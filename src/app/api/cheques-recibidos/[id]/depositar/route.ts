/**
 * POST /api/cheques-recibidos/[id]/depositar
 * Marca el cheque como DEPOSITADO y crea un MovimientoSinFactura INGRESO en la cuenta.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { badRequestResponse, invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

const schema = z.object({
  cuentaId: z.string().uuid(),
  fechaDeposito: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
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
    if (cheque.estado !== "EN_CARTERA") return badRequestResponse("El cheque no está EN_CARTERA")

    const cuenta = await prisma.cuenta.findUnique({ where: { id: parsed.data.cuentaId }, select: { id: true, nombre: true } })
    if (!cuenta) return notFoundResponse("Cuenta")

    const fechaDeposito = new Date(parsed.data.fechaDeposito)

    const resultado = await prisma.$transaction(async (tx) => {
      const chequeActualizado = await tx.chequeRecibido.update({
        where: { id },
        data: {
          estado: "DEPOSITADO",
          cuentaDepositoId: parsed.data.cuentaId,
          fechaAcreditacion: fechaDeposito,
        },
      })

      const movimiento = await registrarMovimiento(tx, {
        cuentaId: parsed.data.cuentaId,
        tipo: "INGRESO",
        categoria: "CHEQUE_DEPOSITADO",
        monto: cheque.monto,
        fecha: fechaDeposito,
        descripcion: `Depósito cheque ${cheque.nroCheque}${cheque.empresa ? ` — ${cheque.empresa.razonSocial}` : ""}`,
        chequeRecibidoId: id,
        operadorCreacionId: operadorId,
      })

      return { cheque: chequeActualizado, movimiento }
    })

    return NextResponse.json(resultado, { status: 200 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/depositar", error)
  }
}
