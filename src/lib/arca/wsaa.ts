/**
 * Propósito: Autenticación contra WSAA (Web Service de Autenticación y Autorización) de ARCA/AFIP.
 * Implementa la generación del TRA (Ticket de Requerimiento de Acceso), firma CMS/PKCS#7
 * con certificado digital, llamada SOAP al WSAA, y cache del ticket en base de datos.
 *
 * Compatible con Vercel serverless: no depende de estado en memoria entre invocaciones.
 * Usa node-forge (pure JS) para CMS signing — sin dependencias nativas.
 */

import forge from "node-forge"
import { prisma } from "@/lib/prisma"
import { WsaaError } from "./errors"
import type { ArcaConfig, TicketAcceso } from "./types"
import { resolverUrls } from "./config"

/** Margen de seguridad: renovar 5 minutos antes de que expire. */
const MARGEN_EXPIRACION_MS = 5 * 60 * 1000

/**
 * obtenerTicketWsaa: (config: ArcaConfig, servicio?: string) -> Promise<TicketAcceso>
 *
 * Obtiene un ticket de acceso WSAA vigente. Primero busca en la DB (cache).
 * Si no existe o expiró, solicita uno nuevo al WSAA y lo persiste.
 *
 * @param config — Configuración ARCA con certificado y modo.
 * @param servicio — Nombre del servicio ARCA (default: "wsfe").
 * @returns Ticket con token, sign y fecha de expiración.
 * @throws WsaaError si la autenticación falla.
 *
 * Ejemplos:
 * const ticket = await obtenerTicketWsaa(config)
 * // ticket.token === "PD94bWwg..."
 * // ticket.sign === "m4SXdz..."
 * // ticket.expiresAt > new Date()
 */
export async function obtenerTicketWsaa(
  config: ArcaConfig,
  servicio = "wsfe"
): Promise<TicketAcceso> {
  // 1. Buscar ticket vigente en DB
  const cached = await prisma.ticketWsaa.findUnique({ where: { id: servicio } })

  if (cached && new Date(cached.expiresAt).getTime() > Date.now() + MARGEN_EXPIRACION_MS) {
    return {
      token: cached.token,
      sign: cached.sign,
      expiresAt: new Date(cached.expiresAt),
    }
  }

  // 2. Solicitar ticket nuevo al WSAA
  const ticket = await solicitarTicketWsaa(config, servicio)

  // 3. Persistir en DB (upsert)
  await prisma.ticketWsaa.upsert({
    where: { id: servicio },
    create: {
      id: servicio,
      token: ticket.token,
      sign: ticket.sign,
      expiresAt: ticket.expiresAt,
    },
    update: {
      token: ticket.token,
      sign: ticket.sign,
      expiresAt: ticket.expiresAt,
      obtainedAt: new Date(),
    },
  })

  return ticket
}

/**
 * solicitarTicketWsaa: (config, servicio) -> Promise<TicketAcceso>
 *
 * Genera un TRA, lo firma con CMS, envía al WSAA por SOAP y parsea la respuesta.
 * Esta función siempre hace una llamada de red al WSAA — usar obtenerTicketWsaa
 * que maneja el cache.
 */
async function solicitarTicketWsaa(
  config: ArcaConfig,
  servicio: string
): Promise<TicketAcceso> {
  // Generar TRA
  const now = new Date()
  const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000) // +12 horas
  const tra = generarTRA(servicio, now, expiration)

  // Firmar con CMS
  const cmsSigned = firmarCMS(tra, config.certificadoB64, config.certificadoPass)

  // Llamar WSAA
  const urls = resolverUrls(config)
  const responseXml = await llamarWsaa(urls.wsaaUrl, cmsSigned)

  // Parsear respuesta
  return parsearLoginTicketResponse(responseXml, expiration)
}

/**
 * generarTRA: (servicio, desde, hasta) -> string
 *
 * Genera el XML del Ticket de Requerimiento de Acceso (TRA) según la especificación WSAA.
 *
 * Ejemplos:
 * generarTRA("wsfe", new Date(), new Date(Date.now() + 12*3600*1000))
 * // '<?xml version="1.0"?><loginTicketRequest version="1.0">...'
 */
export function generarTRA(servicio: string, desde: Date, hasta: Date): string {
  const uniqueId = Math.floor(Math.random() * 2147483647)
  return [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<loginTicketRequest version="1.0">`,
    `  <header>`,
    `    <uniqueId>${uniqueId}</uniqueId>`,
    `    <generationTime>${desde.toISOString()}</generationTime>`,
    `    <expirationTime>${hasta.toISOString()}</expirationTime>`,
    `  </header>`,
    `  <service>${servicio}</service>`,
    `</loginTicketRequest>`,
  ].join("\n")
}

/**
 * firmarCMS: (contenido, certB64, password) -> string
 *
 * Firma el contenido (TRA XML) usando CMS/PKCS#7 con el certificado PKCS#12 provisto.
 * Devuelve el signed data en base64, listo para enviar al WSAA.
 *
 * @param contenido — String a firmar (TRA XML).
 * @param certB64 — Certificado PKCS#12 (.pfx/.p12) codificado en base64.
 * @param password — Contraseña del certificado.
 * @returns CMS signed data en base64.
 * @throws WsaaError si el certificado es inválido o no se puede parsear.
 */
export function firmarCMS(contenido: string, certB64: string, password: string): string {
  try {
    // Decodificar PKCS#12
    const p12Der = forge.util.decode64(certB64)
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    // Extraer certificado y clave privada
    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })

    const certBag = certBags[forge.pki.oids.certBag]
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]

    if (!certBag?.[0]?.cert || !keyBag?.[0]?.key) {
      throw new Error("No se encontró certificado o clave privada en el archivo PKCS#12")
    }

    const cert = certBag[0].cert
    const privateKey = keyBag[0].key

    // Crear PKCS#7 signed data
    const p7 = forge.pkcs7.createSignedData()
    p7.content = forge.util.createBuffer(contenido, "utf8")
    p7.addCertificate(cert)
    p7.addSigner({
      key: privateKey,
      certificate: cert,
      digestAlgorithm: forge.pki.oids.sha256,
      authenticatedAttributes: [
        { type: forge.pki.oids.contentType, value: forge.pki.oids.data },
        { type: forge.pki.oids.messageDigest },
        { type: forge.pki.oids.signingTime, value: new Date().toISOString() },
      ],
    })
    p7.sign()

    // Serializar a DER y luego base64
    const asn1 = p7.toAsn1()
    const der = forge.asn1.toDer(asn1).getBytes()
    return forge.util.encode64(der)
  } catch (err) {
    if (err instanceof WsaaError) throw err
    const msg = err instanceof Error ? err.message : String(err)
    throw new WsaaError(`Error al firmar TRA: ${msg}`)
  }
}

/**
 * llamarWsaa: (url, cmsSigned) -> Promise<string>
 *
 * Envía el CMS firmado al endpoint WSAA mediante SOAP y devuelve el XML de respuesta.
 *
 * @throws WsaaError si hay error de red, timeout o SOAP fault.
 */
async function llamarWsaa(url: string, cmsSigned: string): Promise<string> {
  const soapEnvelope = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">`,
    `  <soapenv:Body>`,
    `    <wsaa:loginCms>`,
    `      <wsaa:in0>${cmsSigned}</wsaa:in0>`,
    `    </wsaa:loginCms>`,
    `  </soapenv:Body>`,
    `</soapenv:Envelope>`,
  ].join("\n")

  let response: Response
  try {
    response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        SOAPAction: "",
      },
      body: soapEnvelope,
      signal: AbortSignal.timeout(15000),
    })
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err)
    throw new WsaaError(`Error de red al contactar WSAA: ${msg}`)
  }

  const text = await response.text()

  if (!response.ok) {
    // Extraer fault string si existe
    const faultMatch = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = faultMatch?.[1] ?? `HTTP ${response.status}`
    throw new WsaaError(`WSAA respondió con error: ${fault}`)
  }

  return text
}

/**
 * parsearLoginTicketResponse: (xml, expirationFallback) -> TicketAcceso
 *
 * Extrae token y sign del XML de respuesta del WSAA.
 * Usa regex simple en vez de un parser XML pesado — la respuesta del WSAA
 * tiene estructura fija y estable.
 *
 * @throws WsaaError si no se encuentra token o sign en la respuesta.
 */
export function parsearLoginTicketResponse(xml: string, expirationFallback: Date): TicketAcceso {
  // La respuesta contiene el loginTicketResponse como string dentro del SOAP body
  const returnMatch = xml.match(/<loginCmsReturn>([\s\S]*?)<\/loginCmsReturn>/)
  const ticketXml = returnMatch?.[1]
    ?.replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')

  if (!ticketXml) {
    throw new WsaaError("Respuesta WSAA no contiene loginCmsReturn")
  }

  const tokenMatch = ticketXml.match(/<token>([\s\S]*?)<\/token>/)
  const signMatch = ticketXml.match(/<sign>([\s\S]*?)<\/sign>/)
  const expirationMatch = ticketXml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)

  if (!tokenMatch?.[1] || !signMatch?.[1]) {
    throw new WsaaError("Respuesta WSAA no contiene token o sign")
  }

  let expiresAt = expirationFallback
  if (expirationMatch?.[1]) {
    const parsed = new Date(expirationMatch[1])
    if (!isNaN(parsed.getTime())) expiresAt = parsed
  }

  return {
    token: tokenMatch[1].trim(),
    sign: signMatch[1].trim(),
    expiresAt,
  }
}
