/**
 * API Route: GET /api/dashboard-financiero/deuda-fleteros
 * Devuelve el desglose de deuda a fleteros con detalle de liquidaciones.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes, maxMonetario, restarImportes } from "@/lib/money"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [la lista de fleteros con saldo a pagar > 0 y el detalle
 * de sus liquidaciones EMITIDAS con saldo pendiente].
 * Solo incluye liquidaciones en estado "EMITIDA" con saldo > 0 (sin pagar o con pago parcial).
 * Esta función existe para mostrar el desglose de deuda a fleteros en el modal del dashboard.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ fleteroId, razonSocial, cuit, totalLiquidado, totalPagado, saldoAPagar, liquidaciones }])
 * GET() === NextResponse.json([{ fleteroId: "...", saldoAPagar: 80000, liquidaciones: [{ id, grabadaEn, total, totalPagado, saldo, estado, nroComprobante, ptoVenta, pdfS3Key }] }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const fleteros = await prisma.fletero.findMany({
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
    })

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
            pdfS3Key: null as string | null, // campo reservado para futura integración S3
          }
        })
        .filter((l) => l.saldo > 0)

      const totalLiquidado = sumarImportes(liquidaciones.map((l) => l.total))
      const totalPagado = sumarImportes(liquidaciones.map((l) => l.totalPagado))
      const saldoAPagar = sumarImportes(liquidaciones.map((l) => l.saldo))

      return {
        fleteroId: flet.id,
        razonSocial: flet.razonSocial,
        cuit: flet.cuit,
        totalLiquidado,
        totalPagado,
        saldoAPagar,
        liquidaciones,
      }
    })
      .filter((f) => f.saldoAPagar > 0)
      .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-fleteros", error)
  }
}
