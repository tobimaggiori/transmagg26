/**
 * Propósito: Página de facturas emitidas de Transmagg.
 * Server wrapper: obtiene empresas y datos de sesión, renderiza FacturasClient.
 * SEGURIDAD: tarifaEmpresa nunca visible para fleteros/choferes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { FacturasClient } from "./facturas-client"
import type { Rol } from "@/types"

/**
 * FacturasPage: () -> Promise<JSX.Element>
 *
 * Obtiene sesión, empresas disponibles y empresaIdPropia según el rol.
 * Renderiza FacturasClient que gestiona la selección y carga dinámica.
 * Redirige a /dashboard si el rol no tiene acceso a facturas.
 * Existe como entry point server-side de la sección de facturas.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de empresas, sin empresaIdPropia
 * <FacturasPage />
 * // Sesión ADMIN_EMPRESA → empresaIdPropia cargada, sin selector
 * <FacturasPage />
 * // Sin sesión → redirect /login
 * <FacturasPage />
 */
export default async function FacturasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  let empresas: { id: string; razonSocial: string }[] = []
  let empresaIdPropia: string | null = null

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    if (empUsr) empresaIdPropia = empUsr.empresaId
  } else if (esRolInterno(rol)) {
    empresas = await prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true },
      orderBy: { razonSocial: "asc" },
    })
  }

  return (
    <FacturasClient
      rol={rol}
      empresas={empresas}
      empresaIdPropia={empresaIdPropia}
    />
  )
}
