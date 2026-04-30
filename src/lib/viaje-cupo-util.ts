/**
 * viaje-cupo-util.ts
 *
 * Helpers puros del cupo (sin dependencias de Prisma ni de servidor).
 * Seguros de importar desde client components.
 *
 * El archivo `viaje-cupo.ts` (con lógica de DB) re-exporta estas funciones
 * para preservar compatibilidad con importadores existentes del servidor.
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
  nroCtg: string | null
  cpe?: string | null
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
  ctgs: string[]
  cpes: string[]
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

  const sufijoLen = Math.max(2, largo - lcpLen)
  const prefijoLen = largo - sufijoLen
  if (prefijoLen <= 0) return remitos.join(", ")

  const prefijo = remitos[0].slice(0, prefijoLen)
  if (!remitos.every((r) => r.slice(0, prefijoLen) === prefijo)) return remitos.join(", ")

  return prefijo + remitos.map((r) => r.slice(prefijoLen)).join("/")
}

/**
 * agruparViajesPorCupo: ViajeAgrupable[] -> GrupoViajes[]
 *
 * Agrupa viajes que comparten cupo en un único grupo. Viajes sin cupo (o
 * cuyo cupo es único en el set) quedan en un grupo de tamaño 1.
 *
 * Por grupo:
 * - kilos: SUMA de los kilos.
 * - subtotal: SUMA de los subtotales.
 * - remitos: array con todos los remitos no nulos.
 * - ctgs: array con todos los nros de CTG no nulos.
 * - cpes: array con todos los nros de CPE no nulos.
 * - resto de campos (fecha, mercadería, origen, destino, tarifa): tomados
 *   del primer viaje del grupo.
 *
 * Preserva el orden de aparición.
 */
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
      if (v.nroCtg) g.ctgs.push(v.nroCtg)
      if (v.cpe) g.cpes.push(v.cpe)
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
      ctgs: v.nroCtg ? [v.nroCtg] : [],
      cpes: v.cpe ? [v.cpe] : [],
    }
    grupos.push(g)
    if (cupoKey) indexByCupo.set(cupoKey, grupos.length - 1)
  }

  return grupos
}
