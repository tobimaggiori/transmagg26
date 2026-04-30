/**
 * API Route: GET /api/dashboard-financiero/deuda-fleteros
 * Devuelve el desglose de deuda a fleteros con detalle de liquidaciones y NC/ND.
 *
 * NC/ND: NC_EMITIDA/ND_EMITIDA a un fletero (vía liquidacion.fleteroId) con
 * `montoTotal > montoDescontado` se consideran pendientes. NC baja deuda,
 * ND la sube. Cuando una NC se aplica a una OP (vía NCDescuento) su
 * montoDescontado sube; al igualar montoTotal, desaparece.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes, maxMonetario, restarImportes } from "@/lib/money"

export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const [fleteros, notasRaw] = await Promise.all([
      prisma.fletero.findMany({
        where: { activo: true },
        include: {
          liquidaciones: {
            where: {
              estado: { in: ["EMITIDA", "PARCIALMENTE_PAGADA"] },
              pagos: { none: { ordenPagoId: { not: null }, anulado: false } },
            },
            include: { pagos: { select: { monto: true } } },
            orderBy: { grabadaEn: "desc" },
          },
        },
        orderBy: { razonSocial: "asc" },
      }),
      prisma.notaCreditoDebito.findMany({
        where: {
          tipo: { in: ["NC_EMITIDA", "ND_EMITIDA"] },
          liquidacionId: { not: null },
        },
        select: {
          id: true, tipo: true, tipoCbte: true,
          nroComprobante: true, ptoVenta: true,
          montoTotal: true, montoDescontado: true, creadoEn: true,
          liquidacion: { select: { fleteroId: true } },
        },
      }),
    ])

    const notasPorFletero = new Map<string, Array<{
      id: string; tipo: "NC_EMITIDA" | "ND_EMITIDA"
      tipoCbte: number | null; nroComprobante: number | null; ptoVenta: number | null
      monto: number; signo: -1 | 1; emitidaEn: string
    }>>()
    for (const n of notasRaw) {
      const fleteroId = n.liquidacion?.fleteroId
      if (!fleteroId) continue
      const saldo = restarImportes(Number(n.montoTotal), Number(n.montoDescontado))
      if (saldo <= 0) continue
      const fila = {
        id: n.id,
        tipo: n.tipo as "NC_EMITIDA" | "ND_EMITIDA",
        tipoCbte: n.tipoCbte,
        nroComprobante: n.nroComprobante,
        ptoVenta: n.ptoVenta,
        monto: saldo,
        signo: (n.tipo === "NC_EMITIDA" ? -1 : 1) as -1 | 1,
        emitidaEn: n.creadoEn.toISOString(),
      }
      const arr = notasPorFletero.get(fleteroId) ?? []
      arr.push(fila)
      notasPorFletero.set(fleteroId, arr)
    }

    const resultado = fleteros.map((flet) => {
      const liquidaciones = flet.liquidaciones
        .map((l) => {
          const totalPagado = sumarImportes(l.pagos.map((p) => p.monto))
          const saldo = maxMonetario(0, restarImportes(l.total, totalPagado))
          return {
            id: l.id,
            grabadaEn: l.grabadaEn.toISOString(),
            total: l.total,
            totalPagado,
            saldo,
            estado: l.estado,
            nroComprobante: l.nroComprobante,
            ptoVenta: l.ptoVenta,
            tipoCbte: l.tipoCbte,
            pdfS3Key: null as string | null,
          }
        })
        .filter((l) => l.saldo > 0)

      const notas = notasPorFletero.get(flet.id) ?? []

      const totalLiquidado = sumarImportes(liquidaciones.map((l) => l.total))
      const totalPagado = sumarImportes(liquidaciones.map((l) => l.totalPagado))
      const saldoLiqs = sumarImportes(liquidaciones.map((l) => l.saldo))
      const saldoNotas = notas.reduce((acc, n) => acc + n.monto * n.signo, 0)
      const saldoAPagar = maxMonetario(0, saldoLiqs + saldoNotas)

      return {
        fleteroId: flet.id,
        razonSocial: flet.razonSocial,
        cuit: flet.cuit,
        totalLiquidado,
        totalPagado,
        saldoAPagar,
        liquidaciones,
        notas,
      }
    })
      .filter((f) => f.saldoAPagar > 0 || f.notas.length > 0)
      .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-fleteros", error)
  }
}
