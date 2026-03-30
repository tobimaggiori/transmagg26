/**
 * API Routes para gestión de viajes.
 * GET  /api/viajes - Lista viajes (filtrado por rol)
 * POST /api/viajes - Crea viaje standalone (ADMIN/OPERADOR_TRANSMAGG)
 *
 * Los viajes se crean independientemente y luego se asocian a liquidaciones/facturas.
 * SEGURIDAD:
 * - tarifaBase nunca se expone a roles de empresa ni de fletero directamente
 * - Fletero solo ve sus propios viajes
 * - Empresa solo ve sus propios viajes
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
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
  tarifaBase: z.number().positive("La tarifa debe ser mayor a 0"),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve hasta 100 viajes filtrados por rol y estado opcional (?estado=PENDIENTE).
 * Roles externos reciben el viaje sin tarifaBase; FLETERO/CHOFER/empresa
 * solo ven sus propios viajes. Roles internos ven todos con tarifaBase.
 * Existe para el listado de viajes en el panel con filtros por rol.
 *
 * Ejemplos:
 * GET /api/viajes (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, tarifaBase, fletero, empresa, ... }]
 * GET /api/viajes?estado=PENDIENTE (sesión FLETERO)
 * // => 200 [{ id, estado: "PENDIENTE", ... }] (sin tarifaBase, solo sus viajes)
 * GET /api/viajes (sesión CHOFER sin viajes)
 * // => 200 []
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const estado = searchParams.get("estado")

  let whereClause: Record<string, unknown> = {}

  if (estado) whereClause.estado = estado

  if (rol === "FLETERO") {
    whereClause = {
      ...whereClause,
      fletero: { usuario: { email: session.user.email } },
    }
  } else if (rol === "CHOFER") {
    whereClause = {
      ...whereClause,
      chofer: { email: session.user.email },
    }
  } else if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email } },
      select: { empresaId: true },
    })
    if (!empUsr) return NextResponse.json([])
    whereClause = { ...whereClause, empresaId: empUsr.empresaId }
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

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
    take: 100,
  })

  // No exponer tarifaBase a roles externos
  if (!esRolInterno(rol)) {
    return NextResponse.json(
      viajes.map((v) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tarifaBase, ...resto } = v
        return resto
      })
    )
  }

  return NextResponse.json(viajes)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body con fleteroId, camionId, choferId, empresaId, fechaViaje y tarifaBase,
 * crea un viaje en estado PENDIENTE verificando que todas las entidades existan y estén activas.
 * Existe para que operadores internos carguen viajes standalone que luego
 * se asociarán a liquidaciones y facturas independientemente.
 *
 * Ejemplos:
 * POST /api/viajes { fleteroId, camionId, choferId, empresaId, fechaViaje: "2026-03-15", tarifaBase: 50000 }
 * // => 201 { id, estado: "PENDIENTE", tarifaBase: 50000 }
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

  try {
    const body = await request.json()
    const parsed = crearViajeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { fleteroId, camionId, choferId, empresaId, fechaViaje, tarifaBase, ...resto } = parsed.data

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
        tarifaBase,
        estado: "PENDIENTE",
        ...resto,
      },
    })

    return NextResponse.json(viaje, { status: 201 })
  } catch (error) {
    console.error("[POST /api/viajes]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
