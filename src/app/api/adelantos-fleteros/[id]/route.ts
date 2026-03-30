import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarAdelantoFleteroSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un adelanto a fletero], devuelve [el detalle completo con fletero, cheques y descuentos].
 * Esta función existe para revisar individualmente un adelanto y su estado de descuento.
 *
 * Ejemplos:
 * GET(request, { params: { id: "a1" } }) === NextResponse.json({ id: "a1", fletero, descuentos })
 * GET(request, { params: { id: "a2" } }) === NextResponse.json({ id: "a2", monto, estado })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto fletero no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const adelanto = await prisma.adelantoFletero.findUnique({
      where: { id: params.id },
      include: {
        fletero: true,
        chequeEmitido: true,
        chequeRecibido: true,
        descuentos: {
          include: {
            liquidacion: true,
          },
          orderBy: { fecha: "desc" },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!adelanto) return notFoundResponse("Adelanto fletero")
    return NextResponse.json(adelanto)
  } catch (error) {
    return serverErrorResponse("GET /api/adelantos-fleteros/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un adelanto y un body parcial], devuelve [el adelanto actualizado si los montos siguen siendo consistentes].
 * Esta función existe para corregir estados, referencias o montos de descuento acumulado.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "a1" } }) === NextResponse.json({ id: "a1", estado: "DESCONTADO_TOTAL" })
 * PATCH(request, { params: { id: "a1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto fletero no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarAdelantoFleteroSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.adelantoFletero.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Adelanto fletero")

    const monto = parsed.data.monto ?? existente.monto
    const montoDescontado = parsed.data.montoDescontado ?? existente.montoDescontado

    if (montoDescontado > monto) {
      return badRequestResponse("El monto descontado no puede superar el monto del adelanto")
    }

    if (parsed.data.fleteroId) {
      const fletero = await prisma.fletero.findUnique({ where: { id: parsed.data.fleteroId } })
      if (!fletero) return notFoundResponse("Fletero")
    }

    if (parsed.data.chequeEmitidoId) {
      const chequeEmitido = await prisma.chequeEmitido.findUnique({ where: { id: parsed.data.chequeEmitidoId } })
      if (!chequeEmitido) return notFoundResponse("Cheque emitido")
    }

    if (parsed.data.chequeRecibidoId) {
      const chequeRecibido = await prisma.chequeRecibido.findUnique({ where: { id: parsed.data.chequeRecibidoId } })
      if (!chequeRecibido) return notFoundResponse("Cheque recibido")
    }

    const adelanto = await prisma.adelantoFletero.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(adelanto)
  } catch (error) {
    return serverErrorResponse("PATCH /api/adelantos-fleteros/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un adelanto a fletero], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de adelantos cargados erróneamente.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "a1" } }) === NextResponse.json({ message: "Adelanto fletero eliminado correctamente" })
 * DELETE(request, { params: { id: "a2" } }) === NextResponse.json({ message: "Adelanto fletero eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto fletero no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.adelantoFletero.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Adelanto fletero")

    await prisma.adelantoFletero.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Adelanto fletero eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/adelantos-fleteros/[id]", error)
  }
}
