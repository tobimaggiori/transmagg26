/**
 * API Route: GET /api/dashboard-financiero/deuda-fleteros
 * Devuelve el desglose de deuda a fleteros con detalle de liquidaciones.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [la lista de fleteros con su saldo a pagar y el detalle de liquidaciones pendientes].
 * Esta función existe para mostrar el desglose de deuda a fleteros en el modal del dashboard.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ fleteroId, razonSocial, totalLiquidado, totalPagado, saldoAPagar, liquidaciones }])
 * GET() === NextResponse.json([{ fleteroId: "...", saldoAPagar: 80000, liquidaciones: [{ id, total, saldo }] }])
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
          where: { estado: { not: "ANULADA" } },
          include: { pagos: { select: { monto: true } } },
          orderBy: { grabadaEn: "desc" },
        },
      },
      orderBy: { razonSocial: "asc" },
    })

    const resultado = fleteros.map((flet) => {
      const liquidaciones = flet.liquidaciones.map((l) => {
        const totalPagado = l.pagos.reduce((acc, p) => acc + p.monto, 0)
        return {
          id: l.id,
          grabadaEn: l.grabadaEn.toISOString(),
          total: l.total,
          totalPagado,
          saldo: Math.max(0, l.total - totalPagado),
          estado: l.estado,
        }
      })
      const totalLiquidado = liquidaciones.reduce((acc, l) => acc + l.total, 0)
      const totalPagado = liquidaciones.reduce((acc, l) => acc + l.totalPagado, 0)
      const saldoAPagar = liquidaciones.reduce((acc, l) => acc + l.saldo, 0)

      return {
        fleteroId: flet.id,
        razonSocial: flet.razonSocial,
        cuit: flet.cuit,
        totalLiquidado,
        totalPagado,
        saldoAPagar,
        liquidaciones,
      }
    }).filter((f) => f.saldoAPagar > 0)
      .sort((a, b) => b.saldoAPagar - a.saldoAPagar)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/deuda-fleteros", error)
  }
}
