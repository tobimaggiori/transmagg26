import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearChequeRecibidoSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los cheques recibidos con empresa, factura y relaciones de depósito o endoso].
 * Esta función existe para administrar la cartera de cheques de terceros del módulo financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nroCheque, empresa, estado }])
 * GET() === NextResponse.json([{ id, cuentaDeposito, endosadoAFletero }])
 * GET() === NextResponse.json([])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId")
    const estado = searchParams.get("estado") ?? undefined
    const esElectronicoParam = searchParams.get("esElectronico")
    const empresaId = searchParams.get("empresaId") ?? undefined
    const tieneFacturaParam = searchParams.get("tieneFactura")
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "100", 10)))

    const where = {
      ...(cuentaId ? { cuentaDepositoId: cuentaId } : {}),
      ...(estado ? { estado } : {}),
      ...(esElectronicoParam !== null ? { esElectronico: esElectronicoParam === "true" } : {}),
      ...(empresaId ? { empresaId } : {}),
      ...(tieneFacturaParam !== null
        ? tieneFacturaParam === "true" ? { facturaId: { not: null } } : { facturaId: null }
        : {}),
      ...(desde || hasta
        ? { fechaCobro: { ...(desde ? { gte: new Date(desde) } : {}), ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}) } }
        : {}),
    }

    const [total, cheques] = await Promise.all([
      prisma.chequeRecibido.count({ where }),
      prisma.chequeRecibido.findMany({
        where,
        include: {
          empresa: { select: { id: true, razonSocial: true } },
          factura: { select: { id: true, nroComprobante: true, tipoCbte: true } },
          cuentaDeposito: { select: { id: true, nombre: true } },
          endosadoAFletero: { select: { id: true, razonSocial: true } },
          endosadoAProveedor: { select: { id: true, razonSocial: true } },
          endosadoABroker: { select: { id: true, nombre: true } },
          operador: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: { fechaCobro: "asc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ cheques, total, page, limit })
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-recibidos", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con los datos de un cheque recibido], devuelve [el cheque creado si pasa validaciones de negocio según su estado].
 * Esta función existe para registrar ingresos vía cheques de clientes y su trazabilidad posterior.
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
    const parsed = crearChequeRecibidoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const data = parsed.data
    const [empresa, factura] = await Promise.all([
      prisma.empresa.findUnique({ where: { id: data.empresaId } }),
      data.facturaId ? prisma.facturaEmitida.findUnique({ where: { id: data.facturaId } }) : Promise.resolve(null),
    ])

    if (!empresa) return notFoundResponse("Empresa")
    if (data.facturaId && !factura) return notFoundResponse("Factura")

    if (data.estado === "DEPOSITADO" && !data.cuentaDepositoId) {
      return badRequestResponse("La cuenta de depósito es obligatoria para cheques depositados")
    }

    if (data.estado === "ENDOSADO_FLETERO" && !data.endosadoAFleteroId) {
      return badRequestResponse("El fletero endosado es obligatorio")
    }

    if (data.estado === "ENDOSADO_PROVEEDOR" && !data.endosadoAProveedorId) {
      return badRequestResponse("El proveedor endosado es obligatorio")
    }

    if (data.estado === "ENDOSADO_BROKER" && !data.endosadoABrokerId) {
      return badRequestResponse("El broker endosado es obligatorio")
    }

    if (data.estado === "DESCONTADO_BANCO" && data.tasaDescuento == null) {
      return badRequestResponse("La tasa de descuento es obligatoria para cheques descontados en banco")
    }

    const cheque = await prisma.chequeRecibido.create({
      data: {
        ...data,
        operadorId,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos", error)
  }
}
