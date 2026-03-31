import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearMovimientoFciSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los movimientos FCI con FCI, cuenta relacionada y operador].
 * Esta función existe para consultar suscripciones y rescates con trazabilidad operativa.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, tipo, monto, fci, cuentaOrigenDestino }])
 * GET() === NextResponse.json([{ id, operador, fecha }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const movimientos = await prisma.movimientoFci.findMany({
      include: {
        fci: { select: { id: true, nombre: true } },
        cuentaOrigenDestino: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json(movimientos)
  } catch (error) {
    return serverErrorResponse("GET /api/movimientos-fci", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con fciId, cuentaOrigenDestinoId, tipo, monto, fecha y descripción], devuelve [el movimiento FCI creado con operador autenticado].
 * Esta función existe para registrar suscripciones y rescates de FCI sin generar impuesto débito/crédito.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, tipo: "SUSCRIPCION" }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "FCI no encontrado" }, { status: 404 })
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
    const parsed = crearMovimientoFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const [fci, cuenta] = await Promise.all([
      prisma.fci.findUnique({ where: { id: parsed.data.fciId } }),
      prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaOrigenDestinoId } }),
    ])

    if (!fci) return notFoundResponse("FCI")
    if (!cuenta) return notFoundResponse("Cuenta")

    const movimiento = await prisma.movimientoFci.create({
      data: {
        ...parsed.data,
        operadorId,
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/movimientos-fci", error)
  }
}
