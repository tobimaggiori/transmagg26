/**
 * API Routes para Recibos de Cobranza.
 * GET  /api/recibos-cobranza?empresaId=...&desde=...&hasta=...
 * POST /api/recibos-cobranza — Crea un nuevo recibo, registra medios de pago,
 *      actualiza facturas a COBRADA, crea movimientos y cheques recibidos.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ejecutarCrearReciboCobranza } from "@/lib/recibo-cobranza-commands"

// ── Schema de validacion ─────────────────────────────────────────────────────

const medioPagoSchema = z.object({
  tipo: z.enum(["TRANSFERENCIA", "ECHEQ", "CHEQUE_FISICO"]),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  cuentaId: z.string().uuid().optional(),
  fechaTransferencia: z.string().optional(),
  referencia: z.string().optional(),
  nroCheque: z.string().optional(),
  bancoEmisor: z.string().optional(),
  fechaEmision: z.string().optional(),
  fechaPago: z.string().optional(),
})

const crearReciboSchema = z.object({
  empresaId: z.string().uuid(),
  facturaIds: z.array(z.string().uuid()).min(1, "Debe incluir al menos una factura"),
  mediosPago: z.array(medioPagoSchema).min(1, "Debe incluir al menos un medio de pago"),
  retencionGanancias: z.number().min(0).default(0),
  retencionIIBB: z.number().min(0).default(0),
  retencionSUSS: z.number().min(0).default(0),
  fecha: z.string(),
})

// ── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve recibos de cobranza, opcionalmente filtrados por empresa y fechas.
 * Solo roles con acceso a "facturas" pueden consultar.
 *
 * Query params: empresaId?, desde?, hasta?
 */
export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const params = req.nextUrl.searchParams
  const empresaId = params.get("empresaId")
  const desde = params.get("desde")
  const hasta = params.get("hasta")

  const where: Record<string, unknown> = {}
  if (empresaId) where.empresaId = empresaId
  if (desde || hasta) {
    where.fecha = {
      ...(desde ? { gte: new Date(desde) } : {}),
      ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
    }
  }

  const recibos = await prisma.reciboCobranza.findMany({
    where,
    include: {
      empresa: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      facturas: { select: { id: true, nroComprobante: true, tipoCbte: true, total: true } },
      mediosPago: true,
    },
    orderBy: { creadoEn: "desc" },
  })

  return NextResponse.json(recibos)
}

// ── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un nuevo Recibo de Cobranza con toda su contabilidad asociada:
 * 1. Valida facturas pendientes de la empresa
 * 2. Valida que el total de medios de pago + retenciones = total facturas
 * 3. En transaccion: crea recibo, medios de pago, actualiza facturas a COBRADA,
 *    crea MovimientoSinFactura para transferencias, ChequeRecibido para cheques
 * 4. Genera PDF y sube a R2
 */
export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON invalido" }, { status: 400 })
  }

  const parsed = crearReciboSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos invalidos" }, { status: 400 })
  }

  // Obtener operadorId desde sesion
  const operadorDb = await prisma.usuario.findUnique({
    where: { email: session.user.email! },
    select: { id: true },
  })
  if (!operadorDb) return NextResponse.json({ error: "Operador no encontrado" }, { status: 400 })

  const result = await ejecutarCrearReciboCobranza(parsed.data, operadorDb.id)

  if (!result.ok) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  return NextResponse.json(result.result, { status: 201 })
}
