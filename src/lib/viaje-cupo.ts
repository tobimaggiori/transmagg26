/**
 * viaje-cupo.ts
 *
 * Lógica del cupo: cuando varios viajes de la misma empresa comparten
 * número de cupo, deben compartir un conjunto de campos. Solo `kilos`,
 * `remito` y `nroCtg` (más sus PDFs y la fecha del viaje) varían
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

// Re-export helpers puros para preservar la API pública del archivo.
// La implementación vive en `viaje-cupo-util.ts` para que sea importable
// desde client components sin arrastrar Prisma.
export {
  formatearRemitosCupo,
  agruparViajesPorCupo,
  type ViajeAgrupable,
  type GrupoViajes,
} from "@/lib/viaje-cupo-util"

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
  "tieneCtg",
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
  tieneCtg: boolean
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
      tieneCtg: true,
    },
    orderBy: { creadoEn: "asc" },
  })
  return viaje
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
