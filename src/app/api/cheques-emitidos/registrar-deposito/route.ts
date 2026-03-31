import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { registrarDepositoChequeEmitidoSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nroCheque, monto y descripcion], devuelve [el cheque marcado como depositado y el movimiento registrado].
 * Esta función existe para registrar diariamente el débito real de cheques emitidos cuando se acreditan en la cuenta de destino.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ cheque, movimiento }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "El monto informado no coincide con el cheque emitido" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = registrarDepositoChequeEmitidoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const cheque = await prisma.chequeEmitido.findFirst({
      where: { nroCheque: parsed.data.nroCheque },
      include: { cuenta: true },
    })

    if (!cheque) {
      return NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
    }

    if (Math.abs(cheque.monto - parsed.data.monto) > 0.009) {
      return badRequestResponse("El monto informado no coincide con el cheque emitido")
    }

    const resultado = await prisma.$transaction(async (tx) => {
      const chequeActualizado = await tx.chequeEmitido.update({
        where: { id: cheque.id },
        data: {
          estado: "DEPOSITADO",
          fechaDeposito: new Date(),
        },
      })

      const movimiento = await tx.movimientoSinFactura.create({
        data: {
          cuentaId: cheque.cuentaId,
          tipo: "EGRESO",
          categoria: "CHEQUE_EMITIDO_DEBITADO",
          monto: parsed.data.monto,
          fecha: new Date(),
          descripcion: parsed.data.descripcion,
          referencia: cheque.nroCheque,
          operadorId,
        },
      })

      return { cheque: chequeActualizado, movimiento }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-emitidos/registrar-deposito", error)
  }
}
