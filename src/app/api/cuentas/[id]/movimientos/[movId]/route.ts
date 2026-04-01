/**
 * PATCH /api/cuentas/[id]/movimientos/[movId] — Actualiza campos editables de un movimiento.
 * DELETE /api/cuentas/[id]/movimientos/[movId] — Elimina un movimiento (solo ADMIN_TRANSMAGG).
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
import type { Rol } from "@/types"

const patchMovimientoSchema = z.object({
  descripcion: z.string().min(1).optional(),
  referencia: z.string().nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
})

/**
 * PATCH: NextRequest, { params: { id, movId } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y el id del movimiento, actualiza descripcion/referencia/comprobanteS3Key.
 * Solo opera sobre movimientos que pertenezcan a la cuenta indicada en la URL.
 *
 * Ejemplos:
 * PATCH({ descripcion: "Nuevo texto" }) => 200 { id, descripcion, ... }
 * PATCH({ comprobanteS3Key: null }) => 200 { id, comprobanteS3Key: null, ... }
 * PATCH({}) => 200 (sin cambios)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; movId: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: cuentaId, movId } = await params

    const movimiento = await prisma.movimientoSinFactura.findUnique({
      where: { id: movId },
      select: { id: true, cuentaId: true },
    })
    if (!movimiento || movimiento.cuentaId !== cuentaId) return notFoundResponse("Movimiento")

    const body = await request.json()
    const parsed = patchMovimientoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const updated = await prisma.movimientoSinFactura.update({
      where: { id: movId },
      data: {
        ...(parsed.data.descripcion !== undefined ? { descripcion: parsed.data.descripcion } : {}),
        ...(parsed.data.referencia !== undefined ? { referencia: parsed.data.referencia } : {}),
        ...(parsed.data.comprobanteS3Key !== undefined ? { comprobanteS3Key: parsed.data.comprobanteS3Key } : {}),
      },
    })

    return NextResponse.json(updated)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cuentas/[id]/movimientos/[movId]", error)
  }
}

/**
 * DELETE: NextRequest, { params: { id, movId } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y el id del movimiento, elimina el movimiento físicamente.
 * Solo permitido para ADMIN_TRANSMAGG.
 *
 * Ejemplos:
 * DELETE (admin) => 200 { message: "Movimiento eliminado" }
 * DELETE (operador) => 403
 * DELETE (movimiento de otra cuenta) => 404
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; movId: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  const rol = access.session.user.rol as Rol
  if (rol !== "ADMIN_TRANSMAGG") {
    return NextResponse.json({ error: "Solo ADMIN_TRANSMAGG puede eliminar movimientos" }, { status: 403 })
  }

  try {
    const { id: cuentaId, movId } = await params

    const movimiento = await prisma.movimientoSinFactura.findUnique({
      where: { id: movId },
      select: { id: true, cuentaId: true },
    })
    if (!movimiento || movimiento.cuentaId !== cuentaId) return notFoundResponse("Movimiento")

    await prisma.movimientoSinFactura.delete({ where: { id: movId } })

    return NextResponse.json({ message: "Movimiento eliminado" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/cuentas/[id]/movimientos/[movId]", error)
  }
}
