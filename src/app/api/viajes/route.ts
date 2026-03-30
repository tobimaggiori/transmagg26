/**
 * API Routes para gestión de viajes.
 * GET  /api/viajes - Lista viajes (filtrado por rol y params)
 * POST /api/viajes - Crea viaje standalone (ADMIN/OPERADOR_TRANSMAGG)
 *
 * Los viajes tienen estados independientes para liquidación y factura.
 * SEGURIDAD:
 * - tarifaOperativaInicial nunca se expone a roles de empresa ni de fletero
 * - Fletero solo ve sus propios viajes
 * - Empresa solo ve sus propios viajes
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { enriquecerViajeOperativo, ocultarTarifaOperativa } from "@/lib/viaje-serialization"
import type { Rol } from "@/types"

const crearViajeSchema = z.object({
  fleteroId: z.string().uuid(),
  camionId: z.string().uuid(),
  choferId: z.string().uuid(),
  empresaId: z.string().uuid(),
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  remito: z.string().optional(),
  cupo: z.string().optional(),
  mercaderia: z.string().optional(),
  procedencia: z.string().optional(),
  provinciaOrigen: z.string().optional(),
  destino: z.string().optional(),
  provinciaDestino: z.string().optional(),
  kilos: z.number().positive().optional(),
  tarifaOperativaInicial: z.number().positive("La tarifa debe ser mayor a 0"),
  estadoLiquidacion: z.string().default("PENDIENTE_LIQUIDAR"),
  estadoFactura: z.string().default("PENDIENTE_FACTURAR"),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve hasta 200 viajes filtrados por rol y parámetros opcionales.
 * Incluye empresa.razonSocial, fletero.razonSocial, estadoLiquidacion, estadoFactura, kilos, tarifaOperativaInicial.
 * Roles externos no reciben tarifaOperativaInicial; roles internos reciben todo.
 * Existe para el listado de viajes con cálculos de toneladas y totales.
 *
 * Ejemplos:
 * GET /api/viajes (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, tarifaOperativaInicial, estadoLiquidacion, estadoFactura, toneladas, total, empresa, fletero }]
 * GET /api/viajes?fleteroId=f1 (sesión OPERADOR_TRANSMAGG)
 * // => 200 viajes filtrados por fletero
 * GET /api/viajes (sesión FLETERO)
 * // => 200 viajes propios sin tarifaOperativaInicial
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const fleteroId = searchParams.get("fleteroId")
  const empresaId = searchParams.get("empresaId")
  const estadoLiquidacion = searchParams.get("estadoLiquidacion")
  const estadoFactura = searchParams.get("estadoFactura")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  let whereClause: Record<string, unknown> = {}

  if (rol === "FLETERO") {
    whereClause = { fletero: { usuario: { email: session.user.email } } }
  } else if (rol === "CHOFER") {
    whereClause = { chofer: { email: session.user.email } }
  } else if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email } },
      select: { empresaId: true },
    })
    if (!empUsr) return NextResponse.json([])
    whereClause = { empresaId: empUsr.empresaId }
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  // Filtros adicionales para roles internos
  if (esRolInterno(rol)) {
    if (fleteroId) whereClause.fleteroId = fleteroId
    if (empresaId) whereClause.empresaId = empresaId
  }

  if (estadoLiquidacion) whereClause.estadoLiquidacion = estadoLiquidacion
  if (estadoFactura) whereClause.estadoFactura = estadoFactura

  if (desde || hasta) {
    const fechaWhere: Record<string, Date> = {}
    if (desde) fechaWhere.gte = new Date(desde)
    if (hasta) {
      const h = new Date(hasta)
      h.setHours(23, 59, 59, 999)
      fechaWhere.lte = h
    }
    whereClause.fechaViaje = fechaWhere
  }

  try {
    const viajes = await prisma.viaje.findMany({
      where: whereClause,
      include: {
        fletero: { select: { razonSocial: true } },
        camion: { select: { patenteChasis: true, tipoCamion: true } },
        chofer: { select: { nombre: true, apellido: true } },
        empresa: { select: { razonSocial: true } },
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fechaViaje: "desc" },
      take: 200,
    })

    const viajesConCalculo = viajes.map((v) => enriquecerViajeOperativo(v))

    // No exponer tarifaOperativaInicial a roles externos
    if (!esRolInterno(rol)) {
      return NextResponse.json(
        viajesConCalculo.map((v) => ocultarTarifaOperativa(v))
      )
    }

    return NextResponse.json(viajesConCalculo)
  } catch (error) {
    console.error("[GET /api/viajes]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body con los campos del viaje, crea un viaje con estados
 * estadoLiquidacion="PENDIENTE_LIQUIDAR" y estadoFactura="PENDIENTE_FACTURAR".
 * Existe para que operadores internos carguen viajes standalone.
 *
 * Ejemplos:
 * POST /api/viajes { fleteroId, camionId, choferId, empresaId, fechaViaje: "2026-03-15", tarifaOperativaInicial: 50000 }
 * // => 201 { id, estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR" }
 * POST /api/viajes { ...datos, fleteroId: "noexiste" }
 * // => 404 { error: "Fletero no encontrado" }
 * POST /api/viajes (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  if (!session.user.id) return NextResponse.json({ error: "Sesión inválida: id de usuario no encontrado" }, { status: 401 })

  try {
    const body = await request.json()
    const parsed = crearViajeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { fleteroId, camionId, choferId, empresaId, fechaViaje, tarifaOperativaInicial, estadoLiquidacion, estadoFactura, ...resto } = parsed.data

    const [fletero, camion, chofer, empresa] = await Promise.all([
      prisma.fletero.findUnique({ where: { id: fleteroId, activo: true } }),
      prisma.camion.findUnique({ where: { id: camionId, activo: true } }),
      prisma.usuario.findUnique({ where: { id: choferId } }),
      prisma.empresa.findUnique({ where: { id: empresaId, activa: true } }),
    ])

    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })
    if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })
    if (!chofer) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    const viaje = await prisma.viaje.create({
      data: {
        fleteroId,
        camionId,
        choferId,
        empresaId,
        operadorId: session.user.id,
        fechaViaje: new Date(fechaViaje),
        tarifaOperativaInicial,
        estadoLiquidacion,
        estadoFactura,
        ...resto,
      },
      include: {
        fletero: { select: { razonSocial: true } },
        empresa: { select: { razonSocial: true } },
      },
    })

    return NextResponse.json(viaje, { status: 201 })
  } catch (error) {
    console.error("[POST /api/viajes]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
