/**
 * Errores propios del módulo padron-arca (servicio constancia_inscripcion).
 */

export class PadronArcaError extends Error {
  readonly retryable: boolean
  constructor(message: string, retryable = false) {
    super(message)
    this.name = "PadronArcaError"
    this.retryable = retryable
  }
}

export class PadronArcaCuitInvalidoError extends PadronArcaError {
  constructor(cuit: string) {
    super(`CUIT inválido: ${cuit}`, false)
    this.name = "PadronArcaCuitInvalidoError"
  }
}

export class PadronArcaNoEncontradoError extends PadronArcaError {
  constructor(cuit: string) {
    super(`No se encontró persona con CUIT ${cuit} en el padrón`, false)
    this.name = "PadronArcaNoEncontradoError"
  }
}
