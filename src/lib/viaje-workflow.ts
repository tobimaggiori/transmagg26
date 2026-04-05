/**
 * Propósito: Reglas de workflow del viaje operativo de Transmagg.
 * Centraliza estados, documentos guardados y avisos derivados del circuito independiente
 * de liquidación al fletero y facturación a la empresa.
 */

/**
 * EstadoLiquidacionViaje: { ... } constante
 *
 * Representa los estados posibles del circuito de liquidación del viaje base.
 * Existe para evitar strings sueltos al decidir si un viaje todavía puede
 * aparecer como pendiente de liquidar o si ya quedó tomado por una liquidación.
 *
 * Ejemplos:
 * EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR === "PENDIENTE_LIQUIDAR"
 * EstadoLiquidacionViaje.LIQUIDADO === "LIQUIDADO"
 */
export const EstadoLiquidacionViaje = {
  PENDIENTE_LIQUIDAR: "PENDIENTE_LIQUIDAR",
  LIQUIDADO: "LIQUIDADO",
  LIQUIDADO_AJUSTADO_PARCIAL: "LIQUIDADO_AJUSTADO_PARCIAL",
} as const

/**
 * EstadoFacturaViaje: { ... } constante
 *
 * Representa los estados posibles del circuito de facturación del viaje base.
 * Existe para evitar strings sueltos al decidir si un viaje todavía puede
 * aparecer como pendiente de facturar o si ya quedó tomado por una factura.
 *
 * Ejemplos:
 * EstadoFacturaViaje.PENDIENTE_FACTURAR === "PENDIENTE_FACTURAR"
 * EstadoFacturaViaje.FACTURADO === "FACTURADO"
 */
export const EstadoFacturaViaje = {
  PENDIENTE_FACTURAR: "PENDIENTE_FACTURAR",
  FACTURADO: "FACTURADO",
  FACTURADO_AJUSTADO_PARCIAL: "FACTURADO_AJUSTADO_PARCIAL",
} as const

/**
 * EstadoLiquidacionDocumento: { ... } constante
 *
 * Representa los estados de una liquidación ya guardada como documento.
 * Existe para distinguir el estado del documento del estado del viaje base.
 *
 * Ejemplos:
 * EstadoLiquidacionDocumento.EMITIDA === "EMITIDA"
 * EstadoLiquidacionDocumento.ANULADA === "ANULADA"
 */
export const EstadoLiquidacionDocumento = {
  EMITIDA: "EMITIDA",
  PAGADA: "PAGADA",
  ANULADA: "ANULADA",
} as const

/**
 * EstadoFacturaDocumento: { ... } constante
 *
 * Representa los estados de una factura ya guardada como documento.
 * Existe para distinguir el estado del documento del estado del viaje base.
 *
 * Ejemplos:
 * EstadoFacturaDocumento.EMITIDA === "EMITIDA"
 * EstadoFacturaDocumento.COBRADA === "COBRADA"
 */
export const EstadoFacturaDocumento = {
  EMITIDA: "EMITIDA",
  COBRADA: "COBRADA",
  ANULADA: "ANULADA",
} as const

export type EstadoLiquidacionViajeType =
  typeof EstadoLiquidacionViaje[keyof typeof EstadoLiquidacionViaje]
export type EstadoFacturaViajeType =
  typeof EstadoFacturaViaje[keyof typeof EstadoFacturaViaje]
export type EstadoLiquidacionDocumentoType =
  typeof EstadoLiquidacionDocumento[keyof typeof EstadoLiquidacionDocumento]
export type EstadoFacturaDocumentoType =
  typeof EstadoFacturaDocumento[keyof typeof EstadoFacturaDocumento]

/**
 * tarifaEsEditable: number -> boolean
 *
 * Dado [un valor de tarifa opcional], devuelve [true si es un valor positivo válido].
 */
export function tarifaEsEditable(tarifa?: number | null): boolean {
  return typeof tarifa === "number" && tarifa > 0
}

/**
 * tieneDocumentosActivos: string[] string -> boolean
 *
 * Dada [la lista de estados de documentos guardados y el estado que significa anulado],
 * devuelve [true si al menos uno sigue activo, false si todos están anulados
 * o si la lista está vacía].
 * Existe para decidir correctamente el estado actual del viaje base cuando
 * se anula un documento pero puede existir otro documento vigente del mismo circuito.
 *
 * Ejemplos:
 * tieneDocumentosActivos(["EMITIDA"], "ANULADA") === true
 * tieneDocumentosActivos(["ANULADA", "PAGADA"], "ANULADA") === true
 * tieneDocumentosActivos(["ANULADA"], "ANULADA") === false
 */
export function tieneDocumentosActivos(estados: string[], estadoAnulado: string): boolean {
  return estados.some((estado) => estado !== estadoAnulado)
}

/**
 * resolverEstadoLiquidacionViaje: EstadoLiquidacionDocumentoType[] -> EstadoLiquidacionViajeType
 *
 * Dada [la lista de estados de todas las liquidaciones asociadas al viaje],
 * devuelve [el estado actual del circuito de liquidación del viaje base].
 * Existe para que un viaje solo vuelva a pendiente si ya no queda ninguna
 * liquidación activa luego de una anulación o corrección.
 *
 * Ejemplos:
 * resolverEstadoLiquidacionViaje(["EMITIDA"]) === "LIQUIDADO"
 * resolverEstadoLiquidacionViaje(["ANULADA"]) === "PENDIENTE_LIQUIDAR"
 * resolverEstadoLiquidacionViaje([]) === "PENDIENTE_LIQUIDAR"
 */
export function resolverEstadoLiquidacionViaje(
  estadosLiquidaciones: EstadoLiquidacionDocumentoType[]
): EstadoLiquidacionViajeType {
  return tieneDocumentosActivos(estadosLiquidaciones, EstadoLiquidacionDocumento.ANULADA)
    ? EstadoLiquidacionViaje.LIQUIDADO
    : EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR
}

/**
 * resolverEstadoFacturaViaje: EstadoFacturaDocumentoType[] -> EstadoFacturaViajeType
 *
 * Dada [la lista de estados de todas las facturas asociadas al viaje],
 * devuelve [el estado actual del circuito de facturación del viaje base].
 * Existe para que un viaje solo vuelva a pendiente si ya no queda ninguna
 * factura activa luego de una anulación o recreación documental.
 *
 * Ejemplos:
 * resolverEstadoFacturaViaje(["EMITIDA"]) === "FACTURADO"
 * resolverEstadoFacturaViaje(["ANULADA"]) === "PENDIENTE_FACTURAR"
 * resolverEstadoFacturaViaje([]) === "PENDIENTE_FACTURAR"
 */
export function resolverEstadoFacturaViaje(
  estadosFacturas: EstadoFacturaDocumentoType[]
): EstadoFacturaViajeType {
  return tieneDocumentosActivos(estadosFacturas, EstadoFacturaDocumento.ANULADA)
    ? EstadoFacturaViaje.FACTURADO
    : EstadoFacturaViaje.PENDIENTE_FACTURAR
}

/**
 * construirAvisosEdicionViaje: string string -> string[]
 *
 * Dados [el estado de liquidación y el estado de facturación del viaje base],
 * devuelve [los avisos que debe ver el operador al editar un viaje que ya fue
 * usado en documentos previos].
 * Existe para dejar explícito que el viaje base puede corregirse sin alterar
 * liquidaciones o facturas ya congeladas.
 *
 * Ejemplos:
 * construirAvisosEdicionViaje("LIQUIDADO", "PENDIENTE_FACTURAR").length === 1
 * construirAvisosEdicionViaje("LIQUIDADO", "FACTURADO").length === 2
 * construirAvisosEdicionViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR").length === 0
 */
export function construirAvisosEdicionViaje(
  estadoLiquidacion: string,
  estadoFactura: string
): string[] {
  const avisos: string[] = []

  if (estadoLiquidacion === EstadoLiquidacionViaje.LIQUIDADO) {
    avisos.push(
      "Este viaje ya está incluido en una liquidación. Los datos de la liquidación no se modificaron."
    )
  }

  if (estadoFactura === EstadoFacturaViaje.FACTURADO) {
    avisos.push(
      "Este viaje ya está incluido en una factura. Los datos de la factura no se modificaron."
    )
  }

  return avisos
}
