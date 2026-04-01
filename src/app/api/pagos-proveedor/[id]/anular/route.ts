/**
 * API Route: POST /api/pagos-proveedor/[id]/anular
 *
 * Anula un PagoProveedor en transacción atómica:
 * 1. Marca el pago anulado=true
 * 2. Recalcula estadoPago de la FacturaProveedor
 * 3. Si era CHEQUE_PROPIO: marca ChequeEmitido como ANULADO
 * 4. Si era CHEQUE_FISICO_TERCERO/CHEQUE_ELECTRONICO_TERCERO: revierte ChequeRecibido a EN_CARTERA
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
 * POST: anula atómicamente un PagoProveedor con todos sus efectos secundarios.
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
    const pago = await prisma.pagoProveedor.findUnique({
      where: { id },
      select: {
        id: true,
        monto: true,
        tipo: true,
        fecha: true,
        anulado: true,
        facturaProveedorId: true,
        cuentaId: true,
        chequeEmitidoId: true,
        chequeRecibidoId: true,
        facturaProveedor: {
          select: {
            id: true,
            nroComprobante: true,
            tipoCbte: true,
            total: true,
            estadoPago: true,
            proveedor: { select: { razonSocial: true } },
            pagos: { where: { anulado: false }, select: { id: true, monto: true } },
          },
        },
        chequeEmitido: { select: { id: true } },
        chequeRecibido: { select: { id: true } },
      },
    })

    if (!pago) return notFoundResponse("Pago")
    if (pago.anulado) return badRequestResponse("El pago ya está anulado")

    let nuevoEstadoPago: string | null = null

    await prisma.$transaction(async (tx) => {
      // 1. Marcar pago como anulado
      await tx.pagoProveedor.update({
        where: { id },
        data: { anulado: true, motivoAnulacion: justificacion },
      })

      // 2. Recalcular estadoPago de la factura
      const fact = pago.facturaProveedor
      const totalSinEste = fact.pagos
        .filter((p) => p.id !== id)
        .reduce((s, p) => s + p.monto, 0)

      if (totalSinEste >= fact.total - 0.01) {
        nuevoEstadoPago = "PAGADA"
      } else if (totalSinEste > 0.01) {
        nuevoEstadoPago = "PARCIALMENTE_PAGADA"
      } else {
        nuevoEstadoPago = "PENDIENTE"
      }

      await tx.facturaProveedor.update({
        where: { id: fact.id },
        data: { estadoPago: nuevoEstadoPago },
      })

      // 3. Cheque propio: marcar como ANULADO
      if (pago.chequeEmitidoId) {
        await tx.chequeEmitido.update({
          where: { id: pago.chequeEmitidoId },
          data: { estado: "ANULADO" },
        })
      }

      // 4. Cheque recibido endosado: revertir a EN_CARTERA
      if (pago.chequeRecibidoId) {
        await tx.chequeRecibido.update({
          where: { id: pago.chequeRecibidoId },
          data: {
            estado: "EN_CARTERA",
            endosadoATipo: null,
            endosadoAProveedorId: null,
          },
        })
      }

      // 5. Transferencia: crear movimiento de reversión
      if (pago.tipo === "TRANSFERENCIA" && pago.cuentaId) {
        const fact = pago.facturaProveedor
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: pago.cuentaId,
            tipo: "INGRESO",
            categoria: "OTRO",
            monto: pago.monto,
            fecha: new Date(),
            descripcion: `REVERSIÓN Pago Factura ${fact.tipoCbte} ${fact.nroComprobante} — ${fact.proveedor.razonSocial} (anulado: ${justificacion})`,
            operadorId,
          },
        })
      }

      // 6. Registrar historial
      await tx.historialPago.create({
        data: {
          pagoProveedorId: id,
          tipoEvento: "ANULACION",
          justificacion,
          estadoAnterior: JSON.stringify({
            monto: pago.monto,
            tipo: pago.tipo,
            anulado: false,
          }),
          operadorId,
        },
      })
    })

    return NextResponse.json({ ok: true, nuevoEstadoPago })
  } catch (error) {
    return serverErrorResponse("POST /api/pagos-proveedor/[id]/anular", error)
  }
}
