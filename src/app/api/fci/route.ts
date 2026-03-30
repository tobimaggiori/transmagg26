import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
  conflictResponse,
} from "@/lib/financial-api"
import { crearFciSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los FCI con su cuenta asociada, último saldo y cantidad de movimientos].
 * Esta función existe para listar y administrar fondos comunes de inversión desde el módulo financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nombre, cuenta, saldos }])
 * GET() === NextResponse.json([{ id, diasHabilesAlerta, activo }])
 * GET() === NextResponse.json([])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId")

    const fondos = await prisma.fci.findMany({
      where: cuentaId ? { cuentaId } : undefined,
      include: {
        cuenta: { select: { id: true, nombre: true, tipo: true, moneda: true } },
        saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1 },
        _count: { select: { movimientos: true } },
      },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(fondos)
  } catch (error) {
    return serverErrorResponse("GET /api/fci", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nombre, cuentaId, moneda, activo y diasHabilesAlerta], devuelve [el FCI creado si la cuenta existe y no hay duplicados].
 * Esta función existe para el alta configurable de FCI vinculados a bancos o brokers.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nombre }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * POST(request) === NextResponse.json({ error: "Ya existe un FCI con ese nombre" }, { status: 409 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const [cuenta, existente] = await Promise.all([
      prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } }),
      prisma.fci.findUnique({ where: { nombre: parsed.data.nombre } }),
    ])

    if (!cuenta) return notFoundResponse("Cuenta")
    if (existente) return conflictResponse("Ya existe un FCI con ese nombre")

    const fci = await prisma.fci.create({ data: parsed.data })
    return NextResponse.json(fci, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/fci", error)
  }
}
