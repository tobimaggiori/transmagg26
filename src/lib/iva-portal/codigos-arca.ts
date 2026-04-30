/**
 * codigos-arca.ts — Mapeo de códigos ARCA usados en el LID.
 *
 * Catálogo cerrado según docs/arca/matriz.md. Si llega un comprobante con
 * código fuera de esta tabla, recolectarDatos() debe producir error
 * bloqueante en validaciones.
 *
 * Funciones puras, sin Prisma, sin estado.
 */

/**
 * COMPROBANTES_LID: Mapa de tipoCbte interno (= código ARCA) a etiqueta.
 * Usamos los mismos códigos que ARCA — no hay traducción.
 *
 * Catálogo cerrado de Transmagg (matriz.md):
 *  Empresa: 1, 2, 3, 6, 7, 8, 201, 202, 203
 *  Fletero: 60, 61
 *  Notas sobre LP: 2, 3, 7, 8 (mismos códigos que facturas A/B)
 */
export const COMPROBANTES_LID: Record<number, string> = {
  1: "Factura A",
  2: "Nota de Débito A",
  3: "Nota de Crédito A",
  6: "Factura B",
  7: "Nota de Débito B",
  8: "Nota de Crédito B",
  60: "Cuenta de Venta y Líquido Producto A",
  61: "Cuenta de Venta y Líquido Producto B",
  201: "Factura de Crédito Electrónica MiPyMEs A",
  202: "ND Factura de Crédito Electrónica MiPyMEs A",
  203: "NC Factura de Crédito Electrónica MiPyMEs A",
}

/**
 * codigoArcaSoportado: number -> boolean
 *
 * Dado un código de comprobante (entero), devuelve true si está en la matriz
 * cerrada de Transmagg/ARCA.
 *
 * Existe para validar antes de incluir en el TXT — un código no soportado
 * impide generar el LID.
 *
 * Ejemplos:
 * codigoArcaSoportado(1)   === true   // Factura A
 * codigoArcaSoportado(60)  === true   // CVLP A
 * codigoArcaSoportado(201) === true   // FCE MiPyMEs A
 * codigoArcaSoportado(99)  === false  // No existe en matriz
 * codigoArcaSoportado(0)   === false
 */
export function codigoArcaSoportado(codigo: number): boolean {
  return Object.prototype.hasOwnProperty.call(COMPROBANTES_LID, codigo)
}

/**
 * etiquetaComprobanteArca: number -> string
 *
 * Dado un código ARCA, devuelve su etiqueta legible. Si no está soportado,
 * devuelve "Código N (no soportado)".
 *
 * Ejemplos:
 * etiquetaComprobanteArca(1)  === "Factura A"
 * etiquetaComprobanteArca(60) === "Cuenta de Venta y Líquido Producto A"
 * etiquetaComprobanteArca(99) === "Código 99 (no soportado)"
 */
export function etiquetaComprobanteArca(codigo: number): string {
  return COMPROBANTES_LID[codigo] ?? `Código ${codigo} (no soportado)`
}

/**
 * ALICUOTAS_LID: Mapa de porcentaje IVA a código ARCA en archivos de alícuota.
 *
 * Códigos según especificación LID/CITI (RG 5223):
 *  3 → 0%
 *  4 → 10.5%
 *  5 → 21%
 *  6 → 27%
 *  8 → 5%
 *  9 → 2.5%
 *
 * Las alícuotas se identifican por porcentaje exacto. Si llega un valor
 * intermedio (ej: 12%), no es soportado por ARCA.
 */
export const ALICUOTAS_LID: ReadonlyArray<{ porcentaje: number; codigo: number }> = [
  { porcentaje: 0, codigo: 3 },
  { porcentaje: 2.5, codigo: 9 },
  { porcentaje: 5, codigo: 8 },
  { porcentaje: 10.5, codigo: 4 },
  { porcentaje: 21, codigo: 5 },
  { porcentaje: 27, codigo: 6 },
]

/**
 * codigoAlicuotaArca: number -> number | null
 *
 * Dado un porcentaje de IVA (ej: 21), devuelve el código ARCA correspondiente
 * (en este caso 5). Devuelve null si la alícuota no está soportada.
 *
 * Permite tolerancia de 0.01 para evitar problemas con coma flotante
 * (e.g. 21.0000001 cuenta como 21).
 *
 * Ejemplos:
 * codigoAlicuotaArca(21)    === 5
 * codigoAlicuotaArca(10.5)  === 4
 * codigoAlicuotaArca(0)     === 3
 * codigoAlicuotaArca(12)    === null
 * codigoAlicuotaArca(20.99) === null  // diferencia > 0.01
 */
export function codigoAlicuotaArca(porcentaje: number): number | null {
  for (const { porcentaje: p, codigo } of ALICUOTAS_LID) {
    if (Math.abs(p - porcentaje) < 0.01) return codigo
  }
  return null
}

/**
 * alicuotaSoportada: number -> boolean
 */
export function alicuotaSoportada(porcentaje: number): boolean {
  return codigoAlicuotaArca(porcentaje) !== null
}

/**
 * MONEDAS_LID: códigos de moneda (3 caracteres). Por ahora solo PES.
 * Si en el futuro se factura en USD, agregar "DOL".
 */
export const MONEDAS_LID = {
  PESOS: "PES",
} as const

/**
 * CODIGOS_DOCUMENTO_LID: tipo de documento del receptor.
 * 80 = CUIT (siempre en operaciones B2B)
 * 86 = CUIL (poco usado)
 * 96 = DNI
 * 99 = Sin identificar (consumidor final)
 */
export const CODIGOS_DOCUMENTO_LID = {
  CUIT: 80,
  CUIL: 86,
  DNI: 96,
  SIN_IDENTIFICAR: 99,
} as const

/**
 * codigoDocumentoPorCuit: string -> number
 *
 * Dado un CUIT/CUIL/DNI normalizado (solo dígitos), devuelve el código
 * ARCA de tipo de documento.
 *
 * Reglas:
 * - 11 dígitos empezando con 20/23/24/27/30/33/34 → CUIT (80)
 * - 11 dígitos empezando con 20/23/24/27 → puede ser CUIL pero ARCA acepta 80 igual
 * - 8 dígitos → DNI (96)
 * - 0 dígitos o vacío → SIN_IDENTIFICAR (99)
 *
 * Para LID en B2B siempre se usa CUIT.
 *
 * Ejemplos:
 * codigoDocumentoPorCuit("30709381683") === 80  // CUIT
 * codigoDocumentoPorCuit("12345678")    === 96  // DNI
 * codigoDocumentoPorCuit("")            === 99
 */
export function codigoDocumentoPorCuit(documento: string): number {
  const limpio = (documento ?? "").replace(/\D/g, "")
  if (limpio.length === 11) return CODIGOS_DOCUMENTO_LID.CUIT
  if (limpio.length === 8) return CODIGOS_DOCUMENTO_LID.DNI
  return CODIGOS_DOCUMENTO_LID.SIN_IDENTIFICAR
}

/**
 * esTipoVentas: number -> boolean
 *
 * Dado un código ARCA, devuelve true si el comprobante va al libro de
 * VENTAS (factura emitida o nota sobre factura emitida). False si va a
 * COMPRAS (LP, factura proveedor, factura seguro, NC/ND recibidas).
 *
 * Nota: el mismo código ARCA puede ir a Ventas o Compras según quién emitió.
 * Esta función solo da una pista basada en el código y el flujo natural en
 * Transmagg, pero la fuente de verdad es `tipoLibro` del DTO.
 *
 * Ejemplos:
 * esTipoVentas(1)   === true   // Factura A emitida → Ventas
 * esTipoVentas(60)  === false  // CVLP emitida → Compras (es LP a fletero)
 * esTipoVentas(201) === true   // FCE A emitida → Ventas
 */
export function esTipoVentas(codigoArca: number): boolean {
  // En Transmagg los CVLP (60, 61) son liquidaciones a fleteros que generan
  // IVA Compras (no Ventas). Las facturas (1, 2, 3, 6, 7, 8, 201-203) son
  // emitidas a empresas y generan IVA Ventas. Pero NC/ND recibidas usan los
  // mismos códigos ARCA y van a Compras — el `tipoLibro` del DTO manda.
  return [1, 2, 3, 6, 7, 8, 201, 202, 203].includes(codigoArca)
}
