import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  calcularCapitalNetoBroker,
  calcularRendimientoBroker,
  calcularSaldoContableCuenta,
  calcularSaldoDisponibleCuenta,
  calcularSaldoEnFciPropiosCuenta,
} from "@/lib/financial"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarCuentaSchema } from "@/lib/financial-schemas"

/**
 * GET: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta], devuelve [el detalle completo de la cuenta con relaciones y métricas calculadas].
 * Esta función existe para la vista individual y paneles de conciliación del módulo financiero.
 *
 * Ejemplos:
 * GET(request, { params: { id: "c1" } }) === NextResponse.json({ id: "c1", saldoContable, saldoDisponible })
 * GET(request, { params: { id: "broker1" } }) === NextResponse.json({ id: "broker1", capitalNetoEnBroker, rendimiento })
 * GET(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: params.id },
      include: {
        movimientosBancarios: true,
        fci: {
          include: {
            saldos: {
              orderBy: { fechaActualizacion: "desc" },
            },
            movimientos: {
              orderBy: { fecha: "desc" },
            },
          },
          orderBy: { nombre: "asc" },
        },
        brokers: true,
      },
    })

    if (!cuenta) return notFoundResponse("Cuenta")

    const detalleFci = cuenta.fci.map((fci) => ({
      id: fci.id,
      nombre: fci.nombre,
      saldoInformadoActual: fci.saldos[0]?.saldoInformado ?? 0,
    }))
    const saldoContable = calcularSaldoContableCuenta(
      cuenta.saldoInicial,
      cuenta.movimientosBancarios.map((movimiento) => movimiento.monto)
    )
    const saldoEnFciPropios = calcularSaldoEnFciPropiosCuenta(detalleFci)
    const saldoDisponible = calcularSaldoDisponibleCuenta(saldoContable, saldoEnFciPropios)
    const capitalEnviado = cuenta.movimientosBancarios
      .filter((movimiento) => movimiento.tipo === "ENVIO_A_BROKER")
      .reduce((acumulado, movimiento) => acumulado + Math.abs(movimiento.monto), 0)
    const capitalRescatado = cuenta.movimientosBancarios
      .filter((movimiento) => movimiento.tipo === "RESCATE_DE_BROKER")
      .reduce((acumulado, movimiento) => acumulado + Math.abs(movimiento.monto), 0)

    return NextResponse.json({
      ...cuenta,
      detalleFci,
      saldoContable,
      saldoEnFciPropios,
      saldoDisponible,
      capitalEnviado,
      capitalRescatado,
      capitalNetoEnBroker: calcularCapitalNetoBroker(capitalEnviado, capitalRescatado),
      rendimiento: calcularRendimientoBroker({
        capitalEnviado,
        capitalRescatado,
        saldoFcis: detalleFci.reduce((acumulado, fci) => acumulado + fci.saldoInformadoActual, 0),
      }),
    })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]", error)
  }
}

/**
 * PATCH: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta y un body parcial], devuelve [la cuenta actualizada si existe y pasa validación].
 * Esta función existe para editar parámetros operativos y flags configurables desde ABM.
 *
 * Ejemplos:
 * PATCH(request, { params: { id: "c1" } }) === NextResponse.json({ id: "c1", nombre, activa })
 * PATCH(request, { params: { id: "c1" } }) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * PATCH(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = actualizarCuentaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.cuenta.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cuenta")

    if (parsed.data.nombre && parsed.data.nombre !== existente.nombre) {
      const duplicada = await prisma.cuenta.findUnique({ where: { nombre: parsed.data.nombre } })
      if (duplicada) return conflictResponse("Ya existe una cuenta con ese nombre")
    }

    const cuenta = await prisma.cuenta.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(cuenta)
  } catch (error) {
    return serverErrorResponse("PATCH /api/cuentas/[id]", error)
  }
}

/**
 * DELETE: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de una cuenta], devuelve [una confirmación de baja lógica marcando la cuenta como inactiva y cerrada].
 * Esta función existe para conservar historial contable sin eliminar registros financieros.
 *
 * Ejemplos:
 * DELETE(request, { params: { id: "c1" } }) === NextResponse.json({ message: "Cuenta desactivada correctamente" })
 * DELETE(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "Cuenta no encontrado" }, { status: 404 })
 * DELETE(request, { params: { id: "c2" } }) === NextResponse.json({ message: "Cuenta desactivada correctamente" })
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const existente = await prisma.cuenta.findUnique({ where: { id: params.id } })
    if (!existente) return notFoundResponse("Cuenta")

    await prisma.cuenta.update({
      where: { id: params.id },
      data: {
        activa: false,
        cerradaEn: existente.cerradaEn ?? new Date(),
      },
    })

    return NextResponse.json({ message: "Cuenta desactivada correctamente" })
  } catch (error) {
    return serverErrorResponse("DELETE /api/cuentas/[id]", error)
  }
}
