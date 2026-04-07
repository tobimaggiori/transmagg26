/**
 * API Routes para gestión de facturas emitidas.
 * GET  /api/facturas?empresaId=XXX - Viajes pendientes de facturar + facturas emitidas
 * POST /api/facturas - Crea factura a partir de viajes seleccionados
 *
 * SEGURIDAD: tarifaEmpresa en ViajeEnFactura es NUNCA visible para fleteros/choferes.
 * El POST marca los viajes seleccionados como estadoFactura="FACTURADO" (NO toca estadoLiquidacion).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { resolverOperadorId, resolverEmpresaIdPorEmail } from "@/lib/session-utils"
import { emitirFacturaDirecta } from "@/lib/emision-directa"
import type { Rol } from "@/types"

// ─── Validación ──────────────────────────────────────────────────────────────

const crearFacturaSchema = z.object({
  empresaId: z.string().uuid(),
  viajeIds: z.array(z.string().uuid()).min(1),
  tipoCbte: z.number().int().refine((v) => [1, 6, 201].includes(v), {
    message: "tipoCbte debe ser 1 (Fact. A), 6 (Fact. B) o 201 (Fact. A MiPyme)",
  }),
  modalidadMiPymes: z.enum(["SCA", "ADC"]).optional(),
  ivaPct: z.number().min(0).max(100).default(21),
  ediciones: z.record(z.string(), z.object({
    kilos: z.number().positive().optional(),
    tarifaEmpresa: z.number().positive().optional(),
  })).optional(),
  emisionArca: z.boolean().optional(),
  idempotencyKey: z.string().uuid().optional(),
})

// ─── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve viajes pendientes de facturar y las facturas existentes de la empresa.
 * Roles empresa solo ven los suyos; roles internos pueden filtrar por empresaId.
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const empresaId = searchParams.get("empresaId")

  if (!esRolEmpresa(rol) && !esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  let empresaIdReal: string | null = empresaId

  if (esRolEmpresa(rol)) {
    empresaIdReal = await resolverEmpresaIdPorEmail(session.user.email ?? "")
    if (!empresaIdReal) return NextResponse.json({ viajesPendientes: [], facturas: [] })
  }

  const whereFacturas: Record<string, unknown> = {}
  if (empresaIdReal) whereFacturas.empresaId = empresaIdReal

  try {
    const [viajesPendientes, facturas] = await Promise.all([
      empresaIdReal
        ? prisma.viaje.findMany({
            where: { empresaId: empresaIdReal, estadoFactura: "PENDIENTE_FACTURAR" },
            include: {
              empresa: { select: { razonSocial: true } },
              fletero: { select: { razonSocial: true } },
              enLiquidaciones: {
                include: { liquidacion: { select: { nroComprobante: true, ptoVenta: true, id: true } } },
                take: 1,
              },
            },
            orderBy: { fechaViaje: "desc" },
            take: 200,
          })
        : [],
      prisma.facturaEmitida.findMany({
        where: whereFacturas,
        include: {
          empresa: { select: { razonSocial: true } },
          viajes: true,
          pagos: { select: { monto: true } },
        },
        orderBy: { emitidaEn: "desc" },
        take: 100,
      }),
    ])

    return NextResponse.json({ viajesPendientes, facturas })
  } catch (error) {
    console.error("[GET /api/facturas]", error)
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
 * Crea una factura a partir de viajes seleccionados. Solo roles internos.
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
    const parsed = crearFacturaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    // Emisión directa: crear + autorizar ARCA en un solo flujo atómico.
    // Si ARCA devuelve CAE → EMITIDA. Si ARCA falla → no queda comprobante.
    const idempotencyKey = parsed.data.idempotencyKey ?? randomUUID()
    const resultado = await emitirFacturaDirecta(parsed.data, operadorId, idempotencyKey)
    if (!resultado.ok) {
      return NextResponse.json({
        error: resultado.error,
        code: resultado.code,
        reintentable: resultado.reintentable,
        documentoId: resultado.documentoId,
      }, { status: resultado.status })
    }
    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    console.error("[POST /api/facturas]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
