/**
 * Helpers de elegibilidad para facturación a empresas.
 *
 * Un viaje es facturable si tiene al menos una LP en estado activo
 * (EMITIDA, PAGADA o PARCIALMENTE_PAGADA). No se requiere CAE ni
 * aceptación de ARCA: el LP puede no haber sido enviado a ARCA todavía.
 */

const ESTADOS_LP_ACTIVOS = ["EMITIDA", "PAGADA", "PARCIALMENTE_PAGADA"]

export type ViajeParaFacturabilidad = {
  estadoFactura: string
  enLiquidaciones: Array<{
    liquidacion: { estado: string }
  }>
}

/**
 * viajeEsFacturable: ViajeParaFacturabilidad -> boolean
 *
 * Dado un viaje con su estado de factura y sus liquidaciones asociadas,
 * devuelve true si el viaje cumple todas las condiciones para ser facturado a la empresa.
 * Existe para centralizar la lógica de elegibilidad y evitar duplicarla en la UI y en la API.
 *
 * Ejemplos:
 * viajeEsFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [{ liquidacion: { estado: "EMITIDA" } }] }) === true
 * viajeEsFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [{ liquidacion: { estado: "PAGADA" } }] }) === true
 * viajeEsFacturable({ estadoFactura: "FACTURADO", enLiquidaciones: [] }) === false
 * viajeEsFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [] }) === false
 */
export function viajeEsFacturable(viaje: ViajeParaFacturabilidad): boolean {
  if (viaje.estadoFactura !== "PENDIENTE_FACTURAR") return false
  return viaje.enLiquidaciones.some(
    (vl) => ESTADOS_LP_ACTIVOS.includes(vl.liquidacion.estado)
  )
}

/**
 * razonNoFacturable: ViajeParaFacturabilidad -> string
 *
 * Dado un viaje que no es facturable, devuelve el motivo específico por el que no cumple
 * los requisitos, siguiendo el orden de validación de condiciones.
 * Existe para mostrar al operador un mensaje claro sobre qué falta para poder facturar.
 *
 * Ejemplos:
 * razonNoFacturable({ estadoFactura: "FACTURADO", enLiquidaciones: [] }) === "El viaje no está pendiente de facturar"
 * razonNoFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [] }) === "No tiene liquidación asignada"
 * razonNoFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [{ liquidacion: { estado: "X" } }] }) === "La LP no está en estado activo (emitida/pagada)"
 */
export function razonNoFacturable(viaje: ViajeParaFacturabilidad): string {
  if (viaje.estadoFactura !== "PENDIENTE_FACTURAR") {
    return "El viaje no está pendiente de facturar"
  }
  if (viaje.enLiquidaciones.length === 0) {
    return "No tiene liquidación asignada"
  }
  return "La LP no está en estado activo (emitida/pagada)"
}
