import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarEmpleadoSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un empleado], devuelve [el detalle del empleado con usuario vinculado y movimientos bancarios].
 * Esta función existe para consultar trazabilidad de pagos de sueldo por empleado.
 *
 * Ejemplos:
 * GET(request, { params: { id: "e1" } }) === NextResponse.json({ id: "e1", usuario, movimientosBancarios })
 * GET(request, { params: { id: "e2" } }) === NextResponse.json({ id: "e2", nombre, cuit })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const empleado = await prisma.empleado.findUnique({
      where: { id: params.id },
      include: {
        usuario: { select: { id: true, nombre: true, apellido: true, email: true } },
      },
    })

    if (!empleado) return notFoundResponse("Empleado")
    return NextResponse.json(empleado)
  } catch (error) {
    return serverErrorResponse("GET /api/empleados/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un empleado y un body parcial], devuelve [el empleado actualizado].
 * Esta función existe para corregir datos identificatorios o vínculo con usuario.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "e1" } }) === NextResponse.json({ id: "e1", cargo: "Tesorería" })
 * PATCH(request, { params: { id: "e1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarEmpleadoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.empleado.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Empleado")

    if (parsed.data.usuarioId) {
      const usuario = await prisma.usuario.findUnique({ where: { id: parsed.data.usuarioId } })
      if (!usuario) return notFoundResponse("Usuario")
    }

    if (parsed.data.cuit || parsed.data.usuarioId) {
      const duplicado = await prisma.empleado.findFirst({
        where: {
          id: { not: params.id },
          OR: [
            ...(parsed.data.cuit ? [{ cuit: parsed.data.cuit }] : []),
            ...(parsed.data.usuarioId ? [{ usuarioId: parsed.data.usuarioId }] : []),
          ],
        },
      })

      if (duplicado) return conflictResponse("Ya existe un empleado con ese CUIT o usuario")
    }

    const empleado = await prisma.empleado.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(empleado)
  } catch (error) {
    return serverErrorResponse("PATCH /api/empleados/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un empleado], devuelve [una confirmación de baja lógica marcándolo inactivo].
 * Esta función existe para preservar historial de movimientos bancarios asociados al empleado.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "e1" } }) === NextResponse.json({ message: "Empleado desactivado correctamente" })
 * DELETE(request, { params: { id: "e2" } }) === NextResponse.json({ message: "Empleado desactivado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.empleado.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Empleado")

    await prisma.empleado.update({ where: { id: params.id }, data: { activo: false } })
    return NextResponse.json({ message: "Empleado desactivado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/empleados/[id]", error)
  }
}
