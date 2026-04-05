/**
 * cuenta-corriente.ts
 *
 * Cálculo de saldos de cuenta corriente para empresas, fleteros y documentos.
 *
 * Estructura:
 * - Funciones puras de cálculo (sin Prisma): calcularSaldoCC, calcularAjusteNotasCD, calcularSaldoPendiente
 * - Funciones de orquestación (con Prisma): calcularSaldoCCEmpresa, calcularSaldoCCFletero, etc.
 *
 * Las funciones puras son testeables sin mocks y contienen las reglas de negocio.
 * Las funciones de orquestación solo obtienen datos y delegan al cálculo puro.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, maxMonetario, type MonetaryInput } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SaldoCC = {
  saldoDeudor: number   // empresa/fletero DEBE (positivo)
  saldoAFavor: number   // empresa/fletero tiene a favor (positivo)
  saldoNeto: number     // positivo = debe, negativo = a favor
}

type NotaCD = { tipo: string; montoTotal: MonetaryInput }

// ─── Neto vigente por documento ──────────────────────────────────────────────

/**
 * calcularNetoVigente: number NotaCD[] -> number
 *
 * Dado [el total original de un documento y las NC/ND asociadas],
 * devuelve [el neto vigente económico: total original - NC + ND].
 *
 * Regla documental:
 * - El documento original es inmutable (nunca se anula)
 * - La verdad económica sale de la suma documental vigente
 * - NC reduce el neto vigente, ND lo aumenta
 *
 * Ejemplos:
 * calcularNetoVigente(100000, []) === 100000
 * calcularNetoVigente(100000, [{ tipo: "NC_EMITIDA", montoTotal: 100000 }]) === 0
 * calcularNetoVigente(100000, [{ tipo: "NC_EMITIDA", montoTotal: 30000 }, { tipo: "ND_EMITIDA", montoTotal: 5000 }]) === 75000
 */
export function calcularNetoVigente(
  totalOriginal: number,
  notasCD: NotaCD[]
): number {
  const ajuste = notasCD.reduce((sum, n) => {
    if (n.tipo === "NC_EMITIDA" || n.tipo === "NC_RECIBIDA") return restarImportes(sum, n.montoTotal)
    if (n.tipo === "ND_EMITIDA" || n.tipo === "ND_RECIBIDA") return sumarImportes([sum, n.montoTotal])
    return sum
  }, 0)
  return maxMonetario(0, sumarImportes([totalOriginal, ajuste]))
}

// ─── Funciones puras de cálculo ──────────────────────────────────────────────

/**
 * calcularAjusteNotasCD: NotaCD[] string string -> number
 *
 * Dada [una lista de notas de crédito/débito, el tipo que reduce deuda
 * y el tipo que aumenta deuda], devuelve [el ajuste neto a aplicar al debe].
 * Positivo = más deuda, negativo = menos deuda.
 *
 * Existe para centralizar la regla de ajuste NC/ND que es idéntica
 * entre empresa (NC_EMITIDA/ND_EMITIDA) y fletero (NC_RECIBIDA/ND_RECIBIDA).
 *
 * Ejemplos:
 * calcularAjusteNotasCD([{ tipo: "NC_EMITIDA", montoTotal: 20000 }], "NC_EMITIDA", "ND_EMITIDA") === -20000
 * calcularAjusteNotasCD([{ tipo: "ND_EMITIDA", montoTotal: 15000 }], "NC_EMITIDA", "ND_EMITIDA") === 15000
 * calcularAjusteNotasCD([], "NC_EMITIDA", "ND_EMITIDA") === 0
 * calcularAjusteNotasCD([
 *   { tipo: "NC_EMITIDA", montoTotal: 10000 },
 *   { tipo: "ND_EMITIDA", montoTotal: 5000 },
 * ], "NC_EMITIDA", "ND_EMITIDA") === -5000
 */
export function calcularAjusteNotasCD(
  notas: NotaCD[],
  tipoCredito: string,
  tipoDebito: string
): number {
  return notas.reduce((sum, n) => {
    if (n.tipo === tipoCredito) return restarImportes(sum, n.montoTotal)
    if (n.tipo === tipoDebito) return sumarImportes([sum, n.montoTotal])
    return sum
  }, 0)
}

/**
 * calcularSaldoCC: number number number -> SaldoCC
 *
 * Dados [totalDocumentos (facturas o liquidaciones), totalPagos y ajusteNotasCD],
 * devuelve [el saldo de cuenta corriente con deudor, a favor y neto].
 *
 * Regla:
 * - totalDebe = totalDocumentos + ajusteNotasCD
 * - saldoNeto = totalDebe - totalPagos
 * - saldoNeto > 0 → deudor; saldoNeto <= 0 → a favor
 *
 * Ejemplos:
 * calcularSaldoCC(300000, 0, 0) === { saldoDeudor: 300000, saldoAFavor: 0, saldoNeto: 300000 }
 * calcularSaldoCC(100000, 130000, 0) === { saldoDeudor: 0, saldoAFavor: 30000, saldoNeto: -30000 }
 * calcularSaldoCC(100000, 0, -20000) === { saldoDeudor: 80000, saldoAFavor: 0, saldoNeto: 80000 }
 * calcularSaldoCC(0, 0, 0) === { saldoDeudor: 0, saldoAFavor: 0, saldoNeto: 0 }
 */
export function calcularSaldoCC(
  totalDocumentos: number,
  totalPagos: number,
  ajusteNotasCD: number
): SaldoCC {
  const totalDebe = sumarImportes([totalDocumentos, ajusteNotasCD])
  const saldoNeto = restarImportes(totalDebe, totalPagos)

  if (saldoNeto > 0) {
    return { saldoDeudor: saldoNeto, saldoAFavor: 0, saldoNeto }
  }
  return { saldoDeudor: 0, saldoAFavor: Math.abs(saldoNeto), saldoNeto }
}

/**
 * calcularSaldoPendiente: number MonetaryInput[] -> number
 *
 * Dado [el total de un documento y la lista de montos de pagos],
 * devuelve [el saldo pendiente, mínimo 0].
 *
 * Ejemplos:
 * calcularSaldoPendiente(100000, [40000]) === 60000
 * calcularSaldoPendiente(100000, [100000]) === 0
 * calcularSaldoPendiente(100000, [120000]) === 0
 * calcularSaldoPendiente(100000, []) === 100000
 */
export function calcularSaldoPendiente(
  total: number,
  pagos: MonetaryInput[]
): number {
  const totalPagado = sumarImportes(pagos)
  return maxMonetario(0, restarImportes(total, totalPagado))
}

// ─── Orquestación con Prisma ─────────────────────────────────────────────────

/**
 * calcularSaldoCCEmpresa: (empresaId: string) -> Promise<SaldoCC>
 *
 * Dado el ID de una empresa, calcula su saldo de cuenta corriente.
 * Obtiene facturas, pagos y notas CD de Prisma, y delega el cálculo
 * a las funciones puras calcularAjusteNotasCD y calcularSaldoCC.
 */
export async function calcularSaldoCCEmpresa(empresaId: string): Promise<SaldoCC> {
  const [facturas, pagos, notasCD] = await Promise.all([
    prisma.facturaEmitida.findMany({
      where: { empresaId },
      select: { total: true },
    }),
    prisma.pagoDeEmpresa.findMany({
      where: { empresaId },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: { factura: { empresaId } },
      select: { tipo: true, montoTotal: true },
    }),
  ])

  const totalFacturas = sumarImportes(facturas.map(f => f.total))
  const totalPagos = sumarImportes(pagos.map(p => p.monto))
  const ajuste = calcularAjusteNotasCD(notasCD, "NC_EMITIDA", "ND_EMITIDA")

  return calcularSaldoCC(totalFacturas, totalPagos, ajuste)
}

/**
 * calcularSaldoCCFletero: (fleteroId: string) -> Promise<SaldoCC>
 *
 * Dado el ID de un fletero, calcula su saldo de cuenta corriente.
 * Obtiene liquidaciones, pagos y notas CD de Prisma, y delega el cálculo
 * a las funciones puras calcularAjusteNotasCD y calcularSaldoCC.
 */
export async function calcularSaldoCCFletero(fleteroId: string): Promise<SaldoCC> {
  const [liquidaciones, pagos, notasCD] = await Promise.all([
    prisma.liquidacion.findMany({
      where: { fleteroId },
      select: { total: true },
    }),
    prisma.pagoAFletero.findMany({
      where: { fleteroId, anulado: false },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: { liquidacion: { fleteroId } },
      select: { tipo: true, montoTotal: true },
    }),
  ])

  const totalLiquidaciones = sumarImportes(liquidaciones.map(l => l.total))
  const totalPagos = sumarImportes(pagos.map(p => p.monto))
  // NC/ND sobre LP pueden ser emitidas (por Transmagg) o recibidas (legacy)
  const ajusteEmitidas = calcularAjusteNotasCD(notasCD, "NC_EMITIDA", "ND_EMITIDA")
  const ajusteRecibidas = calcularAjusteNotasCD(notasCD, "NC_RECIBIDA", "ND_RECIBIDA")
  const ajuste = sumarImportes([ajusteEmitidas, ajusteRecibidas])

  return calcularSaldoCC(totalLiquidaciones, totalPagos, ajuste)
}

/**
 * calcularSaldoPendienteFactura: (facturaId: string) -> Promise<number>
 *
 * Dado el ID de una factura, devuelve el saldo pendiente de cobro
 * basado en el neto vigente documental (total - NC + ND) menos pagos.
 * Retorna 0 si la factura no existe o ya está completamente cobrada.
 */
export async function calcularSaldoPendienteFactura(facturaId: string): Promise<number> {
  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    select: {
      total: true,
      pagos: { select: { monto: true } },
      notasCreditoDebito: { select: { tipo: true, montoTotal: true } },
    },
  })

  if (!factura) return 0

  const netoVigente = calcularNetoVigente(factura.total, factura.notasCreditoDebito)
  return calcularSaldoPendiente(netoVigente, factura.pagos.map(p => p.monto))
}

/**
 * calcularSaldoPendienteLiquidacion: (liquidacionId: string) -> Promise<number>
 *
 * Dado el ID de una liquidación, devuelve el saldo pendiente de pago
 * basado en el neto vigente documental (total - NC + ND) menos pagos.
 * Retorna 0 si la liquidación no existe o ya está completamente pagada.
 */
export async function calcularSaldoPendienteLiquidacion(liquidacionId: string): Promise<number> {
  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: {
      total: true,
      pagos: { where: { anulado: false }, select: { monto: true } },
      notasCreditoDebito: { select: { tipo: true, montoTotal: true } },
    },
  })

  if (!liquidacion) return 0

  const netoVigente = calcularNetoVigente(liquidacion.total, liquidacion.notasCreditoDebito)
  return calcularSaldoPendiente(netoVigente, liquidacion.pagos.map(p => p.monto))
}
