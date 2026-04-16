/**
 * API Route: PATCH /api/pagos-fletero/[id]
 *
 * Modifica un PagoAFletero (monto, nroCheque, fechaPago, reasignación de LP).
 * Transacción atómica con recálculo de estados y CC.
 * Solo ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
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
import { sumarImportes, importesIguales, esMayorQueCero } from "@/lib/money"

const modificarSchema = z.object({
  justificacion: z.string().min(10, "La justificación debe tener al menos 10 caracteres"),
  nuevoMonto: z.number().positive().optional(),
  nroCheque: z.string().optional(),
  fechaPago: z.string().optional(), // ISO date
  nuevaLiquidacionId: z.string().uuid().optional(),
})

/**
 * PATCH: modifica datos de un PagoAFletero con todos sus efectos secundarios.
 *
 * Ejemplos:
 * PATCH /api/pagos-fletero/abc { justificacion: "...", nuevoMonto: 100000 }
 * // => 200 { ok: true }
 * PATCH /api/pagos-fletero/abc { justificacion: "...", nuevaLiquidacionId: "liq2" }
 * // => 200 { ok: true }
 */
export async function PATCH(
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

  const parsed = modificarSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())
  const { justificacion, nuevoMonto, nroCheque, fechaPago, nuevaLiquidacionId } = parsed.data

  if (!nuevoMonto && !nroCheque && !fechaPago && !nuevaLiquidacionId) {
    return badRequestResponse("Debe especificar al menos un campo a modificar")
  }

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
        ordenPagoId: true,
        liquidacion: {
          select: {
            id: true,
            total: true,
            estado: true,
            fleteroId: true,
            pagos: { where: { anulado: false }, select: { id: true, monto: true } },
          },
        },
      },
    })

    if (!pago) return notFoundResponse("Pago")
    if (pago.anulado) return badRequestResponse("No se puede modificar un pago anulado")

    // Validar que la nueva LP pertenezca al mismo fletero
    if (nuevaLiquidacionId && nuevaLiquidacionId !== pago.liquidacionId) {
      const liqNueva = await prisma.liquidacion.findUnique({
        where: { id: nuevaLiquidacionId },
        select: { fleteroId: true },
      })
      if (!liqNueva) return notFoundResponse("Nueva liquidación")
      if (liqNueva.fleteroId !== pago.fleteroId) {
        return badRequestResponse("La nueva liquidación debe pertenecer al mismo fletero")
      }
    }

    const snapshot = {
      monto: pago.monto,
      tipoPago: pago.tipoPago,
      fechaPago: pago.fechaPago,
      liquidacionId: pago.liquidacionId,
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar el pago
      await tx.pagoAFletero.update({
        where: { id },
        data: {
          ...(nuevoMonto !== undefined ? { monto: nuevoMonto } : {}),
          ...(fechaPago !== undefined ? { fechaPago: new Date(fechaPago) } : {}),
          ...(nuevaLiquidacionId !== undefined ? { liquidacionId: nuevaLiquidacionId } : {}),
        },
      })

      // Actualizar ChequeEmitido si aplica
      if (pago.chequeEmitidoId) {
        await tx.chequeEmitido.update({
          where: { id: pago.chequeEmitidoId },
          data: {
            ...(nroCheque !== undefined ? { nroCheque } : {}),
            ...(fechaPago !== undefined ? { fechaPago: new Date(fechaPago) } : {}),
            ...(nuevoMonto !== undefined ? { monto: nuevoMonto } : {}),
            ...(nuevaLiquidacionId !== undefined ? { liquidacionId: nuevaLiquidacionId } : {}),
          },
        })
      }

      // Recalcular LP original si cambió el monto o fue reasignada
      if ((nuevoMonto !== undefined || nuevaLiquidacionId !== undefined) && pago.liquidacion) {
        const liqOrig = pago.liquidacion
        const montoAcreditar = nuevaLiquidacionId ? 0 : (nuevoMonto ?? pago.monto)
        const totalOtrosPagos = sumarImportes(
          liqOrig.pagos.filter((p) => p.id !== id).map((p) => p.monto)
        )
        const totalLiqOrig = sumarImportes([totalOtrosPagos, montoAcreditar])

        const estadoLiqOrig =
          importesIguales(totalLiqOrig, liqOrig.total) || totalLiqOrig >= liqOrig.total
            ? "PAGADA"
            : esMayorQueCero(totalLiqOrig)
            ? "PARCIALMENTE_PAGADA"
            : "EMITIDA"

        await tx.liquidacion.update({
          where: { id: liqOrig.id },
          data: { estado: estadoLiqOrig },
        })
      }

      // Recalcular LP nueva si fue reasignada
      if (nuevaLiquidacionId && nuevaLiquidacionId !== pago.liquidacionId) {
        const liqNueva = await tx.liquidacion.findUnique({
          where: { id: nuevaLiquidacionId },
          select: {
            total: true,
            pagos: { where: { anulado: false }, select: { monto: true } },
          },
        })
        if (liqNueva) {
          const totalConNuevoPago = sumarImportes([
            ...liqNueva.pagos.map((p) => p.monto),
            nuevoMonto ?? pago.monto,
          ])

          const estadoLiqNueva =
            importesIguales(totalConNuevoPago, liqNueva.total) || totalConNuevoPago >= liqNueva.total
              ? "PAGADA"
              : esMayorQueCero(totalConNuevoPago)
              ? "PARCIALMENTE_PAGADA"
              : "EMITIDA"

          await tx.liquidacion.update({
            where: { id: nuevaLiquidacionId },
            data: { estado: estadoLiqNueva },
          })
        }
      }

      // Registrar historial
      await tx.historialPago.create({
        data: {
          pagoFleteroId: id,
          tipoEvento: "MODIFICACION",
          justificacion,
          estadoAnterior: JSON.stringify(snapshot),
          operadorId,
        },
      })

      // Invalidar cache del PDF de la OP a la que pertenece este pago
      if (pago.ordenPagoId) {
        await tx.ordenPago.update({
          where: { id: pago.ordenPagoId },
          data: { pdfS3Key: null },
        })
      }
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("PATCH /api/pagos-fletero/[id]", error)
  }
}
