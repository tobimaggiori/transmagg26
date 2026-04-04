/**
 * recibo-cobranza-commands.ts
 *
 * Logica de negocio transaccional para creacion de Recibos de Cobranza.
 * Valida precondiciones, crea el recibo con medios de pago,
 * actualiza facturas a COBRADA, crea movimientos y cheques recibidos,
 * y genera el PDF.
 */

import { prisma } from "@/lib/prisma"
import { subirPDF } from "@/lib/storage"
import { generarPDFReciboCobranza } from "@/lib/pdf-recibo-cobranza"
import { sumarImportes, m, importesIguales } from "@/lib/money"

// ── Tipos ────────────────────────────────────────────────────────────────────

type MedioPago = {
  tipo: "TRANSFERENCIA" | "ECHEQ" | "CHEQUE_FISICO"
  monto: number
  cuentaId?: string
  fechaTransferencia?: string
  referencia?: string
  nroCheque?: string
  bancoEmisor?: string
  fechaEmision?: string
  fechaPago?: string
}

export type DatosCrearReciboCobranza = {
  empresaId: string
  facturaIds: string[]
  mediosPago: MedioPago[]
  retencionGanancias: number
  retencionIIBB: number
  retencionSUSS: number
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
 * Valida:
 * - Facturas existen, pertenecen a la empresa y estan pendientes
 * - Total de medios + retenciones = total facturas
 *
 * Ejecuta en transaccion:
 * - Crea recibo con numero correlativo
 * - Crea medios de pago, movimientos bancarios y cheques recibidos
 * - Actualiza facturas a COBRADA
 * - Crea PagoDeEmpresa proporcional por factura
 * - Genera PDF y sube a R2 (no fatal)
 */
export async function ejecutarCrearReciboCobranza(
  data: DatosCrearReciboCobranza,
  operadorId: string
): Promise<ResultadoReciboCobranza> {
  const {
    empresaId,
    facturaIds,
    mediosPago,
    retencionGanancias,
    retencionIIBB,
    retencionSUSS,
    fecha,
  } = data

  // Validar facturas: deben pertenecer a la empresa y estar pendientes
  const facturas = await prisma.facturaEmitida.findMany({
    where: { id: { in: facturaIds }, empresaId, estado: "EMITIDA", estadoCobro: "PENDIENTE" },
  })

  if (facturas.length !== facturaIds.length) {
    return {
      ok: false,
      status: 400,
      error: "Alguna factura no existe, no pertenece a la empresa o ya fue cobrada",
    }
  }

  const totalComprobantes = sumarImportes(facturas.map((f) => f.total))
  const totalMedios = sumarImportes(mediosPago.map((mp) => mp.monto))
  const totalRetenciones = sumarImportes([retencionGanancias, retencionIIBB, retencionSUSS])
  const totalCobrado = totalMedios

  // Validar que medios + retenciones = total facturas
  if (!importesIguales(totalComprobantes, sumarImportes([totalMedios, totalRetenciones]))) {
    return {
      ok: false,
      status: 400,
      error: `La suma de medios de pago (${totalMedios.toFixed(2)}) + retenciones (${totalRetenciones.toFixed(2)}) no coincide con el total de facturas (${totalComprobantes.toFixed(2)})`,
    }
  }

  // ─── Transaccion ──────────────────────────────────────────────────────────

  const reciboCreado = await prisma.$transaction(async (tx) => {
    // Numero correlativo
    const maxNro = await tx.reciboCobranza.aggregate({ _max: { nro: true } })
    const nro = (maxNro._max.nro ?? 0) + 1

    // Crear recibo
    const recibo = await tx.reciboCobranza.create({
      data: {
        nro,
        ptoVenta: 1,
        fecha: new Date(fecha),
        empresaId,
        totalCobrado,
        totalRetenciones,
        totalComprobantes,
        retencionGanancias,
        retencionIIBB,
        retencionSUSS,
        operadorId,
      },
    })

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

      // Para TRANSFERENCIA: crear MovimientoSinFactura INGRESO
      if (mp.tipo === "TRANSFERENCIA" && mp.cuentaId) {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: mp.cuentaId,
            tipo: "INGRESO",
            categoria: "TRANSFERENCIA_RECIBIDA",
            monto: mp.monto,
            fecha: mp.fechaTransferencia ? new Date(mp.fechaTransferencia) : new Date(fecha),
            descripcion: `Cobro recibo ${String(1).padStart(4, "0")}-${String(nro).padStart(8, "0")} — ${facturas.length} factura(s)`,
            referencia: mp.referencia ?? null,
            operadorId,
          },
        })
      }

      // Para ECHEQ o CHEQUE_FISICO: crear ChequeRecibido
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
    }

    // Actualizar facturas: asignar recibo y marcar como COBRADA
    await tx.facturaEmitida.updateMany({
      where: { id: { in: facturaIds } },
      data: { reciboId: recibo.id, estadoCobro: "COBRADA" },
    })

    // Crear PagoDeEmpresa por cada factura para impactar la CC de la empresa
    // Distribuir el total cobrado (medios de pago) proporcionalmente entre facturas
    const totalFacturasLocal = sumarImportes(facturas.map((f) => f.total))
    for (const f of facturas) {
      const proporcion = totalFacturasLocal > 0 ? f.total / totalFacturasLocal : 1 / facturas.length
      const montoAplicado = m(totalCobrado * proporcion)
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: f.id,
          tipoPago: "RECIBO_COBRANZA",
          monto: montoAplicado,
          referencia: `Recibo ${String(recibo.ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`,
          fechaPago: new Date(fecha),
          operadorId,
        },
      })
    }

    return recibo
  })

  // ─── Generar PDF y subir a R2 ─────────────────────────────────────────────

  try {
    const pdfBuffer = await generarPDFReciboCobranza(reciboCreado.id)
    const key = await subirPDF(pdfBuffer, "recibos-cobranza", `recibo-${reciboCreado.nro}.pdf`)
    await prisma.reciboCobranza.update({
      where: { id: reciboCreado.id },
      data: { pdfS3Key: key },
    })
  } catch (e) {
    // PDF no critico — el recibo ya fue creado
    console.error("Error generando PDF del recibo:", e)
  }

  return { ok: true, result: { id: reciboCreado.id, nro: reciboCreado.nro } }
}
