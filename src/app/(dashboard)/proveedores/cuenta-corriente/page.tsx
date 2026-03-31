/**
 * Propósito: Redirige /proveedores/cuenta-corriente a /proveedores/cuentas-corrientes.
 * Mantiene compatibilidad con rutas antiguas guardadas en bookmarks o historial.
 */

import { redirect } from "next/navigation"

/**
 * ProveedoresCuentaCorrienteRedirect: () -> never
 *
 * Redirige permanentemente a la nueva ruta de cuentas corrientes de proveedores.
 * Existe para mantener compatibilidad con links anteriores.
 *
 * Ejemplos:
 * // GET /proveedores/cuenta-corriente → redirect /proveedores/cuentas-corrientes
 * <ProveedoresCuentaCorrienteRedirect />
 */
export default function ProveedoresCuentaCorrienteRedirect() {
  redirect("/proveedores/cuentas-corrientes")
}
