/**
 * POST /api/cheques-recibidos/[id]/endosar-broker
 * Endosa el cheque a un broker. Estado → ENDOSADO_BROKER. Pendiente de confirmación de depósito.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const schema = z.object({
  cuentaBrokerId: z.string().uuid(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cheque = await prisma.chequeRecibido.findUnique({ where: { id }, select: { id: true, estado: true } })
    if (!cheque) return notFoundResponse("Cheque recibido")
    if (cheque.estado !== "EN_CARTERA") return badRequestResponse("El cheque no está EN_CARTERA")

    const cuentaBroker = await prisma.cuenta.findUnique({
      where: { id: parsed.data.cuentaBrokerId },
      select: { id: true, tipo: true, brokerId: true },
    })
    if (!cuentaBroker) return notFoundResponse("Cuenta broker")
    if (cuentaBroker.tipo !== "BROKER" || !cuentaBroker.brokerId) {
      return badRequestResponse("La cuenta debe ser de tipo BROKER con broker asociado")
    }

    const chequeActualizado = await prisma.chequeRecibido.update({
      where: { id },
      data: {
        estado: "ENDOSADO_BROKER",
        endosadoATipo: "BROKER",
        endosadoABrokerId: cuentaBroker.id,
      },
    })

    return NextResponse.json(chequeActualizado)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/endosar-broker", error)
  }
}
