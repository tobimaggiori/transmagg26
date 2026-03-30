import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarSaldoFciSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un saldo FCI], devuelve [el detalle del saldo con fondo y operador].
 * Esta función existe para inspeccionar una actualización puntual de saldo.
 *
 * Ejemplos:
 * GET(request, { params: { id: "s1" } }) === NextResponse.json({ id: "s1", fci, operador })
 * GET(request, { params: { id: "s2" } }) === NextResponse.json({ id: "s2", saldoInformado, rendimientoPeriodo })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Saldo FCI no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const saldo = await prisma.saldoFci.findUnique({
      where: { id: params.id },
      include: {
        fci: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!saldo) return notFoundResponse("Saldo FCI")
    return NextResponse.json(saldo)
  } catch (error) {
    return serverErrorResponse("GET /api/saldos-fci/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un saldo FCI y un body parcial], devuelve [el saldo actualizado recalculando rendimientoPeriodo si cambia el monto].
 * Esta función existe para corregir una carga de saldo manteniendo coherencia con el saldo anterior del mismo FCI.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "s1" } }) === NextResponse.json({ id: "s1", saldoInformado })
 * PATCH(request, { params: { id: "s1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Saldo FCI no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarSaldoFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.saldoFci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Saldo FCI")

    const fciId = parsed.data.fciId ?? existente.fciId
    const fci = await prisma.fci.findUnique({ where: { id: fciId } })
    if (!fci) return notFoundResponse("FCI")

    const saldoAnterior = await prisma.saldoFci.findFirst({
      where: {
        fciId,
        id: { not: params.id },
        fechaActualizacion: { lt: parsed.data.fechaActualizacion ?? existente.fechaActualizacion },
      },
      orderBy: { fechaActualizacion: "desc" },
    })

    const saldoInformado = parsed.data.saldoInformado ?? existente.saldoInformado

    const saldo = await prisma.saldoFci.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        rendimientoPeriodo: saldoInformado - (saldoAnterior?.saldoInformado ?? 0),
      },
    })

    return NextResponse.json(saldo)
  } catch (error) {
    return serverErrorResponse("PATCH /api/saldos-fci/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un saldo FCI], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de saldos cuando una actualización fue cargada por error.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "s1" } }) === NextResponse.json({ message: "Saldo FCI eliminado correctamente" })
 * DELETE(request, { params: { id: "s2" } }) === NextResponse.json({ message: "Saldo FCI eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Saldo FCI no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.saldoFci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Saldo FCI")

    await prisma.saldoFci.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Saldo FCI eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/saldos-fci/[id]", error)
  }
}
