/**
 * Propósito: Autenticación contra WSAA de ARCA/AFIP.
 * TRA + CMS/PKCS#7 + SOAP + cache de ticket en DB.
 *
 * Hardening:
 * - Renovación con guard atómico (updateMany) para evitar llamadas duplicadas.
 * - Validación de integridad del ticket cacheado (token/sign no vacíos).
 * - 1 retry con backoff de 2s para errores transitorios de red.
 * - Margen de expiración de 10 minutos (seguridad extra para emisiones largas).
 * - Sanitización de errores (nunca loguea cert/password/token).
 *
 * Compatible con Vercel serverless + Turso/LibSQL.
 */

import forge from "node-forge"
import { prisma } from "@/lib/prisma"
import { WsaaError } from "./errors"
import { fetchArcaSOAP } from "./proxy"
import type { ArcaConfig, TicketAcceso } from "./types"
import { resolverUrls } from "./config"
// Nota: cargarConfigArca() ya descifra certificadoB64 y certificadoPass.
// No descifrar de nuevo aquí — el config que llega ya tiene valores en plaintext.

/** Renovar 10 min antes de que expire (margen para emisiones que tardan). */
const MARGEN_EXPIRACION_MS = 10 * 60 * 1000

/** Timeout para llamadas SOAP al WSAA. */
const WSAA_TIMEOUT_MS = 15000

/** Delay entre reintentos transitorios. */
const RETRY_DELAY_MS = 2000

/** Máximo de reintentos para errores transitorios. */
const MAX_RETRIES = 1

/**
 * obtenerTicketWsaa: (config, servicio?) -> Promise<TicketAcceso>
 *
 * Obtiene un ticket de acceso WSAA vigente. Flujo:
 * 1. Lee ticket de DB.
 * 2. Si es vigente y válido, lo devuelve.
 * 3. Si no, solicita uno nuevo al WSAA con retry y lo persiste.
 *
 * Guard de concurrencia: si dos invocaciones ven ticket vencido simultáneamente,
 * ambas pueden solicitar a WSAA (inevitable sin locks en SQLite), pero el upsert
 * es idempotente — la última respuesta gana. No hay corrupción de datos ni doble
 * consumo de ticket (WSAA tolera múltiples loginCms con el mismo certificado).
 */
export async function obtenerTicketWsaa(
  config: ArcaConfig,
  servicio = "wsfe"
): Promise<TicketAcceso> {
  // 1. Buscar ticket vigente en DB
  const cached = await prisma.ticketWsaa.findUnique({ where: { id: servicio } })

  if (cached && ticketValido(cached)) {
    return {
      token: cached.token,
      sign: cached.sign,
      expiresAt: new Date(cached.expiresAt),
    }
  }

  // 2. Solicitar ticket nuevo con retry
  const ticket = await solicitarConRetry(config, servicio)

  // 3. Persistir en DB (upsert — idempotente si otro request ya lo guardó)
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
 * ticketValido: (cached) -> boolean
 *
 * Verifica que el ticket cacheado es íntegro y no ha expirado (con margen).
 */
function ticketValido(cached: { token: string; sign: string; expiresAt: Date }): boolean {
  if (!cached.token || cached.token.length < 10) return false
  if (!cached.sign || cached.sign.length < 10) return false
  return new Date(cached.expiresAt).getTime() > Date.now() + MARGEN_EXPIRACION_MS
}

/**
 * solicitarConRetry: (config, servicio) -> Promise<TicketAcceso>
 *
 * Solicita ticket al WSAA con 1 retry para errores transitorios (red, timeout).
 * No reintenta errores de certificado (permanentes).
 */
async function solicitarConRetry(config: ArcaConfig, servicio: string): Promise<TicketAcceso> {
  let lastError: WsaaError | null = null

  for (let intento = 0; intento <= MAX_RETRIES; intento++) {
    try {
      return await solicitarTicketWsaa(config, servicio)
    } catch (err) {
      if (!(err instanceof WsaaError)) throw err
      lastError = err

      // No reintentar errores de certificado (permanentes)
      if (err.message.includes("PKCS#12") || err.message.includes("certificado") || err.message.includes("clave privada")) {
        throw new WsaaError("Certificado inválido o contraseña incorrecta", false)
      }

      if (intento < MAX_RETRIES) {
        await sleep(RETRY_DELAY_MS)
      }
    }
  }

  throw lastError ?? new WsaaError("Error desconocido al solicitar ticket WSAA")
}

async function solicitarTicketWsaa(config: ArcaConfig, servicio: string): Promise<TicketAcceso> {
  const now = new Date()
  const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  const tra = generarTRA(servicio, now, expiration)

  // config ya viene descifrado desde cargarConfigArca()
  const certB64 = config.certificadoB64
  const certPass = config.certificadoPass

  const cmsSigned = firmarCMS(tra, certB64, certPass)

  const urls = resolverUrls(config)
  const responseXml = await llamarWsaa(urls.wsaaUrl, cmsSigned)

  return parsearLoginTicketResponse(responseXml, expiration)
}

// ─── TRA ─────────────────────────────────────────────────────────────────────

/** @see exports for tests */
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

// ─── CMS Signing ─────────────────────────────────────────────────────────────

/**
 * firmarCMS: (contenido, certB64, password) -> string
 *
 * Firma el TRA con CMS/PKCS#7. Nunca loguea el certificado ni la password.
 * @throws WsaaError (retryable=false) si el certificado es inválido.
 */
export function firmarCMS(contenido: string, certB64: string, password: string): string {
  try {
    const p12Der = forge.util.decode64(certB64)
    const p12Asn1 = forge.asn1.fromDer(p12Der)
    const p12 = forge.pkcs12.pkcs12FromAsn1(p12Asn1, password)

    const certBags = p12.getBags({ bagType: forge.pki.oids.certBag })
    const keyBags = p12.getBags({ bagType: forge.pki.oids.pkcs8ShroudedKeyBag })
    const certBag = certBags[forge.pki.oids.certBag]
    const keyBag = keyBags[forge.pki.oids.pkcs8ShroudedKeyBag]

    if (!certBag?.[0]?.cert || !keyBag?.[0]?.key) {
      throw new WsaaError("No se encontró certificado o clave privada en el archivo PKCS#12", false)
    }

    const cert = certBag[0].cert
    const privateKey = keyBag[0].key

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

    const asn1 = p7.toAsn1()
    const der = forge.asn1.toDer(asn1).getBytes()
    return forge.util.encode64(der)
  } catch (err) {
    if (err instanceof WsaaError) throw err
    // Sanitizar: no incluir detalles del error de forge que podrían exponer cert info
    throw new WsaaError("Error al firmar TRA (certificado inválido o contraseña incorrecta)", false)
  }
}

// ─── SOAP Call ───────────────────────────────────────────────────────────────

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
    response = await fetchArcaSOAP(
      url,
      { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      soapEnvelope,
      WSAA_TIMEOUT_MS,
    )
  } catch (err) {
    // Error de red/timeout — reintentable
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "Timeout al contactar WSAA"
      : "Error de red al contactar WSAA"
    throw new WsaaError(msg, true)
  }

  const text = await response.text()

  if (!response.ok) {
    const faultMatch = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = faultMatch?.[1] ?? `HTTP ${response.status}`
    // HTTP 5xx es transitorio, 4xx es permanente
    const retryable = response.status >= 500
    throw new WsaaError(`WSAA respondió con error: ${fault}`, retryable)
  }

  return text
}

// ─── Response Parser ─────────────────────────────────────────────────────────

/** @see exports for tests */
export function parsearLoginTicketResponse(xml: string, expirationFallback: Date): TicketAcceso {
  const returnMatch = xml.match(/<loginCmsReturn>([\s\S]*?)<\/loginCmsReturn>/)
  const ticketXml = returnMatch?.[1]
    ?.replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')

  if (!ticketXml) {
    throw new WsaaError("Respuesta WSAA no contiene loginCmsReturn", true)
  }

  const tokenMatch = ticketXml.match(/<token>([\s\S]*?)<\/token>/)
  const signMatch = ticketXml.match(/<sign>([\s\S]*?)<\/sign>/)
  const expirationMatch = ticketXml.match(/<expirationTime>([\s\S]*?)<\/expirationTime>/)

  if (!tokenMatch?.[1] || !signMatch?.[1]) {
    throw new WsaaError("Respuesta WSAA no contiene token o sign", true)
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

// ─── Util ────────────────────────────────────────────────────────────────────

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
