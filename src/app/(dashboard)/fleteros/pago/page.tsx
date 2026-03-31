/**
 * Propósito: Página de pagos a fleteros (ruta /fleteros/pago).
 * Reutiliza PagosClient — misma lógica que /pagos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { PagosClient } from "../../pagos/pagos-client"
import type { Rol } from "@/types"

/**
 * FleterosPagoPage: () -> Promise<JSX.Element>
 *
 * Verifica la sesión del usuario y su rol antes de renderizar el módulo de pagos.
 * Existe como alias de /pagos bajo la ruta /fleteros/pago.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → tabs de pagos
 * <FleterosPagoPage />
 * // Sin sesión → redirect /login
 * <FleterosPagoPage />
 */
export default async function FleterosPagoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "pagos")) redirect("/dashboard")

  return <PagosClient />
}
