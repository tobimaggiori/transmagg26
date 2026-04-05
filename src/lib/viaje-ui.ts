import {
  EstadoFacturaViaje,
  EstadoLiquidacionViaje,
} from "@/lib/viaje-workflow"

export type ResumenWorkflowViajes = {
  total: number
  pendientesLiquidar: number
  pendientesFacturar: number
  pendientesAmbos: number
  cerradosAmbos: number
}

/**
 * esLiquidado: string -> boolean
 *
 * Dado un estadoLiquidacion, devuelve true si el viaje tiene liquidación vigente.
 */
export function esLiquidado(estadoLiquidacion: string): boolean {
  return estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO
}

/**
 * esFacturado: string -> boolean
 *
 * Dado un estadoFactura, devuelve true si el viaje tiene facturación vigente.
 */
export function esFacturado(estadoFactura: string): boolean {
  return estadoFactura === EstadoFacturaViaje.FACTURADO
}

/**
 * labelEstadoLiquidacion: string -> string
 */
export function labelEstadoLiquidacion(estado: string): string {
  switch (estado) {
    case EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR: return "Pendiente"
    case EstadoLiquidacionViaje.LIQUIDADO: return "Liquidado"
    default: return estado
  }
}

/**
 * labelEstadoFactura: string -> string
 */
export function labelEstadoFactura(estado: string): string {
  switch (estado) {
    case EstadoFacturaViaje.PENDIENTE_FACTURAR: return "Pendiente"
    case EstadoFacturaViaje.FACTURADO: return "Facturado"
    default: return estado
  }
}

/**
 * describirCircuitoViaje: string string -> string
 *
 * Dados [el estado de liquidación y el estado de facturación del viaje],
 * devuelve [una descripción corta del punto exacto del workflow operativo].
 *
 * Ejemplos:
 * describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR") === "Pendiente de liquidar y de facturar"
 * describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR") === "Liquidado al fletero, pendiente de facturar"
 * describirCircuitoViaje("LIQUIDADO", "FACTURADO") === "Liquidado y facturado"
 */
export function describirCircuitoViaje(
  estadoLiquidacion: string,
  estadoFactura: string
): string {
  const liq = esLiquidado(estadoLiquidacion)
  const fac = esFacturado(estadoFactura)

  if (!liq && !fac) return "Pendiente de liquidar y de facturar"
  if (liq && !fac) return "Liquidado al fletero, pendiente de facturar"
  if (!liq && fac) return "Facturado a la empresa, pendiente de liquidar"
  return "Liquidado y facturado"
}

/**
 * resumirWorkflowViajes: { estadoLiquidacion: string, estadoFactura: string }[] -> ResumenWorkflowViajes
 *
 * Dada [una lista de viajes con sus dos estados independientes], devuelve [un
 * resumen contable del workflow operativo del tablero].
 */
export function resumirWorkflowViajes(
  viajes: Array<{ estadoLiquidacion: string; estadoFactura: string }>
): ResumenWorkflowViajes {
  return viajes.reduce<ResumenWorkflowViajes>(
    (acumulado, viaje) => {
      acumulado.total += 1

      if (viaje.estadoLiquidacion === EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR) {
        acumulado.pendientesLiquidar += 1
      }

      if (viaje.estadoFactura === EstadoFacturaViaje.PENDIENTE_FACTURAR) {
        acumulado.pendientesFacturar += 1
      }

      if (
        viaje.estadoLiquidacion === EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR &&
        viaje.estadoFactura === EstadoFacturaViaje.PENDIENTE_FACTURAR
      ) {
        acumulado.pendientesAmbos += 1
      }

      if (esLiquidado(viaje.estadoLiquidacion) && esFacturado(viaje.estadoFactura)) {
        acumulado.cerradosAmbos += 1
      }

      return acumulado
    },
    {
      total: 0,
      pendientesLiquidar: 0,
      pendientesFacturar: 0,
      pendientesAmbos: 0,
      cerradosAmbos: 0,
    }
  )
}
