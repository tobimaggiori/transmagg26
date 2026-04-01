/**
 * API Route: GET /api/pagos-fletero/[id]/historial
 * Devuelve el historial inmutable de cambios de un PagoAFletero.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  try {
    const pago = await prisma.pagoAFletero.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!pago) return notFoundResponse("Pago")

    const historial = await prisma.historialPago.findMany({
      where: { pagoFleteroId: id },
      select: {
        id: true,
        tipoEvento: true,
        justificacion: true,
        estadoAnterior: true,
        creadoEn: true,
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { creadoEn: "asc" },
    })

    return NextResponse.json(historial)
  } catch (error) {
    return serverErrorResponse("GET /api/pagos-fletero/[id]/historial", error)
  }
}
