/**
 * PATCH  /api/cuentas/[id]/movimientos/[movId] — Edita descripción/comprobante de un
 *         movimiento MANUAL (esManual=true). Los no-manuales se editan desde la entidad
 *         origen (cheque, pago, etc.).
 * DELETE /api/cuentas/[id]/movimientos/[movId] — Elimina un movimiento manual.
 *         Pasa por revertirMovimiento, que valida que el día no esté sellado ni el mes cerrado.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { revertirMovimiento, esCategoriaImpuestoAutogenerado } from "@/lib/movimiento-cuenta"
import { validarDiaModificable } from "@/lib/conciliacion"

const patchManualSchema = z.object({
  descripcion: z.string().min(1).optional(),
  comprobanteS3Key: z.string().nullable().optional(),
})

/**
 * PATCH: edita solo campos descriptivos de un movimiento manual. Bloquea la
 * edición si el día está sellado o el mes cerrado.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; movId: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: cuentaId, movId } = await params

    const mov = await prisma.movimientoCuenta.findUnique({
      where: { id: movId },
      select: {
        id: true,
        cuentaId: true,
        esManual: true,
        fecha: true,
        cuenta: { select: { activa: true } },
      },
    })
    if (!mov || mov.cuentaId !== cuentaId) return notFoundResponse("Movimiento")
    if (!mov.cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se puede editar el movimiento." },
        { status: 400 }
      )
    }
    if (!mov.esManual) {
      return NextResponse.json(
        { error: "Este movimiento proviene de una entidad (cheque, pago, etc.). Editalo desde su origen." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = patchManualSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const updated = await prisma.$transaction(async (tx) => {
      await validarDiaModificable(tx, cuentaId, mov.fecha)
      return tx.movimientoCuenta.update({
        where: { id: movId },
        data: {
          ...(parsed.data.descripcion !== undefined ? { descripcion: parsed.data.descripcion } : {}),
          ...(parsed.data.comprobanteS3Key !== undefined
            ? { comprobanteS3Key: parsed.data.comprobanteS3Key }
            : {}),
        },
      })
    })

    return NextResponse.json(updated)
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("PATCH /api/cuentas/[id]/movimientos/[movId]", error)
  }
}

/**
 * DELETE: elimina un movimiento manual. Si es espejo de transferencia entre
 * cuentas propias, también elimina el espejo (vía revertirMovimiento).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; movId: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: cuentaId, movId } = await params

    const mov = await prisma.movimientoCuenta.findUnique({
      where: { id: movId },
      select: {
        id: true,
        cuentaId: true,
        esManual: true,
        categoria: true,
        cuenta: { select: { activa: true } },
      },
    })
    if (!mov || mov.cuentaId !== cuentaId) return notFoundResponse("Movimiento")
    if (!mov.cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se puede borrar el movimiento." },
        { status: 400 }
      )
    }
    if (esCategoriaImpuestoAutogenerado(mov.categoria)) {
      return NextResponse.json(
        { error: "Este movimiento es un impuesto auto-generado. Borrá el movimiento padre y se eliminará en cascada." },
        { status: 400 }
      )
    }
    if (!mov.esManual) {
      return NextResponse.json(
        { error: "Solo se pueden borrar movimientos manuales desde acá. Los de entidad se revierten desde la entidad origen." },
        { status: 400 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await revertirMovimiento(tx, movId)
    })

    return NextResponse.json({ message: "Movimiento eliminado" })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("DELETE /api/cuentas/[id]/movimientos/[movId]", error)
  }
}
