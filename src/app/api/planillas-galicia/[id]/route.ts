import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarPlanillaGaliciaSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una planilla Galicia], devuelve [el detalle completo con cuenta, cheques y operador].
 * Esta función existe para revisar un lote antes o después de exportarlo.
 *
 * Ejemplos:
 * GET(request, { params: { id: "pg1" } }) === NextResponse.json({ id: "pg1", chequesEmitidos, cuenta })
 * GET(request, { params: { id: "pg2" } }) === NextResponse.json({ id: "pg2", estado, totalMonto })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Planilla Galicia no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const planilla = await prisma.planillaGalicia.findUnique({
      where: { id: params.id },
      include: {
        cuenta: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
        chequesEmitidos: true,
      },
    })

    if (!planilla) return notFoundResponse("Planilla Galicia")
    return NextResponse.json(planilla)
  } catch (error) {
    return serverErrorResponse("GET /api/planillas-galicia/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una planilla Galicia y un body parcial], devuelve [la planilla actualizada respetando reglas de cuenta y máximo 250 cheques].
 * Esta función existe para editar metadatos y estado del lote de emisión.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "pg1" } }) === NextResponse.json({ id: "pg1", estado: "DESCARGADA" })
 * PATCH(request, { params: { id: "pg1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Planilla Galicia no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarPlanillaGaliciaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.planillaGalicia.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Planilla Galicia")

    const cuentaId = parsed.data.cuentaId ?? existente.cuentaId
    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.tienePlanillaEmisionMasiva) {
      return badRequestResponse("La cuenta seleccionada no admite planilla de emisión masiva")
    }

    const planilla = await prisma.planillaGalicia.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(planilla)
  } catch (error) {
    return serverErrorResponse("PATCH /api/planillas-galicia/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una planilla Galicia], devuelve [una confirmación luego de eliminarla].
 * Esta función existe para descartar borradores mal cargados antes de su procesamiento final.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "pg1" } }) === NextResponse.json({ message: "Planilla Galicia eliminada correctamente" })
 * DELETE(request, { params: { id: "pg2" } }) === NextResponse.json({ message: "Planilla Galicia eliminada correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Planilla Galicia no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.planillaGalicia.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Planilla Galicia")

    await prisma.planillaGalicia.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Planilla Galicia eliminada correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/planillas-galicia/[id]", error)
  }
}
