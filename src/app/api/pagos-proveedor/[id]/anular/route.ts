/**
 * API Route: POST /api/pagos-proveedor/[id]/anular
 *
 * Anula un PagoProveedor en transaccion atomica:
 * 1. Marca el pago anulado=true
 * 2. Recalcula estadoPago de la FacturaProveedor
 * 3. Si era CHEQUE_PROPIO: marca ChequeEmitido como ANULADO
 * 4. Si era CHEQUE_FISICO_TERCERO/CHEQUE_ELECTRONICO_TERCERO: revierte ChequeRecibido a EN_CARTERA
 * 5. Si era TRANSFERENCIA: crea MovimientoSinFactura de reversion (INGRESO)
 * 6. Registra en HistorialPago
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
  badRequestResponse,
  invalidDataResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarAnularPagoProveedor } from "@/lib/anulacion-pago-commands"

const anularSchema = z.object({
  justificacion: z.string().min(10, "La justificación debe tener al menos 10 caracteres"),
})

/**
 * POST: anula atomicamente un PagoProveedor con todos sus efectos secundarios.
 *
 * Ejemplos:
 * POST /api/pagos-proveedor/abc/anular { justificacion: "Pago duplicado" }
 * // => 200 { ok: true, nuevoEstadoPago: "PENDIENTE" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(acceso.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = anularSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())
  const { justificacion } = parsed.data

  try {
    const result = await ejecutarAnularPagoProveedor({ pagoId: id, justificacion }, operadorId)

    if (!result.ok) {
      if (result.status === 404) return notFoundResponse("Pago")
      return badRequestResponse(result.error)
    }

    return NextResponse.json({ ok: true, nuevoEstadoPago: result.nuevoEstadoPago })
  } catch (error) {
    return serverErrorResponse("POST /api/pagos-proveedor/[id]/anular", error)
  }
}
