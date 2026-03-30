import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearTarjetaPrepagaSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todas las tarjetas prepagas con chofer, cuenta y gastos asociados].
 * Esta función existe para administrar tarjetas de choferes emitidas por billeteras virtuales.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, chofer, cuenta, activa }])
 * GET() === NextResponse.json([{ id, limiteMensual, gastos }])
 * GET() === NextResponse.json([])
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId")

    const tarjetas = await prisma.tarjetaPrepaga.findMany({
      where: cuentaId ? { cuentaId } : undefined,
      include: {
        chofer: { select: { id: true, nombre: true, apellido: true, email: true } },
        cuenta: { select: { id: true, nombre: true } },
        gastos: { orderBy: { fecha: "desc" } },
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json(tarjetas)
  } catch (error) {
    return serverErrorResponse("GET /api/tarjetas-prepagas", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con choferId, cuentaId, nroTarjeta, limiteMensual y activa], devuelve [la tarjeta prepaga creada si el chofer y la cuenta existen].
 * Esta función existe para dar de alta tarjetas operativas de choferes.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, choferId, cuentaId }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearTarjetaPrepagaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const [chofer, cuenta] = await Promise.all([
      prisma.usuario.findUnique({ where: { id: parsed.data.choferId } }),
      prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } }),
    ])

    if (!chofer) return notFoundResponse("Chofer")
    if (!cuenta) return notFoundResponse("Cuenta")

    const tarjeta = await prisma.tarjetaPrepaga.create({ data: parsed.data })
    return NextResponse.json(tarjeta, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/tarjetas-prepagas", error)
  }
}
