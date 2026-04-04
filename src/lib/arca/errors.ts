/**
 * Propósito: Errores tipados para la integración ARCA.
 * Cada clase tiene código único, statusCode y flag `retryable` para que el frontend
 * y los logs puedan distinguir errores transitorios de permanentes.
 */

/** Error base de la capa ARCA. Todos los errores ARCA heredan de esta clase. */
class ArcaErrorBase extends Error {
  readonly code: string
  readonly statusCode: number
  /** true si el error es transitorio y se puede reintentar. */
  readonly retryable: boolean

  constructor(code: string, message: string, statusCode = 500, retryable = false) {
    super(message)
    this.name = "ArcaError"
    this.code = code
    this.statusCode = statusCode
    this.retryable = retryable
  }
}

/** ARCA no está configurada o no está activa. No reintentable. */
export class ArcaNoConfiguradaError extends ArcaErrorBase {
  constructor(detalle?: string) {
    super(
      "ARCA_NO_CONFIGURADA",
      detalle ?? "La configuración ARCA no está activa. Configurala desde ABM → ARCA.",
      503,
      false
    )
    this.name = "ArcaNoConfiguradaError"
  }
}

/** Faltan datos obligatorios en la configuración. No reintentable. */
export class ArcaConfigIncompletaError extends ArcaErrorBase {
  constructor(campo: string) {
    super("ARCA_CONFIG_INCOMPLETA", `Configuración ARCA incompleta: falta ${campo}.`, 503, false)
    this.name = "ArcaConfigIncompletaError"
  }
}

/** Error de autenticación WSAA. Reintentable (puede ser transitorio). */
export class WsaaError extends ArcaErrorBase {
  constructor(detalle: string, retryable = true) {
    super("WSAA_ERROR", `Error de autenticación WSAA: ${detalle}`, 502, retryable)
    this.name = "WsaaError"
  }
}

/** Error de WSFEv1. Reintentable si es de red/timeout, no si es SOAP fault funcional. */
export class Wsfev1Error extends ArcaErrorBase {
  constructor(detalle: string, retryable = true) {
    super("WSFEV1_ERROR", `Error del servicio WSFEv1: ${detalle}`, 502, retryable)
    this.name = "Wsfev1Error"
  }
}

/** ARCA rechazó el comprobante. NO reintentable (rechazo fiscal). */
export class ArcaRechazoError extends ArcaErrorBase {
  readonly observaciones: string

  constructor(observaciones: string) {
    super("ARCA_RECHAZO", `Comprobante rechazado por ARCA: ${observaciones}`, 422, false)
    this.name = "ArcaRechazoError"
    this.observaciones = observaciones
  }
}

/** El documento ya fue autorizado. NO reintentable. */
export class DocumentoYaAutorizadoError extends ArcaErrorBase {
  constructor() {
    super("DOCUMENTO_YA_AUTORIZADO", `El documento ya fue autorizado en ARCA.`, 409, false)
    this.name = "DocumentoYaAutorizadoError"
  }
}

/** El documento está en proceso de autorización. Reintentable (esperar y reintentar). */
export class DocumentoEnProcesoError extends ArcaErrorBase {
  constructor() {
    super("DOCUMENTO_EN_PROCESO", `El documento ya está siendo procesado. Esperá e intentá de nuevo.`, 409, true)
    this.name = "DocumentoEnProcesoError"
  }
}

/** Validación previa falló. NO reintentable (datos incorrectos). */
export class ArcaValidacionError extends ArcaErrorBase {
  readonly errores: string[]

  constructor(errores: string[]) {
    super("ARCA_VALIDACION", `Validación pre-ARCA fallida: ${errores.join("; ")}`, 400, false)
    this.name = "ArcaValidacionError"
    this.errores = errores
  }
}

/** Documento no encontrado o no autorizable. NO reintentable. */
export class DocumentoNoEncontradoError extends ArcaErrorBase {
  constructor(tipo: string) {
    super("DOCUMENTO_NO_ENCONTRADO", `${tipo} no encontrado o no está en estado autorizable.`, 404, false)
    this.name = "DocumentoNoEncontradoError"
  }
}

/** Re-export con nombre canónico. Necesario como export porque las routes hacen instanceof. */
export const ArcaError = ArcaErrorBase

/** Verifica si un error es de la capa ARCA (útil para instanceof checks en routes). */
export function esArcaError(err: unknown): err is ArcaErrorBase {
  return err instanceof ArcaErrorBase
}
