/**
 * Propósito: Errores tipados para la integración ARCA.
 * Cada clase de error tiene un código único para que el frontend pueda mostrar
 * mensajes accionables sin exponer detalles internos sensibles.
 */

/** Error base de la capa ARCA. Todos los errores ARCA heredan de esta clase. */
export class ArcaError extends Error {
  readonly code: string
  readonly statusCode: number

  constructor(code: string, message: string, statusCode = 500) {
    super(message)
    this.name = "ArcaError"
    this.code = code
    this.statusCode = statusCode
  }
}

/** ARCA no está configurada o no está activa. */
export class ArcaNoConfiguradaError extends ArcaError {
  constructor(detalle?: string) {
    super(
      "ARCA_NO_CONFIGURADA",
      detalle ?? "La configuración ARCA no está activa. Configurala desde ABM → ARCA.",
      503
    )
    this.name = "ArcaNoConfiguradaError"
  }
}

/** Faltan datos obligatorios en la configuración (certificado, CUIT, puntos de venta). */
export class ArcaConfigIncompletaError extends ArcaError {
  constructor(campo: string) {
    super(
      "ARCA_CONFIG_INCOMPLETA",
      `Configuración ARCA incompleta: falta ${campo}.`,
      503
    )
    this.name = "ArcaConfigIncompletaError"
  }
}

/** Error al autenticarse con WSAA (certificado inválido, WSAA caído, etc). */
export class WsaaError extends ArcaError {
  constructor(detalle: string) {
    super("WSAA_ERROR", `Error de autenticación WSAA: ${detalle}`, 502)
    this.name = "WsaaError"
  }
}

/** Error al comunicarse con WSFEv1 (SOAP fault, timeout, etc). */
export class Wsfev1Error extends ArcaError {
  constructor(detalle: string) {
    super("WSFEV1_ERROR", `Error del servicio WSFEv1: ${detalle}`, 502)
    this.name = "Wsfev1Error"
  }
}

/** ARCA rechazó el comprobante. Incluye las observaciones de rechazo. */
export class ArcaRechazoError extends ArcaError {
  readonly observaciones: string

  constructor(observaciones: string) {
    super("ARCA_RECHAZO", `Comprobante rechazado por ARCA: ${observaciones}`, 422)
    this.name = "ArcaRechazoError"
    this.observaciones = observaciones
  }
}

/** El documento ya fue autorizado. Protección contra doble emisión. */
export class DocumentoYaAutorizadoError extends ArcaError {
  constructor(documentoId: string) {
    super(
      "DOCUMENTO_YA_AUTORIZADO",
      `El documento ${documentoId} ya fue autorizado en ARCA.`,
      409
    )
    this.name = "DocumentoYaAutorizadoError"
  }
}

/** El documento está en proceso de autorización (otro request en curso). */
export class DocumentoEnProcesoError extends ArcaError {
  constructor(documentoId: string) {
    super(
      "DOCUMENTO_EN_PROCESO",
      `El documento ${documentoId} ya está siendo procesado. Esperá e intentá de nuevo.`,
      409
    )
    this.name = "DocumentoEnProcesoError"
  }
}

/** Validación previa a enviar a ARCA falló. */
export class ArcaValidacionError extends ArcaError {
  readonly errores: string[]

  constructor(errores: string[]) {
    super(
      "ARCA_VALIDACION",
      `Validación pre-ARCA fallida: ${errores.join("; ")}`,
      400
    )
    this.name = "ArcaValidacionError"
    this.errores = errores
  }
}

/** El documento no se encuentra o no está en estado autorizable. */
export class DocumentoNoEncontradoError extends ArcaError {
  constructor(tipo: string, id: string) {
    super(
      "DOCUMENTO_NO_ENCONTRADO",
      `${tipo} ${id} no encontrado o no está en estado autorizable.`,
      404
    )
    this.name = "DocumentoNoEncontradoError"
  }
}
