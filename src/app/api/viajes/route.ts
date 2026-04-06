/**
 * API Routes para gestión de viajes.
 * GET  /api/viajes - Lista viajes (filtrado por rol y params)
 * POST /api/viajes - Crea viaje standalone (ADMIN/OPERADOR_TRANSMAGG)
 *
 * Los viajes tienen estados independientes para liquidación y factura.
 * SEGURIDAD:
 * - tarifa/tarifaEmpresa nunca se expone a roles de empresa ni de fletero
 * - Fletero solo ve sus propios viajes
 * - Empresa solo ve sus propios viajes
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { enriquecerViajeOperativo, ocultarTarifaOperativa } from "@/lib/viaje-serialization"
import { resolverOperadorId } from "@/lib/session-utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { construirWhereViajes, validarEntidadesViaje } from "@/lib/viaje-queries"
import type { Rol } from "@/types"

// ─── Validación ──────────────────────────────────────────────────────────────

/** Normaliza una provincia: busca match case-insensitive en la lista canónica */
function normalizarProvincia(valor: string): string {
  const upper = valor.toUpperCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.toUpperCase() === upper) ?? valor
}

const provinciaSchema = z.string().min(1, "La provincia es obligatoria").transform(normalizarProvincia)

const crearViajeSchema = z.object({
  esCamionPropio: z.boolean().default(false),
  fleteroId: z.string().uuid().optional(),
  camionId: z.string().uuid(),
  choferId: z.string().uuid(),
  empresaId: z.string().uuid(),
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  remito: z.string().optional(),
  tieneCupo: z.boolean().default(false),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().optional(),
  procedencia: z.string().optional(),
  provinciaOrigen: provinciaSchema,
  destino: z.string().optional(),
  provinciaDestino: provinciaSchema,
  kilos: z.number().positive().optional(),
  tarifa: z.number().positive("La tarifa debe ser mayor a 0"),
  estadoLiquidacion: z.string().default("PENDIENTE_LIQUIDAR"),
  estadoFactura: z.string().default("PENDIENTE_FACTURAR"),
  tieneCpe: z.boolean().default(true),
  nroCartaPorte: z.string().nullable().optional(),
  cartaPorteS3Key: z.string().nullable().optional(),
}).refine(
  (data) => data.esCamionPropio || !!data.fleteroId,
  { message: "El fletero es obligatorio para viajes con transportista externo", path: ["fleteroId"] }
).refine(
  (data) => !data.tieneCupo || (data.cupo != null && data.cupo.trim().length > 0),
  { message: "El número de cupo es obligatorio cuando el viaje lleva cupo", path: ["cupo"] }
).refine(
  (data) => !data.tieneCpe || (data.nroCartaPorte && data.nroCartaPorte.trim().length > 0),
  { message: "El número de carta de porte es obligatorio", path: ["nroCartaPorte"] }
).refine(
  (data) => !data.tieneCpe || (data.cartaPorteS3Key && data.cartaPorteS3Key.trim().length > 0),
  { message: "El PDF de la carta de porte es obligatorio", path: ["cartaPorteS3Key"] }
)

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve hasta 200 viajes filtrados por rol y parámetros opcionales.
 * Roles externos no reciben tarifa/tarifaEmpresa; roles internos reciben todo.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)

  const resultado = await construirWhereViajes(rol, session.user.email!, {
    fleteroId: searchParams.get("fleteroId"),
    empresaId: searchParams.get("empresaId"),
    estadoLiquidacion: searchParams.get("estadoLiquidacion"),
    estadoFactura: searchParams.get("estadoFactura"),
    desde: searchParams.get("desde"),
    hasta: searchParams.get("hasta"),
    remito: searchParams.get("remito"),
    nroLP: searchParams.get("nroLP"),
    nroFactura: searchParams.get("nroFactura"),
  })

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status })
  }

  try {
    const viajes = await prisma.viaje.findMany({
      where: resultado.where,
      include: {
        fletero: { select: { razonSocial: true } },
        camion: { select: { patenteChasis: true, tipoCamion: true } },
        chofer: { select: { nombre: true, apellido: true } },
        empresa: { select: { razonSocial: true } },
        operador: { select: { nombre: true, apellido: true } },
        enLiquidaciones: {
          include: {
            liquidacion: {
              select: {
                id: true, estado: true, nroComprobante: true,
                ptoVenta: true, pdfS3Key: true, comisionPct: true, ivaPct: true,
              },
            },
          },
        },
        enFacturas: {
          include: {
            factura: {
              select: {
                id: true, nroComprobante: true, pdfS3Key: true,
                estado: true, tipoCbte: true, ivaPct: true,
              },
            },
          },
        },
      },
      orderBy: { fechaViaje: "desc" },
      take: 200,
    })

    const viajesConCalculo = viajes.map((v) => enriquecerViajeOperativo(v))

    if (!esRolInterno(rol)) {
      return NextResponse.json(viajesConCalculo.map((v) => ocultarTarifaOperativa(v)))
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

// ─── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un viaje standalone. Solo roles internos.
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = crearViajeSchema.safeParse(body)
    if (!parsed.success) {
      const detalles = parsed.error.flatten()
      return NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
    }

    const { esCamionPropio, fleteroId, camionId, choferId, empresaId, fechaViaje, tarifa, estadoLiquidacion, estadoFactura, ...resto } = parsed.data

    // Validar que todas las entidades referenciadas existan
    const validacion = await validarEntidadesViaje({
      esCamionPropio, fleteroId, camionId, choferId, empresaId,
      nroCartaPorte: parsed.data.nroCartaPorte,
    })
    if (!validacion.ok) {
      return NextResponse.json({ error: validacion.error }, { status: validacion.status })
    }

    const viaje = await prisma.viaje.create({
      data: {
        esCamionPropio,
        fleteroId: esCamionPropio ? null : fleteroId,
        camionId,
        choferId,
        empresaId,
        operadorId,
        fechaViaje: new Date(fechaViaje),
        tarifa,
        tarifaEmpresa: tarifa,
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
