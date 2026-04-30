/**
 * API Route: GET /api/dashboard-financiero/deuda-empresas
 * Devuelve el desglose de deuda por empresa con detalle de facturas y NC/ND emitidas.
 *
 * NC/ND: se incluyen las NC_EMITIDA/ND_EMITIDA vinculadas a facturas con saldo > 0.
 * NC baja el saldo deudor; ND lo sube. Cuando la factura queda cobrada 100%,
 * sus NC/ND desaparecen junto con ella.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes, maxMonetario, restarImportes } from "@/lib/money"

export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const empresas = await prisma.empresa.findMany({
      where: { activa: true },
      include: {
        facturasEmitidas: {
          include: {
            pagos: { select: { monto: true } },
            notasCreditoDebito: {
              where: { tipo: { in: ["NC_EMITIDA", "ND_EMITIDA"] } },
              select: {
                id: true, tipo: true, tipoCbte: true,
                nroComprobante: true, ptoVenta: true,
                montoTotal: true, creadoEn: true, facturaId: true,
              },
            },
          },
          orderBy: { emitidaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    })

    const resultado = empresas.map((emp) => {
      const facturasConSaldo = emp.facturasEmitidas.map((f) => {
        const totalPagado = sumarImportes(f.pagos.map((p) => p.monto))
        const saldo = maxMonetario(0, restarImportes(f.total, totalPagado))
        return {
          raw: f,
          fila: {
            id: f.id,
            nroComprobante: f.nroComprobante,
            ptoVenta: f.ptoVenta,
            tipoCbte: f.tipoCbte,
            total: f.total,
            totalPagado,
            saldo,
            emitidaEn: f.emitidaEn.toISOString(),
            estado: f.estado,
          },
        }
      }).filter((x) => x.fila.saldo > 0)

      const facturas = facturasConSaldo.map((x) => x.fila)

      const notas = facturasConSaldo.flatMap((x) =>
        x.raw.notasCreditoDebito.map((n) => ({
          id: n.id,
          tipo: n.tipo as "NC_EMITIDA" | "ND_EMITIDA",
          tipoCbte: n.tipoCbte,
          nroComprobante: n.nroComprobante,
          ptoVenta: n.ptoVenta,
          monto: Number(n.montoTotal),
          signo: n.tipo === "NC_EMITIDA" ? -1 : 1,
          emitidaEn: n.creadoEn.toISOString(),
          facturaId: n.facturaId,
        })),
      )

      const totalFacturado = sumarImportes(facturas.map((f) => f.total))
      const totalPagado = sumarImportes(facturas.map((f) => f.totalPagado))
      const saldoFacturas = sumarImportes(facturas.map((f) => f.saldo))
      const saldoNotas = notas.reduce((acc, n) => acc + n.monto * n.signo, 0)
      const saldoDeudor = maxMonetario(0, saldoFacturas + saldoNotas)

      return {
        empresaId: emp.id,
        razonSocial: emp.razonSocial,
        cuit: emp.cuit,
        totalFacturado,
        totalPagado,
        saldoDeudor,
        facturas,
        notas,
      }
    }).filter((e) => e.saldoDeudor > 0 || e.notas.length > 0)
      .sort((a, b) => b.saldoDeudor - a.saldoDeudor)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-empresas", error)
  }
}
