import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarBrokerSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un broker], devuelve [el detalle del broker y su cuenta vinculada].
 * Esta función existe para inspección individual de brokers configurados.
 *
 * Ejemplos:
 * GET(request, { params: { id: "b1" } }) === NextResponse.json({ id: "b1", cuenta })
 * GET(request, { params: { id: "b2" } }) === NextResponse.json({ id: "b2", nombre, cuit })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Broker no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const broker = await prisma.broker.findUnique({ where: { id: params.id }, include: { cuenta: true } })
    if (!broker) return notFoundResponse("Broker")
    return NextResponse.json(broker)
  } catch (error) {
    return serverErrorResponse("GET /api/brokers/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un broker y un body parcial], devuelve [el broker actualizado].
 * Esta función existe para editar nombre, CUIT, cuenta asociada y estado del broker.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "b1" } }) === NextResponse.json({ id: "b1", activo: false })
 * PATCH(request, { params: { id: "b1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Broker no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarBrokerSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.broker.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Broker")

    if (parsed.data.cuentaId) {
      const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId } })
      if (!cuenta) return notFoundResponse("Cuenta")
      if (cuenta.tipo !== "BROKER") return NextResponse.json({ error: "La cuenta vinculada debe ser de tipo BROKER" }, { status: 400 })
    }

    if (parsed.data.nombre || parsed.data.cuit || parsed.data.cuentaId) {
      const duplicado = await prisma.broker.findFirst({
        where: {
          id: { not: params.id },
          OR: [
            ...(parsed.data.nombre ? [{ nombre: parsed.data.nombre }] : []),
            ...(parsed.data.cuit ? [{ cuit: parsed.data.cuit }] : []),
            ...(parsed.data.cuentaId ? [{ cuentaId: parsed.data.cuentaId }] : []),
          ],
        },
      })

      if (duplicado) return conflictResponse("Ya existe un broker con ese nombre, CUIT o cuenta")
    }

    const broker = await prisma.broker.update({ where: { id: params.id }, data: parsed.data })
    return NextResponse.json(broker)
  } catch (error) {
    return serverErrorResponse("PATCH /api/brokers/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un broker], devuelve [una confirmación de baja lógica marcándolo inactivo].
 * Esta función existe para preservar historial financiero asociado al broker.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "b1" } }) === NextResponse.json({ message: "Broker desactivado correctamente" })
 * DELETE(request, { params: { id: "b2" } }) === NextResponse.json({ message: "Broker desactivado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Broker no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.broker.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Broker")

    await prisma.broker.update({ where: { id: params.id }, data: { activo: false } })
    return NextResponse.json({ message: "Broker desactivado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/brokers/[id]", error)
  }
}
