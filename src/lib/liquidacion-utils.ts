/**
 * Utilidades para la UI y lógica de liquidaciones ARCA.
 * Exporta helpers de formato y presentación usados tanto en componentes
 * como en tests.
 */

/**
 * labelCondicionIva: string -> string
 *
 * Dado un valor interno de condición IVA, devuelve el label legible en español.
 * Esta función existe para mostrar la condición impositiva del fletero en la UI
 * de forma amigable.
 *
 * Ejemplos:
 * labelCondicionIva("RESPONSABLE_INSCRIPTO") === "Responsable Inscripto"
 * labelCondicionIva("MONOTRIBUTISTA") === "Monotributista"
 * labelCondicionIva("EXENTO") === "Exento"
 * labelCondicionIva("CONSUMIDOR_FINAL") === "Consumidor Final"
 * labelCondicionIva("OTRO") === "OTRO"
 */
export function labelCondicionIva(condicion: string): string {
  const mapa: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
    MONOTRIBUTISTA: "Monotributista",
    EXENTO: "Exento",
    CONSUMIDOR_FINAL: "Consumidor Final",
  }
  return mapa[condicion] ?? condicion
}

/**
 * formatearNroComprobante: number -> string
 *
 * Dado un número de comprobante, devuelve el número formateado con ceros a la
 * izquierda hasta 8 dígitos.
 * Esta función existe para mostrar el número de líquido producto en el formato
 * estándar ARCA.
 *
 * Ejemplos:
 * formatearNroComprobante(1) === "00000001"
 * formatearNroComprobante(42) === "00000042"
 * formatearNroComprobante(12345678) === "12345678"
 */
export function formatearNroComprobante(nro: number): string {
  return String(nro).padStart(8, "0")
}
