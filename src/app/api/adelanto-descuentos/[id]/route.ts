import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarAdelantoDescuentoSchema } from "@/lib/financial-schemas"

function calcularEstadoAdelanto(monto: number, montoDescontado: number): string {
  if (montoDescontado <= 0) return "PENDIENTE_DESCUENTO"
  if (montoDescontado < monto) return "DESCONTADO_PARCIAL"
  return "DESCONTADO_TOTAL"
}

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un descuento de adelanto], devuelve [el detalle con adelanto y liquidación].
 * Esta función existe para revisar una aplicación específica de descuento.
 *
 * Ejemplos:
 * GET(request, { params: { id: "ad1" } }) === NextResponse.json({ id: "ad1", adelanto, liquidacion })
 * GET(request, { params: { id: "ad2" } }) === NextResponse.json({ id: "ad2", montoDescontado, fecha })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto descuento no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const descuento = await prisma.adelantoDescuento.findUnique({
      where: { id: params.id },
      include: {
        adelanto: {
          include: {
            fletero: true,
          },
        },
        liquidacion: true,
      },
    })

    if (!descuento) return notFoundResponse("Adelanto descuento")
    return NextResponse.json(descuento)
  } catch (error) {
    return serverErrorResponse("GET /api/adelanto-descuentos/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un descuento de adelanto y un body parcial], devuelve [el descuento actualizado y recalcula el acumulado del adelanto].
 * Esta función existe para corregir una aplicación ya registrada sin perder coherencia entre descuento y adelanto.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "ad1" } }) === NextResponse.json({ id: "ad1", montoDescontado })
 * PATCH(request, { params: { id: "ad1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto descuento no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarAdelantoDescuentoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.adelantoDescuento.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Adelanto descuento")

    const adelantoId = parsed.data.adelantoId ?? existente.adelantoId
    const liquidacionId = parsed.data.liquidacionId ?? existente.liquidacionId
    const [adelanto, liquidacion] = await Promise.all([
      prisma.adelantoFletero.findUnique({ where: { id: adelantoId }, include: { descuentos: true } }),
      prisma.liquidacion.findUnique({ where: { id: liquidacionId } }),
    ])

    if (!adelanto) return notFoundResponse("Adelanto fletero")
    if (!liquidacion) return notFoundResponse("Liquidación")

    const nuevoMontoDescontado = parsed.data.montoDescontado ?? existente.montoDescontado
    const totalSinActual = adelanto.descuentos
      .filter((descuento) => descuento.id !== existente.id)
      .reduce((acumulado, descuento) => acumulado + descuento.montoDescontado, 0)
    const totalFinal = totalSinActual + nuevoMontoDescontado

    if (totalFinal > adelanto.monto) {
      return badRequestResponse("El descuento supera el saldo pendiente del adelanto")
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const descuento = await tx.adelantoDescuento.update({
        where: { id: params.id },
        data: parsed.data,
      })

      await tx.adelantoFletero.update({
        where: { id: adelanto.id },
        data: {
          montoDescontado: totalFinal,
          estado: calcularEstadoAdelanto(adelanto.monto, totalFinal),
        },
      })

      return descuento
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("PATCH /api/adelanto-descuentos/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un descuento de adelanto], devuelve [una confirmación luego de eliminarlo y recalcular el estado del adelanto].
 * Esta función existe para revertir descuentos cargados por error manteniendo consistencia acumulada.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "ad1" } }) === NextResponse.json({ message: "Adelanto descuento eliminado correctamente" })
 * DELETE(request, { params: { id: "ad2" } }) === NextResponse.json({ message: "Adelanto descuento eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Adelanto descuento no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.adelantoDescuento.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Adelanto descuento")

    const adelanto = await prisma.adelantoFletero.findUnique({
      where: { id: existente.adelantoId },
      include: { descuentos: true },
    })

    if (!adelanto) return notFoundResponse("Adelanto fletero")

    const totalFinal = adelanto.descuentos
      .filter((descuento) => descuento.id !== existente.id)
      .reduce((acumulado, descuento) => acumulado + descuento.montoDescontado, 0)

    await prisma.$transaction(async (tx) => {
      await tx.adelantoDescuento.delete({ where: { id: params.id } })

      await tx.adelantoFletero.update({
        where: { id: adelanto.id },
        data: {
          montoDescontado: totalFinal,
          estado: calcularEstadoAdelanto(adelanto.monto, totalFinal),
        },
      })
    })

    return NextResponse.json({ message: "Adelanto descuento eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/adelanto-descuentos/[id]", error)
  }
}
