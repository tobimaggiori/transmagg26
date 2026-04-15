/**
 * use-case-result.ts — Tipos compartidos para resultados de casos de uso
 *
 * Define el contrato uniforme de error y resultado que usan todos los
 * casos de uso del sistema (emitir factura, emitir nota CD, etc.).
 *
 * Campos de error:
 * - error: mensaje legible para el operador
 * - code: código programático (ej: "POST_CAE_PDF_ERROR", "ERROR_CREAR_COMPROBANTE")
 * - reintentable: si el operador puede reintentar la operación (errores ARCA transitorios)
 * - documentoId: ID del comprobante que quedó persistido (para reintento o soporte)
 */

/** Error estructurado de un caso de uso. */
export type UseCaseError = {
  error: string
  code?: string
  reintentable?: boolean
  documentoId?: string
}

/**
 * Resultado genérico de un caso de uso.
 * T es el tipo del body en caso de éxito (default unknown).
 *
 * El unknown en T viene de que los commands (nota-cd-commands, emision-directa)
 * retornan nota/documento como unknown. Eliminar ese unknown requiere tipar
 * los resultados de commands — ese es el paso siguiente, no de esta capa.
 */
export type UseCaseResult<T = unknown> =
  | { ok: true; status: number; body: T }
  | { ok: false; status: number; body: UseCaseError }
