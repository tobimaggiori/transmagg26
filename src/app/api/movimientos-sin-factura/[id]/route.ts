/**
 * API Route para un movimiento sin factura específico.
 * PATCH /api/movimientos-sin-factura/[id] - Actualiza descripcion, referencia o comprobanteS3Key.
 * DELETE /api/movimientos-sin-factura/[id] - Elimina el movimiento (solo BORRADOR / sin efectos secundarios).
 *
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

const actualizarMovimientoSchema = z.object({
  descripcion: z.string().min(1).optional(),
  referencia: z.string().nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado [el id y un body parcial con descripcion/referencia/comprobanteS3Key],
 * devuelve [el movimiento actualizado].
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.movimientoSinFactura.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento")

    const body = await request.json()
    const parsed = actualizarMovimientoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const movimiento = await prisma.movimientoSinFactura.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(movimiento)
  } catch (error) {
    return serverErrorResponse("PATCH /api/movimientos-sin-factura/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado [el id del movimiento], elimina el registro permanentemente.
 * Solo aplica a movimientos registrados manualmente (sin efectos secundarios en otras tablas).
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.movimientoSinFactura.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento")

    await prisma.movimientoSinFactura.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Movimiento eliminado" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/movimientos-sin-factura/[id]", error)
  }
}
