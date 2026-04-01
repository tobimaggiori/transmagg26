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
import { resolverOperadorId } from "@/lib/session-utils"

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
    chequePropio: z.object({
      cuentaId: z.string().uuid(),
      nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
      tipoDocBeneficiario: z.string().min(1),
      nroDocBeneficiario: z.string().min(1),
      mailBeneficiario: z.string().optional().nullable(),
      fechaEmision: z.string().min(1),
      fechaPago: z.string().min(1),
      clausula: z.string().optional().nullable(),
      descripcion1: z.string().optional().nullable(),
      descripcion2: z.string().optional().nullable(),
    }),
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
  pagos: z.array(pagoFleteroItemSchema),
  fecha: z.string(),
  gastos: z
    .array(
      z.object({
        gastoId: z.string().uuid(),
        montoDescontar: z.number().positive(),
      })
    )
    .optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: liquidacionId } = await params
  let operadorId: string
  try {
    operadorId = await resolverOperadorId(acceso.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = pagoLiqSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  const { pagos, fecha, gastos } = parsed.data

  try {
    const liquidacion = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: {
        id: true,
        fleteroId: true,
        total: true,
        estado: true,
        nroComprobante: true,
        ptoVenta: true,
        fletero: { select: { razonSocial: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
    })

    if (!liquidacion) return notFoundResponse("Liquidación")

    if (!["EMITIDA", "PARCIALMENTE_PAGADA"].includes(liquidacion.estado)) {
      return badRequestResponse("La liquidación no está en estado pagable")
    }

    const totalYaPagado = liquidacion.pagos.reduce((sum, p) => sum + p.monto, 0)
    const saldoPendiente = liquidacion.total - totalYaPagado
    const totalPagoActual = pagos.reduce((sum, p) => sum + p.monto, 0)
    const totalGastosRequest = gastos ? gastos.reduce((s, g) => s + g.montoDescontar, 0) : 0

    if (pagos.length === 0 && totalGastosRequest === 0) {
      return badRequestResponse("Debe ingresar al menos un medio de pago o gasto a descontar")
    }

    // Validate SALDO_A_FAVOR
    const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
    if (pagoSaldoAFavor) {
      const { saldoAFavor } = await calcularSaldoCCFletero(liquidacion.fleteroId)
      if (pagoSaldoAFavor.monto > saldoAFavor) {
        return badRequestResponse("Saldo a favor insuficiente")
      }
    }

    const fechaPago = new Date(fecha)

    // Los gastos descontados cuentan como cobertura del saldo pendiente
    const nuevoEstado =
      totalPagoActual + totalGastosRequest >= saldoPendiente ? "PAGADA" : "PARCIALMENTE_PAGADA"

    const { ordenPagoId, nroOrdenPago } = await prisma.$transaction(async (tx) => {
      // Coleccionar IDs de pagos reales (no el excedente) para la Orden de Pago
      const pagoIdsParaOP: string[] = []

      for (const pago of pagos) {
        if (pago.tipoPago === "TRANSFERENCIA") {
          const nuevoPago = await tx.pagoAFletero.create({
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
          pagoIdsParaOP.push(nuevoPago.id)
          // Registrar movimiento bancario: TRANSFERENCIA_ENVIADA
          await tx.cuenta.findUnique({
            where: { id: pago.cuentaBancariaId },
            select: { tieneImpuestoDebcred: true, alicuotaImpuesto: true },
          })
          const nroLiq =
            liquidacion.ptoVenta != null && liquidacion.nroComprobante != null
              ? `${String(liquidacion.ptoVenta).padStart(4, "0")}-${String(liquidacion.nroComprobante).padStart(8, "0")}`
              : "s/n"
          const descripcionMov = `Pago Liquidación ${nroLiq} — ${liquidacion.fletero.razonSocial}`
          await tx.movimientoSinFactura.create({
            data: {
              cuentaId: pago.cuentaBancariaId,
              tipo: "EGRESO",
              categoria: "TRANSFERENCIA_ENVIADA",
              monto: pago.monto,
              fecha: fechaPago,
              descripcion: descripcionMov,
              referencia: pago.referencia,
              operadorId,
            },
          })
        } else if (pago.tipoPago === "CHEQUE_PROPIO") {
          const ch = pago.chequePropio
          const existing = await tx.chequeEmitido.findFirst({
            where: { nroCheque: ch.nroCheque, cuentaId: ch.cuentaId },
            select: { id: true },
          })
          if (existing) throw new Error(`DUPLICATE_CHEQUE:${ch.nroCheque}`)
          const nuevoCheque = await tx.chequeEmitido.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              cuentaId: ch.cuentaId,
              nroCheque: ch.nroCheque,
              tipoDocBeneficiario: ch.tipoDocBeneficiario,
              nroDocBeneficiario: ch.nroDocBeneficiario,
              mailBeneficiario: ch.mailBeneficiario ?? null,
              monto: pago.monto,
              fechaEmision: new Date(ch.fechaEmision),
              fechaPago: new Date(ch.fechaPago),
              motivoPago: "ORDEN_DE_PAGO",
              clausula: ch.clausula ?? "NO_A_LA_ORDEN",
              descripcion1: ch.descripcion1 ?? null,
              descripcion2: ch.descripcion2 ?? null,
              esElectronico: true,
              estado: "EMITIDO",
              liquidacionId,
              operadorId,
            },
          })
          const nuevoPago = await tx.pagoAFletero.create({
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
          pagoIdsParaOP.push(nuevoPago.id)
        } else if (pago.tipoPago === "CHEQUE_TERCERO") {
          await tx.chequeRecibido.update({
            where: { id: pago.chequeRecibidoId },
            data: {
              estado: "ENDOSADO_FLETERO",
              endosadoATipo: "FLETERO",
              endosadoAFleteroId: liquidacion.fleteroId,
            },
          })
          const nuevoPago = await tx.pagoAFletero.create({
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
          pagoIdsParaOP.push(nuevoPago.id)
        } else if (pago.tipoPago === "EFECTIVO") {
          const nuevoPago = await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "EFECTIVO",
              monto: pago.monto,
              fechaPago,
              operadorId,
            },
          })
          pagoIdsParaOP.push(nuevoPago.id)
        } else if (pago.tipoPago === "SALDO_A_FAVOR") {
          const nuevoPago = await tx.pagoAFletero.create({
            data: {
              fleteroId: liquidacion.fleteroId,
              liquidacionId,
              tipoPago: "SALDO_A_FAVOR",
              monto: pago.monto,
              fechaPago,
              operadorId,
            },
          })
          pagoIdsParaOP.push(nuevoPago.id)
        }
      }

      // ── Procesar descuentos de gastos de fletero ────────────────────────────
      if (gastos && gastos.length > 0) {
        for (const g of gastos) {
          const gasto = await tx.gastoFletero.findUnique({
            where: { id: g.gastoId },
            select: { id: true, montoPagado: true, montoDescontado: true, estado: true, fleteroId: true },
          })
          if (!gasto || gasto.fleteroId !== liquidacion.fleteroId) continue
          if (gasto.estado === "DESCONTADO_TOTAL") continue

          const saldoGasto = gasto.montoPagado - gasto.montoDescontado
          const efectivoDescontar = Math.min(g.montoDescontar, saldoGasto)
          if (efectivoDescontar <= 0) continue

          await tx.gastoDescuento.create({
            data: {
              gastoId: g.gastoId,
              liquidacionId,
              montoDescontado: efectivoDescontar,
              fecha: fechaPago,
            },
          })

          const nuevoMontoDescontado = gasto.montoDescontado + efectivoDescontar
          const nuevoEstadoGasto =
            nuevoMontoDescontado >= gasto.montoPagado - 0.01 ? "DESCONTADO_TOTAL" : "DESCONTADO_PARCIAL"

          await tx.gastoFletero.update({
            where: { id: g.gastoId },
            data: {
              montoDescontado: nuevoMontoDescontado,
              estado: nuevoEstadoGasto,
            },
          })
        }
      }

      await tx.liquidacion.update({
        where: { id: liquidacionId },
        data: { estado: nuevoEstado },
      })

      const excedente = (totalPagoActual + totalGastosRequest) - saldoPendiente
      if (excedente > 0) {
        // El excedente es un pago de saldo a favor que NO va en la Orden de Pago
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

      // ── Crear la Orden de Pago ────────────────────────────────────────────
      const ultimaOP = await tx.ordenPago.findFirst({ orderBy: { nro: "desc" } })
      const nroOP = (ultimaOP?.nro ?? 0) + 1
      const op = await tx.ordenPago.create({
        data: {
          nro: nroOP,
          fecha: fechaPago,
          fleteroId: liquidacion.fleteroId,
          operadorId,
          pagos: { connect: pagoIdsParaOP.map((id) => ({ id })) },
        },
      })

      return { ordenPagoId: op.id, nroOrdenPago: nroOP }
    })

    return NextResponse.json({
      ok: true,
      nuevoEstado,
      saldoRestante: Math.max(0, saldoPendiente - totalPagoActual),
      saldoAFavorGenerado: Math.max(0, totalPagoActual - saldoPendiente),
      ordenPago: { id: ordenPagoId, nro: nroOrdenPago },
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("DUPLICATE_CHEQUE:")) {
      const nro = error.message.split(":")[1]
      return NextResponse.json(
        { error: `El cheque N° ${nro} ya existe para esa cuenta. Verificá el número.` },
        { status: 409 }
      )
    }
    return serverErrorResponse("POST /api/liquidaciones/[id]/pago", error)
  }
}
