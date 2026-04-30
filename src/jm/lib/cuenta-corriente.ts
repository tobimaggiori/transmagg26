/**
 * cuenta-corriente.ts (JM)
 *
 * Orquestación de saldos para JM. Usa funciones puras de
 * @/lib/cuenta-corriente (sin estado) y prismaJm para datos.
 *
 * Sin LPs ni fleteros — solo facturas emitidas, pagos y NCs.
 */

import { prismaJm } from "@/jm/prisma"
import {
  calcularSaldoPendienteDoc,
  calcularCreditoDisponible,
  calcularSaldoCC,
  type SaldoCC,
} from "@/lib/cuenta-corriente"
import { sumarImportes } from "@/lib/money"

export async function calcularSaldoPendienteFacturaJm(facturaId: string): Promise<number> {
  const factura = await prismaJm.facturaEmitida.findUnique({
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
  return calcularSaldoPendienteDoc(Number(factura.total), {
    pagos: factura.pagos.map((p) => p.monto),
    ncAplicadas: factura.notasCreditoDebito.map((n) => n.montoDescontado),
  })
}

export async function calcularSaldoCCEmpresaJm(empresaId: string): Promise<SaldoCC> {
  const [facturas, pagosSinFactura, ncsEmitidas] = await Promise.all([
    prismaJm.facturaEmitida.findMany({
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
    prismaJm.pagoDeEmpresa.findMany({
      where: { empresaId, facturaId: null },
      select: { monto: true },
    }),
    prismaJm.notaCreditoDebito.findMany({
      where: { factura: { empresaId }, tipo: "NC_EMITIDA" },
      select: { montoTotal: true, montoDescontado: true },
    }),
  ])

  const totalDeudaPorDocs = facturas.reduce((acc, f) => {
    const pendiente = calcularSaldoPendienteDoc(Number(f.total), {
      pagos: f.pagos.map((p) => p.monto),
      ncAplicadas: f.notasCreditoDebito.map((n) => n.montoDescontado),
    })
    return sumarImportes([acc, pendiente])
  }, 0)

  const totalSobrepagos = sumarImportes(pagosSinFactura.map((p) => p.monto))
  const creditoDisponible = calcularCreditoDisponible(ncsEmitidas)

  return calcularSaldoCC({ totalDeudaPorDocs, totalSobrepagos, creditoDisponible })
}
