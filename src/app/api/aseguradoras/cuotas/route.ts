/**
 * API Route: GET /api/aseguradoras/cuotas
 * Devuelve las cuotas de facturas de seguro para un período y tarjeta dados.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const mesAnio = searchParams.get("mesAnio")
  const tarjetaId = searchParams.get("tarjetaId")

  try {
    const where: Record<string, unknown> = {}
    if (mesAnio) where.mesAnio = mesAnio
    if (tarjetaId) where.tarjetaId = tarjetaId

    const cuotas = await prisma.cuotaFacturaSeguro.findMany({
      where,
      include: {
        facturaSeguro: {
          select: {
            id: true,
            nroComprobante: true,
            tipoComprobante: true,
            fecha: true,
            total: true,
            aseguradora: { select: { id: true, razonSocial: true } },
            polizas: { select: { id: true, nroPoliza: true, tipoBien: true } },
          },
        },
        tarjeta: { select: { id: true, nombre: true, banco: true, ultimos4: true } },
        resumenTarjeta: { select: { id: true, periodo: true, pagado: true } },
      },
      orderBy: [{ mesAnio: "asc" }, { nroCuota: "asc" }],
    })

    return NextResponse.json({ cuotas, total: cuotas.length })
  } catch (error) {
    return serverErrorResponse("GET /api/aseguradoras/cuotas", error)
  }
}
