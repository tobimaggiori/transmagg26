/**
 * POST /api/cheques-recibidos/[id]/endosar-fletero
 * Endosa el cheque a un fletero. Estado → ENDOSADO_FLETERO.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

const schema = z.object({
  fleteroId: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cheque = await prisma.chequeRecibido.findUnique({ where: { id }, select: { id: true, estado: true } })
    if (!cheque) return notFoundResponse("Cheque recibido")
    if (cheque.estado !== "EN_CARTERA") return badRequestResponse("El cheque no está EN_CARTERA")

    const fletero = await prisma.fletero.findUnique({ where: { id: parsed.data.fleteroId }, select: { id: true } })
    if (!fletero) return notFoundResponse("Fletero")

    const chequeActualizado = await prisma.chequeRecibido.update({
      where: { id },
      data: {
        estado: "ENDOSADO_FLETERO",
        endosadoATipo: "FLETERO",
        endosadoAFleteroId: parsed.data.fleteroId,
      },
    })

    return NextResponse.json(chequeActualizado)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/endosar-fletero", error)
  }
}
