/**
 * POST /api/cheques-recibidos/[id]/confirmar-deposito-broker
 * Confirma el depósito de un cheque endosado a broker.
 * Registra fechaDepositoBroker y crea MovimientoSinFactura INGRESO en la cuenta del broker.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const schema = z.object({
  fechaDepositoBroker: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cheque = await prisma.chequeRecibido.findUnique({
      where: { id },
      include: { empresa: { select: { razonSocial: true } } },
    })
    if (!cheque) return notFoundResponse("Cheque recibido")
    if (cheque.estado !== "ENDOSADO_BROKER") return badRequestResponse("El cheque no está endosado a un broker")
    if (!cheque.endosadoABrokerId) return badRequestResponse("El cheque no tiene broker asignado")
    if (cheque.fechaDepositoBroker) return badRequestResponse("El depósito ya fue confirmado")

    const fechaDeposito = new Date(parsed.data.fechaDepositoBroker)

    const resultado = await prisma.$transaction(async (tx) => {
      const chequeActualizado = await tx.chequeRecibido.update({
        where: { id },
        data: { fechaDepositoBroker: fechaDeposito },
      })

      const movimiento = await tx.movimientoSinFactura.create({
        data: {
          cuentaId: cheque.endosadoABrokerId!,
          tipo: "INGRESO",
          categoria: "CHEQUE_DEPOSITADO",
          monto: cheque.monto,
          fecha: fechaDeposito,
          descripcion: `Depósito cheque endosado ${cheque.nroCheque}${cheque.empresa ? ` — ${cheque.empresa.razonSocial}` : ""}`,
          referencia: cheque.nroCheque,
          operadorId,
        },
      })

      return { cheque: chequeActualizado, movimiento }
    })

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/confirmar-deposito-broker", error)
  }
}
