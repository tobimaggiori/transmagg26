/**
 * Propósito: Página de cuentas corrientes de fleteros (ruta /fleteros/cuentas-corrientes).
 * Server component: verifica permisos y carga la lista de fleteros activos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { CCFleterosClient } from "./cc-fleteros-client"
import type { Rol } from "@/types"

/**
 * FleterosCuentasCorrientesPage: () -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos (solo roles internos).
 * Carga la lista de fleteros activos y los pasa al componente client.
 * Existe como entry point del módulo de CC por fletero con movimientos cronológicos.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → CCFleterosClient con lista de fleteros
 * <FleterosCuentasCorrientesPage />
 * // Sin sesión → redirect /login
 * <FleterosCuentasCorrientesPage />
 */
export default async function FleterosCuentasCorrientesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const fleteros = await prisma.fletero.findMany({
    where: { activo: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  return <CCFleterosClient fleteros={fleteros} />
}
