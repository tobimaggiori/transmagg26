/**
 * Funciones de cálculo de cuenta corriente para empresas, fleteros y proveedores.
 * Todas las funciones son puras respecto a Prisma (reciben el cliente como parámetro
 * implícito a través de la importación) y devuelven saldos calculados.
 */

import { prisma } from "@/lib/prisma"

export type SaldoCC = {
  saldoDeudor: number   // empresa/fletero DEBE (positivo)
  saldoAFavor: number   // empresa/fletero tiene a favor (positivo)
  saldoNeto: number     // positivo = debe, negativo = a favor
}

/**
 * calcularSaldoCCEmpresa: (empresaId: string) -> Promise<SaldoCC>
 *
 * Dado el ID de una empresa, calcula su saldo de cuenta corriente:
 * - DEBE: suma de facturas en estado EMITIDA, PARCIALMENTE_COBRADA, COBRADA (excluyendo ANULADA y BORRADOR),
 *   más notas de débito emitidas vinculadas a la empresa
 * - HABER: suma de todos los PagoDeEmpresa registrados, más notas de crédito emitidas
 * - saldoNeto = totalDebe - totalHaber
 * - Si saldoNeto > 0 → empresa debe (saldoDeudor = saldoNeto, saldoAFavor = 0)
 * - Si saldoNeto ≤ 0 → empresa tiene a favor (saldoDeudor = 0, saldoAFavor = Math.abs(saldoNeto))
 * Existe para mostrar el saldo en la vista de cuenta corriente y validar pagos con SALDO_A_FAVOR.
 *
 * Ejemplos:
 * calcularSaldoCCEmpresa("emp1") === { saldoDeudor: 400000, saldoAFavor: 0, saldoNeto: 400000 }
 * calcularSaldoCCEmpresa("emp1") === { saldoDeudor: 0, saldoAFavor: 30000, saldoNeto: -30000 }
 */
export async function calcularSaldoCCEmpresa(empresaId: string): Promise<SaldoCC> {
  const [facturas, pagos, notasCD] = await Promise.all([
    prisma.facturaEmitida.findMany({
      where: {
        empresaId,
        estado: { in: ["EMITIDA", "PARCIALMENTE_COBRADA", "COBRADA"] },
      },
      select: { total: true },
    }),
    prisma.pagoDeEmpresa.findMany({
      where: { empresaId },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: {
        factura: { empresaId },
        estado: { not: "ANULADA" },
      },
      select: { tipo: true, montoTotal: true },
    }),
  ])

  const totalFacturas = facturas.reduce((sum, f) => sum + f.total, 0)
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0)

  // NC_EMITIDA reduce deuda (crédito a favor de empresa), ND_EMITIDA aumenta deuda
  const ajusteNotasCD = notasCD.reduce((sum, n) => {
    if (n.tipo === "NC_EMITIDA") return sum - n.montoTotal
    if (n.tipo === "ND_EMITIDA") return sum + n.montoTotal
    return sum
  }, 0)

  const totalDebe = totalFacturas + ajusteNotasCD
  const saldoNeto = totalDebe - totalPagos

  if (saldoNeto > 0) {
    return { saldoDeudor: saldoNeto, saldoAFavor: 0, saldoNeto }
  } else {
    return { saldoDeudor: 0, saldoAFavor: Math.abs(saldoNeto), saldoNeto }
  }
}

/**
 * calcularSaldoCCFletero: (fleteroId: string) -> Promise<SaldoCC>
 *
 * Análogo a calcularSaldoCCEmpresa pero para liquidaciones.
 * DEBE: suma de liquidaciones EMITIDA, PARCIALMENTE_PAGADA, PAGADA (lo que transmagg le debe al fletero)
 * HABER: suma de todos los PagoAFletero registrados (lo que ya se pagó)
 * - saldoNeto = totalDebe - totalHaber
 * - Si saldoNeto > 0 → transmagg debe al fletero (saldoDeudor = saldoNeto, saldoAFavor = 0)
 * - Si saldoNeto ≤ 0 → fletero tiene deuda con transmagg (saldoDeudor = 0, saldoAFavor = Math.abs(saldoNeto))
 */
export async function calcularSaldoCCFletero(fleteroId: string): Promise<SaldoCC> {
  const [liquidaciones, pagos, notasCD] = await Promise.all([
    prisma.liquidacion.findMany({
      where: {
        fleteroId,
        estado: { in: ["EMITIDA", "PARCIALMENTE_PAGADA", "PAGADA"] },
      },
      select: { total: true },
    }),
    prisma.pagoAFletero.findMany({
      where: { fleteroId, anulado: false },
      select: { monto: true },
    }),
    prisma.notaCreditoDebito.findMany({
      where: {
        liquidacion: { fleteroId },
        estado: { not: "ANULADA" },
      },
      select: { tipo: true, montoTotal: true },
    }),
  ])

  const totalLiquidaciones = liquidaciones.reduce((sum, l) => sum + l.total, 0)
  const totalPagos = pagos.reduce((sum, p) => sum + p.monto, 0)

  // NC_RECIBIDA reduce lo que debemos al fletero, ND_RECIBIDA aumenta lo que debemos
  const ajusteNotasCD = notasCD.reduce((sum, n) => {
    if (n.tipo === "NC_RECIBIDA") return sum - n.montoTotal
    if (n.tipo === "ND_RECIBIDA") return sum + n.montoTotal
    return sum
  }, 0)

  const totalDebe = totalLiquidaciones + ajusteNotasCD
  const saldoNeto = totalDebe - totalPagos

  if (saldoNeto > 0) {
    return { saldoDeudor: saldoNeto, saldoAFavor: 0, saldoNeto }
  } else {
    return { saldoDeudor: 0, saldoAFavor: Math.abs(saldoNeto), saldoNeto }
  }
}

/**
 * calcularSaldoPendienteFactura: (facturaId: string) -> Promise<number>
 *
 * Dado el ID de una factura, devuelve el saldo pendiente de cobro.
 * Consulta los pagos existentes y resta del total de la factura.
 * Retorna 0 si la factura no existe o ya está completamente cobrada.
 */
export async function calcularSaldoPendienteFactura(facturaId: string): Promise<number> {
  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    select: {
      total: true,
      pagos: { select: { monto: true } },
    },
  })

  if (!factura) return 0

  const totalPagado = factura.pagos.reduce((sum, p) => sum + p.monto, 0)
  return Math.max(0, factura.total - totalPagado)
}

/**
 * calcularSaldoPendienteLiquidacion: (liquidacionId: string) -> Promise<number>
 *
 * Dado el ID de una liquidación, devuelve el saldo pendiente de pago.
 * Consulta los pagos existentes y resta del total de la liquidación.
 * Retorna 0 si la liquidación no existe o ya está completamente pagada.
 */
export async function calcularSaldoPendienteLiquidacion(liquidacionId: string): Promise<number> {
  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: {
      total: true,
      pagos: { where: { anulado: false }, select: { monto: true } },
    },
  })

  if (!liquidacion) return 0

  const totalPagado = liquidacion.pagos.reduce((sum, p) => sum + p.monto, 0)
  return Math.max(0, liquidacion.total - totalPagado)
}
