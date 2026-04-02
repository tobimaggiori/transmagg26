import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"

type ViajeOperativoMinimo = {
  kilos: number | null
  tarifaFletero?: number | null
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
  const tarifa = viaje.tarifaEmpresa ?? viaje.tarifaFletero ?? null
  const toneladas = viaje.kilos != null ? calcularToneladas(viaje.kilos) : null
  const total =
    viaje.kilos != null && tarifa != null
      ? calcularTotalViaje(viaje.kilos, tarifa)
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
    tarifaFletero?: number | null
    tarifaEmpresa?: number | null
    total?: number | null
  },
>(viaje: T): Omit<T, "tarifaFletero" | "tarifaEmpresa" | "total"> {
  const { tarifaFletero, tarifaEmpresa, total, ...resto } = viaje
  void tarifaFletero
  void tarifaEmpresa
  void total
  return resto
}
