/**
 * GET /api/fleteros/[id]/liquidaciones-pendientes
 *
 * Devuelve las liquidaciones de un fletero con estado EMITIDA o PARCIALMENTE_PAGADA,
 * incluyendo el saldo pendiente calculado (total - suma de pagos anteriores).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado el id del fletero en la ruta, devuelve sus liquidaciones pagables con saldo pendiente.
 *
 * Ejemplos:
 * GET /api/fleteros/abc/liquidaciones-pendientes
 * === [{ id, nroComprobante, total, totalPagado, saldoPendiente, grabadaEn, estado }]
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
      where: {
        fleteroId,
        estado: { in: ["EMITIDA", "PARCIALMENTE_PAGADA"] },
      },
      include: {
        pagos: { select: { monto: true } },
      },
      orderBy: { grabadaEn: "asc" },
    })

    const resultado = liquidaciones.map((liq) => {
      const totalPagado = liq.pagos.reduce((sum, p) => sum + p.monto, 0)
      const saldoPendiente = Math.max(0, liq.total - totalPagado)
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

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/fleteros/[id]/liquidaciones-pendientes", error)
  }
}
