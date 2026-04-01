import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET /api/ordenes-pago
 *
 * Devuelve las Órdenes de Pago emitidas, ordenadas por número descendente.
 * Soporta filtros opcionales: ?fleteroId=, ?nro=, ?desde=, ?hasta=
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(req.url)
  const fleteroId = searchParams.get("fleteroId") || undefined
  const nroStr = searchParams.get("nro")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  try {
    const ordenes = await prisma.ordenPago.findMany({
      where: {
        ...(fleteroId ? { fleteroId } : {}),
        ...(nroStr ? { nro: parseInt(nroStr) } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
              },
            }
          : {}),
      },
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { nro: "desc" },
      take: 200,
    })

    const resultado = ordenes.map((op) => ({
      id: op.id,
      nro: op.nro,
      fecha: op.fecha.toISOString(),
      fletero: op.fletero,
      total: op.pagos.reduce((s, p) => s + p.monto, 0),
      pdfS3Key: op.pdfS3Key,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago", error)
  }
}
