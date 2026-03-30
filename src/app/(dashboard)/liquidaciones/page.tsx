/**
 * Propósito: Página de gestión de liquidaciones de Transmagg.
 * Server component que verifica auth y renderiza el cliente interactivo.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { LiquidacionesClient } from "./liquidaciones-client"

/**
 * LiquidacionesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga lista de fleteros, y renderiza LiquidacionesClient.
 * Existe como server component para separar autenticación del cliente interactivo.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → LiquidacionesClient con selector de fletero completo
 * <LiquidacionesPage />
 * // Sesión FLETERO → LiquidacionesClient con su propio fleteroId automático
 * <LiquidacionesPage />
 * // Sesión ADMIN_EMPRESA → redirect /dashboard
 * <LiquidacionesPage />
 */
export default async function LiquidacionesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const fleteros = esInterno
    ? await prisma.fletero.findMany({
        where: { activo: true },
        select: { id: true, razonSocial: true, comisionDefault: true },
        orderBy: { razonSocial: "asc" },
      })
    : []

  // Para FLETERO: obtener su propio fleteroId
  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    fleteroIdPropio = fletero?.id ?? null
  }

  return (
    <LiquidacionesClient
      rol={rol}
      fleteros={fleteros}
      fleteroIdPropio={fleteroIdPropio}
    />
  )
}
