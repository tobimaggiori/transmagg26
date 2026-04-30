/**
 * GET /api/dashboard-financiero/deuda-empresas/pdf
 * Genera el PDF del reporte "Deuda de Empresas" con los mismos datos
 * que muestra el modal del dashboard financiero (facturas pendientes + NC/ND_EMITIDA).
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes, maxMonetario, restarImportes } from "@/lib/money"
import { generarPDFDeudaEmpresas } from "@/lib/pdf-deuda-empresas"
import type { NotaDeuda } from "@/lib/pdf-deuda-empresas"
import { obtenerDatosEmisor } from "@/lib/pdf-common"

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
                montoTotal: true, creadoEn: true,
              },
            },
          },
          orderBy: { emitidaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    })

    const grupos = empresas
      .map((emp) => {
        const facturasConSaldo = emp.facturasEmitidas.map((f) => {
          const totalPagado = sumarImportes(f.pagos.map((p) => p.monto))
          const saldo = maxMonetario(0, restarImportes(f.total, totalPagado))
          return {
            raw: f,
            saldo,
            fila: {
              nroComprobante: f.nroComprobante,
              ptoVenta: f.ptoVenta,
              tipoCbte: f.tipoCbte,
              total: Number(f.total),
              emitidaEn: f.emitidaEn.toISOString(),
            },
          }
        }).filter((x) => x.saldo > 0)

        const facturas = facturasConSaldo.map((x) => x.fila)
        const notas: NotaDeuda[] = facturasConSaldo.flatMap((x) =>
          x.raw.notasCreditoDebito.map((n) => ({
            tipo: n.tipo as "NC_EMITIDA" | "ND_EMITIDA",
            tipoCbte: n.tipoCbte,
            nroComprobante: n.nroComprobante,
            ptoVenta: n.ptoVenta,
            monto: Number(n.montoTotal),
            signo: (n.tipo === "NC_EMITIDA" ? -1 : 1) as -1 | 1,
            emitidaEn: n.creadoEn.toISOString(),
          })),
        )

        const saldoFacturas = sumarImportes(facturasConSaldo.map((x) => x.saldo))
        const saldoNotas = notas.reduce((acc, n) => acc + n.monto * n.signo, 0)
        const saldoDeudor = maxMonetario(0, saldoFacturas + saldoNotas)

        return { razonSocial: emp.razonSocial, cuit: emp.cuit, saldoDeudor, facturas, notas }
      })
      .filter((e) => e.saldoDeudor > 0 || (e.notas?.length ?? 0) > 0)
      .sort((a, b) => b.saldoDeudor - a.saldoDeudor)

    const totalGeneral = sumarImportes(grupos.map((g) => g.saldoDeudor))

    const emisor = await obtenerDatosEmisor()

    const pdf = await generarPDFDeudaEmpresas({
      empresas: grupos,
      totalGeneral,
      generadoEn: new Date(),
      logo: emisor.logoComprobante,
    })

    return new NextResponse(new Uint8Array(pdf), {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="deuda-empresas.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-empresas/pdf", error)
  }
}
