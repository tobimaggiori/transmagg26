/**
 * orden-pago-commands.ts
 *
 * Logica de negocio transaccional para creacion de Ordenes de Pago.
 * Valida precondiciones, distribuye pagos entre liquidaciones (oldest-first)
 * y ejecuta la transaccion que crea pagos, instrumentos financieros,
 * gastos descontados y la Orden de Pago.
 */

import { prisma } from "@/lib/prisma"
import { calcularSaldoCCFletero } from "@/lib/cuenta-corriente"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"
import { subirPDF, storageConfigurado } from "@/lib/storage"
import { sumarImportes, restarImportes, maxMonetario, importesIguales, m } from "@/lib/money"

// ── Tipos ────────────────────────────────────────────────────────────────────

type PagoFleteroItem =
  | {
      tipoPago: "TRANSFERENCIA"
      monto: number
      cuentaBancariaId: string
      referencia?: string
      comprobanteS3Key: string
    }
  | {
      tipoPago: "CHEQUE_PROPIO"
      monto: number
      comprobanteS3Key: string
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
      comprobanteS3Key: string
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

type NCDescontar = {
  ncId: string
  montoDescontar: number
}

export type DatosCrearOrdenPago = {
  fleteroId: string
  liquidacionIds: string[]
  pagos: PagoFleteroItem[]
  fecha: string
  gastos?: GastoDescontar[]
  ncDescuentos?: NCDescontar[]
}

type ResultadoOrdenPago =
  | { ok: true; result: { ordenPago: { id: string; nro: number; anio: number; display: string } } }
  | { ok: false; status: number; error: string }

// ── Comando principal ────────────────────────────────────────────────────────

/**
 * ejecutarCrearOrdenPago: DatosCrearOrdenPago string -> Promise<ResultadoOrdenPago>
 *
 * Dado [los datos validados de la orden de pago y el operadorId],
 * devuelve [la orden de pago creada o un error con status HTTP].
 *
 * Valida:
 * - Fletero existe
 * - Liquidaciones validas y en estado pagable
 * - Total de pagos + gastos cubre exactamente el saldo pendiente
 * - Saldo a favor suficiente si se usa SALDO_A_FAVOR
 *
 * Ejecuta en transaccion:
 * - Distribuye pagos entre LPs (oldest-first)
 * - Crea instrumentos financieros (cheques, transferencias)
 * - Procesa descuentos de gastos
 * - Actualiza estado de LPs a PAGADA
 * - Crea la Orden de Pago
 * - Genera PDF y sube a R2 (no fatal)
 */
export async function ejecutarCrearOrdenPago(
  data: DatosCrearOrdenPago,
  operadorId: string
): Promise<ResultadoOrdenPago> {
  const { fleteroId, liquidacionIds, pagos, fecha, gastos, ncDescuentos } = data

  if (pagos.length === 0 && (!gastos || gastos.length === 0) && (!ncDescuentos || ncDescuentos.length === 0)) {
    return { ok: false, status: 400, error: "Debe ingresar al menos un medio de pago, gasto o NC a descontar" }
  }

  // ── Cargar fletero ──────────────────────────────────────────────────────
  const fleteroDb = await prisma.fletero.findUnique({
    where: { id: fleteroId },
    select: { id: true, razonSocial: true, cuit: true },
  })
  if (!fleteroDb) return { ok: false, status: 404, error: "Fletero no encontrado" }

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
    return {
      ok: false,
      status: 400,
      error: "Una o mas liquidaciones no son validas o no estan en estado pagable para este fletero",
    }
  }

  // Calcular saldo pendiente por LP
  const liqConSaldo = liquidaciones.map((liq) => {
    const totalPagado = sumarImportes(liq.pagos.map((p) => p.monto))
    return { ...liq, totalPagado, saldoPendiente: maxMonetario(0, restarImportes(liq.total, totalPagado)) }
  })

  // Ordenar de mas antiguo a mas nuevo (distribucion: oldest first)
  const lpsOrdenados = [...liqConSaldo].sort(
    (a, b) => a.grabadaEn.getTime() - b.grabadaEn.getTime()
  )

  const totalSaldoPendiente = sumarImportes(lpsOrdenados.map((lp) => lp.saldoPendiente))
  const totalMediosPago = sumarImportes(pagos.map((p) => p.monto))
  const totalGastosRequest = gastos ? sumarImportes(gastos.map((g) => g.montoDescontar)) : 0
  const totalNCRequest = ncDescuentos ? sumarImportes(ncDescuentos.map((n) => n.montoDescontar)) : 0

  // ── Validar que el pago cubre exactamente el saldo total ────────────────
  if (!importesIguales(sumarImportes([totalMediosPago, totalGastosRequest, totalNCRequest]), totalSaldoPendiente)) {
    return {
      ok: false,
      status: 400,
      error: `El total de los medios de pago debe cubrir exactamente el saldo pendiente (${totalSaldoPendiente.toFixed(2)}). Diferencia: ${restarImportes(sumarImportes([totalMediosPago, totalGastosRequest]), totalSaldoPendiente).toFixed(2)}`,
    }
  }

  // ── Validar SALDO_A_FAVOR ───────────────────────────────────────────────
  const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
  if (pagoSaldoAFavor) {
    const { saldoAFavor } = await calcularSaldoCCFletero(fleteroId)
    if (pagoSaldoAFavor.monto > saldoAFavor) {
      return { ok: false, status: 400, error: "Saldo a favor insuficiente" }
    }
  }

  const fechaPago = new Date(fecha)

  // ── Transaccion ─────────────────────────────────────────────────────────
  const { ordenPagoId, nroOrdenPago, anioOP } = await prisma.$transaction(async (tx) => {
    const pagoIdsParaOP: string[] = []

    // Saldo restante por LP para la distribucion
    const saldosRestantes = new Map<string, number>(
      lpsOrdenados.map((lp) => [lp.id, lp.saldoPendiente])
    )

    let lpIndex = 0

    // ── Distribuir medios de pago entre LPs ──────────────────────────────
    for (const pago of pagos) {
      let montoRestantePago = pago.monto

      // Crear instrumento financiero ONCE por item de pago
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

      // ── Distribuir este item entre los LPs con saldo restante ──────────
      while (montoRestantePago > 0.009 && lpIndex < lpsOrdenados.length) {
        const lp = lpsOrdenados[lpIndex]
        const saldoLP = saldosRestantes.get(lp.id)!
        const montoParaEsteLP = m(Math.min(montoRestantePago, saldoLP))

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
              comprobanteS3Key:
                pago.tipoPago === "TRANSFERENCIA" || pago.tipoPago === "CHEQUE_PROPIO" || pago.tipoPago === "CHEQUE_TERCERO"
                  ? pago.comprobanteS3Key
                  : undefined,
              operadorId,
            },
          })
          pagoIdsParaOP.push(nuevoPago.id)

          saldosRestantes.set(lp.id, restarImportes(saldoLP, montoParaEsteLP))
          montoRestantePago = restarImportes(montoRestantePago, montoParaEsteLP)
        }

        if ((saldosRestantes.get(lp.id) ?? 0) < 0.01) lpIndex++
      }
    }

    // ── Gastos descontados -> se vinculan al primer LP (mas antiguo) ───────
    const primerLpId = lpsOrdenados[0].id
    if (gastos && gastos.length > 0) {
      for (const g of gastos) {
        const gasto = await tx.gastoFletero.findUnique({
          where: { id: g.gastoId },
          select: { id: true, montoPagado: true, montoDescontado: true, estado: true, fleteroId: true },
        })
        if (!gasto || gasto.fleteroId !== fleteroId) continue
        if (gasto.estado === "DESCONTADO_TOTAL") continue

        const saldoGasto = restarImportes(gasto.montoPagado, gasto.montoDescontado)
        const efectivoDescontar = m(Math.min(g.montoDescontar, saldoGasto))
        if (efectivoDescontar <= 0) continue

        await tx.gastoDescuento.create({
          data: {
            gastoId: g.gastoId,
            liquidacionId: primerLpId,
            montoDescontado: efectivoDescontar,
            fecha: fechaPago,
          },
        })

        const nuevoMontoDescontado = sumarImportes([gasto.montoDescontado, efectivoDescontar])
        const nuevoEstadoGasto =
          importesIguales(nuevoMontoDescontado, gasto.montoPagado) || nuevoMontoDescontado > gasto.montoPagado
            ? "DESCONTADO_TOTAL"
            : "DESCONTADO_PARCIAL"

        await tx.gastoFletero.update({
          where: { id: g.gastoId },
          data: { montoDescontado: nuevoMontoDescontado, estado: nuevoEstadoGasto },
        })
      }
    }

    // ── NC descuentos ─────────────────────────────────────────────────────
    if (ncDescuentos && ncDescuentos.length > 0) {
      for (const ncd of ncDescuentos) {
        const nc = await tx.notaCreditoDebito.findUnique({
          where: { id: ncd.ncId },
          select: { id: true, montoTotal: true, montoDescontado: true, liquidacion: { select: { fleteroId: true } } },
        })
        if (!nc || nc.liquidacion?.fleteroId !== fleteroId) continue

        const saldoNC = restarImportes(nc.montoTotal, nc.montoDescontado)
        const efectivoDescontar = m(Math.min(ncd.montoDescontar, saldoNC))
        if (efectivoDescontar <= 0) continue

        const nuevoMontoDescontado = sumarImportes([nc.montoDescontado, efectivoDescontar])
        await tx.notaCreditoDebito.update({
          where: { id: ncd.ncId },
          data: { montoDescontado: nuevoMontoDescontado },
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

    // ── Crear la Orden de Pago (numeración por fletero + año) ──────────
    const anioOP = fechaPago.getFullYear()
    const ultimaOPFletero = await tx.ordenPago.findFirst({
      where: { fleteroId, anio: anioOP },
      orderBy: { nro: "desc" },
      select: { nro: true },
    })
    const nroOP = (ultimaOPFletero?.nro ?? 0) + 1
    const op = await tx.ordenPago.create({
      data: {
        nro: nroOP,
        anio: anioOP,
        fecha: fechaPago,
        fleteroId,
        operadorId,
        pagos: { connect: pagoIdsParaOP.map((id) => ({ id })) },
      },
    })

    return { ordenPagoId: op.id, nroOrdenPago: nroOP, anioOP }
  })

  // ── Generar HTML y subir a R2 (no fatal si falla) ─────────────────────
  if (storageConfigurado()) {
    try {
      const html = await generarHTMLOrdenPago(ordenPagoId)
      const buffer = Buffer.from(html, "utf-8")
      const key = await subirPDF(buffer, "comprobantes-pago-fletero", `OP-${nroOrdenPago}-${anioOP}.html`)
      await prisma.ordenPago.update({ where: { id: ordenPagoId }, data: { pdfS3Key: key } })
    } catch {
      // No bloquear la respuesta si el storage falla
    }
  }

  const display = `${nroOrdenPago}-${anioOP}`
  return { ok: true, result: { ordenPago: { id: ordenPagoId, nro: nroOrdenPago, anio: anioOP, display } } }
}
