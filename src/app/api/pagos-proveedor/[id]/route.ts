/**
 * API Route: PATCH /api/pagos-proveedor/[id]
 *
 * Modifica un PagoProveedor (monto, nroCheque, fechaPago, reasignación de factura).
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

const modificarSchema = z.object({
  justificacion: z.string().min(10, "La justificación debe tener al menos 10 caracteres"),
  nuevoMonto: z.number().positive().optional(),
  nroCheque: z.string().optional(),
  fechaPago: z.string().optional(), // ISO date
  nuevaFacturaId: z.string().uuid().optional(),
})

/**
 * PATCH: modifica datos de un PagoProveedor con todos sus efectos secundarios.
 *
 * Ejemplos:
 * PATCH /api/pagos-proveedor/abc { justificacion: "...", nuevoMonto: 100000 }
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
  const { justificacion, nuevoMonto, nroCheque, fechaPago, nuevaFacturaId } = parsed.data

  if (!nuevoMonto && !nroCheque && !fechaPago && !nuevaFacturaId) {
    return badRequestResponse("Debe especificar al menos un campo a modificar")
  }

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
        chequeEmitidoId: true,
        chequeRecibidoId: true,
        facturaProveedor: {
          select: {
            id: true,
            total: true,
            estadoPago: true,
            proveedorId: true,
            pagos: { where: { anulado: false }, select: { id: true, monto: true } },
          },
        },
      },
    })

    if (!pago) return notFoundResponse("Pago")
    if (pago.anulado) return badRequestResponse("No se puede modificar un pago anulado")

    // Validar que la nueva factura pertenezca al mismo proveedor
    if (nuevaFacturaId && nuevaFacturaId !== pago.facturaProveedorId) {
      const factNueva = await prisma.facturaProveedor.findUnique({
        where: { id: nuevaFacturaId },
        select: { proveedorId: true },
      })
      if (!factNueva) return notFoundResponse("Nueva factura")
      if (factNueva.proveedorId !== pago.facturaProveedor.proveedorId) {
        return badRequestResponse("La nueva factura debe pertenecer al mismo proveedor")
      }
    }

    const snapshot = {
      monto: pago.monto,
      tipo: pago.tipo,
      fecha: pago.fecha,
      facturaProveedorId: pago.facturaProveedorId,
    }

    await prisma.$transaction(async (tx) => {
      // Actualizar el pago
      await tx.pagoProveedor.update({
        where: { id },
        data: {
          ...(nuevoMonto !== undefined ? { monto: nuevoMonto } : {}),
          ...(fechaPago !== undefined ? { fecha: new Date(fechaPago) } : {}),
          ...(nuevaFacturaId !== undefined ? { facturaProveedorId: nuevaFacturaId } : {}),
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
          },
        })
      }

      // Recalcular factura original
      const factOrig = pago.facturaProveedor
      const montoAcreditar = nuevaFacturaId ? 0 : (nuevoMonto ?? pago.monto)
      const totalOtrosPagos = factOrig.pagos
        .filter((p) => p.id !== id)
        .reduce((s, p) => s + p.monto, 0)
      const totalFactOrig = totalOtrosPagos + montoAcreditar

      const estadoFactOrig =
        totalFactOrig >= factOrig.total - 0.01
          ? "PAGADA"
          : totalFactOrig > 0.01
          ? "PARCIALMENTE_PAGADA"
          : "PENDIENTE"

      await tx.facturaProveedor.update({
        where: { id: factOrig.id },
        data: { estadoPago: estadoFactOrig },
      })

      // Recalcular factura nueva si fue reasignada
      if (nuevaFacturaId && nuevaFacturaId !== pago.facturaProveedorId) {
        const factNueva = await tx.facturaProveedor.findUnique({
          where: { id: nuevaFacturaId },
          select: {
            total: true,
            pagos: { where: { anulado: false }, select: { monto: true } },
          },
        })
        if (factNueva) {
          const totalConNuevoPago =
            factNueva.pagos.reduce((s, p) => s + p.monto, 0) + (nuevoMonto ?? pago.monto)

          const estadoFactNueva =
            totalConNuevoPago >= factNueva.total - 0.01
              ? "PAGADA"
              : totalConNuevoPago > 0.01
              ? "PARCIALMENTE_PAGADA"
              : "PENDIENTE"

          await tx.facturaProveedor.update({
            where: { id: nuevaFacturaId },
            data: { estadoPago: estadoFactNueva },
          })
        }
      }

      // Registrar historial
      await tx.historialPago.create({
        data: {
          pagoProveedorId: id,
          tipoEvento: "MODIFICACION",
          justificacion,
          estadoAnterior: JSON.stringify(snapshot),
          operadorId,
        },
      })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("PATCH /api/pagos-proveedor/[id]", error)
  }
}
