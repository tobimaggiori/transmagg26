/**
 * viaje-queries.ts
 *
 * Lógica de dominio para consultas y validaciones de viajes.
 * Separa las reglas de filtrado por rol y la validación de entidades
 * de la route HTTP para mantener los handlers delgados.
 */

import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { resolverEmpresaIdPorEmail } from "@/lib/session-utils"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type FiltrosViaje = {
  fleteroId?: string | null
  empresaId?: string | null
  estadoLiquidacion?: string | null
  estadoFactura?: string | null
  desde?: string | null
  hasta?: string | null
  remito?: string | null
  cupo?: string | null
  cpe?: string | null
  nroCtg?: string | null
  nroLP?: string | null
  nroFactura?: string | null
}

type ResultadoWhere =
  | { ok: true; where: Record<string, unknown> }
  | { ok: false; status: number; error: string; data?: unknown }

/**
 * construirWhereViajes: Rol string FiltrosViaje -> Promise<ResultadoWhere>
 *
 * Dado [el rol del usuario, su email y los filtros de query params],
 * devuelve [el objeto where para Prisma que respeta las reglas de visibilidad
 * por rol, o un error si el rol no tiene acceso].
 *
 * Reglas:
 * - FLETERO: solo sus viajes (via fletero.usuario.email)
 * - CHOFER: solo sus viajes (via chofer.email)
 * - ADMIN_EMPRESA/OPERADOR_EMPRESA: solo viajes de su empresa
 * - ADMIN_TRANSMAGG/OPERADOR_TRANSMAGG: todos, con filtros opcionales
 * - Otros roles: acceso denegado
 *
 * Ejemplos:
 * construirWhereViajes("ADMIN_TRANSMAGG", "a@t.com", { fleteroId: "f1" })
 *   // => { ok: true, where: { fleteroId: "f1" } }
 * construirWhereViajes("FLETERO", "flet@t.com", {})
 *   // => { ok: true, where: { fletero: { usuario: { email: "flet@t.com" } } } }
 * construirWhereViajes("DESCONOCIDO", "x@t.com", {})
 *   // => { ok: false, status: 403, error: "Acceso denegado" }
 */
export async function construirWhereViajes(
  rol: Rol,
  email: string,
  filtros: FiltrosViaje
): Promise<ResultadoWhere> {
  const where: Record<string, unknown> = {}

  // Restricción base por rol
  if (rol === "FLETERO") {
    where.fletero = { usuario: { email } }
  } else if (rol === "CHOFER") {
    // Empleado-chofer logueado: Viaje.chofer → Empleado → usuario (login).
    where.chofer = { usuario: { email } }
  } else if (esRolEmpresa(rol)) {
    const empresaId = await resolverEmpresaIdPorEmail(email)
    if (!empresaId) return { ok: true, where: { id: "__none__" } } // sin empresa → sin viajes
    where.empresaId = empresaId
  } else if (!esRolInterno(rol)) {
    return { ok: false, status: 403, error: "Acceso denegado" }
  }

  // Filtros adicionales (solo roles internos pueden filtrar por fletero/empresa)
  if (esRolInterno(rol)) {
    if (filtros.fleteroId) where.fleteroId = filtros.fleteroId
    if (filtros.empresaId) where.empresaId = filtros.empresaId
  }

  if (filtros.estadoLiquidacion) where.estadoLiquidacion = filtros.estadoLiquidacion
  if (filtros.estadoFactura) where.estadoFactura = filtros.estadoFactura

  if (filtros.desde || filtros.hasta) {
    const fechaWhere: Record<string, Date> = {}
    if (filtros.desde) fechaWhere.gte = new Date(filtros.desde)
    if (filtros.hasta) {
      const h = new Date(filtros.hasta)
      h.setHours(23, 59, 59, 999)
      fechaWhere.lte = h
    }
    where.fechaViaje = fechaWhere
  }

  if (filtros.remito) {
    where.remito = { contains: filtros.remito }
  }
  if (filtros.cupo) {
    where.cupo = { contains: filtros.cupo }
  }
  if (filtros.cpe) {
    where.cpe = { contains: filtros.cpe }
  }
  if (filtros.nroCtg) {
    where.nroCtg = { contains: filtros.nroCtg }
  }
  if (filtros.nroLP) {
    const nro = parseInt(filtros.nroLP, 10)
    if (!isNaN(nro)) {
      where.enLiquidaciones = { some: { liquidacion: { nroComprobante: nro } } }
    }
  }
  if (filtros.nroFactura) {
    where.enFacturas = { some: { factura: { nroComprobante: { contains: filtros.nroFactura } } } }
  }

  return { ok: true, where }
}

// ─── Validación de entidades para creación ───────────────────────────────────

type DatosCrearViaje = {
  esCamionPropio: boolean
  fleteroId?: string
  camionId: string
  choferId: string
  empresaId: string
  nroCtg?: string | null
  remito?: string | null
}

type ResultadoValidacion =
  | { ok: true }
  | { ok: false; status: number; error: string }

/**
 * validarEntidadesViaje: DatosCrearViaje -> Promise<ResultadoValidacion>
 *
 * Dado [los IDs de las entidades referenciadas por un viaje nuevo],
 * devuelve [ok si todas existen y son válidas, o el primer error encontrado].
 *
 * Valida:
 * - Fletero existe y está activo (si no es camión propio)
 * - Camión existe y está activo
 * - Si es camión propio, el camión debe ser propio
 * - Chofer existe y está activo
 * - Empresa existe y está activa
 * - CTG no duplicado
 *
 * Ejemplos:
 * validarEntidadesViaje({ esCamionPropio: false, fleteroId: "f1", camionId: "c1", choferId: "ch1", empresaId: "e1" })
 *   // => { ok: true }
 * validarEntidadesViaje({ esCamionPropio: false, fleteroId: "noexiste", ... })
 *   // => { ok: false, status: 404, error: "Fletero no encontrado" }
 */
export async function validarEntidadesViaje(datos: DatosCrearViaje): Promise<ResultadoValidacion> {
  const [fletero, camion, chofer, empresa] = await Promise.all([
    datos.fleteroId
      ? prisma.fletero.findUnique({ where: { id: datos.fleteroId, activo: true } })
      : Promise.resolve(datos.esCamionPropio ? true : null),
    prisma.camion.findUnique({ where: { id: datos.camionId, activo: true } }),
    prisma.empleado.findUnique({ where: { id: datos.choferId, activo: true } }),
    prisma.empresa.findUnique({ where: { id: datos.empresaId, activa: true } }),
  ])

  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }
  if (!camion) return { ok: false, status: 404, error: "Camión no encontrado" }
  if (datos.esCamionPropio && !(camion as { esPropio: boolean }).esPropio) {
    return { ok: false, status: 400, error: "El camión no pertenece a la flota propia de Transmagg" }
  }
  if (!chofer) return { ok: false, status: 404, error: "Chofer no encontrado" }
  if (!empresa) return { ok: false, status: 404, error: "Empresa no encontrada" }

  if (datos.nroCtg) {
    const existente = await prisma.viaje.findFirst({ where: { nroCtg: datos.nroCtg } })
    if (existente) {
      return { ok: false, status: 409, error: `Ya existe un viaje con el CTG ${datos.nroCtg}` }
    }
  }

  if (datos.remito) {
    const existente = await prisma.viaje.findFirst({
      where: { remito: datos.remito, empresaId: datos.empresaId },
    })
    if (existente) {
      return { ok: false, status: 409, error: `Ya existe un viaje con el remito ${datos.remito} para esta empresa` }
    }
  }

  return { ok: true }
}
