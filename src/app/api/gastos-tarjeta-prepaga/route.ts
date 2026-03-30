import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearGastoTarjetaPrepagaSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los gastos de tarjeta prepaga con tarjeta, chofer y operador].
 * Esta función existe para controlar consumos operativos realizados por choferes.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, tarjeta, tipoGasto, monto }])
 * GET() === NextResponse.json([{ id, fecha, operador }])
 * GET() === NextResponse.json([])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const tarjetaId = searchParams.get("tarjetaId")

    const gastos = await prisma.gastoTarjetaPrepaga.findMany({
      where: tarjetaId ? { tarjetaId } : undefined,
      include: {
        tarjeta: {
          include: {
            chofer: { select: { id: true, nombre: true, apellido: true } },
            cuenta: { select: { id: true, nombre: true } },
          },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(gastos)
  } catch (error) {
    return serverErrorResponse("GET /api/gastos-tarjeta-prepaga", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con tarjetaId, tipoGasto, monto, fecha y opcionales], devuelve [el gasto creado con operador autenticado].
 * Esta función existe para registrar consumos rendidos contra tarjetas prepagas de choferes.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, tarjetaId, tipoGasto }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Tarjeta prepaga no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearGastoTarjetaPrepagaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const tarjeta = await prisma.tarjetaPrepaga.findUnique({ where: { id: parsed.data.tarjetaId } })
    if (!tarjeta) return notFoundResponse("Tarjeta prepaga")

    const gasto = await prisma.gastoTarjetaPrepaga.create({
      data: {
        ...parsed.data,
        operadorId: access.session.user.id,
      },
    })

    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/gastos-tarjeta-prepaga", error)
  }
}
