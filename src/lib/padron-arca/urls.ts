/**
 * URLs del servicio ARCA `ws_sr_constancia_inscripcion` (padrón A5).
 * Overrideables por env vars para tests / proxy.
 */

const URLS_PADRON = {
  homologacion: "https://awshomo.afip.gov.ar/sr-padron/webservices/personaServiceA5",
  produccion: "https://aws.afip.gov.ar/sr-padron/webservices/personaServiceA5",
} as const

const URLS_WSAA = {
  homologacion: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
  produccion: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
} as const

export type ModoPadron = "homologacion" | "produccion"

export function urlPadronArca(modo: ModoPadron): string {
  return process.env.PADRON_ARCA_URL || URLS_PADRON[modo]
}

export function urlWsaaPadron(modo: ModoPadron): string {
  return process.env.ARCA_WSAA_URL || URLS_WSAA[modo]
}
