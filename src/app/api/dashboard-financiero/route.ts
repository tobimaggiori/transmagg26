/**
 * API Route: GET /api/dashboard-financiero
 * Devuelve todos los datos necesarios para el dashboard financiero en una sola consulta.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import {
  calcularSaldoContableCuenta,
  calcularSaldoEnFciPropiosCuenta,
  calcularSaldoDisponibleCuenta,
  calcularCapitalNetoBroker,
  calcularRendimientoBroker,
  diasHabilesDesde,
} from "@/lib/financial"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [el objeto completo del dashboard financiero con deudas, cheques, alertas FCI y saldos de cuentas].
 * Esta función existe para abastecer la pantalla de dashboard financiero con una única llamada HTTP.
 *
 * Ejemplos:
 * GET() === NextResponse.json({ deudaEmpresas: 150000, deudaFleteros: 80000, ... })
 * GET() === NextResponse.json({ chequesEnCartera: { alDia: 50000, noAlDia: 20000, total: 70000 }, ... })
 * GET() === NextResponse.json({ alertasFci: [{ fciId, fciNombre, cuentaId, diasSinActualizar }] })
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const hoy = new Date()

    // Calcular deuda de empresas
    const facturasAgg = await prisma.facturaEmitida.aggregate({
      _sum: { total: true },
      where: { estado: { not: "ANULADA" } },
    })
    const pagosEmpresasAgg = await prisma.pagoDeEmpresa.aggregate({
      _sum: { monto: true },
    })
    const deudaEmpresas = (facturasAgg._sum.total ?? 0) - (pagosEmpresasAgg._sum.monto ?? 0)

    // Calcular deuda a fleteros
    const liquidacionesAgg = await prisma.liquidacion.aggregate({
      _sum: { total: true },
      where: { estado: { not: "ANULADA" } },
    })
    const pagosFleterosAgg = await prisma.pagoAFletero.aggregate({
      _sum: { monto: true },
    })
    const deudaFleteros = (liquidacionesAgg._sum.total ?? 0) - (pagosFleterosAgg._sum.monto ?? 0)

    // Pendiente de facturar: viajes con estadoFactura PENDIENTE_FACTURAR
    const viajesPendienteFacturar = await prisma.viaje.findMany({
      where: { estadoFactura: "PENDIENTE_FACTURAR" },
      select: { tarifaBase: true },
    })
    const pendienteFacturar = viajesPendienteFacturar.reduce((acc, v) => acc + (v.tarifaBase ?? 0), 0)

    // Pendiente de liquidar: viajes con estadoLiquidacion PENDIENTE_LIQUIDAR
    const viajesPendienteLiquidar = await prisma.viaje.findMany({
      where: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
      select: { tarifaBase: true },
    })
    const pendienteLiquidar = viajesPendienteLiquidar.reduce((acc, v) => acc + (v.tarifaBase ?? 0), 0)

    // Cheques en cartera
    const chequesCartera = await prisma.chequeRecibido.findMany({
      where: { estado: "EN_CARTERA" },
      select: { monto: true, fechaCobro: true },
    })
    const chequesAlDia = chequesCartera
      .filter((c) => new Date(c.fechaCobro) <= hoy)
      .reduce((acc, c) => acc + c.monto, 0)
    const chequesNoAlDia = chequesCartera
      .filter((c) => new Date(c.fechaCobro) > hoy)
      .reduce((acc, c) => acc + c.monto, 0)

    // Cheques emitidos no cobrados
    const chequesEmitidosAgg = await prisma.chequeEmitido.aggregate({
      _sum: { monto: true },
      where: { estado: "EMITIDO" },
    })
    const chequesEmitidosNoCobrados = chequesEmitidosAgg._sum.monto ?? 0

    // Alertas FCI
    const fcis = await prisma.fci.findMany({
      where: { activo: true },
      include: {
        saldos: {
          orderBy: { fechaActualizacion: "desc" },
          take: 1,
        },
      },
    })
    const alertasFci = fcis
      .filter((fci) => {
        if (fci.saldos.length === 0) return true
        return diasHabilesDesde(fci.saldos[0].fechaActualizacion) >= fci.diasHabilesAlerta
      })
      .map((fci) => ({
        fciId: fci.id,
        fciNombre: fci.nombre,
        cuentaId: fci.cuentaId,
        diasSinActualizar: fci.saldos.length === 0
          ? 999
          : diasHabilesDesde(fci.saldos[0].fechaActualizacion),
      }))

    // Cuentas con saldos
    const cuentas = await prisma.cuenta.findMany({
      where: { activa: true },
      include: {
        movimientosBancarios: { select: { monto: true, tipo: true } },
        fci: {
          include: {
            saldos: {
              orderBy: { fechaActualizacion: "desc" },
              take: 1,
            },
          },
        },
      },
      orderBy: { nombre: "asc" },
    })

    const treintaDias = new Date(hoy)
    treintaDias.setDate(treintaDias.getDate() + 30)

    const chequesEmitidos30Dias = await prisma.chequeEmitido.findMany({
      where: {
        estado: "EMITIDO",
        fechaPago: { gte: hoy, lte: treintaDias },
      },
      select: { cuentaId: true, monto: true },
    })

    const cuentasResultado = cuentas.map((cuenta) => {
      const saldoContable = calcularSaldoContableCuenta(
        cuenta.saldoInicial,
        cuenta.movimientosBancarios.map((m) => m.monto)
      )
      const fciDetalle = cuenta.fci.map((fci) => ({
        id: fci.id,
        nombre: fci.nombre,
        saldoInformadoActual: fci.saldos[0]?.saldoInformado ?? 0,
      }))
      const saldoEnFciPropios = calcularSaldoEnFciPropiosCuenta(fciDetalle)
      const saldoDisponible = calcularSaldoDisponibleCuenta(saldoContable, saldoEnFciPropios)
      const capitalEnviado = cuenta.movimientosBancarios
        .filter((m) => m.tipo === "ENVIO_A_BROKER")
        .reduce((acc, m) => acc + Math.abs(m.monto), 0)
      const capitalRescatado = cuenta.movimientosBancarios
        .filter((m) => m.tipo === "RESCATE_DE_BROKER")
        .reduce((acc, m) => acc + Math.abs(m.monto), 0)
      const capitalNetoEnBroker = calcularCapitalNetoBroker(capitalEnviado, capitalRescatado)
      const rendimiento = calcularRendimientoBroker({
        capitalEnviado,
        capitalRescatado,
        saldoFcis: fciDetalle.reduce((acc, f) => acc + f.saldoInformadoActual, 0),
      })
      const coberturaCheques30Dias = chequesEmitidos30Dias
        .filter((c) => c.cuentaId === cuenta.id)
        .reduce((acc, c) => acc + c.monto, 0)

      return {
        id: cuenta.id,
        nombre: cuenta.nombre,
        tipo: cuenta.tipo,
        moneda: cuenta.moneda,
        activa: cuenta.activa,
        saldoContable,
        saldoEnFciPropios,
        saldoDisponible,
        coberturaCheques30Dias,
        fciDetalle,
        capitalEnviado,
        capitalRescatado,
        capitalNetoEnBroker,
        rendimiento,
      }
    })

    return NextResponse.json({
      deudaEmpresas,
      deudaFleteros,
      pendienteFacturar,
      pendienteLiquidar,
      chequesEnCartera: {
        alDia: chequesAlDia,
        noAlDia: chequesNoAlDia,
        total: chequesAlDia + chequesNoAlDia,
      },
      chequesEmitidosNoCobrados,
      alertasFci,
      cuentas: cuentasResultado,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero", error)
  }
}
