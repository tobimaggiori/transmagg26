/**
 * GET /api/cheques-recibidos/en-cartera — Lista cheques recibidos en estado EN_CARTERA.
 * Usado en formularios de pago/endoso.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Devuelve todos los cheques recibidos con estado EN_CARTERA, ordenados por fecha de cobro.
 *
 * Ejemplos:
 * GET() === [{ id, nroCheque, monto, fechaCobro, empresa, esElectronico }]
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheques = await prisma.chequeRecibido.findMany({
      where: { estado: "EN_CARTERA" },
      include: {
        empresa: { select: { id: true, razonSocial: true } },
        factura: { select: { id: true, nroComprobante: true, tipoCbte: true } },
      },
      orderBy: { fechaCobro: "asc" },
    })
    return NextResponse.json(cheques)
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-recibidos/en-cartera", error)
  }
}
