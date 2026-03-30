import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearEmpleadoSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [todos los empleados con usuario vinculado opcional].
 * Esta función existe para administrar beneficiarios de pago de sueldo desde el módulo financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nombre, apellido, usuario }])
 * GET() === NextResponse.json([{ id, cuit, fechaIngreso, activo }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const empleados = await prisma.empleado.findMany({
      include: { usuario: { select: { id: true, nombre: true, apellido: true, email: true } } },
      orderBy: [{ activo: "desc" }, { apellido: "asc" }],
    })

    return NextResponse.json(empleados)
  } catch (error) {
    return serverErrorResponse("GET /api/empleados", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con usuarioId opcional, nombre, apellido, cuit, cargo, fechaIngreso y activo], devuelve [el empleado creado si las referencias y unicidad son válidas].
 * Esta función existe para dar de alta empleados alcanzados por pagos de sueldo.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nombre, apellido }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "Ya existe un empleado con ese CUIT o usuario" }, { status: 409 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearEmpleadoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    if (parsed.data.usuarioId) {
      const usuario = await prisma.usuario.findUnique({ where: { id: parsed.data.usuarioId } })
      if (!usuario) return notFoundResponse("Usuario")
    }

    const duplicado = await prisma.empleado.findFirst({
      where: {
        OR: [
          { cuit: parsed.data.cuit },
          ...(parsed.data.usuarioId ? [{ usuarioId: parsed.data.usuarioId }] : []),
        ],
      },
    })

    if (duplicado) return conflictResponse("Ya existe un empleado con ese CUIT o usuario")

    const empleado = await prisma.empleado.create({ data: parsed.data })
    return NextResponse.json(empleado, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/empleados", error)
  }
}
