/**
 * Propósito: Página de cuentas corrientes de proveedores (ruta /proveedores/cuentas-corrientes).
 * Server component: verifica permisos y carga la lista de proveedores activos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { CCProveedoresClient } from "./cc-proveedores-client"
import type { Rol } from "@/types"

/**
 * ProveedoresCuentasCorrientesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos (solo roles internos).
 * Carga la lista de proveedores activos y los pasa al componente client.
 * Existe como entry point del módulo de CC por proveedor con movimientos cronológicos.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → CCProveedoresClient con lista de proveedores
 * <ProveedoresCuentasCorrientesPage />
 * // Sin sesión → redirect /login
 * <ProveedoresCuentasCorrientesPage />
 */
export default async function ProveedoresCuentasCorrientesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <CCProveedoresClient proveedores={proveedores} />
}
