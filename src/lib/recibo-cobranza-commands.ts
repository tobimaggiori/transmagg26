/**
 * recibo-cobranza-commands.ts
 *
 * Lógica de negocio transaccional para creación de Recibos de Cobranza.
 * Soporta: aplicación parcial de facturas, efectivo, saldo cta cte,
 * faltantes de viaje, saldo a cuenta, retenciones, cheques y transferencias.
 */

import { prisma } from "@/lib/prisma"
import { subirPDF } from "@/lib/storage"
import { generarPDFReciboCobranza } from "@/lib/pdf-recibo-cobranza"
import { sumarImportes, restarImportes, m } from "@/lib/money"
import { calcularSaldoCCEmpresa } from "@/lib/cuenta-corriente"

// ── Tipos ────────────────────────────────────────────────────────────────────

type MedioPago = {
  tipo: "TRANSFERENCIA" | "ECHEQ" | "CHEQUE_FISICO" | "EFECTIVO" | "SALDO_CTA_CTE"
  monto: number
  cuentaId?: string
  fechaTransferencia?: string
  referencia?: string
  nroCheque?: string
  bancoEmisor?: string
  fechaEmision?: string
  fechaPago?: string
}

type FacturaAplicada = {
  facturaId: string
  montoAplicado: number
}

type FaltanteInput = {
  viajeId: string
  fleteroId: string
  monto: number
  descripcion?: string
}

export type DatosCrearReciboCobranza = {
  empresaId: string
  facturasAplicadas: FacturaAplicada[]
  mediosPago: MedioPago[]
  retencionGanancias: number
  retencionIIBB: number
  retencionSUSS: number
  faltantes: FaltanteInput[]
  fecha: string
}

type ResultadoReciboCobranza =
  | { ok: true; result: { id: string; nro: number } }
  | { ok: false; status: number; error: string }

// ── Comando principal ────────────────────────────────────────────────────────

/**
 * ejecutarCrearReciboCobranza: DatosCrearReciboCobranza string -> Promise<ResultadoReciboCobranza>
 *
 * Dado [los datos validados del recibo y el operadorId],
 * devuelve [el recibo creado o un error con status HTTP].
 *
 * Ecuación de balance:
 *   totalAplicado = sum(facturasAplicadas[].montoAplicado)
 *   totalFaltantes = sum(faltantes[].monto)
 *   montoCubrir = totalAplicado - totalFaltantes
 *   montoProvisto = totalMedios + totalRetenciones
 *   saldoACuenta = max(0, montoProvisto - montoCubrir)
 *   Validación: montoProvisto >= montoCubrir
 */
export async function ejecutarCrearReciboCobranza(
  data: DatosCrearReciboCobranza,
  operadorId: string
): Promise<ResultadoReciboCobranza> {
  const {
    empresaId,
    facturasAplicadas,
    mediosPago,
    retencionGanancias,
    retencionIIBB,
    retencionSUSS,
    faltantes,
    fecha,
  } = data

  // ── Validar facturas ────────────────────────────────────────────────────

  const facturaIds = facturasAplicadas.map((fa) => fa.facturaId)
  const facturas = await prisma.facturaEmitida.findMany({
    where: {
      id: { in: facturaIds },
      empresaId,
      estado: "EMITIDA",
      estadoCobro: { in: ["PENDIENTE", "PARCIALMENTE_COBRADA"] },
    },
    include: {
      pagos: { select: { monto: true } },
      notasCreditoDebito: { select: { tipo: true, montoTotal: true } },
    },
  })

  if (facturas.length !== facturaIds.length) {
    return {
      ok: false,
      status: 400,
      error: "Alguna factura no existe, no pertenece a la empresa o ya fue cobrada",
    }
  }

  // Validar montoAplicado <= saldoPendiente de cada factura
  for (const fa of facturasAplicadas) {
    const factura = facturas.find((f) => f.id === fa.facturaId)!
    const totalPagado = sumarImportes(factura.pagos.map((p) => p.monto))
    // Ajuste por NC/ND
    const ajusteNC = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => n.tipo === "NC_EMITIDA" || n.tipo === "NC_RECIBIDA")
        .map((n) => n.montoTotal)
    )
    const ajusteND = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => n.tipo === "ND_EMITIDA" || n.tipo === "ND_RECIBIDA")
        .map((n) => n.montoTotal)
    )
    const netoVigente = Math.max(0, sumarImportes([factura.total, ajusteND]) - ajusteNC)
    const saldoPendiente = Math.max(0, restarImportes(netoVigente, totalPagado))

    if (fa.montoAplicado > saldoPendiente + 0.01) {
      return {
        ok: false,
        status: 400,
        error: `El monto aplicado ($${fa.montoAplicado.toFixed(2)}) supera el saldo pendiente ($${saldoPendiente.toFixed(2)}) de la factura`,
      }
    }
  }

  // ── Calcular totales y ecuación de balance ──────────────────────────────

  const totalAplicado = sumarImportes(facturasAplicadas.map((fa) => fa.montoAplicado))
  const totalFaltantes = sumarImportes(faltantes.map((f) => f.monto))
  const totalMedios = sumarImportes(mediosPago.map((mp) => mp.monto))
  const totalRetenciones = sumarImportes([retencionGanancias, retencionIIBB, retencionSUSS])

  const montoCubrir = restarImportes(totalAplicado, totalFaltantes)
  const montoProvisto = sumarImportes([totalMedios, totalRetenciones])
  const saldoACuenta = Math.max(0, m(montoProvisto - montoCubrir))

  if (montoProvisto + 0.01 < montoCubrir) {
    return {
      ok: false,
      status: 400,
      error: `Los medios de pago ($${montoProvisto.toFixed(2)}) + retenciones no cubren el monto a cobrar ($${montoCubrir.toFixed(2)})`,
    }
  }

  // ── Validar SALDO_CTA_CTE ─────────────────────────────────────────────

  const totalSaldoCtaCte = sumarImportes(
    mediosPago.filter((mp) => mp.tipo === "SALDO_CTA_CTE").map((mp) => mp.monto)
  )
  if (totalSaldoCtaCte > 0) {
    const cc = await calcularSaldoCCEmpresa(empresaId)
    if (totalSaldoCtaCte > cc.saldoAFavor + 0.01) {
      return {
        ok: false,
        status: 400,
        error: `El saldo a favor disponible ($${cc.saldoAFavor.toFixed(2)}) es menor al monto de Saldo Cta. Cte. ($${totalSaldoCtaCte.toFixed(2)})`,
      }
    }
  }

  // ── Transacción ────────────────────────────────────────────────────────

  const reciboCreado = await prisma.$transaction(async (tx) => {
    // Número correlativo
    const maxNro = await tx.reciboCobranza.aggregate({ _max: { nro: true } })
    const nro = (maxNro._max.nro ?? 0) + 1

    // Crear recibo
    const recibo = await tx.reciboCobranza.create({
      data: {
        nro,
        ptoVenta: 1,
        fecha: new Date(fecha),
        empresaId,
        totalCobrado: totalMedios,
        totalRetenciones,
        totalComprobantes: totalAplicado,
        retencionGanancias,
        retencionIIBB,
        retencionSUSS,
        totalFaltantes,
        saldoACuenta,
        operadorId,
      },
    })

    const reciboLabel = `Recibo ${String(recibo.ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`

    // Crear medios de pago
    for (const mp of mediosPago) {
      await tx.medioPagoRecibo.create({
        data: {
          reciboId: recibo.id,
          tipo: mp.tipo,
          monto: mp.monto,
          cuentaId: mp.cuentaId ?? null,
          fechaTransferencia: mp.fechaTransferencia ? new Date(mp.fechaTransferencia) : null,
          referencia: mp.referencia ?? null,
          nroCheque: mp.nroCheque ?? null,
          bancoEmisor: mp.bancoEmisor ?? null,
          fechaEmision: mp.fechaEmision ? new Date(mp.fechaEmision) : null,
          fechaPago: mp.fechaPago ? new Date(mp.fechaPago) : null,
        },
      })

      // TRANSFERENCIA: crear MovimientoSinFactura INGRESO
      if (mp.tipo === "TRANSFERENCIA" && mp.cuentaId) {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: mp.cuentaId,
            tipo: "INGRESO",
            categoria: "TRANSFERENCIA_RECIBIDA",
            monto: mp.monto,
            fecha: mp.fechaTransferencia ? new Date(mp.fechaTransferencia) : new Date(fecha),
            descripcion: `Cobro ${reciboLabel} — ${facturasAplicadas.length} factura(s)`,
            referencia: mp.referencia ?? null,
            operadorId,
          },
        })
      }

      // ECHEQ / CHEQUE_FISICO: crear ChequeRecibido
      if (mp.tipo === "ECHEQ" || mp.tipo === "CHEQUE_FISICO") {
        await tx.chequeRecibido.create({
          data: {
            empresaId,
            nroCheque: mp.nroCheque ?? "S/N",
            bancoEmisor: mp.bancoEmisor ?? "Desconocido",
            monto: mp.monto,
            fechaEmision: mp.fechaEmision ? new Date(mp.fechaEmision) : new Date(fecha),
            fechaCobro: mp.fechaPago ? new Date(mp.fechaPago) : new Date(fecha),
            estado: "EN_CARTERA",
            esElectronico: mp.tipo === "ECHEQ",
            operadorId,
            reciboCobranzaId: recibo.id,
          },
        })
      }

      // EFECTIVO y SALDO_CTA_CTE: solo el registro de MedioPagoRecibo (ya creado arriba)
    }

    // Crear FacturaEnRecibo + PagoDeEmpresa + actualizar estadoCobro por cada factura
    for (const fa of facturasAplicadas) {
      // Junction table
      await tx.facturaEnRecibo.create({
        data: {
          reciboId: recibo.id,
          facturaId: fa.facturaId,
          montoAplicado: fa.montoAplicado,
        },
      })

      // PagoDeEmpresa
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: fa.facturaId,
          tipoPago: "RECIBO_COBRANZA",
          monto: fa.montoAplicado,
          referencia: reciboLabel,
          fechaPago: new Date(fecha),
          operadorId,
        },
      })

      // Determinar nuevo estadoCobro
      const factura = facturas.find((f) => f.id === fa.facturaId)!
      const totalPagadoPrevio = sumarImportes(factura.pagos.map((p) => p.monto))
      const totalPagadoNuevo = sumarImportes([totalPagadoPrevio, fa.montoAplicado])
      const nuevoEstado = totalPagadoNuevo >= Number(factura.total) - 0.01 ? "COBRADA" : "PARCIALMENTE_COBRADA"

      await tx.facturaEmitida.update({
        where: { id: fa.facturaId },
        data: { estadoCobro: nuevoEstado },
      })
    }

    // Crear faltantes de viaje
    for (const faltante of faltantes) {
      await tx.faltanteViaje.create({
        data: {
          reciboCobranzaId: recibo.id,
          viajeId: faltante.viajeId,
          fleteroId: faltante.fleteroId,
          empresaId,
          monto: faltante.monto,
          descripcion: faltante.descripcion ?? null,
        },
      })
    }

    // Marcar NC_EMITIDA asociadas a facturas cobradas como descontadas
    // (la NC ya reduce el saldo de la factura — al cobrar se confirma que fue aplicada)
    for (const fa of facturasAplicadas) {
      const ncsFactura = facturas.find((f) => f.id === fa.facturaId)
        ?.notasCreditoDebito.filter((n) => n.tipo === "NC_EMITIDA") ?? []
      if (ncsFactura.length > 0) {
        // Buscar NC con saldo sin descontar para esta factura
        const ncsPendientes = await tx.notaCreditoDebito.findMany({
          where: {
            facturaId: fa.facturaId,
            tipo: "NC_EMITIDA",
          },
          select: { id: true, montoTotal: true, montoDescontado: true },
        })
        for (const nc of ncsPendientes) {
          if (Number(nc.montoDescontado) < Number(nc.montoTotal)) {
            await tx.notaCreditoDebito.update({
              where: { id: nc.id },
              data: { montoDescontado: nc.montoTotal },
            })
          }
        }
      }
    }

    // Saldo a cuenta: si hay exceso, crear PagoDeEmpresa sin factura
    if (saldoACuenta > 0) {
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: null,
          tipoPago: "SALDO_A_CUENTA",
          monto: saldoACuenta,
          referencia: `Saldo a cuenta — ${reciboLabel}`,
          fechaPago: new Date(fecha),
          operadorId,
        },
      })
    }

    return recibo
  })

  // ── Generar PDF y subir a R2 ─────────────────────────────────────────────

  try {
    const pdfBuffer = await generarPDFReciboCobranza(reciboCreado.id)
    const key = await subirPDF(pdfBuffer, "recibos-cobranza", `recibo-${reciboCreado.nro}.pdf`)
    await prisma.reciboCobranza.update({
      where: { id: reciboCreado.id },
      data: { pdfS3Key: key },
    })
  } catch (e) {
    console.error("Error generando PDF del recibo:", e)
  }

  return { ok: true, result: { id: reciboCreado.id, nro: reciboCreado.nro } }
}
