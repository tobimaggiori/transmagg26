import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearPlanillaGaliciaSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todas las planillas Galicia con cuenta, operador y cheques asociados].
 * Esta función existe para administrar lotes de emisión masiva de cheques.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nombre, cuenta, cantidadCheques }])
 * GET() === NextResponse.json([{ id, estado, totalMonto, chequesEmitidos }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const planillas = await prisma.planillaGalicia.findMany({
      include: {
        cuenta: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
        chequesEmitidos: { select: { id: true, nroCheque: true, monto: true, estado: true } },
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json(planillas)
  } catch (error) {
    return serverErrorResponse("GET /api/planillas-galicia", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nombre, cuentaId, estado, totalMonto, cantidadCheques y xlsxS3Key opcional], devuelve [la planilla creada si la cuenta soporta emisión masiva y no supera 250 cheques].
 * Esta función existe para crear borradores de planillas Galicia antes de exportarlas.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nombre, estado }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "La cuenta seleccionada no admite planilla de emisión masiva" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearPlanillaGaliciaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.tienePlanillaEmisionMasiva) {
      return badRequestResponse("La cuenta seleccionada no admite planilla de emisión masiva")
    }

    const planilla = await prisma.planillaGalicia.create({
      data: {
        ...parsed.data,
        operadorId: access.session.user.id,
      },
    })

    return NextResponse.json(planilla, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/planillas-galicia", error)
  }
}
