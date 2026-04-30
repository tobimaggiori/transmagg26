/**
 * pdf-style.ts — Constantes de estilo compartidas para todos los PDFs.
 *
 * La regla CLAUDE.md #8 fija que generamos PDFs con pdfkit. Para que todos
 * los documentos del sistema se vean coherentes (tipo de letra, jerarquía
 * visual, márgenes), todo nuevo PDF importa estas constantes en lugar de
 * inventar números mágicos.
 *
 * Si un caso particular necesita desviarse, dejar un comentario explicando
 * la razón.
 */

/**
 * Tamaños de letra en puntos.
 *
 * Pensado para A4 (portrait o landscape). Si bajás de TABLE_BODY el contador
 * empieza a forzar la vista; si subís TITLE el header se come el contenido.
 */
export const PDF_FONT = {
  /** Encabezado principal del documento (nombre del libro/comprobante). */
  TITLE: 14,
  /** Subtítulo bajo el header (período, totales, etc.). */
  SUBTITLE: 10,
  /** Encabezado de sección dentro del documento. */
  SECTION: 11,
  /** Encabezado de tabla. */
  TABLE_HEAD: 9,
  /** Cuerpo de tabla (filas de datos). Mínimo cómodo para libros contables. */
  TABLE_BODY: 9,
  /** Fila de totales — apenas más grande para distinguirla. */
  TABLE_TOTAL: 9.5,
  /** Texto auxiliar (labels secundarios, observaciones). */
  CAPTION: 8.5,
  /** Footer del documento. */
  FOOTER: 8,
} as const

/**
 * Colores estándar.
 */
export const PDF_COLOR = {
  TEXT: "#000000",
  TEXT_MUTED: "#555555",
  TEXT_DIM: "#888888",
  NAVY: "#1e40af",
  HEADER_BG: "#e5e7eb",
  TOTALS_BG: "#f3f4f6",
  GRID_BORDER: "#cccccc",
  RED: "#dc2626",
  GREEN: "#16a34a",
} as const

/**
 * Márgenes de página en puntos.
 */
export const PDF_MARGIN = 36
