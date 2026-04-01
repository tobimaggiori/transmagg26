/**
 * GET /api/cheques-emitidos/disponibles — Lista cheques emitidos en estado EMITIDO sin pago vinculado activo.
 * Usado en formularios de pago a proveedores/fleteros.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Devuelve cheques emitidos con estado EMITIDO, ordenados por fecha de pago.
 *
 * Ejemplos:
 * GET() === [{ id, nroCheque, monto, fechaPago, cuenta, fletero, proveedor }]
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheques = await prisma.chequeEmitido.findMany({
      where: { estado: "EMITIDO" },
      include: {
        cuenta: { select: { id: true, nombre: true } },
        fletero: { select: { id: true, razonSocial: true } },
        proveedor: { select: { id: true, razonSocial: true } },
      },
      orderBy: { fechaPago: "asc" },
    })
    return NextResponse.json(cheques)
  } catch (error) {
    return serverErrorResponse("GET /api/cheques-emitidos/disponibles", error)
  }
}
