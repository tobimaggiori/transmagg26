/**
 * API Route: /api/brokers
 * GET: lista brokers maestros con conteo de cuentas asociadas.
 * POST: crea un broker (nombre + CUIT únicos).
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearBrokerSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Devuelve los brokers ordenados por nombre, con la cantidad de cuentas
 * comitentes vinculadas.
 *
 * Ejemplos:
 * GET /api/brokers === 200 [{ id, nombre, cuit, activo, cuentasCount: 2 }]
 * GET /api/brokers (sin sesión) === 401
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const brokers = await prisma.broker.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    })
    return NextResponse.json(
      brokers.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        cuit: b.cuit,
        activo: b.activo,
        creadoEn: b.creadoEn,
        cuentasCount: b._count.cuentas,
      })),
    )
  } catch (error) {
    return serverErrorResponse("GET /api/brokers", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nombre y cuit], devuelve [el broker creado si no hay colisión de nombre o CUIT].
 *
 * Ejemplos:
 * POST { nombre: "Bull Market", cuit: "30712345678" } === 201
 * POST { nombre: "" } === 400
 * POST duplicado en nombre o cuit === 409
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const body = await request.json()
    const parsed = crearBrokerSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const nombre = parsed.data.nombre.trim()
    const cuit = parsed.data.cuit

    const duplicado = await prisma.broker.findFirst({
      where: {
        OR: [
          { nombre: { equals: nombre, mode: "insensitive" } },
          { cuit },
        ],
      },
    })
    if (duplicado) return conflictResponse("Ya existe un broker con ese nombre o CUIT")

    const broker = await prisma.broker.create({ data: { nombre, cuit } })
    return NextResponse.json(broker, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/brokers", error)
  }
}
