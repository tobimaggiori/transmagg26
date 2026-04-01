import { NextRequest, NextResponse } from "next/server"
import { resolverOperadorId } from "@/lib/session-utils"
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
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId") ?? undefined
    const estado = searchParams.get("estado") ?? undefined
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined
    const beneficiario = searchParams.get("beneficiario") ?? undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)))

    const where = {
      ...(cuentaId ? { cuentaId } : {}),
      ...(estado ? { estado } : {}),
      ...(desde || hasta
        ? { fechaPago: { ...(desde ? { gte: new Date(desde) } : {}), ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}) } }
        : {}),
      ...(beneficiario
        ? {
            OR: [
              { nroDocBeneficiario: { contains: beneficiario } },
              { mailBeneficiario: { contains: beneficiario } },
              { fletero: { razonSocial: { contains: beneficiario } } },
              { proveedor: { razonSocial: { contains: beneficiario } } },
            ],
          }
        : {}),
    }

    const [total, cheques] = await Promise.all([
      prisma.chequeEmitido.count({ where }),
      prisma.chequeEmitido.findMany({
        where,
        include: {
          fletero: { select: { id: true, razonSocial: true, cuit: true } },
          proveedor: { select: { id: true, razonSocial: true, cuit: true } },
          cuenta: { select: { id: true, nombre: true } },
          liquidacion: { select: { id: true, estado: true, total: true } },
          planillaGalicia: { select: { id: true, nombre: true, estado: true } },
          operador: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: [{ fechaPago: "asc" }, { creadoEn: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ cheques, total, page, limit })
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

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

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
        operadorId,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-emitidos", error)
  }
}
