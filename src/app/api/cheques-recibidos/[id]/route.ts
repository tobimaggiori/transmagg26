import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarChequeRecibidoSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque recibido], devuelve [el detalle completo con empresa, factura y relaciones opcionales].
 * Esta función existe para auditoría individual de un cheque de terceros.
 *
 * Ejemplos:
 * GET(request, { params: { id: "cr1" } }) === NextResponse.json({ id: "cr1", empresa, estado })
 * GET(request, { params: { id: "cr2" } }) === NextResponse.json({ id: "cr2", cuentaDeposito, operador })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque recibido no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheque = await prisma.chequeRecibido.findUnique({
      where: { id: params.id },
      include: {
        empresa: true,
        factura: true,
        cuentaDeposito: true,
        endosadoAFletero: true,
        endosadoAProveedor: true,
        endosadoABroker: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!cheque) return notFoundResponse("Cheque recibido")
    return NextResponse.json(cheque)
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-recibidos/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque recibido y un body parcial], devuelve [el cheque actualizado respetando reglas de estado].
 * Esta función existe para corregir datos y cambios de destino de un cheque recibido.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "cr1" } }) === NextResponse.json({ id: "cr1", estado: "DEPOSITADO" })
 * PATCH(request, { params: { id: "cr1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque recibido no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarChequeRecibidoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.chequeRecibido.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cheque recibido")

    const estado = parsed.data.estado ?? existente.estado
    const cuentaDepositoId = parsed.data.cuentaDepositoId ?? existente.cuentaDepositoId
    const endosadoAFleteroId = parsed.data.endosadoAFleteroId ?? existente.endosadoAFleteroId
    const endosadoAProveedorId = parsed.data.endosadoAProveedorId ?? existente.endosadoAProveedorId
    const endosadoABrokerId = parsed.data.endosadoABrokerId ?? existente.endosadoABrokerId
    const tasaDescuento = parsed.data.tasaDescuento ?? existente.tasaDescuento

    if (estado === "DEPOSITADO" && !cuentaDepositoId) {
      return badRequestResponse("La cuenta de depósito es obligatoria para cheques depositados")
    }

    if (estado === "ENDOSADO_FLETERO" && !endosadoAFleteroId) {
      return badRequestResponse("El fletero endosado es obligatorio")
    }

    if (estado === "ENDOSADO_PROVEEDOR" && !endosadoAProveedorId) {
      return badRequestResponse("El proveedor endosado es obligatorio")
    }

    if (estado === "ENDOSADO_BROKER" && !endosadoABrokerId) {
      return badRequestResponse("El broker endosado es obligatorio")
    }

    if (estado === "DESCONTADO_BANCO" && tasaDescuento == null) {
      return badRequestResponse("La tasa de descuento es obligatoria para cheques descontados en banco")
    }

    const cheque = await prisma.chequeRecibido.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(cheque)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cheques-recibidos/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque recibido], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de cartera de cheques cuando hubo una carga incorrecta.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "cr1" } }) === NextResponse.json({ message: "Cheque recibido eliminado correctamente" })
 * DELETE(request, { params: { id: "cr2" } }) === NextResponse.json({ message: "Cheque recibido eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque recibido no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.chequeRecibido.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cheque recibido")

    await prisma.chequeRecibido.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Cheque recibido eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/cheques-recibidos/[id]", error)
  }
}
