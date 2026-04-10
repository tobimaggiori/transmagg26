/**
 * API Routes para Recibos de Cobranza.
 * GET  /api/recibos-cobranza?empresaId=...&desde=...&hasta=...
 * POST /api/recibos-cobranza — Crea un nuevo recibo con aplicación parcial,
 *      faltantes, saldo a cuenta, y múltiples medios de pago.
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
  tipo: z.enum(["TRANSFERENCIA", "ECHEQ", "CHEQUE_FISICO", "EFECTIVO", "SALDO_CTA_CTE"]),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  cuentaId: z.string().uuid().optional(),
  fechaTransferencia: z.string().optional(),
  referencia: z.string().optional(),
  nroCheque: z.string().optional(),
  bancoEmisor: z.string().optional(),
  fechaEmision: z.string().optional(),
  fechaPago: z.string().optional(),
})

const facturaAplicadaSchema = z.object({
  facturaId: z.string().uuid(),
  montoAplicado: z.number().positive("El monto aplicado debe ser mayor a 0"),
})

const faltanteSchema = z.object({
  viajeId: z.string().uuid(),
  fleteroId: z.string().uuid(),
  monto: z.number().positive("El monto del faltante debe ser mayor a 0"),
  descripcion: z.string().optional(),
})

const crearReciboSchema = z.object({
  empresaId: z.string().uuid(),
  facturasAplicadas: z.array(facturaAplicadaSchema).min(1, "Debe incluir al menos una factura"),
  mediosPago: z.array(medioPagoSchema).min(1, "Debe incluir al menos un medio de pago"),
  retencionGanancias: z.number().min(0).default(0),
  retencionIIBB: z.number().min(0).default(0),
  retencionSUSS: z.number().min(0).default(0),
  faltantes: z.array(faltanteSchema).default([]),
  fecha: z.string(),
})

// ── GET ──────────────────────────────────────────────────────────────────────

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve recibos de cobranza, opcionalmente filtrados por empresa y fechas.
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
      facturasEnRecibo: {
        include: {
          factura: { select: { id: true, nroComprobante: true, tipoCbte: true, total: true } },
        },
      },
      mediosPago: true,
      faltantes: { select: { monto: true, descripcion: true } },
    },
    orderBy: { creadoEn: "desc" },
  })

  return NextResponse.json(recibos)
}

// ── POST ─────────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un nuevo Recibo de Cobranza.
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
