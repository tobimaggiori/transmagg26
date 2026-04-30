/**
 * feriados.ts
 *
 * Helper para determinar si una fecha es día hábil en Argentina.
 * Consume https://api.argentinadatos.com/v1/feriados/{year} y cachea en DB
 * (`FeriadoArgentino`). Una vez sincronizado el año no hace requests extra.
 *
 * - esDiaHabil(fecha): true si no es sábado/domingo ni feriado nacional.
 * - sincronizarFeriadosAnio(year): fetchea y upserta la lista del año.
 * - proximoDiaHabil / diaHabilAnterior: utilitarios de cálculo.
 */

import { prisma } from "@/lib/prisma"

interface FeriadoAPI {
  fecha: string // "YYYY-MM-DD"
  tipo: string
  nombre: string
}

/**
 * diaAnterior: Date -> Date
 *
 * Devuelve una nueva Date un día antes (medianoche local).
 */
function diaAnterior(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() - 1)
  return d
}

/**
 * diaPosterior: Date -> Date
 *
 * Devuelve una nueva Date un día después (medianoche local).
 */
function diaPosterior(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  d.setDate(d.getDate() + 1)
  return d
}

/**
 * aFechaYmd: Date -> Date
 *
 * Normaliza a medianoche local (descarta hora).
 */
function aFechaYmd(fecha: Date): Date {
  const d = new Date(fecha)
  d.setHours(0, 0, 0, 0)
  return d
}

/**
 * sincronizarFeriadosAnio: number -> Promise<number>
 *
 * Trae el listado de feriados del año desde argentinadatos.com y los upserta
 * en la tabla local. Devuelve la cantidad de feriados cargados.
 * Silencioso si falla: devuelve 0 y loggea el error.
 */
export async function sincronizarFeriadosAnio(year: number): Promise<number> {
  try {
    const res = await fetch(`https://api.argentinadatos.com/v1/feriados/${year}`, {
      // 1 día de cache HTTP por seguridad si el fetch se repite
      next: { revalidate: 86400 },
    })
    if (!res.ok) {
      console.warn(`[feriados] API devolvió ${res.status} para ${year}`)
      return 0
    }
    const data = (await res.json()) as FeriadoAPI[]
    if (!Array.isArray(data)) return 0

    // Upsert uno por uno dentro de una transacción para atomicidad.
    await prisma.$transaction(
      data.map((f) =>
        prisma.feriadoArgentino.upsert({
          where: { fecha: new Date(f.fecha + "T00:00:00") },
          create: {
            fecha: new Date(f.fecha + "T00:00:00"),
            year,
            nombre: f.nombre,
            tipo: f.tipo,
          },
          update: { nombre: f.nombre, tipo: f.tipo, year },
        })
      )
    )
    return data.length
  } catch (err) {
    console.warn("[feriados] Error sincronizando:", err)
    return 0
  }
}

/**
 * asegurarFeriadosAnio: number -> Promise<void>
 *
 * Si el año no tiene feriados cargados en la DB, los trae de la API.
 */
async function asegurarFeriadosAnio(year: number): Promise<void> {
  const cuenta = await prisma.feriadoArgentino.count({ where: { year } })
  if (cuenta === 0) {
    await sincronizarFeriadosAnio(year)
  }
}

/**
 * esFeriado: Date -> Promise<boolean>
 *
 * Consulta la DB local (y sincroniza el año si no tiene datos).
 *
 * Ejemplos:
 * esFeriado(new Date("2026-05-01")) === true  // Día del Trabajador
 * esFeriado(new Date("2026-03-05")) === false // jueves común
 */
export async function esFeriado(fecha: Date): Promise<boolean> {
  const f = aFechaYmd(fecha)
  await asegurarFeriadosAnio(f.getFullYear())
  const row = await prisma.feriadoArgentino.findUnique({ where: { fecha: f } })
  return !!row
}

/**
 * esDiaHabil: Date -> Promise<boolean>
 *
 * Día hábil = lunes a viernes y NO feriado nacional argentino.
 *
 * Ejemplos:
 * esDiaHabil(new Date("2026-03-07")) // sábado → false
 * esDiaHabil(new Date("2026-05-01")) // feriado → false
 * esDiaHabil(new Date("2026-03-05")) // jueves común → true
 */
export async function esDiaHabil(fecha: Date): Promise<boolean> {
  const d = aFechaYmd(fecha)
  const dow = d.getDay() // 0=domingo, 6=sábado
  if (dow === 0 || dow === 6) return false
  return !(await esFeriado(d))
}

/**
 * diaHabilAnterior: Date -> Promise<Date>
 *
 * Devuelve el día hábil inmediato anterior a la fecha dada.
 */
export async function diaHabilAnterior(fecha: Date): Promise<Date> {
  let d = diaAnterior(fecha)
  while (!(await esDiaHabil(d))) d = diaAnterior(d)
  return d
}

/**
 * contarDiasHabilesEntre: Date Date -> Promise<number>
 *
 * Cuenta días hábiles entre dos fechas (inclusive ambas si son hábiles).
 * desde < hasta. Si se pasan iguales, devuelve 0 o 1 según si es hábil.
 */
export async function contarDiasHabilesEntre(desde: Date, hasta: Date): Promise<number> {
  const a = aFechaYmd(desde)
  const b = aFechaYmd(hasta)
  if (a > b) return 0
  let count = 0
  let cursor = new Date(a)
  while (cursor <= b) {
    if (await esDiaHabil(cursor)) count += 1
    cursor = diaPosterior(cursor)
  }
  return count
}
