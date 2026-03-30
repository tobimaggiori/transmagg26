import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarFciSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un FCI], devuelve [su detalle con cuenta, movimientos y saldos].
 * Esta función existe para la vista individual y auditoría de fondos.
 *
 * Ejemplos:
 * GET(request, { params: { id: "f1" } }) === NextResponse.json({ id: "f1", cuenta, movimientos, saldos })
 * GET(request, { params: { id: "f2" } }) === NextResponse.json({ id: "f2", nombre, activo })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "FCI no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const fci = await prisma.fci.findUnique({
      where: { id: params.id },
      include: {
        cuenta: true,
        movimientos: { orderBy: { fecha: "desc" } },
        saldos: { orderBy: { fechaActualizacion: "desc" } },
      },
    })

    if (!fci) return notFoundResponse("FCI")
    return NextResponse.json(fci)
  } catch (error) {
    return serverErrorResponse("GET /api/fci/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un FCI y un body parcial], devuelve [el FCI actualizado si existe y pasa validación].
 * Esta función existe para editar alertas, cuenta asociada y estado operativo del fondo.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "f1" } }) === NextResponse.json({ id: "f1", activo: false })
 * PATCH(request, { params: { id: "f1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "FCI no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarFciSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.fci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("FCI")

    if (parsed.data.cuentaId) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
      if (!cuenta) return notFoundResponse("Cuenta")
    }

    if (parsed.data.nombre && parsed.data.nombre !== existente.nombre) {
      const duplicado = await prisma.fci.findUnique({ where: { nombre: parsed.data.nombre } })
      if (duplicado) return conflictResponse("Ya existe un FCI con ese nombre")
    }

    const fci = await prisma.fci.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(fci)
  } catch (error) {
    return serverErrorResponse("PATCH /api/fci/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un FCI], devuelve [una confirmación de baja lógica marcándolo inactivo].
 * Esta función existe para preservar historial de movimientos y saldos sin eliminar trazabilidad.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "f1" } }) === NextResponse.json({ message: "FCI desactivado correctamente" })
 * DELETE(request, { params: { id: "f2" } }) === NextResponse.json({ message: "FCI desactivado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "FCI no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.fci.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("FCI")

    await prisma.fci.update({ where: { id: params.id }, data: { activo: false } })
    return NextResponse.json({ message: "FCI desactivado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/fci/[id]", error)
  }
}
