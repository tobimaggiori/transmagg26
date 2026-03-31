/**
 * Propósito: Página de cuentas corrientes de empresas (ruta /empresas/cuentas-corrientes).
 * Server component: verifica permisos y carga la lista de empresas activas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { CCEmpresasClient } from "./cc-empresas-client"
import type { Rol } from "@/types"

/**
 * EmpresasCuentasCorrientesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos (solo roles internos).
 * Carga la lista de empresas activas y las pasa al componente client.
 * Existe como entry point del módulo de CC por empresa con movimientos cronológicos.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → CCEmpresasClient con lista de empresas
 * <EmpresasCuentasCorrientesPage />
 * // Sin sesión → redirect /login
 * <EmpresasCuentasCorrientesPage />
 */
export default async function EmpresasCuentasCorrientesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <CCEmpresasClient empresas={empresas} />
}
