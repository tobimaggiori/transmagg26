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
 * describirCircuitoViaje: string string -> string
 *
 * Dados [el estado de liquidación y el estado de facturación del viaje],
 * devuelve [una descripción corta del punto exacto del workflow operativo].
 * Existe para explicar de forma legible en la UI que ambos circuitos son
 * independientes y que un mismo viaje puede estar resuelto en uno y pendiente
 * en el otro.
 *
 * Ejemplos:
 * describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR") === "Pendiente de liquidar y de facturar"
 * describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR") === "Liquidado al fletero, pendiente de facturar"
 * describirCircuitoViaje("LIQUIDADO", "FACTURADO") === "Liquidado y facturado"
 */
/**
 * esLiquidado: string -> boolean
 *
 * Dado un estadoLiquidacion, devuelve true si el viaje tiene liquidación vigente
 * (completa o ajustada parcialmente).
 */
export function esLiquidado(estadoLiquidacion: string): boolean {
  return (
    estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO ||
    estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO_AJUSTADO_PARCIAL
  )
}

/**
 * esFacturado: string -> boolean
 *
 * Dado un estadoFactura, devuelve true si el viaje tiene facturación vigente
 * (completa o ajustada parcialmente).
 */
export function esFacturado(estadoFactura: string): boolean {
  return (
    estadoFactura === EstadoFacturaViaje.FACTURADO ||
    estadoFactura === EstadoFacturaViaje.FACTURADO_AJUSTADO_PARCIAL
  )
}

/**
 * labelEstadoLiquidacion: string -> string
 */
export function labelEstadoLiquidacion(estado: string): string {
  switch (estado) {
    case EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR: return "Pendiente"
    case EstadoLiquidacionViaje.LIQUIDADO: return "Liquidado"
    case EstadoLiquidacionViaje.LIQUIDADO_AJUSTADO_PARCIAL: return "Liquidado (ajustado)"
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
    case EstadoFacturaViaje.FACTURADO_AJUSTADO_PARCIAL: return "Facturado (ajustado)"
    default: return estado
  }
}

export function describirCircuitoViaje(
  estadoLiquidacion: string,
  estadoFactura: string
): string {
  const liq = esLiquidado(estadoLiquidacion)
  const fac = esFacturado(estadoFactura)

  if (!liq && !fac) return "Pendiente de liquidar y de facturar"
  if (liq && !fac) {
    const sufijo = estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO_AJUSTADO_PARCIAL ? " (ajustado parcial)" : ""
    return `Liquidado al fletero${sufijo}, pendiente de facturar`
  }
  if (!liq && fac) {
    const sufijo = estadoFactura === EstadoFacturaViaje.FACTURADO_AJUSTADO_PARCIAL ? " (ajustado parcial)" : ""
    return `Facturado a la empresa${sufijo}, pendiente de liquidar`
  }

  const parts: string[] = []
  if (estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO_AJUSTADO_PARCIAL) parts.push("liquidado (ajustado)")
  else parts.push("liquidado")
  if (estadoFactura === EstadoFacturaViaje.FACTURADO_AJUSTADO_PARCIAL) parts.push("facturado (ajustado)")
  else parts.push("facturado")
  return parts[0].charAt(0).toUpperCase() + parts[0].slice(1) + " y " + parts[1]
}

/**
 * resumirWorkflowViajes: { estadoLiquidacion: string, estadoFactura: string }[] -> ResumenWorkflowViajes
 *
 * Dada [una lista de viajes con sus dos estados independientes], devuelve [un
 * resumen contable del workflow operativo del tablero].
 * Existe para construir tarjetas de resumen en la UI sin repetir filtros en
 * cada pantalla.
 *
 * Ejemplos:
 * resumirWorkflowViajes([{ estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR" }]).pendientesAmbos === 1
 * resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR" }]).pendientesFacturar === 1
 * resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO" }]).cerradosAmbos === 1
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
