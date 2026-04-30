/**
 * Propósito: Página de pagos de Transmagg.
 * Muestra tabs con pagos recibidos de empresas, pagos a fleteros, a proveedores y adelantos.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { PagosClient } from "./pagos-client"
import type { Rol } from "@/types"

/**
 * PagosPage: () -> Promise<JSX.Element>
 *
 * Verifica la sesión del usuario y su rol antes de renderizar el módulo de pagos.
 * Redirige a /login si no hay sesión, o a /dashboard si no tiene permiso.
 * Existe como entry point server-side para la sección de pagos.
 *
 * Ejemplos:
 * // GET /pagos (sesión ADMIN_TRANSMAGG) → tabs de pagos
 * <PagosPage />
 * // GET /pagos (sesión FLETERO) → redirect /dashboard
 * <PagosPage />
 * // Sin sesión → redirect /login
 * <PagosPage />
 */
export default async function PagosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "pagos"))) redirect("/dashboard")

  return <PagosClient />
}
