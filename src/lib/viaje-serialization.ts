import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"

type ViajeOperativoMinimo = {
  kilos: number | null
  tarifa?: number | null
  tarifaEmpresa?: number | null
}

/**
 * enriquecerViajeOperativo: ViajeOperativoMinimo & T -> T & { toneladas, total }
 *
 * Calcula toneladas y total (kilos × tarifaEmpresa) para la UI.
 */
export function enriquecerViajeOperativo<T extends ViajeOperativoMinimo>(
  viaje: T
): T & {
  toneladas: number | null
  total: number | null
} {
  const tarifaCalc = viaje.tarifaEmpresa ?? viaje.tarifa ?? null
  const toneladas = viaje.kilos != null ? calcularToneladas(viaje.kilos) : null
  const total =
    viaje.kilos != null && tarifaCalc != null
      ? calcularTotalViaje(viaje.kilos, tarifaCalc)
      : null

  return {
    ...viaje,
    toneladas,
    total,
  }
}

/**
 * ocultarTarifaOperativa: oculta tarifas y total para roles externos.
 */
export function ocultarTarifaOperativa<
  T extends {
    tarifa?: number | null
    tarifaEmpresa?: number | null
    total?: number | null
  },
>(viaje: T): Omit<T, "tarifa" | "tarifaEmpresa" | "total"> {
  const { tarifa, tarifaEmpresa, total, ...resto } = viaje
  void tarifa
  void tarifaEmpresa
  void total
  return resto
}
