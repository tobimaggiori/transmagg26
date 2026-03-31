import { NextRequest, NextResponse } from "next/server"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { calcularSaldoCCFletero } from "@/lib/cuenta-corriente"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const saldo = await calcularSaldoCCFletero(fleteroId)
    return NextResponse.json(saldo)
  } catch (error) {
    return serverErrorResponse("GET /api/fleteros/[id]/saldo-cc", error)
  }
}
