/**
 * validarFechaEmisionArca: string -> { ok: true, fecha: Date } | { ok: false, error: string }
 *
 * Dado un string YYYY-MM-DD, valida que esté dentro de la ventana ARCA
 * (hasta 10 días hacia atrás, no futura). Retorna la fecha como Date
 * con hora 12:00 para evitar problemas de timezone.
 *
 * Ejemplos:
 * validarFechaEmisionArca("2026-04-07") => { ok: true, fecha: Date }
 * validarFechaEmisionArca("2020-01-01") => { ok: false, error: "La fecha de emisión no puede ser anterior a 10 días" }
 * validarFechaEmisionArca("2099-01-01") => { ok: false, error: "La fecha de emisión no puede ser futura" }
 */
export function validarFechaEmisionArca(fechaStr: string): { ok: true; fecha: Date } | { ok: false; error: string } {
  const fecha = new Date(fechaStr + "T12:00:00")
  if (isNaN(fecha.getTime())) return { ok: false, error: "Fecha inválida" }
  const hoy = new Date()
  hoy.setHours(12, 0, 0, 0)
  const hace10Dias = new Date(hoy)
  hace10Dias.setDate(hace10Dias.getDate() - 10)
  if (fecha < hace10Dias) return { ok: false, error: "La fecha de emisión no puede ser anterior a 10 días" }
  if (fecha > hoy) return { ok: false, error: "La fecha de emisión no puede ser futura" }
  return { ok: true, fecha }
}
