import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, badRequestResponse, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET /api/ordenes-pago/proximo-nro?fleteroId={uuid}
 *
 * Devuelve el número que tendría la próxima Orden de Pago para un fletero
 * en el año actual, si se confirmara ahora.
 *
 * Respuesta: { nro: number, anio: number, display: string }
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const fleteroId = req.nextUrl.searchParams.get("fleteroId")
  if (!fleteroId) return badRequestResponse("Se requiere fleteroId")

  try {
    const anio = new Date().getFullYear()
    const ultima = await prisma.ordenPago.findFirst({
      where: { fleteroId, anio },
      orderBy: { nro: "desc" },
      select: { nro: true },
    })
    const nro = (ultima?.nro ?? 0) + 1
    return NextResponse.json({ nro, anio, display: `${nro}-${anio}` })
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago/proximo-nro", error)
  }
}
