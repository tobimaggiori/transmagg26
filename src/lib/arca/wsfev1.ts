/**
 * Propósito: Cliente SOAP para WSFEv1 (Web Service de Facturación Electrónica v1) de ARCA/AFIP.
 * Implementa las operaciones necesarias: FECAESolicitar, FECompUltimoAutorizado.
 * Construye XML a mano (sin librería SOAP) y parsea con fast-xml-parser.
 * Compatible con Vercel serverless.
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
    // Estas tags siempre son arrays aunque ARCA devuelva uno solo
    return ["FECAEDetResponse", "Obs", "Err", "Evt", "AlicIva", "CbteAsoc", "Opcional"].includes(tagName)
  },
})

/** Timeout para llamadas SOAP a WSFEv1 (10 segundos). */
const WSFEV1_TIMEOUT = 10000

// ─── FECompUltimoAutorizado ──────────────────────────────────────────────────

/**
 * feCompUltimoAutorizado: (url, auth, ptoVta, cbteTipo) -> Promise<UltimoAutorizadoResponse>
 *
 * Consulta el último comprobante autorizado en ARCA para un punto de venta y tipo.
 * Sirve para sincronizar numeración: el próximo número a usar es CbteNro + 1.
 *
 * @param url — URL del servicio WSFEv1 (homo o prod).
 * @param auth — Credenciales Token + Sign + Cuit.
 * @param ptoVta — Punto de venta.
 * @param cbteTipo — Código de tipo de comprobante (1, 6, 186, 187, etc).
 * @returns Último número autorizado.
 * @throws Wsfev1Error si la llamada falla o la respuesta es inválida.
 *
 * Ejemplos:
 * const ultimo = await feCompUltimoAutorizado(url, auth, 1, 186)
 * // ultimo.CbteNro === 42
 * // Próximo a usar: 43
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

  const responseXml = await llamarWsfev1(url, "FECompUltimoAutorizado", soapBody)
  const parsed = xmlParser.parse(responseXml)

  const result = navegarRespuesta(parsed, "FECompUltimoAutorizadoResponse", "FECompUltimoAutorizadoResult")

  if (result?.Errors?.Err) {
    const errores = Array.isArray(result.Errors.Err) ? result.Errors.Err : [result.Errors.Err]
    const msgs = errores.map((e: { Code: number; Msg: string }) => `${e.Code}: ${e.Msg}`).join("; ")
    throw new Wsfev1Error(`FECompUltimoAutorizado: ${msgs}`)
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
 * Solicita la autorización de un comprobante electrónico a ARCA.
 * Devuelve la respuesta completa incluyendo CAE, observaciones y resultado.
 *
 * @param url — URL del servicio WSFEv1.
 * @param auth — Credenciales Token + Sign + Cuit.
 * @param req — Request con cabecera y detalle del comprobante.
 * @returns Respuesta ARCA con CAE si fue aprobado.
 * @throws Wsfev1Error si hay error de comunicación o SOAP fault.
 *
 * Ejemplos:
 * const resp = await feCAESolicitar(url, auth, { FeCabReq: {...}, FeDetReq: {...} })
 * // resp.FeDetResp.FECAEDetResponse[0].Resultado === "A"
 * // resp.FeDetResp.FECAEDetResponse[0].CAE === "74123456789012"
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
      (a) =>
        `<CbteAsoc><Tipo>${a.Tipo}</Tipo><PtoVta>${a.PtoVta}</PtoVta><Nro>${a.Nro}</Nro><Cuit>${a.Cuit}</Cuit><CbteFch>${a.CbteFch}</CbteFch></CbteAsoc>`
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

  const responseXml = await llamarWsfev1(url, "FECAESolicitar", soapBody)
  const parsed = xmlParser.parse(responseXml)

  const result = navegarRespuesta(parsed, "FECAESolicitarResponse", "FECAESolicitarResult")

  if (!result?.FeCabResp) {
    throw new Wsfev1Error("Respuesta de FECAESolicitar sin FeCabResp")
  }

  // Normalizar FeDetResp
  const detResp = result.FeDetResp?.FECAEDetResponse
  const normalizedDet = Array.isArray(detResp) ? detResp : detResp ? [detResp] : []

  // Normalizar observaciones dentro de cada detalle
  for (const d of normalizedDet) {
    if (d.Observaciones?.Obs && !Array.isArray(d.Observaciones.Obs)) {
      d.Observaciones.Obs = [d.Observaciones.Obs]
    }
  }

  // Normalizar errores globales
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

// ─── Helpers internos ────────────────────────────────────────────────────────

/**
 * llamarWsfev1: (url, soapAction, soapBody) -> Promise<string>
 *
 * Envía un request SOAP al endpoint WSFEv1 y devuelve el XML de respuesta.
 */
async function llamarWsfev1(
  url: string,
  soapAction: string,
  soapBody: string
): Promise<string> {
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
      signal: AbortSignal.timeout(WSFEV1_TIMEOUT),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new Wsfev1Error(`Error de red al contactar WSFEv1: ${msg}`)
  }

  const text = await response.text()

  if (!response.ok) {
    const faultMatch = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = faultMatch?.[1] ?? `HTTP ${response.status}`
    throw new Wsfev1Error(`WSFEv1 respondió con error: ${fault}`)
  }

  return text
}

/**
 * navegarRespuesta: (parsed, responseTag, resultTag) -> any
 *
 * Navega la estructura parseada del XML SOAP para extraer el resultado de la operación.
 * La estructura SOAP es: Envelope > Body > {responseTag} > {resultTag}.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function navegarRespuesta(parsed: Record<string, unknown>, responseTag: string, resultTag: string): any {
  const envelope = parsed["soap:Envelope"] ?? parsed["Envelope"] ?? parsed["soapenv:Envelope"]
  if (!envelope || typeof envelope !== "object") throw new Wsfev1Error("Respuesta SOAP sin Envelope")

  const body = (envelope as Record<string, unknown>)["soap:Body"] ?? (envelope as Record<string, unknown>)["Body"] ?? (envelope as Record<string, unknown>)["soapenv:Body"]
  if (!body || typeof body !== "object") throw new Wsfev1Error("Respuesta SOAP sin Body")

  const resp = (body as Record<string, unknown>)[responseTag]
  if (!resp || typeof resp !== "object") throw new Wsfev1Error(`Respuesta SOAP sin ${responseTag}`)

  const result = (resp as Record<string, unknown>)[resultTag]
  if (!result || typeof result !== "object") throw new Wsfev1Error(`Respuesta SOAP sin ${resultTag}`)

  return result as Record<string, unknown>
}
