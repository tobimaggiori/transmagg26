import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sugerirImpuestosMovimientoBancario } from "@/lib/financial"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarMovimientoBancarioSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento bancario], devuelve [el detalle completo con cuenta y relaciones opcionales].
 * Esta función existe para inspección individual de cada registro bancario.
 *
 * Ejemplos:
 * GET(request, { params: { id: "mb1" } }) === NextResponse.json({ id: "mb1", cuenta, operador })
 * GET(request, { params: { id: "mb2" } }) === NextResponse.json({ id: "mb2", tipo, monto })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento bancario no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const movimiento = await prisma.movimientoBancario.findUnique({
      where: { id: params.id },
      include: {
        cuenta: true,
        cuentaDestino: true,
        cuentaBroker: true,
        empleado: true,
        operador: { select: { id: true, nombre: true, apellido: true } },
      },
    })

    if (!movimiento) return notFoundResponse("Movimiento bancario")
    return NextResponse.json(movimiento)
  } catch (error) {
    return serverErrorResponse("GET /api/movimientos-bancarios/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento bancario y un body parcial], devuelve [el movimiento actualizado recalculando sugerencias tributarias si corresponde].
 * Esta función existe para corregir una registración bancaria manteniendo coherencia funcional.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "mb1" } }) === NextResponse.json({ id: "mb1", monto })
 * PATCH(request, { params: { id: "mb1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento bancario no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarMovimientoBancarioSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.movimientoBancario.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento bancario")

    const cuentaId = parsed.data.cuentaId ?? existente.cuentaId
    const cuenta = await prisma.cuenta.findUnique({ where: { id: cuentaId } })
    if (!cuenta) return notFoundResponse("Cuenta")

    const tipo = parsed.data.tipo ?? existente.tipo
    if (tipo === "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS" && !(parsed.data.cuentaDestinoId ?? existente.cuentaDestinoId)) {
      return badRequestResponse("La cuenta destino es obligatoria para transferencias entre cuentas propias")
    }

    if ((tipo === "ENVIO_A_BROKER" || tipo === "RESCATE_DE_BROKER") && !(parsed.data.cuentaBrokerId ?? existente.cuentaBrokerId)) {
      return badRequestResponse("La cuenta broker es obligatoria para envíos y rescates de broker")
    }

    if (tipo === "PAGO_SUELDO" && !(parsed.data.empleadoId ?? existente.empleadoId)) {
      return badRequestResponse("El empleado es obligatorio para pagos de sueldo")
    }

    const sugerencia = sugerirImpuestosMovimientoBancario({
      tipo,
      monto: parsed.data.monto ?? existente.monto,
      tieneImpuestoDebcred: cuenta.tieneImpuestoDebcred,
      alicuotaImpuesto: cuenta.alicuotaImpuesto,
      esCuentaComitenteBroker: cuenta.esCuentaComitenteBroker,
    })

    const movimiento = await prisma.movimientoBancario.update({
      where: { id: params.id },
      data: {
        ...parsed.data,
        impuestoDebitoAplica: parsed.data.impuestoDebitoAplica ?? sugerencia.impuestoDebitoAplica,
        impuestoDebitoMonto: parsed.data.impuestoDebitoMonto ?? sugerencia.impuestoDebitoMonto,
        impuestoCreditoAplica: parsed.data.impuestoCreditoAplica ?? sugerencia.impuestoCreditoAplica,
        impuestoCreditoMonto: parsed.data.impuestoCreditoMonto ?? sugerencia.impuestoCreditoMonto,
      },
    })

    return NextResponse.json(movimiento)
  } catch (error) {
    return serverErrorResponse("PATCH /api/movimientos-bancarios/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un movimiento bancario], devuelve [una confirmación luego de eliminar el registro].
 * Esta función existe para completar el CRUD de registraciones bancarias erróneas.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "mb1" } }) === NextResponse.json({ message: "Movimiento bancario eliminado correctamente" })
 * DELETE(request, { params: { id: "mb2" } }) === NextResponse.json({ message: "Movimiento bancario eliminado correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Movimiento bancario no encontrado" }, { status: 404 })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.movimientoBancario.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Movimiento bancario")

    await prisma.movimientoBancario.delete({ where: { id: params.id } })
    return NextResponse.json({ message: "Movimiento bancario eliminado correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/movimientos-bancarios/[id]", error)
  }
}
