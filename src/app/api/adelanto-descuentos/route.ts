import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearAdelantoDescuentoSchema } from "@/lib/financial-schemas"
import { sumarImportes } from "@/lib/money"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los descuentos de adelantos con adelanto y liquidación].
 * Esta función existe para auditar el recupero parcial o total de adelantos contra liquidaciones.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, adelanto, liquidacion, montoDescontado }])
 * GET() === NextResponse.json([{ id, fecha, adelanto: { estado } }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const descuentos = await prisma.adelantoDescuento.findMany({
      include: {
        adelanto: {
          include: {
            fletero: { select: { id: true, razonSocial: true } },
          },
        },
        liquidacion: { select: { id: true, estado: true, total: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(descuentos)
  } catch (error) {
    return serverErrorResponse("GET /api/adelanto-descuentos", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con adelantoId, liquidacionId, montoDescontado y fecha], devuelve [el descuento creado y además actualiza el adelanto acumulando el monto descontado y recalculando estado].
 * Esta función existe para registrar cada aplicación parcial o total de un adelanto sobre una liquidación.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, adelantoId, liquidacionId }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Adelanto fletero no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "El descuento supera el saldo pendiente del adelanto" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearAdelantoDescuentoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const [adelanto, liquidacion] = await Promise.all([
      prisma.adelantoFletero.findUnique({ where: { id: parsed.data.adelantoId } }),
      prisma.liquidacion.findUnique({ where: { id: parsed.data.liquidacionId } }),
    ])

    if (!adelanto) return notFoundResponse("Adelanto fletero")
    if (!liquidacion) return notFoundResponse("Liquidación")

    const nuevoMontoDescontado = sumarImportes([adelanto.montoDescontado, parsed.data.montoDescontado])
    if (nuevoMontoDescontado > adelanto.monto) {
      return badRequestResponse("El descuento supera el saldo pendiente del adelanto")
    }

    const estado =
      nuevoMontoDescontado === 0
        ? "PENDIENTE_DESCUENTO"
        : nuevoMontoDescontado < adelanto.monto
          ? "DESCONTADO_PARCIAL"
          : "DESCONTADO_TOTAL"

    const resultado = await prisma.$transaction(async (tx) => {
      const descuento = await tx.adelantoDescuento.create({ data: parsed.data })

      await tx.adelantoFletero.update({
        where: { id: adelanto.id },
        data: {
          montoDescontado: nuevoMontoDescontado,
          estado,
        },
      })

      return descuento
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/adelanto-descuentos", error)
  }
}
