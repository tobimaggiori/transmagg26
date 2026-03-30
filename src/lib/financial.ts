const TIPOS_DEBITO_SUGERIDO = new Set([
  "CHEQUE_EMITIDO_DEBITADO",
  "TRANSFERENCIA_ENVIADA",
])

const TIPOS_CREDITO_SUGERIDO = new Set([
  "TRANSFERENCIA_RECIBIDA",
  "CHEQUE_DEPOSITADO",
  "INTERES_CUENTA_REMUNERADA",
])

const TIPOS_SIN_IMPUESTO_SUGERIDO = new Set([
  "TRANSFERENCIA_ENTRE_CUENTAS_PROPIAS",
  "ENVIO_A_BROKER",
  "RESCATE_DE_BROKER",
  "PAGO_SUELDO",
  "MANTENIMIENTO_CUENTA",
])

export type SugerenciaImpuestosMovimientoInput = {
  tipo: string
  monto: number
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

export type ResumenFciCuenta = {
  saldoInformadoActual: number
}

export type ResumenCuentaBroker = {
  capitalEnviado: number
  capitalRescatado: number
  saldoFcis: number
}

/**
 * isDiaHabil: Date -> boolean
 *
 * Dado [fecha], devuelve [true si la fecha cae de lunes a viernes, o false si cae sábado o domingo].
 * Esta función existe para calcular alertas y vencimientos financieros ignorando fines de semana.
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
 * Dado [fecha y una fecha actual opcional], devuelve [la cantidad de días hábiles transcurridos entre ambas fechas, sin contar sábados ni domingos].
 * Esta función existe para disparar alertas de FCI sin actualizar usando una regla homogénea en todo el sistema.
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

  let cursor = new Date(inicio)
  let diasHabiles = 0

  while (cursor.getTime() < fin.getTime()) {
    cursor.setDate(cursor.getDate() + 1)
    if (cursor.getTime() > fin.getTime()) break
    if (isDiaHabil(cursor)) diasHabiles += 1
  }

  return diasHabiles
}

/**
 * sugerirImpuestosMovimientoBancario: SugerenciaImpuestosMovimientoInput -> SugerenciaImpuestosMovimiento
 *
 * Dado [tipo de movimiento, monto, si la cuenta tributa débito/crédito, alícuota y si es cuenta comitente broker], devuelve [la sugerencia inicial de impuestos débito/crédito con sus montos calculados].
 * Esta función existe para centralizar la sugerencia automática de impuestos, manteniendo un criterio único y editable por el operador.
 *
 * Ejemplos:
 * sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_RECIBIDA", monto: 1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }) .impuestoCreditoMonto === 6
 * sugerirImpuestosMovimientoBancario({ tipo: "TRANSFERENCIA_ENVIADA", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006 }) .impuestoDebitoMonto === 6
 * sugerirImpuestosMovimientoBancario({ tipo: "ENVIO_A_BROKER", monto: -1000, tieneImpuestoDebcred: true, alicuotaImpuesto: 0.006, esCuentaComitenteBroker: true }) .impuestoDebitoAplica === false
 */
export function sugerirImpuestosMovimientoBancario(
  input: SugerenciaImpuestosMovimientoInput
): SugerenciaImpuestosMovimiento {
  const { tipo, monto, tieneImpuestoDebcred, alicuotaImpuesto, esCuentaComitenteBroker = false } = input

  if (!tieneImpuestoDebcred) {
    return crearSugerenciaImpuestos(false, false, monto, alicuotaImpuesto)
  }

  if (esCuentaComitenteBroker && (tipo === "ENVIO_A_BROKER" || tipo === "RESCATE_DE_BROKER")) {
    return crearSugerenciaImpuestos(false, false, monto, alicuotaImpuesto)
  }

  if (TIPOS_SIN_IMPUESTO_SUGERIDO.has(tipo)) {
    return crearSugerenciaImpuestos(false, false, monto, alicuotaImpuesto)
  }

  return crearSugerenciaImpuestos(
    TIPOS_DEBITO_SUGERIDO.has(tipo),
    TIPOS_CREDITO_SUGERIDO.has(tipo),
    monto,
    alicuotaImpuesto
  )
}

/**
 * calcularCapitalNetoFci: number number -> number
 *
 * Dado [el total suscripto y el total rescatado de un FCI], devuelve [el capital neto invertido en ese fondo].
 * Esta función existe para expresar la regla contable base de FCI sin repetir fórmulas en endpoints ni dashboard.
 *
 * Ejemplos:
 * calcularCapitalNetoFci(200000, 50000) === 150000
 * calcularCapitalNetoFci(120000, 0) === 120000
 * calcularCapitalNetoFci(50000, 70000) === -20000
 */
export function calcularCapitalNetoFci(totalSuscripciones: number, totalRescates: number): number {
  return totalSuscripciones - totalRescates
}

/**
 * calcularRendimientoAcumuladoFci: number number -> number
 *
 * Dado [el saldo informado actual y el capital neto del FCI], devuelve [el rendimiento acumulado del fondo].
 * Esta función existe para materializar la regla de rendimiento acumulado pedida para FCI y brokers.
 *
 * Ejemplos:
 * calcularRendimientoAcumuladoFci(210500, 150000) === 60500
 * calcularRendimientoAcumuladoFci(160000, 150000) === 10000
 * calcularRendimientoAcumuladoFci(90000, 120000) === -30000
 */
export function calcularRendimientoAcumuladoFci(saldoInformado: number, capitalNeto: number): number {
  return saldoInformado - capitalNeto
}

/**
 * calcularSaldoContableCuenta: number number[] -> number
 *
 * Dado [el saldo inicial de una cuenta y la lista de montos de movimientos bancarios], devuelve [el saldo contable de la cuenta].
 * Esta función existe para consolidar la fórmula de saldo contable usada por el módulo financiero.
 *
 * Ejemplos:
 * calcularSaldoContableCuenta(1000, [200, -50, 25]) === 1175
 * calcularSaldoContableCuenta(0, []) === 0
 * calcularSaldoContableCuenta(500, [-100, -50]) === 350
 */
export function calcularSaldoContableCuenta(saldoInicial: number, movimientos: number[]): number {
  return saldoInicial + sumarMontos(movimientos)
}

/**
 * calcularSaldoEnFciPropiosCuenta: ResumenFciCuenta[] -> number
 *
 * Dado [la lista de FCI propios con su último saldo informado], devuelve [el total de dinero inmovilizado actualmente en FCI propios].
 * Esta función existe para desacoplar el cálculo del saldo disponible respecto de la estructura de persistencia.
 *
 * Ejemplos:
 * calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 210500 }, { saldoInformadoActual: 50000 }]) === 260500
 * calcularSaldoEnFciPropiosCuenta([]) === 0
 * calcularSaldoEnFciPropiosCuenta([{ saldoInformadoActual: 160000 }]) === 160000
 */
export function calcularSaldoEnFciPropiosCuenta(fcis: ResumenFciCuenta[]): number {
  return sumarMontos(fcis.map((fci) => fci.saldoInformadoActual))
}

/**
 * calcularSaldoDisponibleCuenta: number number -> number
 *
 * Dado [el saldo contable y el saldo inmovilizado en FCI propios], devuelve [el saldo disponible de la cuenta].
 * Esta función existe para exponer el valor operativo que realmente puede usarse desde caja o banco.
 *
 * Ejemplos:
 * calcularSaldoDisponibleCuenta(1000000, 210500) === 789500
 * calcularSaldoDisponibleCuenta(50000, 0) === 50000
 * calcularSaldoDisponibleCuenta(120000, 160000) === -40000
 */
export function calcularSaldoDisponibleCuenta(saldoContable: number, saldoEnFciPropios: number): number {
  return saldoContable - saldoEnFciPropios
}

/**
 * calcularCapitalNetoBroker: number number -> number
 *
 * Dado [el capital enviado al broker y el capital rescatado del broker], devuelve [el capital neto invertido actualmente en el broker].
 * Esta función existe para mantener consistente el desglose financiero específico de cuentas broker.
 *
 * Ejemplos:
 * calcularCapitalNetoBroker(200000, 50000) === 150000
 * calcularCapitalNetoBroker(0, 0) === 0
 * calcularCapitalNetoBroker(100000, 130000) === -30000
 */
export function calcularCapitalNetoBroker(capitalEnviado: number, capitalRescatado: number): number {
  return capitalEnviado - capitalRescatado
}

/**
 * calcularRendimientoBroker: ResumenCuentaBroker -> number
 *
 * Dado [el capital enviado, el capital rescatado y el total actual de saldos FCI del broker], devuelve [el rendimiento acumulado del broker].
 * Esta función existe para derivar el rendimiento de la cartera broker desde datos agregados y no desde lógica duplicada.
 *
 * Ejemplos:
 * calcularRendimientoBroker({ capitalEnviado: 200000, capitalRescatado: 50000, saldoFcis: 160000 }) === 10000
 * calcularRendimientoBroker({ capitalEnviado: 100000, capitalRescatado: 0, saldoFcis: 95000 }) === -5000
 * calcularRendimientoBroker({ capitalEnviado: 0, capitalRescatado: 0, saldoFcis: 0 }) === 0
 */
export function calcularRendimientoBroker(resumen: ResumenCuentaBroker): number {
  return resumen.saldoFcis - calcularCapitalNetoBroker(resumen.capitalEnviado, resumen.capitalRescatado)
}

function normalizarFecha(fecha: Date): Date {
  return new Date(fecha.getFullYear(), fecha.getMonth(), fecha.getDate())
}

/**
 * sumarMontos: number[] -> number
 *
 * Dado [un arreglo de montos], devuelve [la suma total de todos sus valores].
 * Esta función existe para reutilizar agregaciones monetarias simples sin repetir reduce en múltiples cálculos financieros.
 *
 * Ejemplos:
 * sumarMontos([200, -50, 25]) === 175
 * sumarMontos([]) === 0
 * sumarMontos([100000, 50000]) === 150000
 */
function sumarMontos(montos: number[]): number {
  return montos.reduce((acumulado, monto) => acumulado + monto, 0)
}

/**
 * crearSugerenciaImpuestos: boolean boolean number number -> SugerenciaImpuestosMovimiento
 *
 * Dado [si aplica débito, si aplica crédito, el monto y la alícuota], devuelve [la estructura final de sugerencia de impuestos con montos calculados].
 * Esta función existe para encapsular la construcción uniforme de sugerencias tributarias del impuesto débito/crédito.
 *
 * Ejemplos:
 * crearSugerenciaImpuestos(true, false, -1000, 0.006).impuestoDebitoMonto === 6
 * crearSugerenciaImpuestos(false, true, 1000, 0.006).impuestoCreditoMonto === 6
 * crearSugerenciaImpuestos(false, false, 1000, 0.006).impuestoDebitoMonto === 0
 */
function crearSugerenciaImpuestos(
  impuestoDebitoAplica: boolean,
  impuestoCreditoAplica: boolean,
  monto: number,
  alicuotaImpuesto: number
): SugerenciaImpuestosMovimiento {
  const base = Math.abs(monto)

  return {
    impuestoDebitoAplica,
    impuestoDebitoMonto: impuestoDebitoAplica ? redondearMoneda(base * alicuotaImpuesto) : 0,
    impuestoCreditoAplica,
    impuestoCreditoMonto: impuestoCreditoAplica ? redondearMoneda(base * alicuotaImpuesto) : 0,
  }
}

/**
 * redondearMoneda: number -> number
 *
 * Dado [un monto decimal], devuelve [el mismo monto redondeado a dos decimales].
 * Esta función existe para evitar arrastres de precisión binaria en cálculos monetarios del módulo financiero.
 *
 * Ejemplos:
 * redondearMoneda(6.004) === 6
 * redondearMoneda(6.005) === 6.01
 * redondearMoneda(10.999) === 11
 */
function redondearMoneda(monto: number): number {
  return Math.round(monto * 100) / 100
}
