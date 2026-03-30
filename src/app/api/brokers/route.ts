import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearBrokerSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los brokers con su cuenta vinculada].
 * Esta función existe para administrar brokers configurables desde ABM.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nombre, cuenta }])
 * GET() === NextResponse.json([{ id, cuit, activo }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const brokers = await prisma.broker.findMany({
      include: { cuenta: true },
      orderBy: { nombre: "asc" },
    })

    return NextResponse.json(brokers)
  } catch (error) {
    return serverErrorResponse("GET /api/brokers", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nombre, cuit, cuentaId y activo], devuelve [el broker creado si la cuenta broker existe y no hay duplicados].
 * Esta función existe para alta de brokers vinculados a cuentas tipo BROKER.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nombre }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Ya existe un broker con ese nombre, CUIT o cuenta" }, { status: 409 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearBrokerSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (cuenta.tipo !== "BROKER") return NextResponse.json({ error: "La cuenta vinculada debe ser de tipo BROKER" }, { status: 400 })

    const duplicado = await prisma.broker.findFirst({
      where: {
        OR: [
          { nombre: parsed.data.nombre },
          { cuit: parsed.data.cuit },
          { cuentaId: parsed.data.cuentaId },
        ],
      },
    })

    if (duplicado) return conflictResponse("Ya existe un broker con ese nombre, CUIT o cuenta")

    const broker = await prisma.broker.create({ data: parsed.data })
    return NextResponse.json(broker, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/brokers", error)
  }
}
