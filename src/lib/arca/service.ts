/**
 * Propósito: Servicio central de autorización de comprobantes en ARCA.
 * Orquesta el flujo completo: validación, autenticación WSAA, sincronización de
 * numeración, llamada a FECAESolicitar, persistencia y generación de PDF fiscal.
 *
 * Reutilizable para facturas, liquidaciones, notas de crédito y notas de débito.
 * No contiene lógica de HTTP/routes — las routes lo invocan con datos ya validados.
 *
 * Concurrencia: la transición a EN_PROCESO es atómica (updateMany con WHERE sobre
 * el estado actual). Solo un request puede tomar el lock lógico.
 *
 * PDF: se genera inmediatamente después de la autorización exitosa. Si la generación
 * falla, el CAE queda persistido y el PDF puede regenerarse manualmente.
 */

import { prisma } from "@/lib/prisma"
import { cargarConfigArca, resolverUrls } from "./config"
import { obtenerTicketWsaa } from "./wsaa"
import { feCompUltimoAutorizado, feCAESolicitar } from "./wsfev1"
import { mapearComprobanteArca, parsearFechaArca } from "./mappers"
import type { DatosComprobanteBase } from "./mappers"
import { generarQRFiscal } from "./qr"
import { validarPreAutorizacion, validarDocumentoNoAutorizado } from "./validators"
import {
  ArcaValidacionError,
  ArcaRechazoError,
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  DocumentoNoEncontradoError,
} from "./errors"
import type { ArcaConfig, AutorizarComprobanteResult, TipoDocumentoArca } from "./types"

// ─── Logging seguro ──────────────────────────────────────────────────────────

function logArca(nivel: "info" | "warn" | "error", mensaje: string, meta?: Record<string, unknown>) {
  const entry = { ts: new Date().toISOString(), nivel, modulo: "ARCA", mensaje, ...meta }
  if (nivel === "error") console.error(JSON.stringify(entry))
  else console.log(JSON.stringify(entry))
}

// ─── Lock atómico ────────────────────────────────────────────────────────────

/**
 * tomarLockLiquidacion: (id, idempotencyKey) -> Promise<boolean>
 *
 * Intenta transicionar atómicamente arcaEstado a EN_PROCESO.
 * Solo tiene éxito si el estado actual es PENDIENTE o RECHAZADA.
 * Devuelve true si el lock se tomó, false si alguien más lo tiene.
 *
 * Compatible con SQLite/Turso: usa updateMany con WHERE condicional.
 * SQLite serializa writes, así que solo un request gana la carrera.
 */
async function tomarLockLiquidacion(id: string, idempotencyKey: string): Promise<boolean> {
  const result = await prisma.liquidacion.updateMany({
    where: {
      id,
      arcaEstado: { in: ["PENDIENTE", "RECHAZADA"] },
    },
    data: { arcaEstado: "EN_PROCESO", idempotencyKey },
  })
  return result.count > 0
}

async function tomarLockFactura(id: string, idempotencyKey: string): Promise<boolean> {
  const result = await prisma.facturaEmitida.updateMany({
    where: {
      id,
      estadoArca: { in: ["PENDIENTE", "RECHAZADA"] },
    },
    data: { estadoArca: "EN_PROCESO", idempotencyKey },
  })
  return result.count > 0
}

async function tomarLockNotaCD(id: string, idempotencyKey: string): Promise<boolean> {
  const result = await prisma.notaCreditoDebito.updateMany({
    where: {
      id,
      arcaEstado: { in: ["PENDIENTE", "RECHAZADA"] },
    },
    data: { arcaEstado: "EN_PROCESO", idempotencyKey },
  })
  return result.count > 0
}

// ─── Generación PDF fiscal inmediata ─────────────────────────────────────────

/**
 * generarPdfFiscalLiquidacion: (liquidacionId) -> Promise<string | null>
 *
 * Genera el PDF fiscal de la liquidación (con CAE, QR, nro definitivo) y lo
 * sube a R2. Devuelve la S3 key del PDF, o null si storage no está configurado
 * o si la generación falla.
 *
 * Si falla, NO pierde el CAE — solo loguea el error. El PDF puede regenerarse
 * manualmente via GET /api/liquidaciones/[id]/pdf.
 */
async function generarPdfFiscalLiquidacion(liquidacionId: string): Promise<string | null> {
  try {
    const { storageConfigurado, subirPDF } = await import("@/lib/storage")
    if (!storageConfigurado()) {
      logArca("warn", "Storage no configurado, PDF no generado", { id: liquidacionId })
      return null
    }

    const { generarPDFLiquidacion } = await import("@/lib/pdf-liquidacion")
    const buffer = await generarPDFLiquidacion(liquidacionId)

    const liq = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: { nroComprobante: true, ptoVenta: true },
    })
    const nro = liq?.nroComprobante
      ? `LP-${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
      : `LP-${liquidacionId.slice(0, 8)}`

    const key = await subirPDF(buffer, "liquidaciones", `${nro}.pdf`)
    return key
  } catch (err) {
    logArca("error", "Error generando PDF fiscal post-autorización", {
      id: liquidacionId,
      error: err instanceof Error ? err.message : String(err),
    })
    return null
  }
}

// ─── Servicio principal ──────────────────────────────────────────────────────

/**
 * autorizarLiquidacionArca: (liquidacionId, idempotencyKey) -> Promise<AutorizarComprobanteResult>
 *
 * Autoriza una liquidación (LP) en ARCA. Flujo completo:
 * 1. Carga config ARCA y valida que esté activa
 * 2. Carga la liquidación y valida que no esté ya autorizada
 * 3. Toma lock atómico (EN_PROCESO) — protección contra doble emisión
 * 4. Obtiene ticket WSAA
 * 5. Sincroniza numeración con FECompUltimoAutorizado
 * 6. Arma payload y llama FECAESolicitar
 * 7. Persiste resultado (CAE, observaciones, request/response)
 * 8. Genera PDF fiscal inmediato con CAE
 *
 * @param liquidacionId — UUID de la liquidación.
 * @param idempotencyKey — UUID único para prevenir doble emisión.
 * @returns Resultado con CAE, número definitivo, QR, etc.
 * @throws DocumentoYaAutorizadoError, DocumentoEnProcesoError, ArcaValidacionError, ArcaRechazoError.
 */
export async function autorizarLiquidacionArca(
  liquidacionId: string,
  idempotencyKey: string
): Promise<AutorizarComprobanteResult> {
  const config = await cargarConfigArca()

  // Cargar liquidación con fletero
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    include: {
      fletero: { select: { cuit: true, condicionIva: true } },
      viajes: { select: { fechaViaje: true }, orderBy: { fechaViaje: "asc" } },
    },
  })

  if (!liq || liq.estado === "ANULADA") {
    throw new DocumentoNoEncontradoError("Liquidación", liquidacionId)
  }

  // Idempotencia: si ya fue autorizado con esta misma key, devolver resultado
  if (liq.idempotencyKey === idempotencyKey && liq.arcaEstado === "AUTORIZADA") {
    return resultadoDesdeRegistro(liq as RegistroAutorizado)
  }

  // Verificar estado (lectura informativa, el lock atómico es la protección real)
  const errorEstado = validarDocumentoNoAutorizado(liq.arcaEstado ?? "PENDIENTE")
  if (errorEstado) {
    if (liq.arcaEstado === "AUTORIZADA") throw new DocumentoYaAutorizadoError(liquidacionId)
    throw new DocumentoEnProcesoError(liquidacionId)
  }

  // Lock atómico: solo avanza si el estado actual es PENDIENTE o RECHAZADA
  const lockOk = await tomarLockLiquidacion(liquidacionId, idempotencyKey)
  if (!lockOk) {
    // Releer para dar mensaje preciso
    const current = await prisma.liquidacion.findUnique({
      where: { id: liquidacionId },
      select: { arcaEstado: true },
    })
    if (current?.arcaEstado === "AUTORIZADA") throw new DocumentoYaAutorizadoError(liquidacionId)
    throw new DocumentoEnProcesoError(liquidacionId)
  }

  // Determinar tipo de comprobante por condición IVA del fletero
  const condIva = (liq.fletero as { condicionIva?: string }).condicionIva ?? "RESPONSABLE_INSCRIPTO"
  const tipoCbte = condIva === "RESPONSABLE_INSCRIPTO" || condIva === "MONOTRIBUTISTA" ? 186 : 187
  const tipoKey = tipoCbte === 186 ? "FACTURA_A" : "FACTURA_B"
  const ptoVenta = config.puntosVenta[tipoKey] ?? config.puntosVenta["FACTURA_A"] ?? 1

  try {
    const result = await _autorizarComprobante(config, {
      tipoDocumento: "LIQUIDACION",
      documentoId: liquidacionId,
      tipoCbte,
      ptoVenta,
      cuitReceptor: liq.fletero.cuit.replace(/\D/g, ""),
      neto: liq.neto,
      ivaMonto: liq.ivaMonto,
      total: liq.total,
      fecha: liq.grabadaEn,
      concepto: 2,
      fechaServDesde: liq.viajes[0]?.fechaViaje ?? liq.grabadaEn,
      fechaServHasta: liq.viajes[liq.viajes.length - 1]?.fechaViaje ?? liq.grabadaEn,
    })

    // Generar PDF fiscal inmediato (post-CAE). Si falla, CAE ya está persistido.
    const pdfKey = await generarPdfFiscalLiquidacion(liquidacionId)
    if (pdfKey) {
      await prisma.liquidacion.update({
        where: { id: liquidacionId },
        data: { pdfS3Key: pdfKey },
      })
      logArca("info", "PDF fiscal generado", { id: liquidacionId, pdfKey })
    }

    return result
  } catch (err) {
    // Revertir lock si falló (RECHAZADA si ARCA rechazó, PENDIENTE si error técnico)
    await prisma.liquidacion.update({
      where: { id: liquidacionId },
      data: { arcaEstado: err instanceof ArcaRechazoError ? "RECHAZADA" : "PENDIENTE" },
    }).catch(() => {})
    throw err
  }
}

/**
 * autorizarFacturaArca: (facturaId, idempotencyKey) -> Promise<AutorizarComprobanteResult>
 *
 * Autoriza una factura emitida a empresa en ARCA. Mismo flujo que liquidación
 * pero con modelo FacturaEmitida y tipos de comprobante 1/6/201.
 *
 * Nota: las facturas no tienen generador PDF con pdfkit — usan HTML.
 * El PDF fiscal no se genera inmediatamente; se regenerará en el próximo GET /pdf.
 */
export async function autorizarFacturaArca(
  facturaId: string,
  idempotencyKey: string
): Promise<AutorizarComprobanteResult> {
  const config = await cargarConfigArca()

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    include: {
      empresa: { select: { cuit: true, condicionIva: true } },
      viajes: { select: { fechaViaje: true }, orderBy: { fechaViaje: "asc" } },
    },
  })

  if (!factura || factura.estado === "ANULADA") {
    throw new DocumentoNoEncontradoError("Factura", facturaId)
  }

  if (factura.idempotencyKey === idempotencyKey && factura.estadoArca === "AUTORIZADA") {
    return resultadoDesdeFactura(factura as FacturaAutorizada)
  }

  const errorEstado = validarDocumentoNoAutorizado(factura.estadoArca)
  if (errorEstado) {
    if (factura.estadoArca === "AUTORIZADA") throw new DocumentoYaAutorizadoError(facturaId)
    throw new DocumentoEnProcesoError(facturaId)
  }

  // Lock atómico
  const lockOk = await tomarLockFactura(facturaId, idempotencyKey)
  if (!lockOk) {
    const current = await prisma.facturaEmitida.findUnique({
      where: { id: facturaId },
      select: { estadoArca: true },
    })
    if (current?.estadoArca === "AUTORIZADA") throw new DocumentoYaAutorizadoError(facturaId)
    throw new DocumentoEnProcesoError(facturaId)
  }

  const tipoCbte = factura.tipoCbte
  const tipoKey = tipoCbte === 201 ? "FACTURA_A" : tipoCbte === 1 ? "FACTURA_A" : "FACTURA_B"
  const ptoVenta = config.puntosVenta[tipoKey] ?? 1

  try {
    return await _autorizarComprobante(config, {
      tipoDocumento: "FACTURA",
      documentoId: facturaId,
      tipoCbte,
      ptoVenta,
      cuitReceptor: factura.empresa.cuit.replace(/\D/g, ""),
      neto: factura.neto,
      ivaMonto: factura.ivaMonto,
      total: factura.total,
      fecha: factura.emitidaEn,
      concepto: 2,
      fechaServDesde: factura.viajes[0]?.fechaViaje ?? factura.emitidaEn,
      fechaServHasta: factura.viajes[factura.viajes.length - 1]?.fechaViaje ?? factura.emitidaEn,
      cbuMiPymes: tipoCbte === 201 ? config.cbuMiPymes : null,
      modalidadMiPymes: tipoCbte === 201 ? factura.modalidadMiPymes : null,
    })
  } catch (err) {
    await prisma.facturaEmitida.update({
      where: { id: facturaId },
      data: { estadoArca: err instanceof ArcaRechazoError ? "RECHAZADA" : "PENDIENTE" },
    }).catch(() => {})
    throw err
  }
}

/**
 * autorizarNotaCDArca: (notaId, idempotencyKey) -> Promise<AutorizarComprobanteResult>
 *
 * Autoriza una nota de crédito o débito emitida en ARCA.
 * Requiere comprobante asociado (factura o liquidación original).
 *
 * Nota: NC/ND no tienen generador PDF — se regenerará en GET /pdf si se implementa.
 */
export async function autorizarNotaCDArca(
  notaId: string,
  idempotencyKey: string
): Promise<AutorizarComprobanteResult> {
  const config = await cargarConfigArca()

  const nota = await prisma.notaCreditoDebito.findUnique({
    where: { id: notaId },
    include: {
      factura: { select: { nroComprobante: true, ptoVenta: true, tipoCbte: true, emitidaEn: true, empresa: { select: { cuit: true, condicionIva: true } } } },
      liquidacion: { select: { nroComprobante: true, ptoVenta: true, tipoCbte: true, grabadaEn: true, fletero: { select: { cuit: true } } } },
    },
  })

  if (!nota || nota.estado === "ANULADA") {
    throw new DocumentoNoEncontradoError("Nota de crédito/débito", notaId)
  }

  if (nota.tipo !== "NC_EMITIDA" && nota.tipo !== "ND_EMITIDA") {
    throw new ArcaValidacionError(["Solo se autorizan NC/ND emitidas en ARCA"])
  }

  if (nota.idempotencyKey === idempotencyKey && nota.arcaEstado === "AUTORIZADA") {
    return resultadoDesdeRegistro(nota as RegistroAutorizado)
  }

  const errorEstado = validarDocumentoNoAutorizado(nota.arcaEstado ?? "PENDIENTE")
  if (errorEstado) {
    if (nota.arcaEstado === "AUTORIZADA") throw new DocumentoYaAutorizadoError(notaId)
    throw new DocumentoEnProcesoError(notaId)
  }

  // Lock atómico
  const lockOk = await tomarLockNotaCD(notaId, idempotencyKey)
  if (!lockOk) {
    const current = await prisma.notaCreditoDebito.findUnique({
      where: { id: notaId },
      select: { arcaEstado: true },
    })
    if (current?.arcaEstado === "AUTORIZADA") throw new DocumentoYaAutorizadoError(notaId)
    throw new DocumentoEnProcesoError(notaId)
  }

  // Determinar comprobante asociado
  let cuitReceptor = ""
  let comprobanteAsociado: DatosComprobanteBase["comprobanteAsociado"]

  if (nota.factura) {
    cuitReceptor = nota.factura.empresa.cuit.replace(/\D/g, "")
    comprobanteAsociado = {
      tipo: nota.factura.tipoCbte,
      ptoVta: nota.factura.ptoVenta ?? 1,
      nro: parseInt(nota.factura.nroComprobante ?? "0"),
      cuit: config.cuit,
      fecha: nota.factura.emitidaEn,
    }
  } else if (nota.liquidacion) {
    cuitReceptor = nota.liquidacion.fletero.cuit.replace(/\D/g, "")
    comprobanteAsociado = {
      tipo: nota.liquidacion.tipoCbte ?? 186,
      ptoVta: nota.liquidacion.ptoVenta ?? 1,
      nro: nota.liquidacion.nroComprobante ?? 0,
      cuit: config.cuit,
      fecha: nota.liquidacion.grabadaEn,
    }
  } else {
    throw new ArcaValidacionError(["La nota no tiene factura ni liquidación asociada"])
  }

  const tipoCbte = nota.tipoCbte ?? 0
  const tipoKey = [2, 3].includes(tipoCbte) ? "NOTA_CREDITO_A" : "NOTA_CREDITO_B"
  const ptoVenta = config.puntosVenta[tipoKey] ?? config.puntosVenta["FACTURA_A"] ?? 1

  try {
    return await _autorizarComprobante(config, {
      tipoDocumento: nota.tipo === "NC_EMITIDA" ? "NOTA_CREDITO" : "NOTA_DEBITO",
      documentoId: notaId,
      tipoCbte,
      ptoVenta,
      cuitReceptor,
      neto: nota.montoNeto,
      ivaMonto: nota.montoIva,
      total: nota.montoTotal,
      fecha: nota.creadoEn,
      concepto: 2,
      fechaServDesde: nota.creadoEn,
      fechaServHasta: nota.creadoEn,
      comprobanteAsociado,
    })
  } catch (err) {
    await prisma.notaCreditoDebito.update({
      where: { id: notaId },
      data: { arcaEstado: err instanceof ArcaRechazoError ? "RECHAZADA" : "PENDIENTE" },
    }).catch(() => {})
    throw err
  }
}

// ─── Flujo interno compartido ────────────────────────────────────────────────

interface AutorizarInput extends Omit<DatosComprobanteBase, "nroComprobante"> {
  tipoDocumento: TipoDocumentoArca
  documentoId: string
  cbuMiPymes?: string | null
  modalidadMiPymes?: string | null
}

async function _autorizarComprobante(
  config: ArcaConfig,
  input: AutorizarInput
): Promise<AutorizarComprobanteResult> {
  logArca("info", "Iniciando autorización ARCA", {
    tipo: input.tipoDocumento,
    id: input.documentoId,
    tipoCbte: input.tipoCbte,
  })

  // 1. Obtener ticket WSAA
  const ticket = await obtenerTicketWsaa(config)
  const auth = { Token: ticket.token, Sign: ticket.sign, Cuit: config.cuit }
  const urls = resolverUrls(config)

  // 2. Sincronizar numeración con ARCA
  const ultimo = await feCompUltimoAutorizado(urls.wsfev1Url, auth, input.ptoVenta, input.tipoCbte)
  const nroDefinitivo = ultimo.CbteNro + 1

  logArca("info", "Numeración sincronizada", {
    ultimoArca: ultimo.CbteNro,
    nroDefinitivo,
    ptoVenta: input.ptoVenta,
    tipoCbte: input.tipoCbte,
  })

  // 3. Armar datos del comprobante con número definitivo
  const datosComprobante: DatosComprobanteBase = {
    ...input,
    nroComprobante: nroDefinitivo,
  }

  // 4. Validar
  const errores = validarPreAutorizacion(config, datosComprobante)
  if (errores.length > 0) throw new ArcaValidacionError(errores)

  // 5. Mapear a payload ARCA
  const request = mapearComprobanteArca(datosComprobante)
  const requestJson = JSON.stringify(request)

  // 6. Llamar FECAESolicitar
  const response = await feCAESolicitar(urls.wsfev1Url, auth, request)
  const responseJson = JSON.stringify(response)

  // 7. Procesar resultado
  const det = response.FeDetResp.FECAEDetResponse[0]
  if (!det) {
    throw new Error("Respuesta FECAESolicitar sin detalle de comprobante")
  }

  const observaciones = det.Observaciones?.Obs?.map((o) => `${o.Code}: ${o.Msg}`).join("; ") ?? ""

  if (det.Resultado === "R") {
    logArca("warn", "Comprobante rechazado por ARCA", {
      tipo: input.tipoDocumento,
      id: input.documentoId,
      observaciones,
    })

    // Persistir rechazo (sin borrar pdfS3Key — puede haber borrador previo)
    await _persistirResultado(input.tipoDocumento, input.documentoId, {
      arcaEstado: "RECHAZADA",
      arcaObservaciones: observaciones,
      requestArcaJson: requestJson,
      responseArcaJson: responseJson,
      nroComprobante: nroDefinitivo,
      ptoVenta: input.ptoVenta,
      tipoCbte: input.tipoCbte,
    })

    throw new ArcaRechazoError(observaciones)
  }

  // Autorizado
  const cae = det.CAE
  const caeVto = parsearFechaArca(det.CAEFchVto)
  const qrData = generarQRFiscal({
    cuitEmisor: config.cuit,
    ptoVenta: input.ptoVenta,
    tipoCbte: input.tipoCbte,
    nroComprobante: nroDefinitivo,
    total: input.total,
    cuitReceptor: input.cuitReceptor,
    cae,
    fechaEmision: input.fecha,
  })

  logArca("info", "Comprobante autorizado exitosamente", {
    tipo: input.tipoDocumento,
    id: input.documentoId,
    cae,
    nroDefinitivo,
  })

  // 8. Persistir resultado exitoso (sin tocar pdfS3Key — se actualiza después
  //    de generar el PDF fiscal en la función caller)
  await _persistirResultado(input.tipoDocumento, input.documentoId, {
    arcaEstado: "AUTORIZADA",
    arcaObservaciones: observaciones || null,
    cae,
    caeVto,
    qrData,
    autorizadaEn: new Date(),
    requestArcaJson: requestJson,
    responseArcaJson: responseJson,
    nroComprobante: nroDefinitivo,
    ptoVenta: input.ptoVenta,
    tipoCbte: input.tipoCbte,
  })

  return {
    ok: true,
    cae,
    caeVto,
    nroComprobante: nroDefinitivo,
    ptoVenta: input.ptoVenta,
    tipoCbte: input.tipoCbte,
    qrData,
  }
}

// ─── Persistencia ────────────────────────────────────────────────────────────

interface PersistirData {
  arcaEstado: string
  arcaObservaciones?: string | null
  cae?: string
  caeVto?: Date
  qrData?: string
  autorizadaEn?: Date
  requestArcaJson: string
  responseArcaJson: string
  nroComprobante: number
  ptoVenta: number
  tipoCbte: number
}

async function _persistirResultado(
  tipo: TipoDocumentoArca,
  id: string,
  data: PersistirData
): Promise<void> {
  if (tipo === "LIQUIDACION") {
    await prisma.liquidacion.update({
      where: { id },
      data: {
        arcaEstado: data.arcaEstado,
        arcaObservaciones: data.arcaObservaciones,
        cae: data.cae,
        caeVto: data.caeVto,
        qrData: data.qrData,
        autorizadaEn: data.autorizadaEn,
        requestArcaJson: data.requestArcaJson,
        responseArcaJson: data.responseArcaJson,
        nroComprobante: data.nroComprobante,
        ptoVenta: data.ptoVenta,
        tipoCbte: data.tipoCbte,
      },
    })
  } else if (tipo === "FACTURA") {
    await prisma.facturaEmitida.update({
      where: { id },
      data: {
        estadoArca: data.arcaEstado,
        arcaObservaciones: data.arcaObservaciones,
        cae: data.cae,
        caeVto: data.caeVto,
        qrData: data.qrData,
        autorizadaEn: data.autorizadaEn,
        requestArcaJson: data.requestArcaJson,
        responseArcaJson: data.responseArcaJson,
        nroComprobante: String(data.nroComprobante),
        ptoVenta: data.ptoVenta,
        tipoCbte: data.tipoCbte,
      },
    })
  } else {
    await prisma.notaCreditoDebito.update({
      where: { id },
      data: {
        arcaEstado: data.arcaEstado,
        arcaObservaciones: data.arcaObservaciones,
        cae: data.cae,
        caeVto: data.caeVto,
        qrData: data.qrData,
        autorizadaEn: data.autorizadaEn,
        requestArcaJson: data.requestArcaJson,
        responseArcaJson: data.responseArcaJson,
        nroComprobante: data.nroComprobante,
        ptoVenta: data.ptoVenta,
        tipoCbte: data.tipoCbte,
      },
    })
  }
}

// ─── Helpers para idempotencia ───────────────────────────────────────────────

interface RegistroAutorizado {
  cae: string | null
  caeVto: Date | null
  nroComprobante: number | null
  ptoVenta: number | null
  tipoCbte: number | null
  qrData: string | null
}

interface FacturaAutorizada {
  cae: string | null
  caeVto: Date | null
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  qrData: string | null
}

function resultadoDesdeRegistro(reg: RegistroAutorizado): AutorizarComprobanteResult {
  return {
    ok: true,
    cae: reg.cae ?? "",
    caeVto: reg.caeVto ?? new Date(),
    nroComprobante: reg.nroComprobante ?? 0,
    ptoVenta: reg.ptoVenta ?? 1,
    tipoCbte: reg.tipoCbte ?? 0,
    qrData: reg.qrData ?? "",
  }
}

function resultadoDesdeFactura(fac: FacturaAutorizada): AutorizarComprobanteResult {
  return {
    ok: true,
    cae: fac.cae ?? "",
    caeVto: fac.caeVto ?? new Date(),
    nroComprobante: parseInt(fac.nroComprobante ?? "0"),
    ptoVenta: fac.ptoVenta ?? 1,
    tipoCbte: fac.tipoCbte,
    qrData: fac.qrData ?? "",
  }
}
