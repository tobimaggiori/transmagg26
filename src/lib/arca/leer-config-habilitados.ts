/**
 * leerComprobantesHabilitados: () -> Promise<number[]>
 *
 * Lee los c��digos de comprobante habilitados desde la configuración ARCA.
 * Diseñado para server components que necesitan filtrar opciones de UI
 * sin requerir que la config esté activa ni tenga certificado.
 *
 * Devuelve array vacío si no hay config o si hay error de parsing.
 *
 * Ejemplos:
 * const hab = await leerComprobantesHabilitados()
 * // hab === [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]
 * // o hab === [] si no hay config
 */

import { prisma } from "@/lib/prisma"
import { CODIGOS_CATALOGO } from "./catalogo"

export async function leerComprobantesHabilitados(): Promise<number[]> {
  try {
    const row = await prisma.configuracionArca.findUnique({
      where: { id: "unico" },
      select: { comprobantesHabilitados: true },
    })
    if (!row) return []
    const raw = JSON.parse(row.comprobantesHabilitados || "[]") as unknown[]
    return raw
      .map((v) => (typeof v === "number" ? v : parseInt(String(v), 10)))
      .filter((n) => !isNaN(n) && CODIGOS_CATALOGO.has(n))
  } catch {
    return []
  }
}
