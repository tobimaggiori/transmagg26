/**
 * API Route: GET /api/aseguradoras/facturas/[id]
 * Devuelve una factura de seguro con todas sus relaciones.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  try {
    const factura = await prisma.facturaSeguro.findUnique({
      where: { id },
      include: {
        aseguradora: { select: { id: true, razonSocial: true, cuit: true } },
        cuenta: { select: { id: true, nombre: true } },
        tarjeta: { select: { id: true, nombre: true, banco: true, ultimos4: true } },
        operador: { select: { nombre: true, apellido: true } },
        polizas: true,
        cuotas: {
          include: {
            resumenTarjeta: { select: { id: true, periodo: true, pagado: true } },
          },
          orderBy: { nroCuota: "asc" },
        },
        asientosIva: true,
        items: { orderBy: { orden: "asc" } },
        percepciones: true,
      },
    })

    if (!factura) {
      return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
    }

    return NextResponse.json({ factura })
  } catch (error) {
    return serverErrorResponse("GET /api/aseguradoras/facturas/[id]", error)
  }
}
