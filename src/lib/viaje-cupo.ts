/**
 * viaje-cupo.ts
 *
 * Lógica del cupo: cuando varios viajes de la misma empresa comparten
 * número de cupo, deben compartir un conjunto de campos. Solo `kilos`,
 * `remito` y `nroCartaPorte` (más sus PDFs y la fecha del viaje) varían
 * entre hermanos.
 *
 * Este archivo centraliza:
 *  - El listado de campos lockeados.
 *  - La comparación entre el viaje "fuente" (el más antiguo pendiente con
 *    ese cupo) y un viaje propuesto.
 *  - La carga del viaje fuente desde Prisma.
 *
 * Usar desde:
 *  - POST /api/viajes (rechazar si los campos lockeados no coinciden).
 *  - PATCH /api/viajes/[id] (rechazar edición single si toca lockeado).
 *  - PATCH /api/viajes/cupo-bulk (aplica cambio a todos los hermanos).
 */

import { prisma } from "@/lib/prisma"

/** Campos que deben coincidir entre todos los viajes que comparten cupo. */
export const CAMPOS_LOCKEADOS_CUPO = [
  "mercaderia",
  "procedencia",
  "provinciaOrigen",
  "destino",
  "provinciaDestino",
  "tarifa",
  "comisionPct",
  "fleteroId",
  "camionId",
  "choferId",
  "esCamionPropio",
  "tieneCpe",
] as const

export type CampoLockeadoCupo = typeof CAMPOS_LOCKEADOS_CUPO[number]

export interface ViajeFuenteCupo {
  id: string
  empresaId: string
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  tarifa: number
  comisionPct: number | null
  fleteroId: string | null
  camionId: string
  choferId: string
  esCamionPropio: boolean
  tieneCpe: boolean
}

/**
 * cargarViajeFuenteCupo: string string -> Promise<ViajeFuenteCupo | null>
 *
 * Devuelve el viaje fuente (más antiguo PENDIENTE_FACTURAR con ese cupo
 * para esa empresa). Excluye un id (típicamente el viaje que se está
 * editando) si se pasa `excluirId`. Devuelve null si no hay match.
 *
 * Ejemplos:
 * cargarViajeFuenteCupo("emp1", "C-100") === { id, ... }   // hay match
 * cargarViajeFuenteCupo("emp1", "C-999") === null          // sin match
 * cargarViajeFuenteCupo("emp1", "C-100", "viaje-actual-id") === null o el otro hermano
 */
export async function cargarViajeFuenteCupo(
  empresaId: string,
  cupo: string,
  excluirId?: string,
): Promise<ViajeFuenteCupo | null> {
  const viaje = await prisma.viaje.findFirst({
    where: {
      empresaId,
      cupo,
      tieneCupo: true,
      estadoFactura: "PENDIENTE_FACTURAR",
      ...(excluirId ? { NOT: { id: excluirId } } : {}),
    },
    select: {
      id: true,
      empresaId: true,
      cupo: true,
      mercaderia: true,
      procedencia: true,
      provinciaOrigen: true,
      destino: true,
      provinciaDestino: true,
      tarifa: true,
      comisionPct: true,
      fleteroId: true,
      camionId: true,
      choferId: true,
      esCamionPropio: true,
      tieneCpe: true,
    },
    orderBy: { creadoEn: "asc" },
  })
  return viaje
}

/**
 * formatearRemitosCupo: string[] -> string
 *
 * Formatea una lista de números de remito de viajes que comparten cupo.
 *
 * Regla:
 * - Vacío → "".
 * - 1 remito → ese remito tal cual.
 * - >1 remito: si todos tienen el mismo largo y comparten un prefijo común,
 *   imprime el prefijo una sola vez seguido de los sufijos separados por "/".
 *   El sufijo mínimo es 2 caracteres (legibilidad humana — preferimos
 *   "100200/01/02" sobre "1002000/1/2").
 * - Si los remitos no tienen el mismo largo o no comparten prefijo
 *   suficiente, separa con ", ".
 *
 * Ejemplos:
 * formatearRemitosCupo([]) === ""
 * formatearRemitosCupo(["12345"]) === "12345"
 * formatearRemitosCupo(["12345", "12346"]) === "12345/46"
 * formatearRemitosCupo(["12345", "12346", "12347", "12348"]) === "12345/46/47/48"
 * formatearRemitosCupo(["100200", "100201", "100202"]) === "100200/01/02"
 * formatearRemitosCupo(["12345", "99999"]) === "12345, 99999"
 * formatearRemitosCupo(["12345", "1234567"]) === "12345, 1234567"
 */
export function formatearRemitosCupo(remitos: string[]): string {
  if (remitos.length === 0) return ""
  if (remitos.length === 1) return remitos[0]

  const largo = remitos[0].length
  if (!remitos.every((r) => r.length === largo)) return remitos.join(", ")

  // Longest common prefix
  let lcpLen = largo
  for (const r of remitos.slice(1)) {
    let i = 0
    while (i < lcpLen && remitos[0][i] === r[i]) i++
    lcpLen = i
    if (lcpLen === 0) break
  }

  // Mínimo 2 chars de sufijo. El prefijo efectivo es el largo total menos el sufijo.
  const sufijoLen = Math.max(2, largo - lcpLen)
  const prefijoLen = largo - sufijoLen
  if (prefijoLen <= 0) return remitos.join(", ")

  const prefijo = remitos[0].slice(0, prefijoLen)
  // Validar que todos compartan ese prefijo (puede no cumplirse si lcpLen < prefijoLen)
  if (!remitos.every((r) => r.slice(0, prefijoLen) === prefijo)) return remitos.join(", ")

  return prefijo + remitos.map((r) => r.slice(prefijoLen)).join("/")
}

/**
 * agruparViajesPorCupo: ViajeAgrupable[] -> GrupoViajes[]
 *
 * Agrupa viajes que comparten cupo en un único grupo. Viajes sin cupo (o
 * cuyo cupo es único en el set) quedan en un grupo de tamaño 1.
 *
 * Genérica: sirve para PDF de factura (tarifa = tarifaEmpresa) y de
 * liquidación (tarifa = tarifaFletero). El caller decide qué tarifa pasar.
 *
 * Por grupo:
 * - kilos: SUMA de los kilos.
 * - subtotal: SUMA de los subtotales (preserva tarifas potencialmente
 *   distintas, aunque las validaciones al facturar/liquidar lo prohíben).
 * - remitos: array con todos los remitos no nulos.
 * - cdps: array con todos los nros de carta de porte no nulos.
 * - resto de campos (fecha, mercadería, origen, destino, tarifa): tomados
 *   del primer viaje del grupo.
 *
 * Preserva el orden de aparición.
 *
 * Ejemplos:
 * agruparViajesPorCupo([{cupo:"X", kilos:10, ...}, {cupo:"X", kilos:5, ...}])
 *   === [{cupo:"X", kilos:15, remitos:[...], ...}]   // un grupo con kilos sumados
 * agruparViajesPorCupo([{cupo:null, ...}, {cupo:null, ...}])
 *   === dos grupos individuales
 * agruparViajesPorCupo([{cupo:"X", ...}, {cupo:"Y", ...}])
 *   === dos grupos separados por cupo distinto
 */
export interface ViajeAgrupable {
  fechaViaje: Date
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifa: number
  subtotal: number
  nroCartaPorte: string | null
}

export interface GrupoViajes {
  fechaViaje: Date
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  tarifa: number
  kilos: number
  subtotal: number
  cupo: string | null
  remitos: string[]
  cdps: string[]
}

export function agruparViajesPorCupo(viajes: ViajeAgrupable[]): GrupoViajes[] {
  const grupos: GrupoViajes[] = []
  const indexByCupo = new Map<string, number>()

  for (const v of viajes) {
    const cupoKey = v.cupo?.trim() || null
    if (cupoKey && indexByCupo.has(cupoKey)) {
      const idx = indexByCupo.get(cupoKey)!
      const g = grupos[idx]
      g.kilos += v.kilos ?? 0
      g.subtotal = g.subtotal + v.subtotal
      if (v.remito) g.remitos.push(v.remito)
      if (v.nroCartaPorte) g.cdps.push(v.nroCartaPorte)
      continue
    }
    const g: GrupoViajes = {
      fechaViaje: v.fechaViaje,
      mercaderia: v.mercaderia,
      procedencia: v.procedencia,
      provinciaOrigen: v.provinciaOrigen,
      destino: v.destino,
      provinciaDestino: v.provinciaDestino,
      tarifa: v.tarifa,
      kilos: v.kilos ?? 0,
      subtotal: v.subtotal,
      cupo: cupoKey,
      remitos: v.remito ? [v.remito] : [],
      cdps: v.nroCartaPorte ? [v.nroCartaPorte] : [],
    }
    grupos.push(g)
    if (cupoKey) indexByCupo.set(cupoKey, grupos.length - 1)
  }

  return grupos
}

/**
 * compararCamposLockeados: ViajeFuenteCupo Partial<ViajeFuenteCupo> -> string[]
 *
 * Devuelve la lista de campos en los que `propuesto` difiere de `fuente`.
 * Vacío = todo coincide. Solo compara campos definidos en `propuesto`.
 *
 * Para campos nullables, `null === null` cuenta como coincidencia.
 *
 * Ejemplos:
 * compararCamposLockeados({mercaderia:"X",...}, {mercaderia:"X"}) === []
 * compararCamposLockeados({mercaderia:"X",...}, {mercaderia:"Y"}) === ["mercaderia"]
 * compararCamposLockeados({comisionPct:null,...}, {comisionPct:null}) === []
 */
export function compararCamposLockeados(
  fuente: ViajeFuenteCupo,
  propuesto: Partial<Record<CampoLockeadoCupo, unknown>>,
): CampoLockeadoCupo[] {
  const diferencias: CampoLockeadoCupo[] = []
  for (const campo of CAMPOS_LOCKEADOS_CUPO) {
    if (!(campo in propuesto)) continue
    const valFuente = fuente[campo]
    const valProp = propuesto[campo]
    if (valFuente !== valProp) diferencias.push(campo)
  }
  return diferencias
}
