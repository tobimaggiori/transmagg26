/**
 * POST /api/fleteros/[id]/pago
 *
 * Registra un pago a un fletero contra múltiples liquidaciones en una transacción atómica.
 * El monto total se distribuye proporcionalmente al saldo pendiente de cada liquidación.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  requireFinancialAccess,
  badRequestResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarPagoFleteroDirecto } from "@/lib/pago-fletero-directo-commands"

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const itemSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("TRANSFERENCIA"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    cuentaId: z.string().uuid("Cuenta inválida"),
  }),
  z.object({
    tipo: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    cuentaId: z.string().uuid("Cuenta/chequera inválida"),
    nroChequePropioEmitir: z.string().optional(),
    fechaPagoChequePropioEmitir: z.string().min(1, "Fecha de pago del cheque obligatoria"),
  }),
  z.object({
    tipo: z.literal("CHEQUE_TERCERO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    chequeRecibidoId: z.string().uuid("Cheque recibido inválido"),
  }),
  z.object({
    tipo: z.literal("EFECTIVO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
  }),
])

const bodySchema = z.object({
  fechaPago: z.string().min(1, "Fecha de pago obligatoria"),
  observaciones: z.string().optional(),
  liquidacionIds: z.array(z.string().uuid()).min(1, "Seleccioná al menos una liquidación"),
  items: z.array(itemSchema).min(1, "Agregá al menos un ítem de pago"),
})

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el id del fletero en la ruta y el body con liquidacionIds + items, registra
 * el pago distribuyendo proporcionalmente el monto entre las liquidaciones seleccionadas.
 *
 * Ejemplos:
 * POST /api/fleteros/abc/pago { liquidacionIds: ["l1","l2"], items: [{tipo:"TRANSFERENCIA",...}] }
 * === { ok: true, pagosCreados: 2 }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  const { id: fleteroId } = await params

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  try {
    const resultado = await ejecutarPagoFleteroDirecto(
      {
        fleteroId,
        fechaPago: parsed.data.fechaPago,
        observaciones: parsed.data.observaciones,
        liquidacionIds: parsed.data.liquidacionIds,
        items: parsed.data.items,
      },
      operadorId
    )

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.result)
  } catch (error) {
    return serverErrorResponse("POST /api/fleteros/[id]/pago", error)
  }
}
