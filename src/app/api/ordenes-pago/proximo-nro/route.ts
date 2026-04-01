import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET /api/ordenes-pago/proximo-nro
 *
 * Devuelve el número que tendría la próxima Orden de Pago si se confirmara ahora.
 * Se usa para mostrar el número provisional en el preview antes de guardar.
 *
 * Respuesta: { nro: number }
 */
export async function GET(): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  try {
    const ultima = await prisma.ordenPago.findFirst({ orderBy: { nro: "desc" }, select: { nro: true } })
    const nro = (ultima?.nro ?? 0) + 1
    return NextResponse.json({ nro })
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago/proximo-nro", error)
  }
}
