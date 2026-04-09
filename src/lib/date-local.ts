/**
 * date-local.ts — Helpers de fecha calendario local.
 *
 * Convención del proyecto:
 * - Los strings YYYY-MM-DD representan fechas CALENDARIO LOCAL (no UTC).
 * - Para convertir YYYY-MM-DD a Date, se normaliza a mediodía local (12:00)
 *   para evitar que shifts de timezone cambien el día.
 * - NUNCA usar toISOString().slice(0,10) para generar "hoy" en la UI,
 *   porque toISOString() devuelve UTC y puede diferir del día local.
 */

/**
 * hoyLocalYmd: (base?) -> string
 *
 * Devuelve la fecha de hoy (o de `base`) como YYYY-MM-DD en calendario local.
 * Usa getFullYear/getMonth/getDate — NO toISOString().
 *
 * Ejemplos:
 * hoyLocalYmd(new Date(2026, 3, 8)) // => "2026-04-08"
 * hoyLocalYmd(new Date(2026, 0, 1)) // => "2026-01-01"
 */
export function hoyLocalYmd(base: Date = new Date()): string {
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, "0")
  const d = String(base.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

/**
 * parsearFechaLocalMediodia: string -> Date
 *
 * Recibe un string YYYY-MM-DD y devuelve un Date a mediodía local.
 * Usa el constructor new Date(year, monthIndex, day, 12, 0, 0, 0) — NO parseo implícito.
 * Lanza Error si el formato es inválido o la fecha no existe.
 *
 * Ejemplos:
 * parsearFechaLocalMediodia("2026-04-08") // => Date(2026, 3, 8, 12, 0, 0, 0)
 * parsearFechaLocalMediodia("abc")        // => Error
 */
export function parsearFechaLocalMediodia(fechaStr: string): Date {
  const match = fechaStr.match(/^(\d{4})-(\d{2})-(\d{2})$/)
  if (!match) throw new Error(`Formato de fecha inválido: ${fechaStr}`)
  const [, ys, ms, ds] = match
  const year = parseInt(ys, 10)
  const month = parseInt(ms, 10) - 1
  const day = parseInt(ds, 10)
  const date = new Date(year, month, day, 12, 0, 0, 0)
  // Verificar que la fecha es real (e.g. no 2026-02-30)
  if (date.getFullYear() !== year || date.getMonth() !== month || date.getDate() !== day) {
    throw new Error(`Fecha inexistente: ${fechaStr}`)
  }
  return date
}

/**
 * normalizarMediodiaLocal: Date -> Date
 *
 * Devuelve una copia del Date con hora fijada a 12:00:00.000 local.
 * Útil para comparar dos fechas solo por día calendario.
 *
 * Ejemplos:
 * normalizarMediodiaLocal(new Date(2026, 3, 8, 23, 59)) // => Date(2026, 3, 8, 12, 0, 0, 0)
 */
export function normalizarMediodiaLocal(fecha: Date): Date {
  const copia = new Date(fecha)
  copia.setHours(12, 0, 0, 0)
  return copia
}

/**
 * sumarDiasLocal: (Date, number) -> Date
 *
 * Devuelve una copia de la fecha ajustada por `dias` (positivo o negativo),
 * normalizada a mediodía local.
 *
 * Ejemplos:
 * sumarDiasLocal(new Date(2026, 3, 8, 12), -10) // => Date(2026, 2, 29, 12, 0, 0, 0)
 * sumarDiasLocal(new Date(2026, 3, 8, 12), 1)   // => Date(2026, 3, 9, 12, 0, 0, 0)
 */
export function sumarDiasLocal(fecha: Date, dias: number): Date {
  const copia = normalizarMediodiaLocal(fecha)
  copia.setDate(copia.getDate() + dias)
  return copia
}

/**
 * mesLocalYm: (base?) -> string
 *
 * Devuelve el mes actual (o de `base`) como YYYY-MM en calendario local.
 * Usa getFullYear/getMonth — NO toISOString().
 *
 * Ejemplos:
 * mesLocalYm(new Date(2026, 3, 8)) // => "2026-04"
 * mesLocalYm(new Date(2026, 0, 1)) // => "2026-01"
 */
export function mesLocalYm(base: Date = new Date()): string {
  const y = base.getFullYear()
  const m = String(base.getMonth() + 1).padStart(2, "0")
  return `${y}-${m}`
}
