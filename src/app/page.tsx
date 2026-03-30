/**
 * Propósito: Página raíz de Transmagg.
 * Redirige automáticamente al dashboard principal cuando el usuario accede a "/".
 */

import { redirect } from "next/navigation"

/**
 * RootPage: () -> never
 *
 * Redirige inmediatamente a /dashboard sin renderizar contenido.
 * Existe para que "/" sea un alias transparente del dashboard en lugar
 * de mostrar una página vacía o de bienvenida.
 *
 * Ejemplos:
 * // Acceso a "/" → redirect a "/dashboard"
 * RootPage() // => redirect("/dashboard")
 * // Acceso a "/" autenticado → dashboard visible
 * RootPage() // => redirect("/dashboard") → middleware permite acceso
 * // Acceso a "/" no autenticado → redirect → middleware redirige a /login
 * RootPage() // => redirect("/dashboard") → middleware redirige a "/login"
 */
export default function RootPage() {
  redirect("/dashboard")
}
