/**
 * Propósito: Funciones puras de cálculo para viajes, liquidaciones y facturas.
 * Centraliza la lógica de conversión kg→ton y totales para reutilizar
 * en API routes, UI y tests sin dependencias externas.
 *
 * Todas las funciones monetarias usan el módulo money.ts para garantizar
 * precisión decimal y redondeo consistente según la política monetaria.
 */

import {
  m,
  sumarImportes,
  restarImportes,
  aplicarPorcentaje,
  calcularIva,
  type MonetaryInput,
} from "@/lib/money"
import { Decimal } from "decimal.js"

/**
 * calcularToneladas: number -> number
 *
 * Dado [kilos], devuelve [las toneladas equivalentes redondeadas a 3 decimales].
 * Existe para centralizar la conversión kg→ton usada en viajes, liquidaciones y facturas.
 * Nota: 3 decimales porque es unidad de peso, no monetaria.
 *
 * Ejemplos:
 * calcularToneladas(25000) === 25
 * calcularToneladas(1500) === 1.5
 * calcularToneladas(0) === 0
 */
export function calcularToneladas(kilos: number): number {
  return new Decimal(kilos).dividedBy(1000).toDecimalPlaces(3, Decimal.ROUND_HALF_UP).toNumber()
}

/**
 * calcularTotalViaje: number number -> number
 *
 * Dado [kilos y tarifa por tonelada], devuelve [el total del viaje redondeado a 2 decimales].
 * Existe para centralizar el cálculo de totales de viajes en el sistema.
 *
 * Ejemplos:
 * calcularTotalViaje(25000, 50) === 1250
 * calcularTotalViaje(1500, 100) === 150
 * calcularTotalViaje(0, 100) === 0
 */
export function calcularTotalViaje(kilos: number, tarifaPorTonelada: number): number {
  const toneladas = new Decimal(kilos).dividedBy(1000).toDecimalPlaces(3, Decimal.ROUND_HALF_UP)
  return toneladas.times(new Decimal(tarifaPorTonelada)).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber()
}

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type ViajeParaLiquidar = { kilos: number; tarifaFletero: MonetaryInput }
export type ResultadoLiquidacion = {
  subtotalBruto: number    // suma de totales de cada viaje
  comisionMonto: number    // subtotalBruto × (comisionPct / 100)
  neto: number             // subtotalBruto - comisionMonto
  ivaMonto: number         // neto × (ivaPct / 100)
  totalFinal: number       // neto + ivaMonto
}

export type ViajeParaFacturar = { kilos: number; tarifaEmpresa: MonetaryInput }
export type ResultadoFactura = {
  neto: number
  ivaMonto: number
  total: number
}

/**
 * calcularLiquidacion: ViajeParaLiquidar[] number number -> ResultadoLiquidacion
 *
 * Dado [viajes con kilos y tarifaFletero, porcentaje de comisión y porcentaje de IVA],
 * devuelve [el desglose completo de la liquidación].
 * Existe para centralizar el cálculo de liquidaciones (cuenta de venta y líquido producto).
 *
 * Ejemplos:
 * calcularLiquidacion([{ kilos: 25000, tarifaFletero: 50 }], 10, 21).subtotalBruto === 1250
 * calcularLiquidacion([{ kilos: 25000, tarifaFletero: 50 }], 10, 21).comisionMonto === 125
 * calcularLiquidacion([{ kilos: 25000, tarifaFletero: 50 }], 10, 21).totalFinal === 1361.25
 */
export function calcularLiquidacion(
  viajes: ViajeParaLiquidar[],
  comisionPct: number,
  ivaPct: number
): ResultadoLiquidacion {
  const subtotales = viajes.map(v => calcularTotalViaje(v.kilos, m(v.tarifaFletero)))
  const subtotalBruto = sumarImportes(subtotales)
  const comisionMonto = aplicarPorcentaje(subtotalBruto, comisionPct)
  const neto = restarImportes(subtotalBruto, comisionMonto)
  const ivaMonto = calcularIva(neto, ivaPct)
  const totalFinal = sumarImportes([neto, ivaMonto])

  return { subtotalBruto, comisionMonto, neto, ivaMonto, totalFinal }
}

/**
 * calcularFactura: ViajeParaFacturar[] number -> ResultadoFactura
 *
 * Dado [viajes con kilos y tarifaEmpresa y porcentaje de IVA],
 * devuelve [el desglose de la factura].
 * Existe para centralizar el cálculo de facturas emitidas a empresas.
 *
 * Ejemplos:
 * calcularFactura([{ kilos: 25000, tarifaEmpresa: 60 }], 21).neto === 1500
 * calcularFactura([{ kilos: 25000, tarifaEmpresa: 60 }], 21).ivaMonto === 315
 * calcularFactura([{ kilos: 25000, tarifaEmpresa: 60 }], 21).total === 1815
 */
export function calcularFactura(
  viajes: ViajeParaFacturar[],
  ivaPct: number
): ResultadoFactura {
  const subtotales = viajes.map(v => calcularTotalViaje(v.kilos, m(v.tarifaEmpresa)))
  const neto = sumarImportes(subtotales)
  const ivaMonto = calcularIva(neto, ivaPct)
  const total = sumarImportes([neto, ivaMonto])

  return { neto, ivaMonto, total }
}
