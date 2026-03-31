/**
 * Propósito: Redirige /fleteros/cuenta-corriente a /fleteros/cuentas-corrientes.
 * Mantiene compatibilidad con rutas antiguas guardadas en bookmarks o historial.
 */

import { redirect } from "next/navigation"

/**
 * FleterosCuentaCorrienteRedirect: () -> never
 *
 * Redirige permanentemente a la nueva ruta de cuentas corrientes de fleteros.
 * Existe para mantener compatibilidad con links anteriores.
 *
 * Ejemplos:
 * // GET /fleteros/cuenta-corriente → redirect /fleteros/cuentas-corrientes
 * <FleterosCuentaCorrienteRedirect />
 */
export default function FleterosCuentaCorrienteRedirect() {
  redirect("/fleteros/cuentas-corrientes")
}
