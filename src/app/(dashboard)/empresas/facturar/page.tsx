/**
 * Propósito: Página de creación de facturas a empresas (/empresas/facturar).
 * Server wrapper: verifica auth y rol interno, carga empresas activas.
 * Los viajes se obtienen desde la LP seleccionada (read-only), no se necesitan camiones ni choferes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { FacturarEmpresaClient } from "./facturar-client"
import type { Rol } from "@/types"

/**
 * EmpresasFacturarPage: () -> Promise<JSX.Element>
 *
 * Verifica que el usuario tenga sesión activa y rol interno (ADMIN_TRANSMAGG
 * u OPERADOR_TRANSMAGG). Carga empresas activas.
 * Renderiza FacturarEmpresaClient con esos datos.
 * Redirige a /dashboard si el rol no es interno.
 * Existe como entry point server-side del flujo de creación de facturas a empresas.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de empresas, listo para facturar
 * <EmpresasFacturarPage />
 * // Sesión ADMIN_EMPRESA → redirect /dashboard
 * <EmpresasFacturarPage />
 * // Sin sesión → redirect /login
 * <EmpresasFacturarPage />
 */
export default async function EmpresasFacturarPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true, condicionIva: true },
    orderBy: { razonSocial: "asc" },
  })

  return <FacturarEmpresaClient empresas={empresas} />
}
