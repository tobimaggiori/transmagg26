/**
 * financial.ts
 *
 * Funciones puras de cálculo financiero para cuentas, FCI, brokers e impuestos.
 * No tiene dependencias de Prisma — todo es cálculo de dominio.
 *
 * Estructura:
 * - Clasificación de impuestos: clasificarImpuestoMovimiento (regla pura sobre tipo)
 * - Cálculo de impuestos: calcularMontoImpuestoDebcred (regla monetaria)
 * - Sugerencia compuesta: sugerirImpuestosMovimientoBancario (clasificación + cálculo)
 * - Saldos de cuenta: calcularSaldoContableCuenta, calcularSaldoDisponibleCuenta
 * - FCI/Broker: calcularCapitalNetoFci, calcularRendimientoAcumuladoFci, etc.
 * - Días hábiles: isDiaHabil, diasHabilesDesde
 */

import {
  sumarImportes,
  aplicarPorcentaje,
  absMonetario,
  restarImportes,
  type MonetaryInput,
} from "@/lib/money"

// ─── Clasificación de impuestos ──────────────────────────────────────────────

/** Tipos de movimiento que sugieren impuesto al DÉBITO. */
export const TIPOS_DEBITO_SUGERIDO = new Set([
  "CHEQUE_EMITIDO_DEBITADO",
  "TRANSFERENCIA_ENVIADA",
])

/** Tipos de movimiento que sugieren impuesto al CRÉDITO. */
export const TIPOS_CREDITO_SUGERIDO = new Set([
  "TRANSFERENCIA_RECIBIDA",
  "CHEQUE_DEPOSITADO",
  "INTERES_CUENTA_REMUNERADA",
])

/** Tipos de movimiento exentos de impuesto débito/crédito. */
export const TIPOS_SIN_IMPUESTO_SUGERIDO = new Set([
  "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
  "ENVIO_A_BROKER",
  "RESCATE_DE_BROKER",
  "PAGO_SUELDO",
  "MANTENIMIENTO_CUENTA",
])

export type ClasificacionImpuesto = {
  aplicaDebito: boolean
  aplicaCredito: boolean
}

/**
 * clasificarImpuestoMovimiento: string boolean boolean -> ClasificacionImpuesto
 *
 * Dado [el tipo de movimiento, si la cuenta tributa débito/crédito y si es
 * cuenta comitente broker], devuelve [si aplica impuesto al débito y/o crédito].
 *
 * Reglas:
 * - Si la cuenta no tributa → ninguno aplica
 * - Si es comitente broker y el tipo es ENVIO/RESCATE_DE_BROKER → ninguno aplica
 * - Si el tipo está en TIPOS_SIN_IMPUESTO → ninguno aplica
 * - Si no, aplica según TIPOS_DEBITO_SUGERIDO / TIPOS_CREDITO_SUGERIDO
 *
 * Ejemplos:
 * clasificarImpuestoMovimiento("TRANSFERENCIA_RECIBIDA", true, false) === { aplicaDebito: false, aplicaCredito: true }
 * clasificarImpuestoMovimiento("TRANSFERENCIA_ENVIADA", true, false) === { aplicaDebito: true, aplicaCredito: false }
 * clasificarImpuestoMovimiento("TRANSFERENCIA_ENVIADA", false, false) === { aplicaDebito: false, aplicaCredito: false }
 * clasificarImpuestoMovimiento("ENVIO_A_BROKER", true, true) === { aplicaDebito: false, aplicaCredito: false }
 * clasificarImpuestoMovimiento("PAGO_SUELDO", true, false) === { aplicaDebito: false, aplicaCredito: false }
 */
export function clasificarImpuestoMovimiento(
  tipo: string,
  tieneImpuestoDebcred: boolean,
  esCuentaComitenteBroker: boolean
): ClasificacionImpuesto {
  if (!tieneImpuestoDebcred) {
    return { aplicaDebito: false, aplicaCredito: false }
  }

  if (esCuentaComitenteBroker && (tipo === "ENVIO_A_BROKER" || tipo === "RESCATE_DE_BROKER")) {
    return { aplicaDebito: false, aplicaCredito: false }
  }

  if (TIPOS_SIN_IMPUESTO_SUGERIDO.has(tipo)) {
    return { aplicaDebito: false, aplicaCredito: false }
  }

  return {
    aplicaDebito: TIPOS_DEBITO_SUGERIDO.has(tipo),
    aplicaCredito: TIPOS_CREDITO_SUGERIDO.has(tipo),
  }
}

// ─── Cálculo de montos de impuesto ──────────────────────────────────────────

/**
 * calcularMontoImpuestoDebcred: MonetaryInput number -> number
 *
 * Dado [el monto del movimiento y la alícuota como factor decimal (ej: 0.006 = 0.6%)],
 * devuelve [el monto del impuesto calculado sobre el valor absoluto del monto].
 *
 * Ejemplos:
 * calcularMontoImpuestoDebcred(1000, 0.006) === 6
 * calcularMontoImpuestoDebcred(-1000, 0.006) === 6
 * calcularMontoImpuestoDebcred(50000, 0.006) === 300
 * calcularMontoImpuestoDebcred(1000, 0) === 0
 */
export function calcularMontoImpuestoDebcred(
  monto: MonetaryInput,
  alicuotaImpuesto: number
): number {
  const base = absMonetario(monto)
  const pct = alicuotaImpuesto * 100
  return aplicarPorcentaje(base, pct)
}

// ─── Sugerencia compuesta ────────────────────────────────────────────────────

export type SugerenciaImpuestosMovimientoInput = {
  tipo: string
  monto: MonetaryInput
  tieneImpuestoDebcred: boolean
  alicuotaImpuesto: number
  esCuentaComitenteBroker?: boolean
}

export type SugerenciaImpuestosMovimiento = {
  impuestoDebitoAplica: boolean
  impuestoDebitoMonto: number
  impuestoCreditoAplica: boolean
  impuestoCreditoMonto: number
}

/**
 * sugerirImpuestosMovimientoBancario: SugerenciaImpuestosMovimientoInput -> SugerenciaImpuestosMovimiento
 *
 * Dado [tipo de movimiento, monto, si la cuenta tributa débito/crédito, alícuota
 * y si es cuenta comitente broker], devuelve [la sugerencia inicial de impuestos
 * débito/crédito con sus montos calculados].
 *
 * Compone clasificarImpuestoMovimiento (regla) + calcularMontoImpuestoDebcred (cálculo).
 *
 * Ejemplos:
 * sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_RECIBIDA", monto: 1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }).impuestoCreditoMonto === 6
 * sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_ENVIADA", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }).impuestoDebitoMonto === 6
 * sugerirImpuestosMovimientoBancario({ tipo: "ENVIO_A_BROKER", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006, esCuentaComitenteBroker: true }).impuestoDebitoAplica === false
 */
export function sugerirImpuestosMovimientoBancario(
  input: SugerenciaImpuestosMovimientoInput
): SugerenciaImpuestosMovimiento {
  const { tipo, monto, tieneImpuestoDebcred, alicuotaImpuesto, esCuentaComitenteBroker = false } = input
  const { aplicaDebito, aplicaCredito } = clasificarImpuestoMovimiento(tipo, tieneImpuestoDebcred, esCuentaComitenteBroker)
  const montoImpuesto = calcularMontoImpuestoDebcred(monto, alicuotaImpuesto)

  return {
    impuestoDebitoAplica: aplicaDebito,
    impuestoDebitoMonto: aplicaDebito ? montoImpuesto : 0,
    impuestoCreditoAplica: aplicaCredito,
    impuestoCreditoMonto: aplicaCredito ? montoImpuesto : 0,
  }
}

// ─── Días hábiles ────────────────────────────────────────────────────────────

/**
 * isDiaHabil: Date -> boolean
 *
 * Dado [fecha], devuelve [true si la fecha cae de lunes a viernes].
 *
 * Ejemplos:
 * isDiaHabil(new Date("2026-03-30T12:00:00.000Z")) === true
 * isDiaHabil(new Date("2026-03-28T12:00:00.000Z")) === false
 * isDiaHabil(new Date("2026-03-29T12:00:00.000Z")) === false
 */
export function isDiaHabil(fecha: Date): boolean {
  const dia = fecha.getDay()
  return dia !== 0 && dia !== 6
}

/**
 * diasHabilesDesde: Date Date? -> number
 *
 * Dado [fecha y una fecha actual opcional], devuelve [la cantidad de días hábiles
 * transcurridos entre ambas fechas].
 *
 * Ejemplos:
 * diasHabilesDesde(new Date("2026-03-27T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 1
 * diasHabilesDesde(new Date("2026-03-28T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 1
 * diasHabilesDesde(new Date("2026-03-23T12:00:00.000Z"), new Date("2026-03-30T12:00:00.000Z")) === 5
 */
export function diasHabilesDesde(fecha: Date, hoy = new Date()): number {
  const inicio = normalizarFecha(fecha)
  const fin = normalizarFecha(hoy)

  if (inicio.getTime() >= fin.getTime()) return 0

  const cursor = new Date(inicio)
  let diasHabiles = 0

  while (cursor.getTime() < fin.getTime()) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getTime() > fin.getTime()) break
    if (isDiaHabil(cursor)) diasHabiles += 1
  }

  return diasHabiles
}

// ─── FCI y cuentas ───────────────────────────────────────────────────────────

export type ResumenFciCuenta = {
  saldoInformadoActual: MonetaryInput
}

export type ResumenCuentaBroker = {
  capitalEnviado: MonetaryInput
  capitalRescatado: MonetaryInput
  saldoFcis: MonetaryInput
}

/**
 * calcularCapitalNetoFci: MonetaryInput MonetaryInput -> number
 *
 * Dado [el total suscripto y el total rescatado de un FCI], devuelve [el capital neto invertido].
 *
 * Ejemplos:
 * calcularCapitalNetoFci(200000, 50000) === 150000
 * calcularCapitalNetoFci(120000, 0) === 120000
 * calcularCapitalNetoFci(50000, 70000) === -20000
 */
export function calcularCapitalNetoFci(totalSuscripciones: MonetaryInput, totalRescates: MonetaryInput): number {
  return restarImportes(totalSuscripciones, totalRescates)
}

/**
 * calcularRendimientoAcumuladoFci: MonetaryInput MonetaryInput -> number
 *
 * Dado [el saldo informado actual y el capital neto], devuelve [el rendimiento acumulado].
 *
 * Ejemplos:
 * calcularRendimientoAcumuladoFci(210500, 150000) === 60500
 * calcularRendimientoAcumuladoFci(160000, 150000) === 10000
 * calcularRendimientoAcumuladoFci(90000, 120000) === -30000
 */
export function calcularRendimientoAcumuladoFci(saldoInformado: MonetaryInput, capitalNeto: MonetaryInput): number {
  return restarImportes(saldoInformado, capitalNeto)
}

/**
 * calcularSaldoContableCuenta: MonetaryInput MonetaryInput[] -> number
 *
 * Dado [el saldo inicial y la lista de movimientos], devuelve [el saldo contable].
 *
 * Ejemplos:
 * calcularSaldoContableCuenta(1000, [200, -50, 25]) === 1175
 * calcularSaldoContableCuenta(0, []) === 0
 * calcularSaldoContableCuenta(500, [-100, -50]) === 350
 */
export function calcularSaldoContableCuenta(saldoInicial: MonetaryInput, movimientos: MonetaryInput[]): number {
  return sumarImportes([saldoInicial, ...movimientos])
}

/**
 * calcularSaldoEnFciPropiosCuenta: ResumenFciCuenta[] -> number
 *
 * Dado [la lista de FCI propios con su último saldo informado], devuelve [el total inmovilizado en FCI].
 *
 * Ejemplos:
 * calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 210500 }, { saldoInformadoActual: 50000 }]) === 260500
 * calcularSaldoEnFciPropiosCuenta([]) === 0
 */
export function calcularSaldoEnFciPropiosCuenta(fcis: ResumenFciCuenta[]): number {
  return sumarImportes(fcis.map((fci) => fci.saldoInformadoActual))
}

/**
 * calcularSaldoDisponibleCuenta: MonetaryInput MonetaryInput -> number
 *
 * Dado [el saldo contable y el saldo inmovilizado en FCI], devuelve [el saldo disponible].
 *
 * Ejemplos:
 * calcularSaldoDisponibleCuenta(1000000, 210500) === 789500
 * calcularSaldoDisponibleCuenta(50000, 0) === 50000
 * calcularSaldoDisponibleCuenta(120000, 160000) === -40000
 */
export function calcularSaldoDisponibleCuenta(saldoContable: MonetaryInput, saldoEnFciPropios: MonetaryInput): number {
  return restarImportes(saldoContable, saldoEnFciPropios)
}

/**
 * calcularCapitalNetoBroker: MonetaryInput MonetaryInput -> number
 *
 * Dado [el capital enviado y el rescatado], devuelve [el capital neto en el broker].
 *
 * Ejemplos:
 * calcularCapitalNetoBroker(200000, 50000) === 150000
 * calcularCapitalNetoBroker(0, 0) === 0
 * calcularCapitalNetoBroker(100000, 130000) === -30000
 */
export function calcularCapitalNetoBroker(capitalEnviado: MonetaryInput, capitalRescatado: MonetaryInput): number {
  return restarImportes(capitalEnviado, capitalRescatado)
}

/**
 * calcularRendimientoBroker: ResumenCuentaBroker -> number
 *
 * Dado [el resumen del broker], devuelve [el rendimiento acumulado].
 *
 * Ejemplos:
 * calcularRendimientoBroker({ capitalEnviado: 200000, capitalRescatado: 50000, saldoFcis: 160000 }) === 10000
 * calcularRendimientoBroker({ capitalEnviado: 100000, capitalRescatado: 0, saldoFcis: 95000 }) === -5000
 * calcularRendimientoBroker({ capitalEnviado: 0, capitalRescatado: 0, saldoFcis: 0 }) === 0
 */
export function calcularRendimientoBroker(resumen: ResumenCuentaBroker): number {
  return restarImportes(resumen.saldoFcis, calcularCapitalNetoBroker(resumen.capitalEnviado, resumen.capitalRescatado))
}

// ─── Helpers internos ────────────────────────────────────────────────────────

function normalizarFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}
