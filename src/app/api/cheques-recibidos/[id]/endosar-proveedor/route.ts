/**
 * POST /api/cheques-recibidos/[id]/endosar-proveedor
 * Endosa el cheque a un proveedor. Estado → ENDOSADO_PROVEEDOR.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

const schema = z.object({
  proveedorId: z.string().uuid(),
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

    const proveedor = await prisma.proveedor.findUnique({ where: { id: parsed.data.proveedorId }, select: { id: true } })
    if (!proveedor) return notFoundResponse("Proveedor")

    const chequeActualizado = await prisma.chequeRecibido.update({
      where: { id },
      data: {
        estado: "ENDOSADO_PROVEEDOR",
        endosadoATipo: "PROVEEDOR",
        endosadoAProveedorId: parsed.data.proveedorId,
      },
    })

    return NextResponse.json(chequeActualizado)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/endosar-proveedor", error)
  }
}
