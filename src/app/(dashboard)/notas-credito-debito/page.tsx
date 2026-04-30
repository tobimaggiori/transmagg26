/**
 * Propósito: Página de Notas de Crédito y Débito de Transmagg.
 * Server wrapper: verifica sesión y renderiza NotasCDClient.
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { NotasCDClient } from "./notas-cd-client"
import type { Rol } from "@/types"

/**
 * NotasCreditoDebitoPage: () -> Promise<JSX.Element>
 *
 * Verifica sesión y permisos. Si el rol no tiene acceso a notas_credito_debito
 * redirige a /dashboard. Renderiza NotasCDClient para la gestión de NC/ND.
 * Existe como entry point server-side de la sección de Notas de Crédito/Débito.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → renderiza NotasCDClient
 * <NotasCreditoDebitoPage />
 * // Sin sesión → redirect /login
 * <NotasCreditoDebitoPage />
 * // Sesión FLETERO → redirect /dashboard
 * <NotasCreditoDebitoPage />
 */
export default async function NotasCreditoDebitoPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "notas_credito_debito"))) redirect("/dashboard")

  return <NotasCDClient />
}
