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
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheques = await prisma.chequeRecibido.findMany({
      include: {
        empresa: { select: { id: true, razonSocial: true } },
        factura: { select: { id: true, nroComprobante: true } },
        cuentaDeposito: { select: { id: true, nombre: true } },
        endosadoAFletero: { select: { id: true, razonSocial: true } },
        endosadoAProveedor: { select: { id: true, razonSocial: true } },
        endosadoABroker: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaCobro: "asc" },
    })

    return NextResponse.json(cheques)
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
        operadorId: access.session.user.id,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos", error)
  }
}
