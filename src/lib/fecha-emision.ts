/**
 * validarFechaEmisionArca: (string, Date?) -> { ok: true, fecha: Date } | { ok: false, error: string }
 *
 * Dado un string YYYY-MM-DD, valida que esté dentro de la ventana ARCA
 * (hasta 10 días hacia atrás, no futura). Retorna la fecha como Date
 * normalizada a mediodía local.
 *
 * Usa parseo LOCAL explícito — no depende de toISOString ni de UTC.
 * El parámetro `ahora` permite testear sin depender del reloj real.
 *
 * Ejemplos:
 * validarFechaEmisionArca("2026-04-07") => { ok: true, fecha: Date }
 * validarFechaEmisionArca("2020-01-01") => { ok: false, error: "...anterior a 10 días" }
 * validarFechaEmisionArca("2099-01-01") => { ok: false, error: "...futura" }
 */

import {
  parsearFechaLocalMediodia,
  normalizarMediodiaLocal,
  sumarDiasLocal,
} from "@/lib/date-local"

export function validarFechaEmisionArca(
  fechaStr: string,
  ahora: Date = new Date()
): { ok: true; fecha: Date } | { ok: false; error: string } {
  let fecha: Date
  try {
    fecha = parsearFechaLocalMediodia(fechaStr)
  } catch {
    return { ok: false, error: "Fecha inválida" }
  }

  const hoy = normalizarMediodiaLocal(ahora)
  const hace10Dias = sumarDiasLocal(hoy, -10)

  if (fecha > hoy) return { ok: false, error: "La fecha de emisión no puede ser futura" }
  if (fecha < hace10Dias) return { ok: false, error: "La fecha de emisión no puede ser anterior a 10 días" }

  return { ok: true, fecha }
}
