import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarTarjetaPrepagaSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una tarjeta prepaga], devuelve [el detalle con chofer, cuenta y gastos].
 * Esta función existe para consultar el estado y consumo individual de una tarjeta.
 *
 * Ejemplos:
 * GET(request, { params: { id: "tp1" } }) === NextResponse.json({ id: "tp1", chofer, gastos })
 * GET(request, { params: { id: "tp2" } }) === NextResponse.json({ id: "tp2", limiteMensual, activa })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const tarjeta = await prisma.tarjetaPrepaga.findUnique({
      where: { id: params.id },
      include: {
        chofer: true,
        cuenta: true,
        gastos: { orderBy: { fecha: "desc" } },
      },
    })

    if (!tarjeta) return notFoundResponse("Tarjeta prepaga")
    return NextResponse.json(tarjeta)
  } catch (error) {
    return serverErrorResponse("GET /api/tarjetas-prepagas/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una tarjeta prepaga y un body parcial], devuelve [la tarjeta actualizada].
 * Esta función existe para ajustar límites, número o estado de la tarjeta.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "tp1" } }) === NextResponse.json({ id: "tp1", activa: false })
 * PATCH(request, { params: { id: "tp1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarTarjetaPrepagaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.tarjetaPrepaga.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Tarjeta prepaga")

    if (parsed.data.choferId) {
      const chofer = await prisma.usuario.findUnique({ where: { id: parsed.data.choferId } })
      if (!chofer) return notFoundResponse("Chofer")
    }

    if (parsed.data.cuentaId) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
      if (!cuenta) return notFoundResponse("Cuenta")
    }

    const tarjeta = await prisma.tarjetaPrepaga.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(tarjeta)
  } catch (error) {
    return serverErrorResponse("PATCH /api/tarjetas-prepagas/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una tarjeta prepaga], devuelve [una confirmación de baja lógica marcándola inactiva].
 * Esta función existe para preservar historial de gastos asociado a tarjetas discontinuadas.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "tp1" } }) === NextResponse.json({ message: "Tarjeta prepaga desactivada correctamente" })
 * DELETE(request, { params: { id: "tp2" } }) === NextResponse.json({ message: "Tarjeta prepaga desactivada correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.tarjetaPrepaga.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Tarjeta prepaga")

    await prisma.tarjetaPrepaga.update({ where: { id: params.id }, data: { activa: false } })
    return NextResponse.json({ message: "Tarjeta prepaga desactivada correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/tarjetas-prepagas/[id]", error)
  }
}
