import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearChequeEmitidoSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los cheques emitidos con cuenta, beneficiarios potenciales, planilla y liquidación].
 * Esta función existe para administrar la operatoria de cheques propios desde el módulo financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nroCheque, cuenta, estado }])
 * GET() === NextResponse.json([{ id, fletero, proveedor, planillaGalicia }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheques = await prisma.chequeEmitido.findMany({
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        proveedor: { select: { id: true, razonSocial: true } },
        cuenta: { select: { id: true, nombre: true } },
        liquidacion: { select: { id: true, estado: true, total: true } },
        planillaGalicia: { select: { id: true, nombre: true, estado: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: [{ fechaPago: "asc" }, { creadoEn: "desc" }],
    })

    return NextResponse.json(cheques)
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-emitidos", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con los datos de un cheque emitido], devuelve [el cheque creado si las referencias y reglas del beneficiario son válidas].
 * Esta función existe para registrar cheques propios individuales o integrables a planillas masivas.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nroCheque, estado }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearChequeEmitidoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const data = parsed.data
    const [cuenta, fletero, proveedor, liquidacion, planilla] = await Promise.all([
      prisma.cuenta.findUnique({ where: { id: data.cuentaId } }),
      data.fleteroId ? prisma.fletero.findUnique({ where: { id: data.fleteroId } }) : Promise.resolve(null),
      data.proveedorId ? prisma.proveedor.findUnique({ where: { id: data.proveedorId } }) : Promise.resolve(null),
      data.liquidacionId ? prisma.liquidacion.findUnique({ where: { id: data.liquidacionId } }) : Promise.resolve(null),
      data.planillaGaliciaId ? prisma.planillaGalicia.findUnique({ where: { id: data.planillaGaliciaId } }) : Promise.resolve(null),
    ])

    if (!cuenta) return notFoundResponse("Cuenta")
    if (data.fleteroId && !fletero) return notFoundResponse("Fletero")
    if (data.proveedorId && !proveedor) return notFoundResponse("Proveedor")
    if (data.liquidacionId && !liquidacion) return notFoundResponse("Liquidación")
    if (data.planillaGaliciaId && !planilla) return notFoundResponse("Planilla Galicia")
    if (!data.fleteroId && !data.proveedorId) {
      return badRequestResponse("El cheque emitido debe vincularse a un fletero o a un proveedor")
    }
    if (data.descripcion2 && !data.descripcion1) {
      return badRequestResponse("Descripción 2 requiere descripción 1")
    }
    if (data.planillaGaliciaId && !cuenta.tienePlanillaEmisionMasiva) {
      return badRequestResponse("La cuenta seleccionada no admite planilla de emisión masiva")
    }

    const cheque = await prisma.chequeEmitido.create({
      data: {
        ...data,
        operadorId: access.session.user.id,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-emitidos", error)
  }
}
