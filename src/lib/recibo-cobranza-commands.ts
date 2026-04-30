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
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

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

type NotaAplicada = {
  notaId: string
  monto: number
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
  notasAplicadas: NotaAplicada[]
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
    notasAplicadas,
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
      notasCreditoDebito: {
        select: { id: true, tipo: true, montoTotal: true, montoDescontado: true },
      },
    },
  })

  if (facturas.length !== facturaIds.length) {
    return {
      ok: false,
      status: 400,
      error: "Alguna factura no existe, no pertenece a la empresa o ya fue cobrada",
    }
  }

  // ── Validar notas aplicadas ────────────────────────────────────────────
  // Cada nota debe pertenecer a una factura del recibo y estar dentro del
  // saldo aplicable (montoTotal − montoDescontado previo).

  const notasById = new Map<string, { tipo: string; montoTotal: number; montoDescontado: number; facturaId: string }>()
  for (const f of facturas) {
    for (const n of f.notasCreditoDebito) {
      notasById.set(n.id, {
        tipo: n.tipo,
        montoTotal: Number(n.montoTotal),
        montoDescontado: Number(n.montoDescontado),
        facturaId: f.id,
      })
    }
  }

  for (const na of notasAplicadas) {
    const nota = notasById.get(na.notaId)
    if (!nota) {
      return {
        ok: false,
        status: 400,
        error: "Una nota seleccionada no pertenece a ninguna factura del recibo",
      }
    }
    const disponible = Math.max(0, restarImportes(nota.montoTotal, nota.montoDescontado))
    if (na.monto > disponible + 0.01) {
      return {
        ok: false,
        status: 400,
        error: `El monto aplicado de la nota ($${na.monto.toFixed(2)}) supera el disponible ($${disponible.toFixed(2)})`,
      }
    }
  }

  // Helpers para agrupar notas aplicadas por factura
  const esNC = (t: string) => t === "NC_EMITIDA" || t === "NC_RECIBIDA"
  const esND = (t: string) => t === "ND_EMITIDA" || t === "ND_RECIBIDA"

  function notasDeFactura(facturaId: string) {
    return notasAplicadas.filter((na) => notasById.get(na.notaId)?.facturaId === facturaId)
  }
  function ncAplicadasNuevoEnFactura(facturaId: string) {
    return sumarImportes(
      notasDeFactura(facturaId)
        .filter((na) => esNC(notasById.get(na.notaId)!.tipo))
        .map((na) => na.monto)
    )
  }
  function ndAplicadasNuevoEnFactura(facturaId: string) {
    return sumarImportes(
      notasDeFactura(facturaId)
        .filter((na) => esND(notasById.get(na.notaId)!.tipo))
        .map((na) => na.monto)
    )
  }

  // Validar saldoPendiente >= montoAplicado + NC nuevas − ND nuevas para cada factura.
  // Es decir: lo que se "consume" del saldo en este recibo (cash + NCs) no puede
  // superar la deuda actual (total + ND_total − NC_descontadas − pagos previos).
  for (const fa of facturasAplicadas) {
    const factura = facturas.find((f) => f.id === fa.facturaId)!
    const totalPagado = sumarImportes(factura.pagos.map((p) => p.monto))

    const ncDescontadasPrev = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => esNC(n.tipo))
        .map((n) => n.montoDescontado)
    )
    const ndDescontadasPrev = sumarImportes(
      factura.notasCreditoDebito
        .filter((n) => esND(n.tipo))
        .map((n) => n.montoDescontado)
    )

    const ncNuevo = ncAplicadasNuevoEnFactura(fa.facturaId)
    const ndNuevo = ndAplicadasNuevoEnFactura(fa.facturaId)

    const deudaVigente = Math.max(
      0,
      sumarImportes([factura.total, ndDescontadasPrev, ndNuevo]) - ncDescontadasPrev - ncNuevo - totalPagado
    )

    if (fa.montoAplicado > deudaVigente + 0.01) {
      return {
        ok: false,
        status: 400,
        error: `El monto aplicado ($${fa.montoAplicado.toFixed(2)}) supera el saldo pendiente ($${deudaVigente.toFixed(2)}) de la factura`,
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

    // Transferencias acumuladas para registrar movimientos bancarios después
    // de crear los PagoDeEmpresa (el movimiento se ancla al primer pago).
    const transferenciasPendientesDeMov: Array<{
      cuentaId: string
      monto: number
      fecha: Date
    }> = []

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

      if (mp.tipo === "TRANSFERENCIA" && mp.cuentaId) {
        transferenciasPendientesDeMov.push({
          cuentaId: mp.cuentaId,
          monto: mp.monto,
          fecha: mp.fechaTransferencia ? new Date(mp.fechaTransferencia) : new Date(fecha),
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

    // Aplicar notas seleccionadas: junction + acumular en montoDescontado
    for (const na of notasAplicadas) {
      await tx.notaAplicadaEnRecibo.create({
        data: {
          notaId: na.notaId,
          reciboId: recibo.id,
          monto: na.monto,
          fecha: new Date(fecha),
        },
      })
      await tx.notaCreditoDebito.update({
        where: { id: na.notaId },
        data: { montoDescontado: { increment: na.monto } },
      })
    }

    // Crear FacturaEnRecibo + PagoDeEmpresa + actualizar estadoCobro por cada factura
    let primerPagoDeEmpresaId: string | null = null
    for (const fa of facturasAplicadas) {
      // Junction table
      await tx.facturaEnRecibo.create({
        data: {
          reciboId: recibo.id,
          facturaId: fa.facturaId,
          montoAplicado: fa.montoAplicado,
        },
      })

      // PagoDeEmpresa (solo si hay cash aplicado)
      if (fa.montoAplicado > 0) {
        const pagoDeEmp = await tx.pagoDeEmpresa.create({
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
        if (primerPagoDeEmpresaId === null) primerPagoDeEmpresaId = pagoDeEmp.id
      }

      // Determinar nuevo estadoCobro: COBRADA si total + ND_total − NC_total − pagos ≤ 0
      const factura = facturas.find((f) => f.id === fa.facturaId)!
      const totalPagadoPrevio = sumarImportes(factura.pagos.map((p) => p.monto))
      const totalPagadoNuevo = sumarImportes([totalPagadoPrevio, fa.montoAplicado])

      const ncDescontadasPrev = sumarImportes(
        factura.notasCreditoDebito
          .filter((n) => esNC(n.tipo))
          .map((n) => n.montoDescontado)
      )
      const ndDescontadasPrev = sumarImportes(
        factura.notasCreditoDebito
          .filter((n) => esND(n.tipo))
          .map((n) => n.montoDescontado)
      )
      const ncNuevo = ncAplicadasNuevoEnFactura(fa.facturaId)
      const ndNuevo = ndAplicadasNuevoEnFactura(fa.facturaId)

      const saldoFinal =
        sumarImportes([factura.total, ndDescontadasPrev, ndNuevo]) -
        ncDescontadasPrev -
        ncNuevo -
        totalPagadoNuevo

      const nuevoEstado = saldoFinal <= 0.01 ? "COBRADA" : "PARCIALMENTE_COBRADA"

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

    // Saldo a cuenta: si hay exceso, crear PagoDeEmpresa sin factura
    if (saldoACuenta > 0) {
      const pagoSaldo = await tx.pagoDeEmpresa.create({
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
      if (primerPagoDeEmpresaId === null) primerPagoDeEmpresaId = pagoSaldo.id
    }

    // Registrar movimientos bancarios de TRANSFERENCIA (ancla = primer PagoDeEmpresa)
    if (primerPagoDeEmpresaId) {
      for (const t of transferenciasPendientesDeMov) {
        await registrarMovimiento(tx, {
          cuentaId: t.cuentaId,
          tipo: "INGRESO",
          categoria: "TRANSFERENCIA_RECIBIDA",
          monto: t.monto,
          fecha: t.fecha,
          descripcion: `Cobro ${reciboLabel} — ${facturasAplicadas.length} factura(s)`,
          pagoDeEmpresaId: primerPagoDeEmpresaId,
          operadorCreacionId: operadorId,
        })
      }
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
