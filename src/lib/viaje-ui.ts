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
export function describirCircuitoViaje(
  estadoLiquidacion: string,
  estadoFactura: string
): string {
  if (
    estadoLiquidacion === EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR &&
    estadoFactura === EstadoFacturaViaje.PENDIENTE_FACTURAR
  ) {
    return "Pendiente de liquidar y de facturar"
  }

  if (
    estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO &&
    estadoFactura === EstadoFacturaViaje.PENDIENTE_FACTURAR
  ) {
    return "Liquidado al fletero, pendiente de facturar"
  }

  if (
    estadoLiquidacion === EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR &&
    estadoFactura === EstadoFacturaViaje.FACTURADO
  ) {
    return "Facturado a la empresa, pendiente de liquidar"
  }

  return "Liquidado y facturado"
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

      if (
        viaje.estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO &&
        viaje.estadoFactura === EstadoFacturaViaje.FACTURADO
      ) {
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
