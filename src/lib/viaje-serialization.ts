import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"

type ViajeOperativoMinimo = {
  kilos: number | null
  tarifaOperativaInicial?: number | null
}

/**
 * obtenerTarifaOperativaInicial: number? -> number | null
 *
 * Dado [el valor persistido históricamente como tarifa operativa inicial], devuelve [la
 * tarifa operativa inicial en formato semántico explícito].
 * Existe para centralizar el tratamiento del importe operativo inicial del viaje
 * en un solo punto de entrada.
 *
 * Ejemplos:
 * obtenerTarifaOperativaInicial(150000) === 150000
 * obtenerTarifaOperativaInicial(null) === null
 * obtenerTarifaOperativaInicial(undefined) === null
 */
export function obtenerTarifaOperativaInicial(
  tarifaOperativaInicial?: number | null
): number | null {
  return tarifaOperativaInicial ?? null
}

/**
 * enriquecerViajeOperativo: ViajeOperativoMinimo & T -> T & { tarifaOperativaInicial: number | null, toneladas: number | null, total: number | null }
 *
 * Dado [un viaje operativo con kilos y tarifa operativa inicial], devuelve [el
 * viaje con esa tarifa y los cálculos derivados].
 * Existe para responder las APIs de viajes con un contrato claro para la UI
 * sin repetir cálculos en cada endpoint.
 *
 * Ejemplos:
 * enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).tarifaOperativaInicial === 50
 * enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).toneladas === 25
 * enriquecerViajeOperativo({ kilos: null, tarifaOperativaInicial: 50 }).total === null
 */
export function enriquecerViajeOperativo<T extends ViajeOperativoMinimo>(
  viaje: T
): T & {
  tarifaOperativaInicial: number | null
  toneladas: number | null
  total: number | null
} {
  const tarifaOperativaInicial = obtenerTarifaOperativaInicial(viaje.tarifaOperativaInicial)
  const toneladas = viaje.kilos != null ? calcularToneladas(viaje.kilos) : null
  const total =
    viaje.kilos != null && tarifaOperativaInicial != null
      ? calcularTotalViaje(viaje.kilos, tarifaOperativaInicial)
      : null

  return {
    ...viaje,
    tarifaOperativaInicial,
    toneladas,
    total,
  }
}

/**
 * ocultarTarifaOperativa: T & { tarifaOperativaInicial?: number | null, total?: number | null } -> Omit<T, "tarifaOperativaInicial" | "total">
 *
 * Dado [un viaje serializado], devuelve [el mismo viaje sin tarifa operativa ni
 * total derivado].
 * Existe para proteger datos comerciales cuando la API responde a roles externos.
 *
 * Ejemplos:
 * "tarifaOperativaInicial" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === false
 * "total" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === false
 * "id" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === true
 */
export function ocultarTarifaOperativa<
  T extends {
    tarifaOperativaInicial?: number | null
    total?: number | null
  },
>(viaje: T): Omit<T, "tarifaOperativaInicial" | "total"> {
  const { tarifaOperativaInicial, total, ...resto } = viaje
  void tarifaOperativaInicial
  void total
  return resto
}
