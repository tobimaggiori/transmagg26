/**
 * Sistema de permisos RBAC para Transmagg.
 *
 * REGLAS DE SEGURIDAD CRÍTICAS:
 * - tarifaFletero (ViajeEnLiquidacion): NUNCA visible para ADMIN_EMPRESA, OPERADOR_EMPRESA, CHOFER
 * - tarifaEmpresa (ViajeEnFactura):     NUNCA visible para FLETERO, CHOFER
 */

import type { Rol } from "@/types"
import { SECCIONES } from "@/lib/secciones"

export const ROLES_INTERNOS: Rol[] = ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"]
export const ROLES_EXTERNOS: Rol[] = ["FLETERO", "CHOFER", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"]
export const ROLES_EMPRESA: Rol[] = ["ADMIN_EMPRESA", "OPERADOR_EMPRESA"]
export const ROLES_FLETERO: Rol[] = ["FLETERO", "CHOFER"]

export const PERMISOS_SECCION: Record<string, Rol[]> = {
  dashboard: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  mi_flota: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  viajes: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO", "CHOFER", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  liquidaciones: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  facturas: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  notas_credito_debito: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  proveedores: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  iva: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  iibb: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  cuentas_corrientes: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  financiero: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  cuentas: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  pagos: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  abm: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.empresas": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.fleteros": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.usuarios": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.proveedores": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.cuentas": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.fci": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "abm.empleados": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  admin: ["ADMIN_TRANSMAGG"],
  configuracion: ["ADMIN_TRANSMAGG"],
  configuracion_permisos: ["ADMIN_TRANSMAGG"],
  // Secciones de grupos de navegación (nuevas rutas agrupadas)
  empresas_facturar: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  empresas_facturas: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  empresas_cuenta_corriente: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"],
  fleteros_liquidar: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  fleteros_liquidaciones: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  fleteros_adelantos: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  fleteros_pago: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  fleteros_cuenta_corriente: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"],
  contabilidad_cuentas: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  contabilidad_iva: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  contabilidad_iibb: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  contabilidad_notas: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  aseguradoras: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  contabilidad_comprobantes: ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  contabilidad_comprobantes_eliminar: ["ADMIN_TRANSMAGG"],
  "contabilidad.fci": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  // Portal IVA / LID ARCA — permisos granulares.
  // ADMIN_TRANSMAGG siempre tiene todo (ver tienePermiso). OPERADOR_TRANSMAGG
  // requiere fila habilitada en PermisoUsuario por sección.
  "contabilidad.iva": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.ver": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.ajustes": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.generar_txt": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.marcar_conciliado": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.marcar_presentado": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
  "contabilidad.iva.reabrir_periodo": ["ADMIN_TRANSMAGG"],
  "contabilidad.iva.descargar_exportacion": ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG"],
}

/**
 * puedeAcceder: Rol string -> boolean
 *
 * Dado un rol de usuario y el nombre de una sección del sistema,
 * devuelve true si ese rol tiene permiso para acceder a la sección,
 * false en caso contrario o si la sección no existe.
 * Existe para centralizar el control de acceso y evitar duplicar
 * lógica de permisos en cada página y API route.
 *
 * Ejemplos:
 * puedeAcceder("FLETERO", "liquidaciones")         === true
 * puedeAcceder("FLETERO", "proveedores")           === false
 * puedeAcceder("ADMIN_TRANSMAGG", "admin")         === true
 */
export function puedeAcceder(rol: Rol, seccion: string): boolean {
  const rolesPermitidos = PERMISOS_SECCION[seccion]
  if (!rolesPermitidos) return false
  return rolesPermitidos.includes(rol)
}

/**
 * esRolInterno: Rol -> boolean
 *
 * Dado un rol, devuelve true si pertenece a Transmagg
 * (ADMIN_TRANSMAGG u OPERADOR_TRANSMAGG), false si es externo.
 * Existe para distinguir a los empleados internos de clientes y
 * fleteros, ya que los internos tienen acceso completo al sistema.
 *
 * Ejemplos:
 * esRolInterno("ADMIN_TRANSMAGG")    === true
 * esRolInterno("OPERADOR_TRANSMAGG") === true
 * esRolInterno("FLETERO")            === false
 */
export function esRolInterno(rol: Rol): boolean {
  return ROLES_INTERNOS.includes(rol)
}

/**
 * puedeVerTarifaFletero: Rol -> boolean
 *
 * Dado un rol, devuelve true si puede ver la tarifa pagada al fletero
 * (tarifaFletero en ViajeEnLiquidacion), false en caso contrario.
 * Existe para proteger la confidencialidad comercial: las empresas
 * clientes no deben conocer cuánto cobra el fletero por el servicio.
 *
 * Ejemplos:
 * puedeVerTarifaFletero("FLETERO")        === true
 * puedeVerTarifaFletero("ADMIN_EMPRESA")  === false
 * puedeVerTarifaFletero("CHOFER")         === false
 */
export function puedeVerTarifaFletero(rol: Rol): boolean {
  return ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO"].includes(rol)
}

/**
 * puedeVerTarifaEmpresa: Rol -> boolean
 *
 * Dado un rol, devuelve true si puede ver la tarifa facturada a la empresa
 * (tarifaEmpresa en ViajeEnFactura), false en caso contrario.
 * Existe para proteger la confidencialidad comercial: los fleteros
 * no deben conocer cuánto cobra Transmagg a sus clientes.
 *
 * Ejemplos:
 * puedeVerTarifaEmpresa("ADMIN_EMPRESA")     === true
 * puedeVerTarifaEmpresa("FLETERO")           === false
 * puedeVerTarifaEmpresa("CHOFER")            === false
 */
export function puedeVerTarifaEmpresa(rol: Rol): boolean {
  return ["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"].includes(rol)
}

/**
 * esAdmin: Rol -> boolean
 *
 * Dado un rol, devuelve true únicamente si es ADMIN_TRANSMAGG.
 * Existe para restringir las operaciones de gestión de usuarios
 * y configuración global solo al administrador del sistema.
 *
 * Ejemplos:
 * esAdmin("ADMIN_TRANSMAGG")    === true
 * esAdmin("OPERADOR_TRANSMAGG") === false
 * esAdmin("FLETERO")            === false
 */
export function esAdmin(rol: Rol): boolean {
  return rol === "ADMIN_TRANSMAGG"
}

/**
 * esRolEmpresa: Rol -> boolean
 *
 * Dado un rol, devuelve true si corresponde a un usuario de empresa cliente
 * (ADMIN_EMPRESA u OPERADOR_EMPRESA), false en caso contrario.
 * Existe para filtrar datos de facturas y viajes mostrando solo
 * los registros pertenecientes a la empresa del usuario.
 *
 * Ejemplos:
 * esRolEmpresa("ADMIN_EMPRESA")    === true
 * esRolEmpresa("OPERADOR_EMPRESA") === true
 * esRolEmpresa("FLETERO")          === false
 */
export function esRolEmpresa(rol: Rol): boolean {
  return ROLES_EMPRESA.includes(rol)
}

/**
 * esRolFletero: Rol -> boolean
 *
 * Dado un rol, devuelve true si es FLETERO o CHOFER, false en caso contrario.
 * Existe para filtrar datos de liquidaciones y camiones mostrando solo
 * los registros vinculados al fletero del usuario autenticado.
 *
 * Ejemplos:
 * esRolFletero("FLETERO")          === true
 * esRolFletero("CHOFER")           === true
 * esRolFletero("ADMIN_TRANSMAGG")  === false
 */
export function esRolFletero(rol: Rol): boolean {
  return ROLES_FLETERO.includes(rol)
}

/**
 * puedeGestionarFlota: Rol -> boolean
 *
 * Dado un rol, devuelve true si puede gestionar su propia flota de camiones y choferes.
 * Solo el rol FLETERO puede acceder a la sección "Mi Flota" para ver el estado
 * de sus camiones y choferes asignados.
 * ADMIN_TRANSMAGG gestiona la flota de todos los fleteros desde el ABM.
 * Existe para controlar el acceso a la página de Mi Flota exclusiva del fletero.
 *
 * Ejemplos:
 * puedeGestionarFlota("FLETERO")           === true
 * puedeGestionarFlota("ADMIN_TRANSMAGG")   === false
 * puedeGestionarFlota("CHOFER")            === false
 * puedeGestionarFlota("OPERADOR_EMPRESA")  === false
 */
export function puedeGestionarFlota(rol: Rol): boolean {
  return rol === "FLETERO"
}

/**
 * tienePermiso: (usuarioId, rol, seccion) -> Promise<boolean>
 *
 * Dado el id y rol del usuario y el nombre de una sección, devuelve true si
 * el usuario tiene permiso para acceder a ella.
 *
 * Matriz de decisión:
 *  - ADMIN_TRANSMAGG → siempre true.
 *  - Si `seccion` está en SECCIONES (es una sección granular) → consulta
 *    PermisoUsuario y devuelve habilitado.
 *  - Si `seccion` NO está en SECCIONES (solo tiene definición en
 *    PERMISOS_SECCION a nivel de rol) → cae a puedeAcceder (role-based).
 *    Esto evita bloquear accesos por mismatch entre SECCIONES y el guard.
 *  - Si no hay fila y tampoco está en PERMISOS_SECCION → false.
 *
 * Ejemplos:
 * tienePermiso("u1", "ADMIN_TRANSMAGG", "contabilidad.reportes") === true
 * tienePermiso("u2", "OPERADOR_TRANSMAGG", "dashboard.deuda_empresas") === depende DB
 * tienePermiso("u2", "OPERADOR_TRANSMAGG", "liquidaciones") === true (no granular, fallback rol)
 */
export async function tienePermiso(
  usuarioId: string,
  rol: string,
  seccion: string
): Promise<boolean> {
  if (rol === "ADMIN_TRANSMAGG") return true
  const seccionesGranulares = new Set<string>(Object.values(SECCIONES))
  if (seccionesGranulares.has(seccion)) {
    const { prisma } = await import("@/lib/prisma")
    const permiso = await prisma.permisoUsuario.findUnique({
      where: { usuarioId_seccion: { usuarioId, seccion } }
    })
    return permiso?.habilitado ?? false
  }
  // Fallback: role-based check.
  return puedeAcceder(rol as Rol, seccion)
}

/**
 * getPermisosUsuario: (usuarioId, rol) -> Promise<string[]>
 *
 * Dado el id y rol del usuario, devuelve el array de secciones habilitadas.
 * ADMIN_TRANSMAGG recibe todas las secciones. Para otros roles consulta DB.
 * Existe para pasar la lista de permisos al Sidebar y al Dashboard.
 *
 * Ejemplos:
 * getPermisosUsuario("u1", "ADMIN_TRANSMAGG") === todas las SECCIONES
 * getPermisosUsuario("u2", "OPERADOR_TRANSMAGG") === secciones habilitadas en DB
 */
export async function getPermisosUsuario(
  usuarioId: string,
  rol: string
): Promise<string[]> {
  if (rol === "ADMIN_TRANSMAGG") return Object.values(SECCIONES)
  const { prisma } = await import("@/lib/prisma")
  const permisos = await prisma.permisoUsuario.findMany({
    where: { usuarioId, habilitado: true },
    select: { seccion: true }
  })
  return permisos.map(p => p.seccion)
}
