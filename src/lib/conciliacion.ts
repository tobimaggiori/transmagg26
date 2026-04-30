/**
 * conciliacion.ts — Lógica de sellado de días y cierre mensual de cuentas.
 *
 * Un ConciliacionDia sella (cuentaId, fecha) con el saldo del extracto
 * bancario del día. Cuando todos los días de un mes con movimientos están
 * sellados, el mes puede cerrarse creando un CierreMesCuenta. El cierre
 * mensual es el sello que consultan los reportes contables para saber si
 * el mes de una cuenta está completo.
 *
 * Reglas:
 *  - sellarDia: idempotente (upsert). No requiere que haya movimientos.
 *  - desellarDia: bloqueado si el mes contenedor está cerrado.
 *  - cerrarMes: exige que TODOS los días con movimientos del mes tengan
 *    ConciliacionDia. No exige nada sobre días sin movimientos.
 *  - reabrirMes: borra el CierreMesCuenta; no toca los ConciliacionDia.
 */

import { prisma } from "@/lib/prisma"
import { aDiaUtc, rangoMesUtc } from "@/lib/movimiento-cuenta"
import { m } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type EstadoMes = "SIN_MOVIMIENTOS" | "PENDIENTE" | "EN_CURSO" | "LISTO_PARA_CERRAR" | "CERRADO"

// ─── Sellado de día ──────────────────────────────────────────────────────────

/**
 * sellarDia: { cuentaId, fecha, saldoExtracto, operadorId } -> Promise<{ id: string; creado: boolean }>
 *
 * Dado [cuenta, fecha, saldo del extracto y operador], sella el día con
 * upsert. Devuelve [el id y si fue creación (true) o actualización (false)].
 *
 * Valida:
 *  - Cuenta existe.
 *  - Mes contenedor NO está cerrado (si está, reabrir primero).
 *
 * Ejemplos:
 * sellarDia({ cuentaId: "c1", fecha: new Date("2026-04-15"), saldoExtracto: 12500.5, operadorId: "u1" })
 *   // => { id: "...", creado: true }  (primera vez)
 *   // => { id: "...", creado: false } (actualización)
 */
export async function sellarDia(params: {
  cuentaId: string
  fecha: Date
  saldoExtracto: number
  operadorId: string
}): Promise<{ id: string; creado: boolean }> {
  const dia = aDiaUtc(params.fecha)
  const mes = dia.getUTCMonth() + 1
  const anio = dia.getUTCFullYear()
  const saldoExtracto = m(params.saldoExtracto)

  const cerrado = await prisma.cierreMesCuenta.findUnique({
    where: { cuentaId_mes_anio: { cuentaId: params.cuentaId, mes, anio } },
    select: { id: true },
  })
  if (cerrado) {
    throw new Error("El mes está cerrado. Reabrí el mes antes de sellar o modificar días.")
  }

  const existente = await prisma.conciliacionDia.findUnique({
    where: { cuentaId_fecha: { cuentaId: params.cuentaId, fecha: dia } },
    select: { id: true },
  })

  if (existente) {
    const upd = await prisma.conciliacionDia.update({
      where: { id: existente.id },
      data: {
        saldoExtracto,
        operadorId: params.operadorId,
        conciliadoEn: new Date(),
      },
      select: { id: true },
    })
    return { id: upd.id, creado: false }
  }

  const creado = await prisma.conciliacionDia.create({
    data: {
      cuentaId: params.cuentaId,
      fecha: dia,
      saldoExtracto,
      operadorId: params.operadorId,
    },
    select: { id: true },
  })
  return { id: creado.id, creado: true }
}

/**
 * desellarDia: { cuentaId, fecha } -> Promise<boolean>
 *
 * Dado [cuenta y fecha], elimina el ConciliacionDia si existe. Devuelve
 * [true si había sello, false si no].
 *
 * Valida:
 *  - Mes contenedor NO está cerrado.
 */
export async function desellarDia(params: {
  cuentaId: string
  fecha: Date
}): Promise<boolean> {
  const dia = aDiaUtc(params.fecha)
  const mes = dia.getUTCMonth() + 1
  const anio = dia.getUTCFullYear()

  const cerrado = await prisma.cierreMesCuenta.findUnique({
    where: { cuentaId_mes_anio: { cuentaId: params.cuentaId, mes, anio } },
    select: { id: true },
  })
  if (cerrado) {
    throw new Error("El mes está cerrado. Reabrí el mes antes de desellar días.")
  }

  const deletedMany = await prisma.conciliacionDia.deleteMany({
    where: { cuentaId: params.cuentaId, fecha: dia },
  })
  return deletedMany.count > 0
}

// ─── Cierre / reapertura de mes ──────────────────────────────────────────────

/**
 * diasConMovimientosPendientesDeSellar: string number number -> Promise<Date[]>
 *
 * Dado [cuenta, mes, año], devuelve [los días del mes que tienen al menos un
 * movimiento pero no tienen ConciliacionDia]. Si el array está vacío, el mes
 * está listo para cerrar.
 */
export async function diasConMovimientosPendientesDeSellar(
  cuentaId: string,
  mes: number,
  anio: number
): Promise<Date[]> {
  const { desde, hasta } = rangoMesUtc(mes, anio)

  const movimientos = await prisma.movimientoCuenta.findMany({
    where: { cuentaId, fecha: { gte: desde, lt: hasta } },
    select: { fecha: true },
    distinct: ["fecha"],
    orderBy: { fecha: "asc" },
  })
  const fechasConMov = movimientos.map((m) => m.fecha)

  const sellados = await prisma.conciliacionDia.findMany({
    where: { cuentaId, fecha: { gte: desde, lt: hasta } },
    select: { fecha: true },
  })
  const setSellados = new Set(sellados.map((s) => s.fecha.toISOString()))

  return fechasConMov.filter((f) => !setSellados.has(f.toISOString()))
}

/**
 * cerrarMes: { cuentaId, mes, anio, operadorId, pdfExtractoKey?, observaciones? }
 *   -> Promise<{ id: string }>
 *
 * Dado [datos del cierre], crea un CierreMesCuenta si se cumplen las
 * precondiciones. Devuelve [el id creado].
 *
 * Valida:
 *  - El mes aún no está cerrado.
 *  - Todos los días con movimientos del mes tienen ConciliacionDia.
 *
 * Se permite cerrar un mes sin movimientos (nada que sellar), por si la
 * cuenta no operó ese mes.
 */
export async function cerrarMes(params: {
  cuentaId: string
  mes: number
  anio: number
  operadorId: string
  pdfExtractoKey?: string | null
  observaciones?: string | null
}): Promise<{ id: string }> {
  const yaCerrado = await prisma.cierreMesCuenta.findUnique({
    where: { cuentaId_mes_anio: { cuentaId: params.cuentaId, mes: params.mes, anio: params.anio } },
    select: { id: true },
  })
  if (yaCerrado) throw new Error("El mes ya está cerrado")

  const pendientes = await diasConMovimientosPendientesDeSellar(
    params.cuentaId,
    params.mes,
    params.anio
  )
  if (pendientes.length > 0) {
    throw new Error(
      `Faltan sellar ${pendientes.length} día(s) con movimientos antes de cerrar el mes`
    )
  }

  const creado = await prisma.cierreMesCuenta.create({
    data: {
      cuentaId: params.cuentaId,
      mes: params.mes,
      anio: params.anio,
      operadorId: params.operadorId,
      pdfExtractoKey: params.pdfExtractoKey ?? null,
      observaciones: params.observaciones ?? null,
    },
    select: { id: true },
  })
  return creado
}

/**
 * reabrirMes: { cuentaId, mes, anio } -> Promise<boolean>
 *
 * Dado [cuenta, mes, año], elimina el CierreMesCuenta si existe. Devuelve
 * [true si había cierre, false si no]. No toca los ConciliacionDia.
 */
export async function reabrirMes(params: {
  cuentaId: string
  mes: number
  anio: number
}): Promise<boolean> {
  const del = await prisma.cierreMesCuenta.deleteMany({
    where: { cuentaId: params.cuentaId, mes: params.mes, anio: params.anio },
  })
  return del.count > 0
}

// ─── Consulta de estado del mes ──────────────────────────────────────────────

/**
 * estadoMesCuenta: string number number -> Promise<EstadoMes>
 *
 * Dado [cuenta, mes, año], devuelve [su estado derivado]:
 *   - CERRADO: existe CierreMesCuenta.
 *   - LISTO_PARA_CERRAR: todos los días con movimientos sellados, sin cierre aún.
 *   - EN_CURSO: hay algún ConciliacionDia pero faltan sellar días con movs.
 *   - PENDIENTE: hay movimientos pero ningún ConciliacionDia aún.
 *   - SIN_MOVIMIENTOS: el mes no tiene movimientos ni sellos.
 */
export async function estadoMesCuenta(
  cuentaId: string,
  mes: number,
  anio: number
): Promise<EstadoMes> {
  const cerrado = await prisma.cierreMesCuenta.findUnique({
    where: { cuentaId_mes_anio: { cuentaId, mes, anio } },
    select: { id: true },
  })
  if (cerrado) return "CERRADO"

  const { desde, hasta } = rangoMesUtc(mes, anio)

  const [cantMovs, cantSellos] = await Promise.all([
    prisma.movimientoCuenta.count({
      where: { cuentaId, fecha: { gte: desde, lt: hasta } },
    }),
    prisma.conciliacionDia.count({
      where: { cuentaId, fecha: { gte: desde, lt: hasta } },
    }),
  ])

  if (cantMovs === 0 && cantSellos === 0) return "SIN_MOVIMIENTOS"

  const pendientes = await diasConMovimientosPendientesDeSellar(cuentaId, mes, anio)
  if (pendientes.length === 0) return "LISTO_PARA_CERRAR"
  if (cantSellos > 0) return "EN_CURSO"
  return "PENDIENTE"
}

// ─── Soporte para reportes contables ────────────────────────────────────────

/**
 * cuentasActivasConMesAbierto: number number -> Promise<{ id: string; nombre: string }[]>
 *
 * Dado [mes y año], devuelve [las cuentas activas que NO tienen CierreMesCuenta
 * para ese mes]. Lista vacía == todas las cuentas activas cerraron ese mes.
 *
 * Este helper es el que los reportes contables van a consultar para decidir si
 * pueden generarse.
 */
export async function cuentasActivasConMesAbierto(
  mes: number,
  anio: number
): Promise<{ id: string; nombre: string }[]> {
  const activas = await prisma.cuenta.findMany({
    where: { activa: true },
    select: { id: true, nombre: true },
  })
  const cierres = await prisma.cierreMesCuenta.findMany({
    where: { mes, anio, cuentaId: { in: activas.map((c) => c.id) } },
    select: { cuentaId: true },
  })
  const cerradosSet = new Set(cierres.map((c) => c.cuentaId))
  return activas.filter((c) => !cerradosSet.has(c.id))
}

/**
 * mesCerradoParaTodasLasCuentas: number number -> Promise<boolean>
 *
 * Dado [mes y año], devuelve [true si todas las cuentas activas tienen
 * CierreMesCuenta para ese periodo]. Wrapper sobre `cuentasActivasConMesAbierto`
 * para el caso booleano.
 */
export async function mesCerradoParaTodasLasCuentas(
  mes: number,
  anio: number
): Promise<boolean> {
  const abiertas = await cuentasActivasConMesAbierto(mes, anio)
  return abiertas.length === 0
}

// ─── Utilidad transaccional (para uso interno de commands) ──────────────────

/**
 * validarDiaModificable: Tx string Date -> Promise<void>
 *
 * Re-exporta la validación usada por movimiento-cuenta.ts para que commands
 * externos puedan pre-chequear antes de operaciones compuestas.
 * Lanza si el día está sellado o el mes cerrado.
 */
export async function validarDiaModificable(tx: Tx, cuentaId: string, fecha: Date): Promise<void> {
  const dia = aDiaUtc(fecha)
  const mes = dia.getUTCMonth() + 1
  const anio = dia.getUTCFullYear()
  const [sellado, cerrado] = await Promise.all([
    tx.conciliacionDia.findUnique({
      where: { cuentaId_fecha: { cuentaId, fecha: dia } },
      select: { id: true },
    }),
    tx.cierreMesCuenta.findUnique({
      where: { cuentaId_mes_anio: { cuentaId, mes, anio } },
      select: { id: true },
    }),
  ])
  if (sellado) throw new Error("El día está conciliado. Desconciliá antes de modificar.")
  if (cerrado) throw new Error("El mes está cerrado. Reabrí antes de modificar.")
}
