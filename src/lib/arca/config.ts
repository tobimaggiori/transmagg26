/**
 * Propósito: Carga y validación de la configuración ARCA desde la base de datos.
 * Centraliza el acceso a ConfiguracionArca y resuelve las URLs de los web services
 * según el modo (homologación/producción).
 */

import { prisma } from "@/lib/prisma"
import { ArcaNoConfiguradaError, ArcaConfigIncompletaError } from "./errors"
import { descifrarValor } from "./crypto"
import type { ArcaConfig, ArcaUrls } from "./types"

const WSAA_URLS = {
  homologacion: "https://wsaahomo.afip.gov.ar/ws/services/LoginCms",
  produccion: "https://wsaa.afip.gov.ar/ws/services/LoginCms",
} as const

const WSFEV1_URLS = {
  homologacion: "https://wswhomo.afip.gov.ar/wsfev1/service.asmx",
  produccion: "https://servicios1.afip.gov.ar/wsfev1/service.asmx",
} as const

/**
 * cargarConfigArca: () -> Promise<ArcaConfig>
 *
 * Lee la configuración ARCA del singleton en la base de datos y valida
 * que esté activa y tenga todos los campos necesarios para operar.
 * Lanza ArcaNoConfiguradaError si no está activa, ArcaConfigIncompletaError
 * si le faltan campos obligatorios.
 *
 * Ejemplos:
 * const config = await cargarConfigArca()
 * // config.cuit === "30709381683"
 * // config.modo === "homologacion"
 */
export async function cargarConfigArca(): Promise<ArcaConfig> {
  const row = await prisma.configuracionArca.findUnique({ where: { id: "unico" } })

  if (!row) throw new ArcaNoConfiguradaError("No existe registro de configuración ARCA.")
  if (!row.activa) throw new ArcaNoConfiguradaError()

  if (!row.cuit || row.cuit.replace(/\D/g, "").length !== 11) {
    throw new ArcaConfigIncompletaError("CUIT válido (11 dígitos)")
  }
  if (!row.certificadoB64) throw new ArcaConfigIncompletaError("certificado digital")
  if (!row.certificadoPass) throw new ArcaConfigIncompletaError("contraseña del certificado")

  let puntosVenta: Record<string, number> = {}
  try {
    puntosVenta = JSON.parse(row.puntosVenta || "{}")
  } catch {
    throw new ArcaConfigIncompletaError("puntos de venta (JSON inválido)")
  }

  return {
    cuit: row.cuit.replace(/\D/g, ""),
    razonSocial: row.razonSocial,
    // Descifrar certificado y password (backward compatible con plaintext legacy)
    certificadoB64: descifrarValor(row.certificadoB64),
    certificadoPass: descifrarValor(row.certificadoPass),
    modo: row.modo === "produccion" ? "produccion" : "homologacion",
    puntosVenta,
    cbuMiPymes: row.cbuMiPymes ?? null,
    activa: row.activa,
  }
}

/**
 * resolverUrls: ArcaConfig -> ArcaUrls
 *
 * Dado un objeto de configuración ARCA, devuelve las URLs de WSAA y WSFEv1
 * correspondientes al modo (homologación o producción).
 * Soporta override por variables de entorno ARCA_WSAA_URL y ARCA_WSFEV1_URL.
 *
 * Ejemplos:
 * resolverUrls({ modo: "homologacion", ... })
 * // { wsaaUrl: "https://wsaahomo.afip.gov.ar/...", wsfev1Url: "https://wswhomo.afip.gov.ar/..." }
 */
export function resolverUrls(config: ArcaConfig): ArcaUrls {
  return {
    wsaaUrl: process.env.ARCA_WSAA_URL || WSAA_URLS[config.modo],
    wsfev1Url: process.env.ARCA_WSFEV1_URL || WSFEV1_URLS[config.modo],
  }
}

/**
 * arcaConfigurada: () -> Promise<boolean>
 *
 * Verifica rápidamente si ARCA está activa sin lanzar errores.
 * Útil para condiciones UI o guards que no requieren la config completa.
 *
 * Ejemplos:
 * if (await arcaConfigurada()) { mostrarBotonArca() }
 */
export async function arcaConfigurada(): Promise<boolean> {
  try {
    const row = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: { activa: true },
    })
    return row?.activa === true
  } catch {
    return false
  }
}
