/**
 * Propósito: Página principal del dashboard financiero de Transmagg.
 * Muestra métricas financieras clave solo para roles internos.
 * Delega la lógica de UI al componente client FinancialDashboardClient.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { FinancialDashboardClient } from "./financial-dashboard-client"
import type { Rol } from "@/types"

/**
 * DashboardPage: () -> Promise<JSX.Element>
 *
 * Verifica la sesión del usuario y su rol antes de renderizar el dashboard financiero.
 * Solo permite acceso a ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG; redirige al login o a viajes si no cumple.
 * Existe como punto de entrada al dashboard financiero, separando la autenticación de la UI.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → renderiza FinancialDashboardClient
 * <DashboardPage />
 * // Sesión FLETERO → redirect /viajes
 * <DashboardPage />
 * // Sin sesión → redirect /login
 * <DashboardPage />
 */
export default async function DashboardPage() {
  const session = await auth()

  if (!session?.user) {
    redirect("/login")
  }

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol

  if (!esRolInterno(rol)) {
    redirect("/viajes")
  }

  return <FinancialDashboardClient />
}
