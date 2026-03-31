import { NextRequest, NextResponse } from "next/server"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { calcularSaldoCCEmpresa } from "@/lib/cuenta-corriente"
import { prisma } from "@/lib/prisma"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: empresaId } = await params

  try {
    const empresa = await prisma.empresa.findUnique({
      where: { id: empresaId },
      select: { id: true },
    })
    if (!empresa) return notFoundResponse("Empresa")

    const saldo = await calcularSaldoCCEmpresa(empresaId)
    return NextResponse.json(saldo)
  } catch (error) {
    return serverErrorResponse("GET /api/empresas/[id]/saldo-cc", error)
  }
}
