/**
 * Helpers de elegibilidad para facturación a empresas.
 *
 * Un viaje es facturable si tiene al menos una LP en estado EMITIDA con CAE
 * obtenido y aceptado por ARCA.
 */

export type ViajeParaFacturabilidad = {
  estadoFactura: string
  enLiquidaciones: Array<{
    liquidacion: { estado: string; cae: string | null; arcaEstado: string | null }
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
 * viajeEsFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [{ liquidacion: { estado: "EMITIDA", cae: "123", arcaEstado: "ACEPTADA" } }] }) === true
 * viajeEsFacturable({ estadoFactura: "FACTURADO", enLiquidaciones: [] }) === false
 * viajeEsFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [] }) === false
 */
export function viajeEsFacturable(viaje: ViajeParaFacturabilidad): boolean {
  if (viaje.estadoFactura !== "PENDIENTE_FACTURAR") return false
  return viaje.enLiquidaciones.some(
    (vl) =>
      vl.liquidacion.estado === "EMITIDA" &&
      vl.liquidacion.cae !== null &&
      vl.liquidacion.arcaEstado === "ACEPTADA"
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
 * razonNoFacturable({ estadoFactura: "PENDIENTE_FACTURAR", enLiquidaciones: [{ liquidacion: { estado: "BORRADOR", cae: null, arcaEstado: null } }] }) === "La LP no está emitida"
 */
export function razonNoFacturable(viaje: ViajeParaFacturabilidad): string {
  if (viaje.estadoFactura !== "PENDIENTE_FACTURAR") {
    return "El viaje no está pendiente de facturar"
  }
  if (viaje.enLiquidaciones.length === 0) {
    return "No tiene liquidación asignada"
  }
  const tieneEmitida = viaje.enLiquidaciones.some((vl) => vl.liquidacion.estado === "EMITIDA")
  if (!tieneEmitida) {
    return "La LP no está emitida"
  }
  const tieneConCae = viaje.enLiquidaciones.some(
    (vl) => vl.liquidacion.estado === "EMITIDA" && vl.liquidacion.cae !== null
  )
  if (!tieneConCae) {
    return "La LP no tiene CAE de ARCA"
  }
  return "La LP no fue aceptada por ARCA"
}
