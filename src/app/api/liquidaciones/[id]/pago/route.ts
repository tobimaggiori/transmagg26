import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  requireFinancialAccess,
  badRequestResponse,
  notFoundResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { calcularSaldoCCFletero } from "@/lib/cuenta-corriente"

const pagoFleteroItemSchema = z.discriminatedUnion("tipoPago", [
  z.object({
    tipoPago: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaBancariaId: z.string().uuid(),
    referencia: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive(),
    cuentaId: z.string().uuid(),
    nroCheque: z.string().optional(),
    nroDocBeneficiario: z.string().min(1),
    tipoDocBeneficiario: z.string().min(1),
  }),
  z.object({
    tipoPago: z.literal("CHEQUE_TERCERO"),
    monto: z.number().positive(),
    chequeRecibidoId: z.string().uuid(),
  }),
  z.object({
    tipoPago: z.literal("EFECTIVO"),
    monto: z.number().positive(),
  }),
  z.object({
    tipoPago: z.literal("SALDO_A_FAVOR"),
    monto: z.number().positive(),
  }),
])

const pagoLiqSchema = z.object({
  pagos: z.array(pagoFleteroItemSchema).min(1),
  fecha: z.string(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: liquidacionId } = await params
  const operadorId = acceso.session.user.id

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = pagoLiqSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  const { pagos, fecha } = parsed.data

  try {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: {
        id: true,
        fleteroId: true,
        total: true,
        estado: true,
        pagos: { select: { monto: true } },
      },
    })

    if (!liquidacion) return notFoundResponse("Liquidación")

    if (!["EMITIDA", "PARCIALMENTE_PAGADA"].includes(liquidacion.estado)) {
      return badRequestResponse("La liquidación no está en estado pagable")
    }

    const totalYaPagado = liquidacion.pagos.reduce((sum, p) => sum + p.monto, 0)
    const saldoPendiente = liquidacion.total - totalYaPagado
    const totalPagoActual = pagos.reduce((sum, p) => sum + p.monto, 0)

    // Validate SALDO_A_FAVOR
    const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
    if (pagoSaldoAFavor) {
      const { saldoAFavor } = await calcularSaldoCCFletero(liquidacion.fleteroId)
      if (pagoSaldoAFavor.monto > saldoAFavor) {
        return badRequestResponse("Saldo a favor insuficiente")
      }
    }

    const fechaPago = new Date(fecha)

    const nuevoEstado =
      totalPagoActual >= saldoPendiente ? "PAGADA" : "PARCIALMENTE_PAGADA"

    await prisma.$transaction(async (tx) => {
      for (const pago of pagos) {
        if (pago.tipoPago === "TRANSFERENCIA") {
          await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "TRANSFERENCIA",
              monto: pago.monto,
              referencia: pago.referencia,
              fechaPago,
              cuentaId: pago.cuentaBancariaId,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "CHEQUE_PROPIO") {
          const nuevoCheque = await tx.chequeEmitido.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              cuentaId: pago.cuentaId,
              nroCheque: pago.nroCheque,
              tipoDocBeneficiario: pago.tipoDocBeneficiario,
              nroDocBeneficiario: pago.nroDocBeneficiario,
              monto: pago.monto,
              fechaEmision: fechaPago,
              fechaPago: fechaPago,
              motivoPago: "FACTURA",
              clausula: "NO_A_LA_ORDEN",
              estado: "EMITIDO",
              liquidacionId,
              operadorId,
            },
          })
          await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "CHEQUE_PROPIO",
              monto: pago.monto,
              fechaPago,
              chequeEmitidoId: nuevoCheque.id,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "CHEQUE_TERCERO") {
          await tx.chequeRecibido.update({
            where: { id: pago.chequeRecibidoId },
            data: {
              estado: "ENDOSADO_FLETERO",
              endosadoATipo: "FLETERO",
              endosadoAFleteroId: liquidacion.fleteroId,
            },
          })
          await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "CHEQUE_TERCERO",
              monto: pago.monto,
              fechaPago,
              chequeRecibidoId: pago.chequeRecibidoId,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "EFECTIVO") {
          await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "EFECTIVO",
              monto: pago.monto,
              fechaPago,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "SALDO_A_FAVOR") {
          await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "SALDO_A_FAVOR",
              monto: pago.monto,
              fechaPago,
              operadorId,
            },
          })
        }
      }

      await tx.liquidacion.update({
        where: { id: liquidacionId },
        data: { estado: nuevoEstado },
      })

      const excedente = totalPagoActual - saldoPendiente
      if (excedente > 0) {
        await tx.pagoAFletero.create({
          data: {
            fleteroId: liquidacion.fleteroId,
            liquidacionId: null,
            tipoPago: "SALDO_A_FAVOR",
            monto: -excedente,
            fechaPago,
            operadorId,
          },
        })
      }
    })

    return NextResponse.json({
      ok: true,
      nuevoEstado,
      saldoRestante: Math.max(0, saldoPendiente - totalPagoActual),
      saldoAFavorGenerado: Math.max(0, totalPagoActual - saldoPendiente),
    })
  } catch (error) {
    return serverErrorResponse("POST /api/liquidaciones/[id]/pago", error)
  }
}
