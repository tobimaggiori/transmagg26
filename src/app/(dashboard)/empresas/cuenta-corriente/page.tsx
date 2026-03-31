/**
 * Propósito: Redirige /empresas/cuenta-corriente a /empresas/cuentas-corrientes.
 * Mantiene compatibilidad con rutas antiguas guardadas en bookmarks o historial.
 */

import { redirect } from "next/navigation"

/**
 * EmpresasCuentaCorrienteRedirect: () -> never
 *
 * Redirige permanentemente a la nueva ruta de cuentas corrientes de empresas.
 * Existe para mantener compatibilidad con links anteriores.
 *
 * Ejemplos:
 * // GET /empresas/cuenta-corriente → redirect /empresas/cuentas-corrientes
 * <EmpresasCuentaCorrienteRedirect />
 */
export default function EmpresasCuentaCorrienteRedirect() {
  redirect("/empresas/cuentas-corrientes")
}
