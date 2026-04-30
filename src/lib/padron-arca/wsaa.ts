/**
 * Obtención del Ticket de Acceso (TA) WSAA para el servicio
 * `ws_sr_constancia_inscripcion`. Caché propio en `TicketWsaa`
 * con id="ws_sr_constancia_inscripcion" — el modelo está pensado
 * para múltiples servicios y no compite con la row "wsfe" usada
 * por facturación.
 *
 * Reusa `firmarCMS`, `generarTRA` y `parsearLoginTicketResponse` del módulo
 * de WSFEv1 porque son helpers puros agnósticos de servicio.
 */

import { prisma } from "@/lib/prisma"
import { firmarCMS, generarTRA, parsearLoginTicketResponse } from "@/lib/arca/wsaa"
import { fetchArcaSOAP } from "@/lib/arca/proxy"
import { PadronArcaError } from "./errors"
import { urlWsaaPadron, type ModoPadron } from "./urls"

const SERVICIO = "ws_sr_constancia_inscripcion"
const MARGEN_EXPIRACION_MS = 10 * 60 * 1000
const WSAA_TIMEOUT_MS = 15000

export type TicketAccesoPadron = {
  token: string
  sign: string
  expiresAt: Date
}

export async function obtenerTicketPadron(input: {
  modo: ModoPadron
  certificadoB64: string
  certificadoPass: string
}): Promise<TicketAccesoPadron> {
  const cached = await prisma.ticketWsaa.findUnique({ where: { id: SERVICIO } })

  if (cached && ticketValido(cached)) {
    return { token: cached.token, sign: cached.sign, expiresAt: new Date(cached.expiresAt) }
  }

  const ticket = await solicitarTicket(input)

  await prisma.ticketWsaa.upsert({
    where: { id: SERVICIO },
    create: {
      id: SERVICIO,
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

function ticketValido(c: { token: string; sign: string; expiresAt: Date }): boolean {
  if (!c.token || c.token.length < 10) return false
  if (!c.sign || c.sign.length < 10) return false
  return new Date(c.expiresAt).getTime() > Date.now() + MARGEN_EXPIRACION_MS
}

async function solicitarTicket(input: {
  modo: ModoPadron
  certificadoB64: string
  certificadoPass: string
}): Promise<TicketAccesoPadron> {
  const now = new Date()
  const expiration = new Date(now.getTime() + 12 * 60 * 60 * 1000)
  const tra = generarTRA(SERVICIO, now, expiration)
  const cms = firmarCMS(tra, input.certificadoB64, input.certificadoPass)

  const xml = await llamarWsaa(urlWsaaPadron(input.modo), cms)
  return parsearLoginTicketResponse(xml, expiration)
}

async function llamarWsaa(url: string, cmsSigned: string): Promise<string> {
  const envelope = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:wsaa="http://wsaa.view.sua.dvadac.desein.afip.gov">`,
    `  <soapenv:Body>`,
    `    <wsaa:loginCms>`,
    `      <wsaa:in0>${cmsSigned}</wsaa:in0>`,
    `    </wsaa:loginCms>`,
    `  </soapenv:Body>`,
    `</soapenv:Envelope>`,
  ].join("\n")

  let res: Response
  try {
    res = await fetchArcaSOAP(
      url,
      { "Content-Type": "text/xml; charset=utf-8", SOAPAction: "" },
      envelope,
      WSAA_TIMEOUT_MS,
    )
  } catch (err) {
    const msg = err instanceof Error && err.name === "TimeoutError"
      ? "Timeout al contactar WSAA (constancia inscripción)"
      : "Error de red al contactar WSAA (constancia inscripción)"
    throw new PadronArcaError(msg, true)
  }

  const text = await res.text()
  if (!res.ok) {
    const m = text.match(/<faultstring>([\s\S]*?)<\/faultstring>/)
    const fault = m?.[1] ?? `HTTP ${res.status}`
    throw new PadronArcaError(`WSAA respondió con error: ${fault}`, res.status >= 500)
  }
  return text
}
