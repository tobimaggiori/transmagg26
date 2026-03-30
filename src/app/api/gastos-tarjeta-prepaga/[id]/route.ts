import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarGastoTarjetaPrepagaSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un gasto de tarjeta prepaga], devuelve [el detalle con tarjeta, chofer y operador].
 * Esta función existe para auditar un consumo individual.
 *
 * Ejemplos:
 * GET(request, { params: { id: "gt1" } }) === NextResponse.json({ id: "gt1", tarjeta, operador })
 * GET(request, { params: { id: "gt2" } }) === NextResponse.json({ id: "gt2", tipoGasto, monto })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Gasto tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const gasto = await prisma.gastoTarjetaPrepaga.findUnique({
      where: { id: params.id },
      include: {
        tarjeta: {
          include: {
            chofer: true,
            cuenta: true,
          },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!gasto) return notFoundResponse("Gasto tarjeta prepaga")
    return NextResponse.json(gasto)
  } catch (error) {
    return serverErrorResponse("GET /api/gastos-tarjeta-prepaga/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un gasto de tarjeta prepaga y un body parcial], devuelve [el gasto actualizado].
 * Esta función existe para corregir rendiciones y comprobantes asociados.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "gt1" } }) === NextResponse.json({ id: "gt1", monto })
 * PATCH(request, { params: { id: "gt1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Gasto tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarGastoTarjetaPrepagaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.gastoTarjetaPrepaga.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Gasto tarjeta prepaga")

    if (parsed.data.tarjetaId) {
      const tarjeta = await prisma.tarjetaPrepaga.findUnique({ where: { id: parsed.data.tarjetaId } })
      if (!tarjeta) return notFoundResponse("Tarjeta prepaga")
    }

    const gasto = await prisma.gastoTarjetaPrepaga.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(gasto)
  } catch (error) {
    return serverErrorResponse("PATCH /api/gastos-tarjeta-prepaga/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un gasto de tarjeta prepaga], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de gastos cargados erróneamente.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "gt1" } }) === NextResponse.json({ message: "Gasto tarjeta prepaga eliminado correctamente" })
 * DELETE(request, { params: { id: "gt2" } }) === NextResponse.json({ message: "Gasto tarjeta prepaga eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Gasto tarjeta prepaga no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.gastoTarjetaPrepaga.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Gasto tarjeta prepaga")

    await prisma.gastoTarjetaPrepaga.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Gasto tarjeta prepaga eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/gastos-tarjeta-prepaga/[id]", error)
  }
}
