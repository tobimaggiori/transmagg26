/**
 * GET /api/fleteros/[id]/liquidaciones-pendientes
 *
 * Devuelve las liquidaciones de un fletero con saldo pendiente > 0,
 * usando la fórmula unificada (total − pagos − NCs aplicadas − gastos − adelantos).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { calcularSaldoPendienteDoc } from "@/lib/cuenta-corriente"
import { sumarImportes, esMayorQueCero } from "@/lib/money"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve [{ id, nroComprobante, total, totalPagado, saldoPendiente, grabadaEn, estado }]
 * para LPs cuyo saldoPendiente > 0 (usando la fórmula unificada).
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: fleteroId } = await params

    const fletero = await prisma.fletero.findUnique({ where: { id: fleteroId }, select: { id: true } })
    if (!fletero) return notFoundResponse("Fletero")

    const liquidaciones = await prisma.liquidacion.findMany({
      where: { fleteroId },
      include: {
        pagos: { where: { anulado: false }, select: { monto: true } },
        ncDescuentos: { select: { montoDescontado: true } },
        gastoDescuentos: { select: { montoDescontado: true } },
        adelantoDescuentos: { select: { montoDescontado: true } },
      },
      orderBy: { grabadaEn: "asc" },
    })

    const resultado = liquidaciones
      .map((liq) => {
        const totalPagado = sumarImportes(liq.pagos.map((p) => p.monto))
        const saldoPendiente = calcularSaldoPendienteDoc(liq.total, {
          pagos: liq.pagos.map((p) => p.monto),
          ncAplicadas: liq.ncDescuentos.map((n) => n.montoDescontado),
          gastos: liq.gastoDescuentos.map((g) => g.montoDescontado),
          adelantos: liq.adelantoDescuentos.map((a) => a.montoDescontado),
        })
        return {
          id: liq.id,
          nroComprobante: liq.nroComprobante,
          ptoVenta: liq.ptoVenta,
          total: liq.total,
          totalPagado,
          saldoPendiente,
          grabadaEn: liq.grabadaEn.toISOString(),
          estado: liq.estado,
        }
      })
      .filter((liq) => esMayorQueCero(liq.saldoPendiente))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/fleteros/[id]/liquidaciones-pendientes", error)
  }
}
