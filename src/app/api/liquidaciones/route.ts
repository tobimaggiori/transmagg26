/**
 * API Routes para gestión de liquidaciones.
 * GET  /api/liquidaciones?fleteroId=XXX - Viajes pendientes + liquidaciones
 * POST /api/liquidaciones - Crea liquidación asociando viajes existentes
 *
 * SEGURIDAD: tarifaFletero en ViajeEnLiquidacion es NUNCA visible para empresas/choferes.
 * Los viajes se filtran por estadoLiquidacion="PENDIENTE_LIQUIDAR".
 * El POST los marca como estadoLiquidacion="LIQUIDADO" (NO toca estadoFactura).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { EstadoLiquidacionViaje } from "@/lib/viaje-workflow"
import { resolverOperadorId, resolverFleteroIdPorEmail } from "@/lib/session-utils"
import { ejecutarCrearLiquidacion, calcularProximoNroComprobanteLiquidacion } from "@/lib/liquidacion-commands"
import { emitirLiquidacionDirecta } from "@/lib/emision-directa"
import type { Rol } from "@/types"

// ─── Validación ──────────────────────────────────────────────────────────────

const viajeEnLiqSchema = z.object({
  viajeId: z.string().uuid(),
  camionId: z.string().uuid().optional(),
  choferId: z.string().uuid().optional(),
  fechaViaje: z.string(),
  remito: z.string().nullable().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: z.string().nullable().optional(),
  destino: z.string().nullable().optional(),
  provinciaDestino: z.string().nullable().optional(),
  kilos: z.number().positive("Kilos debe ser mayor a 0"),
  tarifaFletero: z.number().positive("La tarifa del fletero debe ser mayor a 0"),
})

const crearLiquidacionSchema = z.object({
  fleteroId: z.string().uuid(),
  comisionPct: z.number().min(0).max(100),
  ivaPct: z.number().min(0).max(100).default(21),
  viajes: z.array(viajeEnLiqSchema).min(1, "Debe incluir al menos un viaje"),
  emisionArca: z.boolean().optional(),
  idempotencyKey: z.string().uuid().optional(),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado un fleteroId opcional por query param, devuelve los viajes pendientes de liquidar,
 * las liquidaciones existentes del fletero, los datos del fletero y el próximo nro comprobante.
 * Roles internos pueden filtrar por fleteroId; FLETERO solo ve los suyos.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const fleteroId = searchParams.get("fleteroId")

  if (rol !== "FLETERO" && !esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  let fleteroIdReal: string | null = fleteroId

  if (rol === "FLETERO") {
    const fleteroId = await resolverFleteroIdPorEmail(session.user.email ?? "")
    if (!fleteroId) return NextResponse.json({ viajesPendientes: [], liquidaciones: [] })
    fleteroIdReal = fleteroId
  }

  const whereViajes = {
    fleteroId: fleteroIdReal ? fleteroIdReal : { not: null },
    estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR,
  }

  const whereLiquidaciones: Record<string, unknown> = {}
  if (fleteroIdReal) whereLiquidaciones.fleteroId = fleteroIdReal

  try {
    const [viajesRaw, liquidaciones, fleteroData, nroProximoComprobante, gastosPendientes] = await Promise.all([
      prisma.viaje.findMany({
        where: whereViajes,
        select: {
          id: true, fechaViaje: true, fleteroId: true, empresaId: true,
          empresa: { select: { razonSocial: true } },
          camionId: true, camion: { select: { patenteChasis: true } },
          choferId: true, chofer: { select: { nombre: true, apellido: true } },
          remito: true, tieneCupo: true, cupo: true, mercaderia: true,
          procedencia: true, provinciaOrigen: true, destino: true,
          provinciaDestino: true, kilos: true, tarifa: true,
          nroCartaPorte: true, estadoLiquidacion: true, estadoFactura: true,
        },
        orderBy: { fechaViaje: "desc" },
        take: 200,
      }),
      prisma.liquidacion.findMany({
        where: whereLiquidaciones,
        include: {
          fletero: { select: { razonSocial: true, cuit: true } },
          viajes: {
            include: {
              viaje: { select: { nroCartaPorte: true, cartaPorteS3Key: true } },
            },
          },
          pagos: {
            where: { anulado: false },
            select: {
              id: true, monto: true, tipoPago: true, fechaPago: true, anulado: true,
              ordenPago: { select: { id: true, nro: true, fecha: true, pdfS3Key: true } },
            },
          },
          gastoDescuentos: {
            include: {
              gasto: {
                select: {
                  tipo: true,
                  facturaProveedor: {
                    select: {
                      tipoCbte: true, nroComprobante: true,
                      proveedor: { select: { razonSocial: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { grabadaEn: "desc" },
        take: 100,
      }),
      fleteroIdReal
        ? prisma.fletero.findUnique({
            where: { id: fleteroIdReal },
            select: { id: true, razonSocial: true, cuit: true, condicionIva: true, direccion: true },
          })
        : Promise.resolve(null),
      calcularProximoNroComprobanteLiquidacion(),
      fleteroIdReal
        ? prisma.gastoFletero.findMany({
            where: {
              fleteroId: fleteroIdReal,
              estado: { in: ["PENDIENTE_PAGO", "PAGADO", "DESCONTADO_PARCIAL"] },
            },
            select: {
              id: true, tipo: true, montoPagado: true, montoDescontado: true, estado: true,
              facturaProveedor: {
                select: {
                  id: true, tipoCbte: true, nroComprobante: true, fechaCbte: true,
                  proveedor: { select: { razonSocial: true } },
                },
              },
            },
            orderBy: { creadoEn: "asc" },
          })
        : Promise.resolve([]),
    ])

    const viajesPendientes = viajesRaw.map((v) => ({
      ...v,
      tarifa: v.tarifa,
      toneladas: v.kilos != null ? calcularToneladas(v.kilos) : null,
      total: v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifa) : null,
    }))

    return NextResponse.json({ viajesPendientes, liquidaciones, fletero: fleteroData, nroProximoComprobante, gastosPendientes })
  } catch (error) {
    console.error("[GET /api/liquidaciones]", error)
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
 * Crea una liquidación asociando viajes existentes. Solo roles internos.
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
    const parsed = crearLiquidacionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    // Emisión directa: crear + autorizar ARCA en un solo flujo
    if (parsed.data.emisionArca && parsed.data.idempotencyKey) {
      const resultado = await emitirLiquidacionDirecta(parsed.data, operadorId, parsed.data.idempotencyKey)
      if (!resultado.ok) {
        return NextResponse.json({ error: resultado.error }, { status: resultado.status })
      }
      return NextResponse.json(resultado, { status: 201 })
    }

    // Flujo clásico: solo crear (autorizar ARCA por separado)
    const resultado = await ejecutarCrearLiquidacion(parsed.data, operadorId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.liquidacion, { status: 201 })
  } catch (error) {
    console.error("[POST /api/liquidaciones]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
