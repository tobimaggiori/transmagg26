import { NextRequest, NextResponse } from "next/server"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"

/**
 * GET /api/fleteros/[id]/adelantos-pendientes
 *
 * Devuelve AdelantoFletero del fletero con saldo > 0 (no DESCONTADO_TOTAL),
 * con los datos del cheque vinculado si corresponde, para listarlos en el
 * formulario de Orden de Pago como "Adelantos a descontar".
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: fleteroId } = await params

  try {
    const fletero = await prisma.fletero.findUnique({
      where: { id: fleteroId },
      select: { id: true },
    })
    if (!fletero) return notFoundResponse("Fletero")

    const adelantos = await prisma.adelantoFletero.findMany({
      where: {
        fleteroId,
        estado: { not: "DESCONTADO_TOTAL" },
        tipo: { in: ["CHEQUE_PROPIO", "CHEQUE_TERCERO", "TRANSFERENCIA", "EFECTIVO"] },
      },
      include: {
        chequeEmitido: { select: { nroCheque: true } },
        chequeRecibido: { select: { nroCheque: true, bancoEmisor: true } },
      },
      orderBy: { fecha: "asc" },
    })

    const resultado = adelantos.map((a) => ({
      id: a.id,
      tipo: a.tipo,
      monto: a.monto,
      montoDescontado: a.montoDescontado,
      fecha: a.fecha.toISOString(),
      descripcion: a.descripcion,
      comprobanteS3Key: a.comprobanteS3Key,
      nroCheque: a.chequeEmitido?.nroCheque ?? a.chequeRecibido?.nroCheque ?? null,
      bancoCheque: a.chequeRecibido?.bancoEmisor ?? null,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/fleteros/[id]/adelantos-pendientes", error)
  }
}
