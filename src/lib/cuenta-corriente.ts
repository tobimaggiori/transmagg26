/**
 * cuenta-corriente.ts
 *
 * Cálculo de saldos de cuenta corriente para empresas, fleteros y documentos.
 *
 * MODELO UNIFICADO (refactor 2026-04):
 *
 * Saldo pendiente de un documento (LP / factura) =
 *     total
 *   − sum(pagos no anulados)
 *   − sum(NCs aplicadas) — `nota.montoDescontado` (acumulado de aplicaciones explícitas)
 *   − sum(gastos descontados, solo LPs)
 *   − sum(adelantos descontados, solo LPs)
 *
 * - Una NC emitida NO reduce automáticamente el saldo del documento. Solo lo
 *   reduce cuando se aplica explícitamente (vía recibo de cobranza para empresas
 *   o vía OP para fleteros). El monto aplicado se acumula en `nota.montoDescontado`.
 * - Mientras la NC tenga saldo sin aplicar (`montoTotal − montoDescontado > 0`),
 *   ese remanente forma parte del "crédito disponible" del fletero/empresa,
 *   reportado por separado del saldo deudor.
 *
 * Saldo CC = sum(saldoPendiente de cada doc) menos saldoAFavor por sobrepagos.
 * Crédito disponible = sum(NC.montoTotal − NC.montoDescontado) por NCs activas.
 *
 * Estructura del archivo:
 * - Funciones puras de cálculo (sin Prisma): testeables sin mocks.
 * - Funciones de orquestación (con Prisma): obtienen datos y delegan al cálculo puro.
 *
 * NOTA: `calcularNetoVigente` se mantiene exclusivamente para reportes fiscales
 * (libros IVA, comprobantes oficiales). NO debe usarse para cálculo de saldos.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, maxMonetario, type MonetaryInput } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type SaldoCC = {
  saldoDeudor: number          // empresa/fletero DEBE (positivo)
  saldoAFavor: number          // empresa/fletero tiene a favor por sobrepagos (positivo)
  creditoDisponible: number    // NCs emitidas con monto sin aplicar
  saldoNeto: number            // positivo = debe, negativo = a favor (sin contar crédito)
}

type NotaCD = { tipo: string; montoTotal: MonetaryInput }
type NotaConDescuento = { montoTotal: MonetaryInput; montoDescontado: MonetaryInput }

// ─── Neto vigente (SOLO USO FISCAL) ──────────────────────────────────────────

/**
 * calcularNetoVigente: number NotaCD[] -> number
 *
 * SOLO PARA CONTEXTO FISCAL (libros IVA, reportes oficiales).
 * NO usar para cálculos de saldo pendiente — ese cálculo va por
 * `calcularSaldoPendienteDoc` / `calcularSaldoPendienteFactura` /
 * `calcularSaldoPendienteLiquidacion`.
 *
 * Devuelve el neto vigente económico: total original − NC + ND.
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

// ─── Funciones puras: saldo pendiente y crédito disponible ───────────────────

/**
 * calcularSaldoPendienteDoc: number {pagos, ncAplicadas, gastos?, adelantos?} -> number
 *
 * Fórmula unificada: saldo pendiente de un documento.
 *
 * Ejemplos:
 * calcularSaldoPendienteDoc(100000, { pagos: [], ncAplicadas: [] }) === 100000
 * calcularSaldoPendienteDoc(100000, { pagos: [60000], ncAplicadas: [] }) === 40000
 * calcularSaldoPendienteDoc(100000, { pagos: [], ncAplicadas: [30000] }) === 70000
 * calcularSaldoPendienteDoc(100000, { pagos: [50000], ncAplicadas: [20000], gastos: [10000], adelantos: [20000] }) === 0
 * calcularSaldoPendienteDoc(100000, { pagos: [120000], ncAplicadas: [] }) === 0
 */
export function calcularSaldoPendienteDoc(
  total: number,
  componentes: {
    pagos: MonetaryInput[]
    ncAplicadas: MonetaryInput[]
    gastos?: MonetaryInput[]
    adelantos?: MonetaryInput[]
  }
): number {
  const consumido = sumarImportes([
    sumarImportes(componentes.pagos),
    sumarImportes(componentes.ncAplicadas),
    sumarImportes(componentes.gastos ?? []),
    sumarImportes(componentes.adelantos ?? []),
  ])
  return maxMonetario(0, restarImportes(total, consumido))
}

/**
 * calcularCreditoDisponible: NotaConDescuento[] -> number
 *
 * Suma el saldo sin aplicar de NCs (montoTotal − montoDescontado, mínimo 0 por NC).
 * Solo deben pasarse NCs (no NDs).
 *
 * Ejemplos:
 * calcularCreditoDisponible([]) === 0
 * calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 0 }]) === 50000
 * calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 50000 }]) === 0
 * calcularCreditoDisponible([{ montoTotal: 50000, montoDescontado: 20000 }, { montoTotal: 30000, montoDescontado: 0 }]) === 60000
 */
export function calcularCreditoDisponible(notas: NotaConDescuento[]): number {
  return notas.reduce((sum, nc) => {
    const restante = maxMonetario(0, restarImportes(nc.montoTotal, nc.montoDescontado))
    return sumarImportes([sum, restante])
  }, 0)
}

/**
 * calcularSaldoPendiente: number MonetaryInput[] -> number
 *
 * Variante simple: solo pagos. Mantenida para compatibilidad de
 * llamadores que no manejan aplicaciones (factura proveedor sin NC).
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
  return calcularSaldoPendienteDoc(total, { pagos, ncAplicadas: [] })
}

/**
 * calcularAjusteNotasCD: NotaCD[] string string -> number
 *
 * MANTENIDO solo para casos legacy donde se necesita el delta NC/ND como
 * número (e.g. asientos contables). Para saldos usar las helpers nuevas.
 *
 * Ejemplos:
 * calcularAjusteNotasCD([{ tipo: "NC_EMITIDA", montoTotal: 20000 }], "NC_EMITIDA", "ND_EMITIDA") === -20000
 * calcularAjusteNotasCD([{ tipo: "ND_EMITIDA", montoTotal: 15000 }], "NC_EMITIDA", "ND_EMITIDA") === 15000
 * calcularAjusteNotasCD([], "NC_EMITIDA", "ND_EMITIDA") === 0
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
 * calcularSaldoCC: { totalDeudaPorDocs, totalSobrepagos, creditoDisponible } -> SaldoCC
 *
 * Compone el resultado SaldoCC a partir de:
 * - totalDeudaPorDocs: suma de saldoPendiente de todos los docs (>= 0)
 * - totalSobrepagos: pagos que excedieron el total de docs (>= 0)
 * - creditoDisponible: NCs emitidas con saldo sin aplicar (>= 0)
 *
 * Reglas:
 * - saldoNeto = totalDeudaPorDocs − totalSobrepagos
 * - saldoNeto > 0 → deudor; saldoNeto <= 0 → a favor
 * - creditoDisponible se reporta separado, no afecta saldoNeto
 *
 * Ejemplos:
 * calcularSaldoCC({ totalDeudaPorDocs: 300000, totalSobrepagos: 0, creditoDisponible: 0 })
 *   === { saldoDeudor: 300000, saldoAFavor: 0, creditoDisponible: 0, saldoNeto: 300000 }
 * calcularSaldoCC({ totalDeudaPorDocs: 100000, totalSobrepagos: 30000, creditoDisponible: 0 })
 *   === { saldoDeudor: 70000, saldoAFavor: 0, creditoDisponible: 0, saldoNeto: 70000 }
 * calcularSaldoCC({ totalDeudaPorDocs: 0, totalSobrepagos: 25000, creditoDisponible: 50000 })
 *   === { saldoDeudor: 0, saldoAFavor: 25000, creditoDisponible: 50000, saldoNeto: -25000 }
 */
export function calcularSaldoCC(componentes: {
  totalDeudaPorDocs: number
  totalSobrepagos: number
  creditoDisponible: number
}): SaldoCC {
  const saldoNeto = restarImportes(componentes.totalDeudaPorDocs, componentes.totalSobrepagos)
  if (saldoNeto > 0) {
    return {
      saldoDeudor: saldoNeto,
      saldoAFavor: 0,
      creditoDisponible: componentes.creditoDisponible,
      saldoNeto,
    }
  }
  return {
    saldoDeudor: 0,
    saldoAFavor: Math.abs(saldoNeto),
    creditoDisponible: componentes.creditoDisponible,
    saldoNeto,
  }
}

// ─── Orquestación con Prisma ─────────────────────────────────────────────────

/**
 * calcularSaldoPendienteFactura: string -> Promise<number>
 *
 * Saldo pendiente de cobro de una factura:
 *   total − pagos no anulados − NCs aplicadas (montoDescontado).
 * Retorna 0 si la factura no existe o ya está saldada.
 */
export async function calcularSaldoPendienteFactura(facturaId: string): Promise<number> {
  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    select: {
      total: true,
      pagos: { select: { monto: true } },
      notasCreditoDebito: {
        where: { tipo: "NC_EMITIDA" },
        select: { montoDescontado: true },
      },
    },
  })
  if (!factura) return 0
  return calcularSaldoPendienteDoc(factura.total, {
    pagos: factura.pagos.map((p) => p.monto),
    ncAplicadas: factura.notasCreditoDebito.map((n) => n.montoDescontado),
  })
}

/**
 * calcularSaldoPendienteLiquidacion: string -> Promise<number>
 *
 * Saldo pendiente de pago de una liquidación:
 *   total − pagos no anulados − NCs aplicadas − gastos descontados − adelantos descontados.
 *
 * IMPORTANTE: las NCs aplicadas se leen de la link table `nc_descuentos`
 * filtrada por `liquidacionId`, NO de `liquidacion.notasCreditoDebito` (que
 * lista NCs emitidas SOBRE esa LP). Una NC de LP1 puede aplicarse a LP2 en
 * una OP — el descuento queda registrado en nc_descuentos con liquidacionId
 * = LP2, mientras la NC sigue ligada a su LP origen.
 *
 * Retorna 0 si la liquidación no existe o ya está saldada.
 */
export async function calcularSaldoPendienteLiquidacion(liquidacionId: string): Promise<number> {
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: {
      total: true,
      pagos: { where: { anulado: false }, select: { monto: true } },
      ncDescuentos: { select: { montoDescontado: true } },
      gastoDescuentos: { select: { montoDescontado: true } },
      adelantoDescuentos: { select: { montoDescontado: true } },
    },
  })
  if (!liq) return 0
  return calcularSaldoPendienteDoc(liq.total, {
    pagos: liq.pagos.map((p) => p.monto),
    ncAplicadas: liq.ncDescuentos.map((n) => n.montoDescontado),
    gastos: liq.gastoDescuentos.map((g) => g.montoDescontado),
    adelantos: liq.adelantoDescuentos.map((a) => a.montoDescontado),
  })
}

/**
 * calcularSaldoCCEmpresa: string -> Promise<SaldoCC>
 *
 * Saldo de cuenta corriente de una empresa.
 * Suma saldo pendiente de cada factura, sobrepagos sin asignar y crédito por NC no aplicadas.
 */
export async function calcularSaldoCCEmpresa(empresaId: string): Promise<SaldoCC> {
  const [facturas, pagosSinFactura, ncsEmitidas] = await Promise.all([
    prisma.facturaEmitida.findMany({
      where: { empresaId },
      select: {
        total: true,
        pagos: { select: { monto: true } },
        notasCreditoDebito: {
          where: { tipo: "NC_EMITIDA" },
          select: { montoTotal: true, montoDescontado: true },
        },
      },
    }),
    prisma.pagoDeEmpresa.findMany({
      where: { empresaId, facturaId: null },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: { factura: { empresaId }, tipo: "NC_EMITIDA" },
      select: { montoTotal: true, montoDescontado: true },
    }),
  ])

  const totalDeudaPorDocs = facturas.reduce((acc, f) => {
    const pendiente = calcularSaldoPendienteDoc(f.total, {
      pagos: f.pagos.map((p) => p.monto),
      ncAplicadas: f.notasCreditoDebito.map((n) => n.montoDescontado),
    })
    return sumarImportes([acc, pendiente])
  }, 0)

  const totalSobrepagos = sumarImportes(pagosSinFactura.map((p) => p.monto))
  const creditoDisponible = calcularCreditoDisponible(ncsEmitidas)

  return calcularSaldoCC({ totalDeudaPorDocs, totalSobrepagos, creditoDisponible })
}

/**
 * calcularSaldoCCFletero: string -> Promise<SaldoCC>
 *
 * Saldo de cuenta corriente de un fletero.
 * Suma saldo pendiente de cada LP, sobrepagos sin asignar (saldo a favor) y
 * crédito por NC emitidas sobre LP con monto sin aplicar.
 */
export async function calcularSaldoCCFletero(fleteroId: string): Promise<SaldoCC> {
  const [liqs, pagosSinLiq, ncsEmitidas] = await Promise.all([
    prisma.liquidacion.findMany({
      where: { fleteroId },
      select: {
        total: true,
        pagos: { where: { anulado: false }, select: { monto: true } },
        ncDescuentos: { select: { montoDescontado: true } },
        gastoDescuentos: { select: { montoDescontado: true } },
        adelantoDescuentos: { select: { montoDescontado: true } },
      },
    }),
    prisma.pagoAFletero.findMany({
      where: { fleteroId, anulado: false, liquidacionId: null },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: { liquidacion: { fleteroId }, tipo: "NC_EMITIDA" },
      select: { montoTotal: true, montoDescontado: true },
    }),
  ])

  const totalDeudaPorDocs = liqs.reduce((acc, liq) => {
    const pendiente = calcularSaldoPendienteDoc(liq.total, {
      pagos: liq.pagos.map((p) => p.monto),
      ncAplicadas: liq.ncDescuentos.map((n) => n.montoDescontado),
      gastos: liq.gastoDescuentos.map((g) => g.montoDescontado),
      adelantos: liq.adelantoDescuentos.map((a) => a.montoDescontado),
    })
    return sumarImportes([acc, pendiente])
  }, 0)

  const totalSobrepagos = sumarImportes(pagosSinLiq.map((p) => p.monto))
  const creditoDisponible = calcularCreditoDisponible(ncsEmitidas)

  return calcularSaldoCC({ totalDeudaPorDocs, totalSobrepagos, creditoDisponible })
}
