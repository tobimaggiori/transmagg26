/**
 * SOAP request/response del método `getPersona_v2` del servicio
 * `ws_sr_constancia_inscripcion` (padrón A5).
 *
 * Estructura de respuesta:
 *   <personaReturn>
 *     <datosGenerales>
 *       <apellido/<nombre/<razonSocial> idPersona, tipoPersona, estadoClave
 *       <domicilioFiscal>direccion, codPostal, localidad, descripcionProvincia, ...
 *     <datosMonotributo> ... (solo si es monotributista)
 *       <impuesto> idImpuesto, descripcionImpuesto, estadoImpuesto, ...
 *     <datosRegimenGeneral> ... (solo si es régimen general)
 *       <impuesto>...
 */

import { fetchArcaSOAP } from "@/lib/arca/proxy"
import { PadronArcaError, PadronArcaNoEncontradoError } from "./errors"
import type {
  PersonaPadronArca,
  DomicilioFiscalArca,
  ImpuestoArca,
  CategoriaArca,
  RegimenArca,
} from "./types"

const TIMEOUT_MS = 15000

export async function llamarGetPersona(input: {
  url: string
  token: string
  sign: string
  cuitRepresentada: string
  cuitConsultado: string
}): Promise<PersonaPadronArca> {
  const envelope = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:a5="http://a5.soap.ws.server.puc.sr/">`,
    `  <soapenv:Body>`,
    `    <a5:getPersona_v2>`,
    `      <token>${input.token}</token>`,
    `      <sign>${input.sign}</sign>`,
    `      <cuitRepresentada>${input.cuitRepresentada}</cuitRepresentada>`,
    `      <idPersona>${input.cuitConsultado}</idPersona>`,
    `    </a5:getPersona_v2>`,
    `  </soapenv:Body>`,
    `</soapenv:Envelope>`,
  ].join("\n")

  let res: Response
  try {
    res = await fetchArcaSOAP(
      input.url,
      { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      envelope,
      TIMEOUT_MS,
    )
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "Timeout al contactar el padrón ARCA"
      : "Error de red al contactar el padrón ARCA"
    throw new PadronArcaError(msg, true)
  }

  const text = await res.text()
  if (!res.ok) {
    const m = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = m?.[1] ?? `HTTP ${res.status}`
    throw new PadronArcaError(`Padrón respondió con error: ${fault}`, res.status >= 500)
  }

  if (/No existe persona|persona inexistente/i.test(text)) {
    throw new PadronArcaNoEncontradoError(input.cuitConsultado)
  }

  return parsearGetPersona(text, input.cuitConsultado)
}

export function parsearGetPersona(xml: string, cuitConsultado: string): PersonaPadronArca {
  const personaReturn = capturar(xml, "personaReturn") ?? xml
  const datosGenerales = capturar(personaReturn, "datosGenerales")
  if (!datosGenerales) {
    throw new PadronArcaNoEncontradoError(cuitConsultado)
  }

  const cuit = textoTag(datosGenerales, "idPersona") ?? cuitConsultado
  const tipoPersona = textoTag(datosGenerales, "tipoPersona")
  const estadoClave = textoTag(datosGenerales, "estadoClave")
  const razonSocial = textoTag(datosGenerales, "razonSocial")
  const nombre = textoTag(datosGenerales, "nombre")
  const apellido = textoTag(datosGenerales, "apellido")

  const domXml = capturar(datosGenerales, "domicilioFiscal")
  const domicilioFiscal: DomicilioFiscalArca | null = domXml
    ? {
        direccion: textoTag(domXml, "direccion"),
        codPostal: textoTag(domXml, "codPostal") ?? textoTag(domXml, "codigoPostal"),
        localidad: textoTag(domXml, "localidad"),
        descripcionProvincia: textoTag(domXml, "descripcionProvincia"),
      }
    : null

  // Régimen: depende de qué bloque viene
  const datosMonotributo = capturar(personaReturn, "datosMonotributo")
  const datosRegimenGeneral = capturar(personaReturn, "datosRegimenGeneral")
  let regimen: RegimenArca = null
  let bloqueImpuestos: string | null = null
  if (datosMonotributo) {
    regimen = "MONOTRIBUTO"
    bloqueImpuestos = datosMonotributo
  } else if (datosRegimenGeneral) {
    regimen = "REGIMEN_GENERAL"
    bloqueImpuestos = datosRegimenGeneral
  }

  const impuestos: ImpuestoArca[] = bloqueImpuestos
    ? capturarTodos(bloqueImpuestos, "impuesto").map((x) => ({
        idImpuesto: parseInt(textoTag(x, "idImpuesto") ?? "0", 10),
        descripcionImpuesto: textoTag(x, "descripcionImpuesto"),
        // A5 usa <estadoImpuesto> con valores "AC" (activo) / "NA" / "EX".
        estado: textoTag(x, "estadoImpuesto") ?? textoTag(x, "estado"),
      }))
    : []

  const categorias: CategoriaArca[] = bloqueImpuestos
    ? [
        ...capturarTodos(bloqueImpuestos, "categoria"),
        ...capturarTodos(bloqueImpuestos, "categoriaMonotributo"),
      ].map((x) => ({
        idImpuesto: parseInt(textoTag(x, "idImpuesto") ?? "0", 10),
        descripcionImpuesto: textoTag(x, "descripcionImpuesto"),
        idCategoria: parseInt(textoTag(x, "idCategoria") ?? "0", 10) || null,
        descripcionCategoria: textoTag(x, "descripcionCategoria"),
        estado: textoTag(x, "estadoCategoria") ?? textoTag(x, "estado"),
      }))
    : []

  return {
    cuit,
    tipoPersona,
    estadoClave,
    razonSocial,
    nombre,
    apellido,
    domicilioFiscal,
    regimen,
    impuestos,
    categorias,
  }
}

// ─── Helpers de parseo XML por regex ────────────────────────────────────────

function capturar(xml: string, tag: string): string | null {
  const m = xml.match(new RegExp(`<(?:[\\w]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w]+:)?${tag}>`))
  return m?.[1] ?? null
}

function capturarTodos(xml: string, tag: string): string[] {
  const re = new RegExp(`<(?:[\\w]+:)?${tag}\\b[^>]*>([\\s\\S]*?)</(?:[\\w]+:)?${tag}>`, "g")
  const out: string[] = []
  let m: RegExpExecArray | null
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}

function textoTag(xml: string, tag: string): string | null {
  const v = capturar(xml, tag)
  return v != null ? decodeXml(v.trim()) || null : null
}

function decodeXml(s: string): string {
  return s
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
}
