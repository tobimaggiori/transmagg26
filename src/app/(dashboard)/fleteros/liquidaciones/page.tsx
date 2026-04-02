/**
 * Propósito: Página de consulta de Líquidos Producto (ruta /fleteros/liquidaciones).
 * Usa ConsultarLPClient — solo consulta con filtros.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarLPClient } from "./consultar-lp-client"

/**
 * FleterosLiquidacionesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga fleteros y cuentas bancarias,
 * y renderiza ConsultarLPClient (consulta de LPs con filtros y detalle).
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → ConsultarLPClient con selector de fletero + tabla
 * <FleterosLiquidacionesPage />
 * // Sin sesión → redirect /login
 * <FleterosLiquidacionesPage />
 */
export default async function FleterosLiquidacionesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "liquidaciones")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const fleteros = esInterno
    ? await prisma.fletero.findMany({
        where: { activo: true },
        select: { id: true, razonSocial: true, cuit: true },
        orderBy: { razonSocial: "asc" },
      })
    : []

  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    fleteroIdPropio = fletero?.id ?? null
  }

  return (
    <ConsultarLPClient
      rol={rol}
      fleteros={fleteros}
      fleteroIdPropio={fleteroIdPropio}
    />
  )
}
