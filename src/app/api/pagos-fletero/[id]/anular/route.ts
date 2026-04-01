/**
 * API Route: POST /api/pagos-fletero/[id]/anular
 *
 * Anula un PagoAFletero en transacción atómica:
 * 1. Marca el pago anulado=true
 * 2. Recalcula estado de la LP
 * 3. Si era CHEQUE_PROPIO: marca ChequeEmitido como ANULADO
 * 4. Si era CHEQUE_TERCERO: revierte ChequeRecibido a EN_CARTERA
 * 5. Si era TRANSFERENCIA: crea MovimientoSinFactura de reversión (INGRESO)
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
import { prisma } from "@/lib/prisma"
import { resolverOperadorId } from "@/lib/session-utils"

const anularSchema = z.object({
  justificacion: z.string().min(10, "La justificación debe tener al menos 10 caracteres"),
})

/**
 * POST: anula atómicamente un PagoAFletero con todos sus efectos secundarios.
 *
 * Ejemplos:
 * POST /api/pagos-fletero/abc/anular { justificacion: "Pago duplicado" }
 * // => 200 { ok: true, nuevoEstadoLP: "EMITIDA" }
 * POST /api/pagos-fletero/abc/anular { justificacion: "" }
 * // => 400 { error: "Datos inválidos" }
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
    const pago = await prisma.pagoAFletero.findUnique({
      where: { id },
      select: {
        id: true,
        monto: true,
        tipoPago: true,
        fechaPago: true,
        anulado: true,
        fleteroId: true,
        liquidacionId: true,
        cuentaId: true,
        chequeEmitidoId: true,
        chequeRecibidoId: true,
        liquidacion: {
          select: {
            id: true,
            total: true,
            estado: true,
            nroComprobante: true,
            ptoVenta: true,
            fletero: { select: { razonSocial: true } },
            pagos: { where: { anulado: false }, select: { id: true, monto: true } },
          },
        },
        chequeEmitido: { select: { id: true, nroCheque: true } },
        chequeRecibido: { select: { id: true } },
      },
    })

    if (!pago) return notFoundResponse("Pago")
    if (pago.anulado) return badRequestResponse("El pago ya está anulado")

    let nuevoEstadoLP: string | null = null

    await prisma.$transaction(async (tx) => {
      // 1. Marcar pago como anulado
      await tx.pagoAFletero.update({
        where: { id },
        data: { anulado: true, motivoAnulacion: justificacion },
      })

      // 2. Recalcular estado LP
      if (pago.liquidacion) {
        const liq = pago.liquidacion
        const totalSinEste = liq.pagos
          .filter((p) => p.id !== id)
          .reduce((s, p) => s + p.monto, 0)

        if (totalSinEste >= liq.total - 0.01) {
          nuevoEstadoLP = "PAGADA"
        } else if (totalSinEste > 0.01) {
          nuevoEstadoLP = "PARCIALMENTE_PAGADA"
        } else {
          nuevoEstadoLP = "EMITIDA"
        }

        await tx.liquidacion.update({
          where: { id: liq.id },
          data: { estado: nuevoEstadoLP },
        })
      }

      // 3. Cheque propio: marcar como ANULADO
      if (pago.chequeEmitidoId) {
        await tx.chequeEmitido.update({
          where: { id: pago.chequeEmitidoId },
          data: { estado: "ANULADO" },
        })
      }

      // 4. Cheque recibido: revertir a EN_CARTERA
      if (pago.chequeRecibidoId) {
        await tx.chequeRecibido.update({
          where: { id: pago.chequeRecibidoId },
          data: {
            estado: "EN_CARTERA",
            endosadoATipo: null,
            endosadoAFleteroId: null,
          },
        })
      }

      // 5. Transferencia: crear movimiento de reversión
      if (pago.tipoPago === "TRANSFERENCIA" && pago.cuentaId && pago.liquidacion) {
        const liq = pago.liquidacion
        const nroLiq =
          liq.nroComprobante != null
            ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
            : "s/n"
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: pago.cuentaId,
            tipo: "INGRESO",
            categoria: "OTRO",
            monto: pago.monto,
            fecha: new Date(),
            descripcion: `REVERSIÓN Pago LP ${nroLiq} — ${liq.fletero.razonSocial} (anulado: ${justificacion})`,
            operadorId,
          },
        })
      }

      // 6. Registrar historial
      await tx.historialPago.create({
        data: {
          pagoFleteroId: id,
          tipoEvento: "ANULACION",
          justificacion,
          estadoAnterior: JSON.stringify({
            monto: pago.monto,
            tipoPago: pago.tipoPago,
            anulado: false,
          }),
          operadorId,
        },
      })
    })

    return NextResponse.json({ ok: true, nuevoEstadoLP })
  } catch (error) {
    return serverErrorResponse("POST /api/pagos-fletero/[id]/anular", error)
  }
}
