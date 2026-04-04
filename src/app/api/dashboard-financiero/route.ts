/**
 * API Route: GET /api/dashboard-financiero
 * Devuelve todos los datos necesarios para el dashboard financiero en una sola consulta.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { calcularTotalViaje } from "@/lib/viajes"
import {
  requireFinancialAccess,
} from "@/lib/financial-api"
import { sumarImportes, restarImportes } from "@/lib/money"
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

    // Cada sección en su propio try-catch para identificar fallos
    let deudaEmpresas = 0
    let deudaFleteros = 0
    let pendienteFacturar = 0
    let pendienteLiquidar = 0

    try {
      const facturasAgg = await prisma.facturaEmitida.aggregate({
        _sum: { total: true },
        where: { estado: { not: "ANULADA" } },
      })
      const pagosEmpresasAgg = await prisma.pagoDeEmpresa.aggregate({
        _sum: { monto: true },
      })
      deudaEmpresas = restarImportes(facturasAgg._sum.total ?? 0, pagosEmpresasAgg._sum.monto ?? 0)
    } catch (e) { console.error("[dashboard] Error deudaEmpresas:", e) }

    try {
      const liquidacionesAgg = await prisma.liquidacion.aggregate({
        _sum: { total: true },
        where: { estado: { not: "ANULADA" } },
      })
      const pagosFleterosAgg = await prisma.pagoAFletero.aggregate({
        _sum: { monto: true },
        where: { anulado: false },
      })
      deudaFleteros = restarImportes(liquidacionesAgg._sum.total ?? 0, pagosFleterosAgg._sum.monto ?? 0)
    } catch (e) { console.error("[dashboard] Error deudaFleteros:", e) }

    try {
      const viajesPendienteFacturar = await prisma.viaje.findMany({
        where: { estadoFactura: "PENDIENTE_FACTURAR" },
        select: { kilos: true, tarifaEmpresa: true },
      })
      pendienteFacturar = sumarImportes(
        viajesPendienteFacturar.map(v => v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifaEmpresa) : 0)
      )
    } catch (e) { console.error("[dashboard] Error pendienteFacturar:", e) }

    try {
      const viajesPendienteLiquidar = await prisma.viaje.findMany({
        where: { fleteroId: { not: null }, estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
        select: { kilos: true, tarifa: true },
      })
      pendienteLiquidar = sumarImportes(
        viajesPendienteLiquidar.map(v => v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifa) : 0)
      )
    } catch (e) { console.error("[dashboard] Error pendienteLiquidar:", e) }

    // Cheques en cartera
    let chequesAlDia = 0, chequesNoAlDia = 0, chequesFisico = 0, chequesElectronico = 0
    let chequesEmitidosNoCobrados = 0
    let alertasFci: Array<{ fciId: string; fciNombre: string; cuentaId: string; diasSinActualizar: number }> = []

    try {
      const chequesCartera = await prisma.chequeRecibido.findMany({
        where: { estado: "EN_CARTERA" },
        select: { monto: true, fechaCobro: true, esElectronico: true },
      })
      chequesAlDia = sumarImportes(chequesCartera.filter((c) => new Date(c.fechaCobro) <= hoy).map(c => c.monto))
      chequesNoAlDia = sumarImportes(chequesCartera.filter((c) => new Date(c.fechaCobro) > hoy).map(c => c.monto))
      chequesFisico = sumarImportes(chequesCartera.filter((c) => !c.esElectronico).map(c => c.monto))
      chequesElectronico = sumarImportes(chequesCartera.filter((c) => c.esElectronico).map(c => c.monto))
    } catch (e) { console.error("[dashboard] Error chequesCartera:", e) }

    try {
      const chequesEmitidosAgg = await prisma.chequeEmitido.aggregate({ _sum: { monto: true }, where: { estado: "EMITIDO" } })
      chequesEmitidosNoCobrados = chequesEmitidosAgg._sum.monto ?? 0
    } catch (e) { console.error("[dashboard] Error chequesEmitidos:", e) }

    try {
      const fcis = await prisma.fci.findMany({
        where: { activo: true },
        select: {
          id: true, nombre: true, cuentaId: true, diasHabilesAlerta: true,
          saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1, select: { fechaActualizacion: true } },
        },
      })
      alertasFci = fcis
        .filter((fci) => fci.saldos.length === 0 || diasHabilesDesde(fci.saldos[0].fechaActualizacion) >= fci.diasHabilesAlerta)
        .map((fci) => ({
          fciId: fci.id,
          fciNombre: fci.nombre,
          cuentaId: fci.cuentaId,
          diasSinActualizar: fci.saldos.length === 0 ? 999 : diasHabilesDesde(fci.saldos[0].fechaActualizacion),
        }))
    } catch (e) { console.error("[dashboard] Error alertasFci:", e) }

    // Cuentas con saldos — use select to avoid pulling new columns that may not exist in Turso
    let cuentasResultado: Array<Record<string, unknown>> = []
    try {
      const cuentas = await prisma.cuenta.findMany({
        where: { activa: true },
        select: {
          id: true, nombre: true, tipo: true, moneda: true, activa: true, saldoInicial: true,
          movimientosSinFactura: { select: { monto: true, tipo: true, categoria: true } },
          fci: {
            select: {
              id: true, nombre: true, cuentaId: true, diasHabilesAlerta: true,
              saldos: { orderBy: { fechaActualizacion: "desc" }, take: 1, select: { saldoInformado: true } },
            },
          },
        },
        orderBy: { nombre: "asc" },
      })

      const treintaDias = new Date(hoy)
      treintaDias.setDate(treintaDias.getDate() + 30)

      const chequesEmitidos30Dias = await prisma.chequeEmitido.findMany({
        where: { estado: "EMITIDO", fechaPago: { gte: hoy, lte: treintaDias } },
        select: { cuentaId: true, monto: true },
      })

      cuentasResultado = cuentas.map((cuenta) => {
        const saldoContable = calcularSaldoContableCuenta(
          cuenta.saldoInicial,
          cuenta.movimientosSinFactura.map((m) => m.tipo === "INGRESO" ? m.monto : -m.monto)
        )
        const fciDetalle = cuenta.fci.map((fci) => ({
          id: fci.id,
          nombre: fci.nombre,
          saldoInformadoActual: fci.saldos[0]?.saldoInformado ?? 0,
        }))
        const saldoEnFciPropios = calcularSaldoEnFciPropiosCuenta(fciDetalle)
        const saldoDisponible = calcularSaldoDisponibleCuenta(saldoContable, saldoEnFciPropios)
        const capitalEnviado = sumarImportes(
          cuenta.movimientosSinFactura.filter((m) => m.categoria === "ENVIO_A_BROKER").map(m => m.monto)
        )
        const capitalRescatado = sumarImportes(
          cuenta.movimientosSinFactura.filter((m) => m.categoria === "RESCATE_DE_BROKER").map(m => m.monto)
        )
        const capitalNetoEnBroker = calcularCapitalNetoBroker(capitalEnviado, capitalRescatado)
        const rendimiento = calcularRendimientoBroker({
          capitalEnviado,
          capitalRescatado,
          saldoFcis: sumarImportes(fciDetalle.map(f => f.saldoInformadoActual)),
        })
        const coberturaCheques30Dias = sumarImportes(
          chequesEmitidos30Dias.filter((c) => c.cuentaId === cuenta.id).map(c => c.monto)
        )

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
    } catch (e) { console.error("[dashboard] Error cuentas:", e) }

    return NextResponse.json({
      deudaEmpresas,
      deudaFleteros,
      pendienteFacturar,
      pendienteLiquidar,
      chequesEnCartera: {
        alDia: chequesAlDia,
        noAlDia: chequesNoAlDia,
        total: sumarImportes([chequesAlDia, chequesNoAlDia]),
        fisico: chequesFisico,
        electronico: chequesElectronico,
      },
      chequesEmitidosNoCobrados,
      alertasFci,
      cuentas: cuentasResultado,
    })
  } catch (error) {
    console.error("[dashboard] Error global:", error)
    // Return partial data rather than 500 so the dashboard doesn't break completely
    return NextResponse.json({
      deudaEmpresas: 0,
      deudaFleteros: 0,
      pendienteFacturar: 0,
      pendienteLiquidar: 0,
      chequesEnCartera: { alDia: 0, noAlDia: 0, total: 0, fisico: 0, electronico: 0 },
      chequesEmitidosNoCobrados: 0,
      alertasFci: [],
      cuentas: [],
      _error: error instanceof Error ? error.message : "Error desconocido",
    })
  }
}
