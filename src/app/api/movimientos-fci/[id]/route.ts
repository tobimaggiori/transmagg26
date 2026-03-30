import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarMovimientoFciSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento FCI], devuelve [el detalle con FCI, cuenta relacionada y operador].
 * Esta función existe para auditar individualmente suscripciones y rescates.
 *
 * Ejemplos:
 * GET(request, { params: { id: "m1" } }) === NextResponse.json({ id: "m1", fci, cuentaOrigenDestino, operador })
 * GET(request, { params: { id: "m2" } }) === NextResponse.json({ id: "m2", tipo, monto })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento FCI no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const movimiento = await prisma.movimientoFci.findUnique({
      where: { id: params.id },
      include: {
        fci: true,
        cuentaOrigenDestino: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!movimiento) return notFoundResponse("Movimiento FCI")
    return NextResponse.json(movimiento)
  } catch (error) {
    return serverErrorResponse("GET /api/movimientos-fci/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento FCI y un body parcial], devuelve [el movimiento actualizado].
 * Esta función existe para corregir importes, fechas o descripciones cargadas por operador.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "m1" } }) === NextResponse.json({ id: "m1", monto: 2000 })
 * PATCH(request, { params: { id: "m1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento FCI no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarMovimientoFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.movimientoFci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento FCI")

    if (parsed.data.fciId) {
      const fci = await prisma.fci.findUnique({ where: { id: parsed.data.fciId } })
      if (!fci) return notFoundResponse("FCI")
    }

    if (parsed.data.cuentaOrigenDestinoId) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaOrigenDestinoId } })
      if (!cuenta) return notFoundResponse("Cuenta")
    }

    const movimiento = await prisma.movimientoFci.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(movimiento)
  } catch (error) {
    return serverErrorResponse("PATCH /api/movimientos-fci/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento FCI], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de movimientos FCI cuando una carga fue incorrecta.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "m1" } }) === NextResponse.json({ message: "Movimiento FCI eliminado correctamente" })
 * DELETE(request, { params: { id: "m2" } }) === NextResponse.json({ message: "Movimiento FCI eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento FCI no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.movimientoFci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento FCI")

    await prisma.movimientoFci.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Movimiento FCI eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/movimientos-fci/[id]", error)
  }
}
