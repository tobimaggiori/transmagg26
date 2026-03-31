/**
 * Utilidades de búsqueda y normalización de texto para comboboxes buscables.
 * Exporta helpers usados en SearchCombobox y sus tests.
 */

/**
 * normalizarBusqueda: string -> string
 *
 * Dado un texto, devuelve el texto en minúsculas y sin tildes ni caracteres diacríticos.
 * Esta función existe para comparar búsquedas sin importar tildes ni mayúsculas,
 * permitiendo que "garcia" encuentre "García" y viceversa.
 *
 * Ejemplos:
 * normalizarBusqueda("García") === "garcia"
 * normalizarBusqueda("CUIT: 20-1") === "cuit: 20-1"
 * normalizarBusqueda("  Rodríguez  ") === "  rodriguez  "
 */
export function normalizarBusqueda(texto: string): string {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
}

/**
 * coincideConBusqueda: { label: string, sublabel?: string } string -> boolean
 *
 * Dado un item con label y sublabel opcional, y un texto de búsqueda,
 * devuelve true si el label o el sublabel contienen el texto (sin distinción de tildes ni mayúsculas).
 * Esta función existe para filtrar el listado del SearchCombobox en tiempo real.
 *
 * Ejemplos:
 * coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "garcia") === true
 * coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "12345") === true
 * coincideConBusqueda({ label: "García SRL", sublabel: "20-12345678-9" }, "xyz") === false
 */
export function coincideConBusqueda(
  item: { label: string; sublabel?: string },
  busqueda: string
): boolean {
  const q = normalizarBusqueda(busqueda)
  return (
    normalizarBusqueda(item.label).includes(q) ||
    normalizarBusqueda(item.sublabel ?? "").includes(q)
  )
}
