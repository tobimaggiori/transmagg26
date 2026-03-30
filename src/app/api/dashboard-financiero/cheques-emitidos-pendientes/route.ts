/**
 * API Route: GET /api/dashboard-financiero/cheques-emitidos-pendientes
 * Devuelve los cheques emitidos con estado EMITIDO (no cobrados aún).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [la lista de cheques emitidos con estado EMITIDO ordenados por fecha de pago].
 * Esta función existe para poblar el modal del dashboard de cheques emitidos no cobrados.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ id, beneficiario, nroCheque, monto, fechaPago, cuenta }])
 * GET() === NextResponse.json([{ id: "...", monto: 50000, fechaPago: "2026-04-15T..." }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const cheques = await prisma.chequeEmitido.findMany({
      where: { estado: "EMITIDO" },
      include: {
        cuenta: { select: { nombre: true } },
      },
      orderBy: { fechaPago: "asc" },
    })

    const resultado = cheques.map((c) => ({
      id: c.id,
      beneficiario: c.nroDocBeneficiario,
      nroCheque: c.nroCheque,
      monto: c.monto,
      fechaPago: c.fechaPago.toISOString(),
      cuenta: c.cuenta.nombre,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/cheques-emitidos-pendientes", error)
  }
}
