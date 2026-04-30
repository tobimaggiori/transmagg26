/**
 * periodo.ts — Máquina de estados del PeriodoIva.
 *
 * Estados (en orden lógico):
 *   ABIERTO ─────────────► EN_REVISION_CONTADOR ─────────────► TXT_GENERADO
 *      ▲                          ▲                                  │
 *      │                          │                                  ▼
 *      │                  ◄───────┴──────────► CONCILIADO ──► PRESENTADO
 *      │                                            │              │
 *      └────────────────── REABIERTO ◄──────────────┴──────────────┘
 *
 * Transiciones permitidas (validadas en API):
 *  ABIERTO → EN_REVISION_CONTADOR
 *  EN_REVISION_CONTADOR → TXT_GENERADO (al generar)
 *  EN_REVISION_CONTADOR → ABIERTO     (volver atrás)
 *  TXT_GENERADO → EN_REVISION_CONTADOR (regenerar más tarde)
 *  TXT_GENERADO → CONCILIADO
 *  CONCILIADO → PRESENTADO
 *  PRESENTADO → REABIERTO  (requiere permiso admin + motivo)
 *  REABIERTO → cualquier estado anterior
 */

import { prisma } from "@/lib/prisma"

export const ESTADOS_PERIODO = [
  "ABIERTO",
  "EN_REVISION_CONTADOR",
  "TXT_GENERADO",
  "CONCILIADO",
  "PRESENTADO",
  "REABIERTO",
] as const

export type EstadoPeriodo = typeof ESTADOS_PERIODO[number]

/** Transiciones válidas: { from: [...to] } */
const TRANSICIONES_VALIDAS: Record<EstadoPeriodo, EstadoPeriodo[]> = {
  ABIERTO: ["EN_REVISION_CONTADOR"],
  EN_REVISION_CONTADOR: ["TXT_GENERADO", "ABIERTO"],
  TXT_GENERADO: ["EN_REVISION_CONTADOR", "CONCILIADO"],
  CONCILIADO: ["PRESENTADO", "EN_REVISION_CONTADOR"],
  PRESENTADO: ["REABIERTO"],
  REABIERTO: ["ABIERTO", "EN_REVISION_CONTADOR", "TXT_GENERADO", "CONCILIADO"],
}

/**
 * transicionPermitida: from to -> boolean
 *
 * Ejemplos:
 * transicionPermitida("ABIERTO", "EN_REVISION_CONTADOR")    === true
 * transicionPermitida("PRESENTADO", "ABIERTO")              === false
 * transicionPermitida("PRESENTADO", "REABIERTO")            === true
 */
export function transicionPermitida(from: EstadoPeriodo, to: EstadoPeriodo): boolean {
  return TRANSICIONES_VALIDAS[from]?.includes(to) ?? false
}

/**
 * obtenerOCrearPeriodoIva: string -> Promise<PeriodoIva>
 *
 * Devuelve el período del mesAnio. Si no existe, lo crea en estado ABIERTO.
 *
 * Ejemplo:
 * obtenerOCrearPeriodoIva("2026-04") === { id, mesAnio: "2026-04", estado: "ABIERTO", ... }
 */
export async function obtenerOCrearPeriodoIva(mesAnio: string) {
  const existente = await prisma.periodoIva.findUnique({ where: { mesAnio } })
  if (existente) return existente
  return prisma.periodoIva.create({
    data: { mesAnio, estado: "ABIERTO" },
  })
}

/**
 * cambiarEstadoPeriodo: opciones -> Promise<PeriodoIva>
 *
 * Cambia el estado validando la transición. Si pasa a PRESENTADO o
 * CONCILIADO, marca cerradoEn/cerradoPorId. REABIERTO requiere motivo
 * (validar en API antes de llamar).
 *
 * Lanza si la transición no está permitida.
 */
export async function cambiarEstadoPeriodo(opciones: {
  periodoId: string
  nuevoEstado: EstadoPeriodo
  usuarioId: string
  observaciones?: string
}) {
  const { periodoId, nuevoEstado, usuarioId, observaciones } = opciones
  const periodo = await prisma.periodoIva.findUnique({ where: { id: periodoId } })
  if (!periodo) throw new Error("Período no encontrado")

  if (!transicionPermitida(periodo.estado as EstadoPeriodo, nuevoEstado)) {
    throw new Error(
      `Transición ${periodo.estado} → ${nuevoEstado} no permitida`,
    )
  }

  const data: Record<string, unknown> = { estado: nuevoEstado }
  if (observaciones) data.observaciones = observaciones

  // Marcar cierre cuando va a CONCILIADO o PRESENTADO
  if (nuevoEstado === "CONCILIADO" || nuevoEstado === "PRESENTADO") {
    data.cerradoEn = new Date()
    data.cerradoPorId = usuarioId
  }
  // Limpiar cierre al reabrir
  if (nuevoEstado === "REABIERTO" || nuevoEstado === "ABIERTO" || nuevoEstado === "EN_REVISION_CONTADOR") {
    data.cerradoEn = null
    data.cerradoPorId = null
  }

  return prisma.periodoIva.update({ where: { id: periodoId }, data })
}

/**
 * permiteAjustes: estado -> boolean
 *
 * Devuelve true si el período permite crear/anular ajustes.
 * No se pueden modificar PRESENTADO ni CONCILIADO sin reabrir antes.
 */
export function permiteAjustes(estado: EstadoPeriodo): boolean {
  return ["ABIERTO", "EN_REVISION_CONTADOR", "TXT_GENERADO", "REABIERTO"].includes(estado)
}

/**
 * permiteGenerarTxt: estado -> boolean
 */
export function permiteGenerarTxt(estado: EstadoPeriodo): boolean {
  return ["ABIERTO", "EN_REVISION_CONTADOR", "TXT_GENERADO", "REABIERTO"].includes(estado)
}
