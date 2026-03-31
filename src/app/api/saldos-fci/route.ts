import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearSaldoFciSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los saldos FCI con fondo y operador].
 * Esta función existe para consultar la evolución informada de cada FCI.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, saldoInformado, rendimientoPeriodo, fci }])
 * GET() === NextResponse.json([{ id, fechaActualizacion, operador }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const saldos = await prisma.saldoFci.findMany({
      include: {
        fci: { select: { id: true, nombre: true } },
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
      orderBy: { fechaActualizacion: "desc" },
    })

    return NextResponse.json(saldos)
  } catch (error) {
    return serverErrorResponse("GET /api/saldos-fci", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con fciId, saldoInformado y fechaActualizacion], devuelve [el saldo FCI creado con rendimientoPeriodo calculado contra el saldo anterior].
 * Esta función existe para registrar el saldo visible al operador y medir rendimiento entre actualizaciones.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, rendimientoPeriodo }, { status: 201 })
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
    const parsed = crearSaldoFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const fci = await prisma.fci.findUnique({
      where: { id: parsed.data.fciId },
      include: { saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1 } },
    })

    if (!fci) return notFoundResponse("FCI")

    const saldoAnterior = fci.saldos[0]?.saldoInformado ?? 0
    const saldo = await prisma.saldoFci.create({
      data: {
        ...parsed.data,
        rendimientoPeriodo: parsed.data.saldoInformado - saldoAnterior,
        operadorId,
      },
    })

    return NextResponse.json(saldo, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/saldos-fci", error)
  }
}
