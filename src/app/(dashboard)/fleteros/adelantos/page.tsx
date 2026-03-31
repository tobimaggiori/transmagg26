/**
 * Propósito: Página de adelantos a fleteros (ruta /fleteros/adelantos).
 * Reutiliza PagosClient — el tab de adelantos está integrado en el módulo de pagos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { PagosClient } from "../../pagos/pagos-client"
import type { Rol } from "@/types"

/**
 * FleterosAdelantosPage: () -> Promise<JSX.Element>
 *
 * Verifica la sesión del usuario y su rol antes de renderizar el módulo de pagos.
 * El usuario puede acceder al tab de adelantos desde la interfaz de PagosClient.
 * Existe como alias de /pagos bajo la ruta /fleteros/adelantos.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → tabs de pagos (incluye Adelantos)
 * <FleterosAdelantosPage />
 * // Sin sesión → redirect /login
 * <FleterosAdelantosPage />
 */
export default async function FleterosAdelantosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "pagos")) redirect("/dashboard")

  return <PagosClient />
}
