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

export function viajeEsFacturable(viaje: ViajeParaFacturabilidad): boolean {
  if (viaje.estadoFactura !== "PENDIENTE_FACTURAR") return false
  return viaje.enLiquidaciones.some(
    (vl) =>
      vl.liquidacion.estado === "EMITIDA" &&
      vl.liquidacion.cae !== null &&
      vl.liquidacion.arcaEstado === "ACEPTADA"
  )
}

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
