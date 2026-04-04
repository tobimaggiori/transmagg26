/**
 * Propósito: Cliente SOAP para WSFEv1 de ARCA/AFIP.
 * FECAESolicitar + FECompUltimoAutorizado.
 *
 * Hardening:
 * - 1 retry con backoff para errores de red/timeout.
 * - No retry para errores SOAP funcionales (ARCA rechazó, CUIT inválido, etc).
 * - Timeout explícito de 15s (Vercel tiene límite de 30s).
 * - Clasificación de errores: retryable vs permanente.
 * - Sanitización: nunca loguea token/sign completos.
 */

import { XMLParser } from "fast-xml-parser"
import { Wsfev1Error } from "./errors"
import type {
  AuthWsfev1,
  FECAERequest,
  FECAEResponse,
  UltimoAutorizadoResponse,
} from "./types"

const xmlParser = new XMLParser({
  ignoreAttributes: false,
  parseTagValue: true,
  trimValues: true,
  isArray: (tagName) => {
    return ["FECAEDetResponse", "Obs", "Err", "Evt", "AlicIva", "CbteAsoc", "Opcional"].includes(tagName)
  },
})

/** Timeout para llamadas SOAP a WSFEv1. */
const WSFEV1_TIMEOUT_MS = 15000

/** Delay entre reintentos. */
const RETRY_DELAY_MS = 2000

/** Máximo de reintentos para errores transitorios. */
const MAX_RETRIES = 1

// ─── FECompUltimoAutorizado ──────────────────────────────────────────────────

/**
 * feCompUltimoAutorizado: (url, auth, ptoVta, cbteTipo) -> Promise<UltimoAutorizadoResponse>
 *
 * Consulta el último comprobante autorizado en ARCA para un punto de venta y tipo.
 * Con 1 retry para errores transitorios de red.
 */
export async function feCompUltimoAutorizado(
  url: string,
  auth: AuthWsfev1,
  ptoVta: number,
  cbteTipo: number
): Promise<UltimoAutorizadoResponse> {
  const soapBody = `
    <FECompUltimoAutorizado xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${auth.Token}</Token>
        <Sign>${auth.Sign}</Sign>
        <Cuit>${auth.Cuit}</Cuit>
      </Auth>
      <PtoVta>${ptoVta}</PtoVta>
      <CbteTipo>${cbteTipo}</CbteTipo>
    </FECompUltimoAutorizado>`

  const responseXml = await llamarConRetry(url, "FECompUltimoAutorizado", soapBody)
  const parsed = xmlParser.parse(responseXml)
  const result = navegarRespuesta(parsed, "FECompUltimoAutorizadoResponse", "FECompUltimoAutorizadoResult")

  if (result?.Errors?.Err) {
    const errores = Array.isArray(result.Errors.Err) ? result.Errors.Err : [result.Errors.Err]
    const msgs = errores.map((e: { Code: number; Msg: string }) => `${e.Code}: ${e.Msg}`).join("; ")
    // Errores funcionales de ARCA no son reintentables
    throw new Wsfev1Error(`FECompUltimoAutorizado: ${msgs}`, false)
  }

  return {
    PtoVta: Number(result.PtoVta ?? ptoVta),
    CbteTipo: Number(result.CbteTipo ?? cbteTipo),
    CbteNro: Number(result.CbteNro ?? 0),
  }
}

// ─── FECAESolicitar ──────────────────────────────────────────────────────────

/**
 * feCAESolicitar: (url, auth, req) -> Promise<FECAEResponse>
 *
 * Solicita autorización de comprobante electrónico. Con 1 retry para errores de red.
 * IMPORTANTE: FECAESolicitar es idempotente en ARCA si se envía el mismo CbteDesde/CbteHasta
 * para el mismo PtoVta/CbteTipo — ARCA devuelve el mismo CAE si ya fue autorizado.
 */
export async function feCAESolicitar(
  url: string,
  auth: AuthWsfev1,
  req: FECAERequest
): Promise<FECAEResponse> {
  const det = req.FeDetReq.FECAEDetRequest[0]

  let ivaXml = ""
  if (det.Iva?.AlicIva && det.Iva.AlicIva.length > 0) {
    const items = det.Iva.AlicIva.map(
      (a) => `<AlicIva><Id>${a.Id}</Id><BaseImp>${a.BaseImp}</BaseImp><Importe>${a.Importe}</Importe></AlicIva>`
    ).join("")
    ivaXml = `<Iva>${items}</Iva>`
  }

  let cbtesAsocXml = ""
  if (det.CbtesAsoc?.CbteAsoc && det.CbtesAsoc.CbteAsoc.length > 0) {
    const items = det.CbtesAsoc.CbteAsoc.map(
      (a) => `<CbteAsoc><Tipo>${a.Tipo}</Tipo><PtoVta>${a.PtoVta}</PtoVta><Nro>${a.Nro}</Nro><Cuit>${a.Cuit}</Cuit><CbteFch>${a.CbteFch}</CbteFch></CbteAsoc>`
    ).join("")
    cbtesAsocXml = `<CbtesAsoc>${items}</CbtesAsoc>`
  }

  let opcionalesXml = ""
  if (det.Opcionales?.Opcional && det.Opcionales.Opcional.length > 0) {
    const items = det.Opcionales.Opcional.map(
      (o) => `<Opcional><Id>${o.Id}</Id><Valor>${o.Valor}</Valor></Opcional>`
    ).join("")
    opcionalesXml = `<Opcionales>${items}</Opcionales>`
  }

  const fchServXml = det.FchServDesde
    ? `<FchServDesde>${det.FchServDesde}</FchServDesde><FchServHasta>${det.FchServHasta}</FchServHasta><FchVtoPago>${det.FchVtoPago}</FchVtoPago>`
    : ""

  const soapBody = `
    <FECAESolicitar xmlns="http://ar.gov.afip.dif.FEV1/">
      <Auth>
        <Token>${auth.Token}</Token>
        <Sign>${auth.Sign}</Sign>
        <Cuit>${auth.Cuit}</Cuit>
      </Auth>
      <FeCAEReq>
        <FeCabReq>
          <CantReg>${req.FeCabReq.CantReg}</CantReg>
          <PtoVta>${req.FeCabReq.PtoVta}</PtoVta>
          <CbteTipo>${req.FeCabReq.CbteTipo}</CbteTipo>
        </FeCabReq>
        <FeDetReq>
          <FECAEDetRequest>
            <Concepto>${det.Concepto}</Concepto>
            <DocTipo>${det.DocTipo}</DocTipo>
            <DocNro>${det.DocNro}</DocNro>
            <CbteDesde>${det.CbteDesde}</CbteDesde>
            <CbteHasta>${det.CbteHasta}</CbteHasta>
            <CbteFch>${det.CbteFch}</CbteFch>
            <ImpTotal>${det.ImpTotal}</ImpTotal>
            <ImpTotConc>${det.ImpTotConc}</ImpTotConc>
            <ImpNeto>${det.ImpNeto}</ImpNeto>
            <ImpOpEx>${det.ImpOpEx}</ImpOpEx>
            <ImpTrib>${det.ImpTrib}</ImpTrib>
            <ImpIVA>${det.ImpIVA}</ImpIVA>
            ${fchServXml}
            <MonId>${det.MonId}</MonId>
            <MonCotiz>${det.MonCotiz}</MonCotiz>
            ${ivaXml}
            ${cbtesAsocXml}
            ${opcionalesXml}
          </FECAEDetRequest>
        </FeDetReq>
      </FeCAEReq>
    </FECAESolicitar>`

  const responseXml = await llamarConRetry(url, "FECAESolicitar", soapBody)
  const parsed = xmlParser.parse(responseXml)
  const result = navegarRespuesta(parsed, "FECAESolicitarResponse", "FECAESolicitarResult")

  if (!result?.FeCabResp) {
    throw new Wsfev1Error("Respuesta de FECAESolicitar sin FeCabResp", true)
  }

  const detResp = result.FeDetResp?.FECAEDetResponse
  const normalizedDet = Array.isArray(detResp) ? detResp : detResp ? [detResp] : []

  for (const d of normalizedDet) {
    if (d.Observaciones?.Obs && !Array.isArray(d.Observaciones.Obs)) {
      d.Observaciones.Obs = [d.Observaciones.Obs]
    }
  }

  if (result.Errors?.Err && !Array.isArray(result.Errors.Err)) {
    result.Errors.Err = [result.Errors.Err]
  }

  return {
    FeCabResp: result.FeCabResp,
    FeDetResp: { FECAEDetResponse: normalizedDet },
    Errors: result.Errors,
    Events: result.Events,
  }
}

// ─── SOAP Call con retry ─────────────────────────────────────────────────────

async function llamarConRetry(url: string, soapAction: string, soapBody: string): Promise<string> {
  let lastError: Wsfev1Error | null = null

  for (let intento = 0; intento <= MAX_RETRIES; intento++) {
    try {
      return await llamarWsfev1(url, soapAction, soapBody)
    } catch (err) {
      if (!(err instanceof Wsfev1Error)) throw err
      lastError = err

      // Solo reintentar errores transitorios (red, timeout, 5xx)
      if (!err.retryable || intento >= MAX_RETRIES) throw err

      await sleep(RETRY_DELAY_MS * (intento + 1))
    }
  }

  throw lastError ?? new Wsfev1Error("Error desconocido en WSFEv1")
}

async function llamarWsfev1(url: string, soapAction: string, soapBody: string): Promise<string> {
  const envelope = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<soap:Envelope xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/">`,
    `  <soap:Body>`,
    soapBody,
    `  </soap:Body>`,
    `</soap:Envelope>`,
  ].join("\n")

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: `http://ar.gov.afip.dif.FEV1/${soapAction}`,
      },
      body: envelope,
      signal: AbortSignal.timeout(WSFEV1_TIMEOUT_MS),
    })
  } catch (err) {
    const isTimeout = err instanceof Error && err.name === "TimeoutError"
    const msg = isTimeout ? `Timeout (${WSFEV1_TIMEOUT_MS}ms) al contactar WSFEv1` : "Error de red al contactar WSFEv1"
    throw new Wsfev1Error(msg, true) // Transitorio → reintentable
  }

  const text = await response.text()

  if (!response.ok) {
    const faultMatch = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = faultMatch?.[1] ?? `HTTP ${response.status}`
    const retryable = response.status >= 500 // 5xx transitorio, 4xx permanente
    throw new Wsfev1Error(`WSFEv1 respondió con error: ${fault}`, retryable)
  }

  return text
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function navegarRespuesta(parsed: Record<string, unknown>, responseTag: string, resultTag: string): any {
  const envelope = parsed["soap:Envelope"] ?? parsed["Envelope"] ?? parsed["soapenv:Envelope"]
  if (!envelope || typeof envelope !== "object") throw new Wsfev1Error("Respuesta SOAP sin Envelope", true)

  const body = (envelope as Record<string, unknown>)["soap:Body"] ?? (envelope as Record<string, unknown>)["Body"] ?? (envelope as Record<string, unknown>)["soapenv:Body"]
  if (!body || typeof body !== "object") throw new Wsfev1Error("Respuesta SOAP sin Body", true)

  const resp = (body as Record<string, unknown>)[responseTag]
  if (!resp || typeof resp !== "object") throw new Wsfev1Error(`Respuesta SOAP sin ${responseTag}`, true)

  const result = (resp as Record<string, unknown>)[resultTag]
  if (!result || typeof result !== "object") throw new Wsfev1Error(`Respuesta SOAP sin ${resultTag}`, true)

  return result as Record<string, unknown>
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
