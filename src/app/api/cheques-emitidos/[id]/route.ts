import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarChequeEmitidoSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque emitido], devuelve [el detalle completo con cuenta, beneficiario, planilla y liquidación].
 * Esta función existe para auditar una emisión de cheque individual.
 *
 * Ejemplos:
 * GET(request, { params: { id: "ce1" } }) === NextResponse.json({ id: "ce1", cuenta, estado })
 * GET(request, { params: { id: "ce2" } }) === NextResponse.json({ id: "ce2", fletero, planillaGalicia })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheque = await prisma.chequeEmitido.findUnique({
      where: { id: params.id },
      include: {
        fletero: true,
        proveedor: true,
        cuenta: true,
        liquidacion: true,
        planillaGalicia: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!cheque) return notFoundResponse("Cheque emitido")
    return NextResponse.json(cheque)
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-emitidos/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque emitido y un body parcial], devuelve [el cheque actualizado respetando reglas del beneficiario y planilla].
 * Esta función existe para corregir datos de emisión, estado o asociación del cheque.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "ce1" } }) === NextResponse.json({ id: "ce1", estado: "EMITIDO" })
 * PATCH(request, { params: { id: "ce1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarChequeEmitidoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.chequeEmitido.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cheque emitido")

    const cuentaId = parsed.data.cuentaId ?? existente.cuentaId
    const fleteroId = parsed.data.fleteroId ?? existente.fleteroId
    const proveedorId = parsed.data.proveedorId ?? existente.proveedorId
    const planillaGaliciaId = parsed.data.planillaGaliciaId ?? existente.planillaGaliciaId
    const descripcion1 = parsed.data.descripcion1 ?? existente.descripcion1
    const descripcion2 = parsed.data.descripcion2 ?? existente.descripcion2

    const [cuenta, planilla] = await Promise.all([
      prisma.cuenta.findUnique({ where: { id: cuentaId } }),
      planillaGaliciaId ? prisma.planillaGalicia.findUnique({ where: { id: planillaGaliciaId } }) : Promise.resolve(null),
    ])

    if (!cuenta) return notFoundResponse("Cuenta")
    if (planillaGaliciaId && !planilla) return notFoundResponse("Planilla Galicia")
    if (!fleteroId && !proveedorId) {
      return badRequestResponse("El cheque emitido debe vincularse a un fletero o a un proveedor")
    }
    if (descripcion2 && !descripcion1) {
      return badRequestResponse("Descripción 2 requiere descripción 1")
    }
    if (planillaGaliciaId && !cuenta.tienePlanillaEmisionMasiva) {
      return badRequestResponse("La cuenta seleccionada no admite planilla de emisión masiva")
    }

    const cheque = await prisma.chequeEmitido.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(cheque)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cheques-emitidos/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un cheque emitido], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de cheques propios ante cargas erróneas.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "ce1" } }) === NextResponse.json({ message: "Cheque emitido eliminado correctamente" })
 * DELETE(request, { params: { id: "ce2" } }) === NextResponse.json({ message: "Cheque emitido eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.chequeEmitido.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cheque emitido")

    await prisma.chequeEmitido.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Cheque emitido eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/cheques-emitidos/[id]", error)
  }
}
