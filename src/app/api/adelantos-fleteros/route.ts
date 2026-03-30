import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearAdelantoFleteroSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los adelantos a fleteros con sus descuentos, fletero y cheques relacionados].
 * Esta función existe para administrar anticipos operativos y su recuperación posterior en liquidaciones.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, fletero, monto, estado }])
 * GET() === NextResponse.json([{ id, descuentos, chequeEmitido, chequeRecibido }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const adelantos = await prisma.adelantoFletero.findMany({
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        chequeEmitido: { select: { id: true, nroCheque: true, monto: true } },
        chequeRecibido: { select: { id: true, nroCheque: true, monto: true } },
        descuentos: {
          include: {
            liquidacion: { select: { id: true, estado: true, total: true } },
          },
          orderBy: { fecha: "desc" },
        },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(adelantos)
  } catch (error) {
    return serverErrorResponse("GET /api/adelantos-fleteros", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con datos del adelanto a fletero], devuelve [el adelanto creado con operador autenticado si las referencias existen y los montos son consistentes].
 * Esta función existe para registrar adelantos por efectivo, transferencia, combustible o cheques.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, fleteroId, estado }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "El monto descontado no puede superar el monto del adelanto" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearAdelantoFleteroSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const data = parsed.data

    if (data.montoDescontado > data.monto) {
      return badRequestResponse("El monto descontado no puede superar el monto del adelanto")
    }

    const [fletero, chequeEmitido, chequeRecibido] = await Promise.all([
      prisma.fletero.findUnique({ where: { id: data.fleteroId } }),
      data.chequeEmitidoId ? prisma.chequeEmitido.findUnique({ where: { id: data.chequeEmitidoId } }) : Promise.resolve(null),
      data.chequeRecibidoId ? prisma.chequeRecibido.findUnique({ where: { id: data.chequeRecibidoId } }) : Promise.resolve(null),
    ])

    if (!fletero) return notFoundResponse("Fletero")
    if (data.chequeEmitidoId && !chequeEmitido) return notFoundResponse("Cheque emitido")
    if (data.chequeRecibidoId && !chequeRecibido) return notFoundResponse("Cheque recibido")

    const adelanto = await prisma.adelantoFletero.create({
      data: {
        ...data,
        operadorId: access.session.user.id,
      },
    })

    return NextResponse.json(adelanto, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/adelantos-fleteros", error)
  }
}
