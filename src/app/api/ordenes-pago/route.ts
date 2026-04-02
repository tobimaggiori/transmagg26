import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, badRequestResponse, serverErrorResponse, invalidDataResponse } from "@/lib/financial-api"
import { calcularSaldoCCFletero } from "@/lib/cuenta-corriente"
import { resolverOperadorId } from "@/lib/session-utils"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"
import { subirPDF, storageConfigurado } from "@/lib/storage"

/**
 * GET /api/ordenes-pago
 *
 * Devuelve las Órdenes de Pago emitidas, ordenadas por número descendente.
 * Soporta filtros opcionales: ?fleteroId=, ?nro=, ?desde=, ?hasta=
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(req.url)
  const fleteroId = searchParams.get("fleteroId") || undefined
  const nroStr = searchParams.get("nro")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  try {
    const ordenes = await prisma.ordenPago.findMany({
      where: {
        ...(fleteroId ? { fleteroId } : {}),
        ...(nroStr ? { nro: parseInt(nroStr) } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
              },
            }
          : {}),
      },
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { nro: "desc" },
      take: 200,
    })

    const resultado = ordenes.map((op) => ({
      id: op.id,
      nro: op.nro,
      fecha: op.fecha.toISOString(),
      fletero: op.fletero,
      total: op.pagos.reduce((s, p) => s + p.monto, 0),
      pdfS3Key: op.pdfS3Key,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago", error)
  }
}

// ─── POST /api/ordenes-pago ───────────────────────────────────────────────────

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
      nroCheque: z.string().min(1),
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

const multiLPPagoSchema = z.object({
  fleteroId: z.string().uuid(),
  liquidacionIds: z.array(z.string().uuid()).min(1),
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

/**
 * POST /api/ordenes-pago
 *
 * Crea una Orden de Pago que puede cubrir uno o varios LPs del mismo fletero.
 * Los pagos se distribuyen entre los LPs según su saldo pendiente, aplicando
 * primero al LP más antiguo (por grabadaEn).
 *
 * Body: { fleteroId, liquidacionIds, pagos, gastos?, fecha }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

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

  const parsed = multiLPPagoSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  const { fleteroId, liquidacionIds, pagos, fecha, gastos } = parsed.data

  if (pagos.length === 0 && (!gastos || gastos.length === 0)) {
    return badRequestResponse("Debe ingresar al menos un medio de pago o gasto a descontar")
  }

  try {
    // ── Cargar fletero ──────────────────────────────────────────────────────
    const fleteroDb = await prisma.fletero.findUnique({
      where: { id: fleteroId },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!fleteroDb) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    // ── Cargar y validar liquidaciones ──────────────────────────────────────
    const liquidaciones = await prisma.liquidacion.findMany({
      where: {
        id: { in: liquidacionIds },
        fleteroId,
        estado: { in: ["EMITIDA", "PARCIALMENTE_PAGADA"] },
      },
      select: {
        id: true,
        total: true,
        estado: true,
        nroComprobante: true,
        ptoVenta: true,
        grabadaEn: true,
        fletero: { select: { razonSocial: true, cuit: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
    })

    if (liquidaciones.length !== liquidacionIds.length) {
      return badRequestResponse(
        "Una o más liquidaciones no son válidas o no están en estado pagable para este fletero"
      )
    }

    // Calcular saldo pendiente por LP
    const liqConSaldo = liquidaciones.map((liq) => {
      const totalPagado = liq.pagos.reduce((s, p) => s + p.monto, 0)
      return { ...liq, totalPagado, saldoPendiente: Math.max(0, liq.total - totalPagado) }
    })

    // Ordenar de más antiguo a más nuevo (distribución: oldest first)
    const lpsOrdenados = [...liqConSaldo].sort(
      (a, b) => a.grabadaEn.getTime() - b.grabadaEn.getTime()
    )

    const totalSaldoPendiente = lpsOrdenados.reduce((s, lp) => s + lp.saldoPendiente, 0)
    const totalMediosPago = pagos.reduce((s, p) => s + p.monto, 0)
    const totalGastosRequest = gastos ? gastos.reduce((s, g) => s + g.montoDescontar, 0) : 0

    // ── Validar que el pago cubre exactamente el saldo total ────────────────
    if (Math.abs(totalMediosPago + totalGastosRequest - totalSaldoPendiente) > 0.01) {
      return badRequestResponse(
        `El total de los medios de pago debe cubrir exactamente el saldo pendiente (${totalSaldoPendiente.toFixed(2)}). Diferencia: ${(totalMediosPago + totalGastosRequest - totalSaldoPendiente).toFixed(2)}`
      )
    }

    // ── Validar SALDO_A_FAVOR ───────────────────────────────────────────────
    const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
    if (pagoSaldoAFavor) {
      const { saldoAFavor } = await calcularSaldoCCFletero(fleteroId)
      if (pagoSaldoAFavor.monto > saldoAFavor) {
        return badRequestResponse("Saldo a favor insuficiente")
      }
    }

    const fechaPago = new Date(fecha)

    // ── Transacción ─────────────────────────────────────────────────────────
    const { ordenPagoId, nroOrdenPago } = await prisma.$transaction(async (tx) => {
      const pagoIdsParaOP: string[] = []

      // Saldo restante por LP para la distribución
      const saldosRestantes = new Map<string, number>(
        lpsOrdenados.map((lp) => [lp.id, lp.saldoPendiente])
      )

      let lpIndex = 0

      // ── Distribuir medios de pago entre LPs ──────────────────────────────
      for (const pago of pagos) {
        let montoRestantePago = pago.monto

        // Crear instrumento financiero ONCE por ítem de pago
        let chequeEmitidoId: string | undefined

        if (pago.tipoPago === "CHEQUE_PROPIO") {
          const ch = pago.chequePropio
          const existing = await tx.chequeEmitido.findFirst({
            where: { nroCheque: ch.nroCheque, cuentaId: ch.cuentaId },
            select: { id: true },
          })
          if (existing) throw new Error(`DUPLICATE_CHEQUE:${ch.nroCheque}`)
          const nuevoCheque = await tx.chequeEmitido.create({
            data: {
              fleteroId,
              cuentaId: ch.cuentaId,
              nroCheque: ch.nroCheque,
              tipoDocBeneficiario: "CUIT",
              nroDocBeneficiario: fleteroDb.cuit.replace(/\D/g, ""),
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
              liquidacionId: lpsOrdenados[lpIndex]?.id ?? lpsOrdenados[0].id,
              operadorId,
            },
          })
          chequeEmitidoId = nuevoCheque.id
        }

        if (pago.tipoPago === "CHEQUE_TERCERO") {
          await tx.chequeRecibido.update({
            where: { id: pago.chequeRecibidoId },
            data: {
              estado: "ENDOSADO_FLETERO",
              endosadoATipo: "FLETERO",
              endosadoAFleteroId: fleteroId,
            },
          })
        }

        if (pago.tipoPago === "TRANSFERENCIA") {
          const lpLabels = lpsOrdenados
            .map((lp) => {
              if (!lp.ptoVenta || !lp.nroComprobante) return "s/n"
              return `${String(lp.ptoVenta).padStart(4, "0")}-${String(lp.nroComprobante).padStart(8, "0")}`
            })
            .join(", ")
          const descripcionMov =
            lpsOrdenados.length === 1
              ? `Pago LP ${lpLabels} — ${fleteroDb.razonSocial}`
              : `Pago LPs ${lpLabels} — ${fleteroDb.razonSocial}`
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
        }

        // ── Distribuir este ítem entre los LPs con saldo restante ──────────
        while (montoRestantePago > 0.009 && lpIndex < lpsOrdenados.length) {
          const lp = lpsOrdenados[lpIndex]
          const saldoLP = saldosRestantes.get(lp.id)!
          const montoParaEsteLP = Math.min(montoRestantePago, saldoLP)

          if (montoParaEsteLP > 0) {
            const nuevoPago = await tx.pagoAFletero.create({
              data: {
                fleteroId,
                liquidacionId: lp.id,
                tipoPago: pago.tipoPago,
                monto: montoParaEsteLP,
                fechaPago,
                cuentaId:
                  pago.tipoPago === "TRANSFERENCIA"
                    ? pago.cuentaBancariaId
                    : pago.tipoPago === "CHEQUE_PROPIO"
                    ? pago.chequePropio.cuentaId
                    : undefined,
                chequeEmitidoId: pago.tipoPago === "CHEQUE_PROPIO" ? chequeEmitidoId : undefined,
                chequeRecibidoId:
                  pago.tipoPago === "CHEQUE_TERCERO" ? pago.chequeRecibidoId : undefined,
                referencia: pago.tipoPago === "TRANSFERENCIA" ? pago.referencia : undefined,
                operadorId,
              },
            })
            pagoIdsParaOP.push(nuevoPago.id)

            saldosRestantes.set(lp.id, saldoLP - montoParaEsteLP)
            montoRestantePago -= montoParaEsteLP
          }

          if ((saldosRestantes.get(lp.id) ?? 0) < 0.01) lpIndex++
        }

      }

      // ── Gastos descontados → se vinculan al primer LP (más antiguo) ───────
      const primerLpId = lpsOrdenados[0].id
      if (gastos && gastos.length > 0) {
        for (const g of gastos) {
          const gasto = await tx.gastoFletero.findUnique({
            where: { id: g.gastoId },
            select: { id: true, montoPagado: true, montoDescontado: true, estado: true, fleteroId: true },
          })
          if (!gasto || gasto.fleteroId !== fleteroId) continue
          if (gasto.estado === "DESCONTADO_TOTAL") continue

          const saldoGasto = gasto.montoPagado - gasto.montoDescontado
          const efectivoDescontar = Math.min(g.montoDescontar, saldoGasto)
          if (efectivoDescontar <= 0) continue

          await tx.gastoDescuento.create({
            data: {
              gastoId: g.gastoId,
              liquidacionId: primerLpId,
              montoDescontado: efectivoDescontar,
              fecha: fechaPago,
            },
          })

          const nuevoMontoDescontado = gasto.montoDescontado + efectivoDescontar
          const nuevoEstadoGasto =
            nuevoMontoDescontado >= gasto.montoPagado - 0.01
              ? "DESCONTADO_TOTAL"
              : "DESCONTADO_PARCIAL"

          await tx.gastoFletero.update({
            where: { id: g.gastoId },
            data: { montoDescontado: nuevoMontoDescontado, estado: nuevoEstadoGasto },
          })
        }
      }

      // ── Actualizar estado de cada LP a PAGADA ─────────────────────────────
      for (const lp of lpsOrdenados) {
        await tx.liquidacion.update({
          where: { id: lp.id },
          data: { estado: "PAGADA" },
        })
      }

      // ── Crear la Orden de Pago ──────────────────────────────────────────
      const ultimaOP = await tx.ordenPago.findFirst({ orderBy: { nro: "desc" } })
      const nroOP = (ultimaOP?.nro ?? 0) + 1
      const op = await tx.ordenPago.create({
        data: {
          nro: nroOP,
          fecha: fechaPago,
          fleteroId,
          operadorId,
          pagos: { connect: pagoIdsParaOP.map((id) => ({ id })) },
        },
      })

      return { ordenPagoId: op.id, nroOrdenPago: nroOP }
    })

    // ── Generar HTML y subir a R2 (no fatal si falla) ─────────────────────
    if (storageConfigurado()) {
      try {
        const html = await generarHTMLOrdenPago(ordenPagoId)
        const buffer = Buffer.from(html, "utf-8")
        const key = await subirPDF(buffer, "comprobantes-pago-fletero", `OP-${nroOrdenPago}.html`)
        await prisma.ordenPago.update({ where: { id: ordenPagoId }, data: { pdfS3Key: key } })
      } catch {
        // No bloquear la respuesta si el storage falla
      }
    }

    return NextResponse.json({
      ok: true,
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
    return serverErrorResponse("POST /api/ordenes-pago", error)
  }
}
