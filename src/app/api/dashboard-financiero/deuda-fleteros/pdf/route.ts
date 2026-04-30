/**
 * GET /api/dashboard-financiero/deuda-fleteros/pdf
 * Genera el PDF del reporte "Deuda a Fleteros" con liquidaciones pendientes + NC/ND_EMITIDA.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes, maxMonetario, restarImportes } from "@/lib/money"
import { generarPDFDeudaFleteros } from "@/lib/pdf-deuda-fleteros"
import type { NotaDeuda } from "@/lib/pdf-deuda-fleteros"
import { obtenerDatosEmisor } from "@/lib/pdf-common"

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

    const notasPorFletero = new Map<string, NotaDeuda[]>()
    for (const n of notasRaw) {
      const fleteroId = n.liquidacion?.fleteroId
      if (!fleteroId) continue
      const saldo = restarImportes(Number(n.montoTotal), Number(n.montoDescontado))
      if (saldo <= 0) continue
      const fila: NotaDeuda = {
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

    const grupos = fleteros
      .map((flet) => {
        const liquidaciones = flet.liquidaciones
          .map((l) => {
            const totalPagado = sumarImportes(l.pagos.map((p) => p.monto))
            const saldo = maxMonetario(0, restarImportes(l.total, totalPagado))
            return {
              nroComprobante: l.nroComprobante,
              ptoVenta: l.ptoVenta,
              tipoCbte: l.tipoCbte,
              total: Number(l.total),
              grabadaEn: l.grabadaEn.toISOString(),
              _saldo: saldo,
            }
          })
          .filter((l) => l._saldo > 0)
        const saldoLiqs = sumarImportes(liquidaciones.map((l) => l._saldo))
        const notas = notasPorFletero.get(flet.id) ?? []
        const saldoNotas = notas.reduce((acc, n) => acc + n.monto * n.signo, 0)
        const saldoAPagar = maxMonetario(0, saldoLiqs + saldoNotas)
        return {
          razonSocial: flet.razonSocial,
          cuit: flet.cuit,
          saldoAPagar,
          liquidaciones: liquidaciones.map(({ _saldo, ...rest }) => { void _saldo; return rest }),
          notas,
        }
      })
      .filter((f) => f.saldoAPagar > 0 || f.notas.length > 0)
      .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

    const totalGeneral = sumarImportes(grupos.map((g) => g.saldoAPagar))

    const emisor = await obtenerDatosEmisor()

    const pdf = await generarPDFDeudaFleteros({
      fleteros: grupos,
      totalGeneral,
      generadoEn: new Date(),
      logo: emisor.logoComprobante,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="deuda-fleteros.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-fleteros/pdf", error)
  }
}
