import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { sugerirImpuestosMovimientoBancario } from "@/lib/financial"
import {
  badRequestResponse,
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { registrarDepositoChequeEmitidoSchema } from "@/lib/financial-schemas"

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con nroCheque, monto y ajustes tributarios opcionales], devuelve [el cheque marcado como depositado y el movimiento bancario creado].
 * Esta función existe para registrar diariamente el débito real de cheques emitidos cuando se acreditan en la cuenta de destino.
 *
 * Ejemplos:
 * POST(request) === NextResponse.json({ cheque, movimientoBancario }, { status: 201 })
 * POST(request) === NextResponse.json({ error: "Cheque emitido no encontrado" }, { status: 404 })
 * POST(request) === NextResponse.json({ error: "El monto informado no coincide con el cheque emitido" }, { status: 400 })
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

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

    const sugerencia = sugerirImpuestosMovimientoBancario({
      tipo: "CHEQUE_EMITIDO_DEBITADO",
      monto: -parsed.data.monto,
      tieneImpuestoDebcred: cheque.cuenta.tieneImpuestoDebcred,
      alicuotaImpuesto: cheque.cuenta.alicuotaImpuesto,
      esCuentaComitenteBroker: cheque.cuenta.esCuentaComitenteBroker,
    })

    const resultado = await prisma.$transaction(async (tx) => {
      const chequeActualizado = await tx.chequeEmitido.update({
        where: { id: cheque.id },
        data: {
          estado: "DEPOSITADO",
          fechaDeposito: new Date(),
        },
      })

      const movimientoBancario = await tx.movimientoBancario.create({
        data: {
          cuentaId: cheque.cuentaId,
          tipo: "CHEQUE_EMITIDO_DEBITADO",
          monto: -parsed.data.monto,
          fecha: new Date(),
          descripcion: parsed.data.descripcion,
          referencia: cheque.nroCheque,
          impuestoDebitoAplica: parsed.data.impuestoDebitoAplica ?? sugerencia.impuestoDebitoAplica,
          impuestoDebitoMonto: parsed.data.impuestoDebitoMonto ?? sugerencia.impuestoDebitoMonto,
          impuestoCreditoAplica: false,
          impuestoCreditoMonto: 0,
          otrosDescuentosDescripcion: parsed.data.otrosDescuentosDescripcion,
          otrosDescuentosMonto: parsed.data.otrosDescuentosMonto,
          operadorId: access.session.user.id,
        },
      })

      return { cheque: chequeActualizado, movimientoBancario }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-emitidos/registrar-deposito", error)
  }
}
