/**
 * Propósito: Carga y validación de la configuración ARCA desde la base de datos.
 * Centraliza el acceso a ConfiguracionArca y resuelve las URLs de los web services
 * según el modo (homologación/producción).
 */

import { prisma } from "@/lib/prisma"
import { ArcaNoConfiguradaError, ArcaConfigIncompletaError } from "./errors"
import { descifrarValor } from "./crypto"
import { CODIGOS_CATALOGO } from "./catalogo"
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
  const row = await prisma.configuracionArca.findUnique({
    where: { id: "unico" },
    select: {
      cuit: true, razonSocial: true, certificadoB64: true, certificadoPass: true,
      modo: true, puntosVenta: true, comprobantesHabilitados: true,
      cbuMiPymes: true, activa: true,
    },
  })

  if (!row) throw new ArcaNoConfiguradaError("No existe registro de configuración ARCA.")
  if (!row.activa) throw new ArcaNoConfiguradaError()

  if (!row.cuit || row.cuit.replace(/\D/g, "").length !== 11) {
    throw new ArcaConfigIncompletaError("CUIT válido (11 dígitos)")
  }

  const esSimulacion = row.modo === "simulacion"

  // En modo simulación no se requiere certificado
  if (!esSimulacion) {
    if (!row.certificadoB64) throw new ArcaConfigIncompletaError("certificado digital")
    if (!row.certificadoPass) throw new ArcaConfigIncompletaError("contraseña del certificado")
  }

  const puntosVenta: Record<string, number> = {}
  try {
    const raw = JSON.parse(row.puntosVenta || "{}") as Record<string, unknown>
    // Normalizar: DB puede tener strings ("1") o numbers (1) → siempre number
    for (const [k, v] of Object.entries(raw)) {
      const n = typeof v === "number" ? v : parseInt(String(v), 10)
      if (!isNaN(n) && n > 0) puntosVenta[k] = n
    }
  } catch {
    throw new ArcaConfigIncompletaError("puntos de venta (JSON inválido)")
  }

  // Parsear comprobantes habilitados: JSON array de números, filtrar solo los del catálogo
  let comprobantesHabilitados: number[] = []
  try {
    const rawCH = JSON.parse(row.comprobantesHabilitados || "[]") as unknown[]
    comprobantesHabilitados = rawCH
      .map((v) => typeof v === "number" ? v : parseInt(String(v), 10))
      .filter((n) => !isNaN(n) && CODIGOS_CATALOGO.has(n))
  } catch {
    // Si el JSON es inválido, queda vacío (nada habilitado)
  }

  return {
    cuit: row.cuit.replace(/\D/g, ""),
    razonSocial: row.razonSocial,
    certificadoB64: row.certificadoB64 ? descifrarValor(row.certificadoB64) : "",
    certificadoPass: row.certificadoPass ? descifrarValor(row.certificadoPass) : "",
    modo: row.modo === "produccion" ? "produccion" : row.modo === "simulacion" ? "simulacion" : "homologacion",
    puntosVenta,
    comprobantesHabilitados,
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
  // Modo simulación no usa URLs reales
  const modo = config.modo === "simulacion" ? "homologacion" : config.modo
  return {
    wsaaUrl: process.env.ARCA_WSAA_URL || WSAA_URLS[modo],
    wsfev1Url: process.env.ARCA_WSFEV1_URL || WSFEV1_URLS[modo],
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
