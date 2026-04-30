/**
 * Construcción de filtros where para la API de viajes JM.
 * Solo accesible por roles internos de Transmagg (gateado en el layout).
 */

import { Prisma } from ".prisma/jm-client"

type FiltrosViaje = {
  empresaId?: string | null
  desde?: string | null
  hasta?: string | null
  remito?: string | null
  cupo?: string | null
  cpe?: string | null
  nroCtg?: string | null
}

/**
 * construirWhereViajesJm: FiltrosViaje -> Prisma.ViajeWhereInput
 *
 * Dado los filtros opcionales de query params, devuelve el where para Prisma JM.
 * Sin restricciones por rol porque solo entra al sistema gente interna de
 * Transmagg (gateado a nivel de layout).
 *
 * Ejemplos:
 * construirWhereViajesJm({ empresaId: "e1" })
 *   // => { empresaId: "e1" }
 * construirWhereViajesJm({ desde: "2026-01-01", hasta: "2026-01-31" })
 *   // => { fechaViaje: { gte: ..., lte: ... } }
 * construirWhereViajesJm({})
 *   // => {}
 */
export function construirWhereViajesJm(filtros: FiltrosViaje): Prisma.ViajeWhereInput {
  const where: Prisma.ViajeWhereInput = {}

  if (filtros.empresaId) where.empresaId = filtros.empresaId

  if (filtros.desde || filtros.hasta) {
    const fechaWhere: { gte?: Date; lte?: Date } = {}
    if (filtros.desde) fechaWhere.gte = new Date(filtros.desde)
    if (filtros.hasta) {
      const h = new Date(filtros.hasta)
      h.setHours(23, 59, 59, 999)
      fechaWhere.lte = h
    }
    where.fechaViaje = fechaWhere
  }

  if (filtros.remito) where.remito = { contains: filtros.remito }
  if (filtros.cupo) where.cupo = { contains: filtros.cupo }
  if (filtros.cpe) where.cpe = { contains: filtros.cpe }
  if (filtros.nroCtg) where.nroCtg = { contains: filtros.nroCtg }

  return where
}
