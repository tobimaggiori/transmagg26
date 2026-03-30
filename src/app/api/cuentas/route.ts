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
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearCuentaSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [el listado de cuentas con relaciones básicas y valores calculados de saldo contable, saldo en FCI propios, saldo disponible y métricas broker].
 * Esta función existe para abastecer el dashboard financiero y el ABM de cuentas con una única consulta consistente.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, nombre, saldoContable, saldoDisponible }])
 * GET() === NextResponse.json([{ id, tipo: "BROKER", capitalNetoEnBroker, rendimiento }])
 * GET() === NextResponse.json([{ id, fci: [{ nombre, saldoInformadoActual }] }])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cuentas = await prisma.cuenta.findMany({
      include: {
        movimientosBancarios: {
          select: { monto: true, tipo: true },
        },
        fci: {
          include: {
            saldos: {
              orderBy: { fechaActualizacion: "desc" },
              take: 1,
            },
          },
          orderBy: { nombre: "asc" },
        },
      },
      orderBy: { nombre: "asc" },
    })

    const resultado = cuentas.map((cuenta) => {
      const saldoContable = calcularSaldoContableCuenta(
        cuenta.saldoInicial,
        cuenta.movimientosBancarios.map((movimiento) => movimiento.monto)
      )

      const detalleFci = cuenta.fci.map((fci) => ({
        id: fci.id,
        nombre: fci.nombre,
        saldoInformadoActual: fci.saldos[0]?.saldoInformado ?? 0,
      }))

      const saldoEnFciPropios = calcularSaldoEnFciPropiosCuenta(detalleFci)
      const saldoDisponible = calcularSaldoDisponibleCuenta(saldoContable, saldoEnFciPropios)
      const capitalEnviado = cuenta.movimientosBancarios
        .filter((movimiento) => movimiento.tipo === "ENVIO_A_BROKER")
        .reduce((acumulado, movimiento) => acumulado + Math.abs(movimiento.monto), 0)
      const capitalRescatado = cuenta.movimientosBancarios
        .filter((movimiento) => movimiento.tipo === "RESCATE_DE_BROKER")
        .reduce((acumulado, movimiento) => acumulado + Math.abs(movimiento.monto), 0)
      const capitalNetoEnBroker = calcularCapitalNetoBroker(capitalEnviado, capitalRescatado)
      const rendimiento = calcularRendimientoBroker({
        capitalEnviado,
        capitalRescatado,
        saldoFcis: detalleFci.reduce((acumulado, fci) => acumulado + fci.saldoInformadoActual, 0),
      })

      return {
        ...cuenta,
        detalleFci,
        saldoContable,
        saldoEnFciPropios,
        saldoDisponible,
        capitalEnviado,
        capitalRescatado,
        capitalNetoEnBroker,
        rendimiento,
      }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con los datos de una cuenta], devuelve [la cuenta creada si la validación y unicidad son correctas].
 * Esta función existe para permitir el ABM de cuentas configurable sin tocar código.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ id, nombre: "Galicia Pesos" }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Datos inválidos", detalles }, { status: 400 })
 * POST(request) === NextResponse.json({ error: "Ya existe una cuenta con ese nombre" }, { status: 409 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearCuentaSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.cuenta.findUnique({ where: { nombre: parsed.data.nombre } })
    if (existente) return conflictResponse("Ya existe una cuenta con ese nombre")

    const cuenta = await prisma.cuenta.create({
      data: parsed.data,
    })

    return NextResponse.json(cuenta, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cuentas", error)
  }
}
