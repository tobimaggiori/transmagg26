/**
 * pago-fletero-commands.ts
 *
 * Logica de negocio transaccional para registro de pagos a fleteros
 * sobre una liquidacion individual.
 * Valida precondiciones, crea pagos con multiples medios, procesa
 * descuentos de gastos y genera la Orden de Pago.
 */

import { prisma } from "@/lib/prisma"
import { calcularSaldoCCFletero } from "@/lib/cuenta-corriente"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"
import { subirPDF, storageConfigurado } from "@/lib/storage"
import { sumarImportes, restarImportes, maxMonetario, importesIguales } from "@/lib/money"

// ── Tipos ────────────────────────────────────────────────────────────────────

type PagoFleteroItem =
  | {
      tipoPago: "TRANSFERENCIA"
      monto: number
      cuentaBancariaId: string
      referencia?: string
    }
  | {
      tipoPago: "CHEQUE_PROPIO"
      monto: number
      chequePropio: {
        cuentaId: string
        nroCheque: string
        mailBeneficiario?: string | null
        fechaEmision: string
        fechaPago: string
        clausula?: string | null
        descripcion1?: string | null
        descripcion2?: string | null
      }
    }
  | {
      tipoPago: "CHEQUE_TERCERO"
      monto: number
      chequeRecibidoId: string
    }
  | {
      tipoPago: "EFECTIVO"
      monto: number
    }
  | {
      tipoPago: "SALDO_A_FAVOR"
      monto: number
    }

type GastoDescontar = {
  gastoId: string
  montoDescontar: number
}

export type DatosRegistrarPagoFletero = {
  liquidacionId: string
  pagos: PagoFleteroItem[]
  fecha: string
  gastos?: GastoDescontar[]
}

type ResultadoPagoFletero =
  | {
      ok: true
      result: {
        nuevoEstado: string
        saldoRestante: number
        saldoAFavorGenerado: number
        ordenPago: { id: string; nro: number }
      }
    }
  | { ok: false; status: number; error: string }

// ── Comando principal ────────────────────────────────────────────────────────

/**
 * ejecutarRegistrarPagoFletero: DatosRegistrarPagoFletero string -> Promise<ResultadoPagoFletero>
 *
 * Dado [los datos validados del pago y el operadorId],
 * devuelve [el resultado del pago o un error con status HTTP].
 *
 * Valida:
 * - Liquidacion existe y esta en estado pagable
 * - Al menos un medio de pago o gasto a descontar
 * - Saldo a favor suficiente si se usa SALDO_A_FAVOR
 *
 * Ejecuta en transaccion:
 * - Crea pagos por cada medio de pago
 * - Crea instrumentos financieros (cheques, movimientos bancarios)
 * - Procesa descuentos de gastos
 * - Actualiza estado de la liquidacion
 * - Crea la Orden de Pago
 * - Genera PDF y sube a R2 (no fatal)
 */
export async function ejecutarRegistrarPagoFletero(
  data: DatosRegistrarPagoFletero,
  operadorId: string
): Promise<ResultadoPagoFletero> {
  const { liquidacionId, pagos, fecha, gastos } = data

  const liquidacion = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: {
      id: true,
      fleteroId: true,
      total: true,
      estado: true,
      nroComprobante: true,
      ptoVenta: true,
      fletero: { select: { razonSocial: true, cuit: true } },
      pagos: { where: { anulado: false }, select: { monto: true } },
    },
  })

  if (!liquidacion) return { ok: false, status: 404, error: "Liquidacion no encontrada" }

  if (!["EMITIDA", "PARCIALMENTE_PAGADA"].includes(liquidacion.estado)) {
    return { ok: false, status: 400, error: "La liquidacion no esta en estado pagable" }
  }

  const totalYaPagado = sumarImportes(liquidacion.pagos.map((p) => p.monto))
  const saldoPendiente = restarImportes(liquidacion.total, totalYaPagado)
  const totalPagoActual = sumarImportes(pagos.map((p) => p.monto))
  const totalGastosRequest = gastos ? sumarImportes(gastos.map((g) => g.montoDescontar)) : 0

  if (pagos.length === 0 && totalGastosRequest === 0) {
    return { ok: false, status: 400, error: "Debe ingresar al menos un medio de pago o gasto a descontar" }
  }

  // Validate SALDO_A_FAVOR
  const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
  if (pagoSaldoAFavor) {
    const { saldoAFavor } = await calcularSaldoCCFletero(liquidacion.fleteroId)
    if (pagoSaldoAFavor.monto > saldoAFavor) {
      return { ok: false, status: 400, error: "Saldo a favor insuficiente" }
    }
  }

  const fechaPago = new Date(fecha)

  // Los gastos descontados cuentan como cobertura del saldo pendiente
  const cobertura = sumarImportes([totalPagoActual, totalGastosRequest])
  const nuevoEstado =
    cobertura >= saldoPendiente ? "PAGADA" : "PARCIALMENTE_PAGADA"

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
        const descripcionMov = `Pago Liquidacion ${nroLiq} — ${liquidacion.fletero.razonSocial}`
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
            tipoDocBeneficiario: "CUIT",
            nroDocBeneficiario: liquidacion.fletero.cuit.replace(/\D/g, ""),
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

        const saldoGasto = restarImportes(gasto.montoPagado, gasto.montoDescontado)
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

        const nuevoMontoDescontado = sumarImportes([gasto.montoDescontado, efectivoDescontar])
        const nuevoEstadoGasto =
          importesIguales(nuevoMontoDescontado, gasto.montoPagado) || nuevoMontoDescontado >= gasto.montoPagado
            ? "DESCONTADO_TOTAL"
            : "DESCONTADO_PARCIAL"

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

    const excedente = restarImportes(cobertura, saldoPendiente)
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

  // ── Generar HTML y subir a R2 (no fatal si falla) ────────────────────────
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

  return {
    ok: true,
    result: {
      nuevoEstado,
      saldoRestante: maxMonetario(0, restarImportes(saldoPendiente, totalPagoActual)),
      saldoAFavorGenerado: maxMonetario(0, restarImportes(totalPagoActual, saldoPendiente)),
      ordenPago: { id: ordenPagoId, nro: nroOrdenPago },
    },
  }
}
