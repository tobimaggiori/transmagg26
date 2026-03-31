/**
 * Propósito: Página de facturas emitidas (ruta /empresas/facturas).
 * Reutiliza FacturasClient — misma lógica que /facturas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { FacturasClient } from "../../facturas/facturas-client"
import type { Rol } from "@/types"

/**
 * EmpresasFacturasPage: () -> Promise<JSX.Element>
 *
 * Obtiene sesión, empresas disponibles y empresaIdPropia según el rol.
 * Renderiza FacturasClient. Redirige a /dashboard si no tiene acceso.
 * Existe como alias de /facturas bajo la ruta /empresas/facturas.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → lista de empresas
 * <EmpresasFacturasPage />
 * // Sin sesión → redirect /login
 * <EmpresasFacturasPage />
 */
export default async function EmpresasFacturasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "facturas")) redirect("/dashboard")

  let empresas: { id: string; razonSocial: string }[] = []
  let empresaIdPropia: string | null = null
  let camiones: { id: string; patenteChasis: string; fleteroId: string }[] = []
  let choferes: { id: string; nombre: string; apellido: string }[] = []
  let cuentasBancarias: { id: string; nombre: string; bancoOEntidad: string }[] = []

  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    if (empUsr) empresaIdPropia = empUsr.empresaId
  } else if (esRolInterno(rol)) {
    const data = await Promise.all([
      prisma.empresa.findMany({
        where: { activa: true },
        select: { id: true, razonSocial: true },
        orderBy: { razonSocial: "asc" },
      }),
      prisma.camion.findMany({
        where: { activo: true },
        select: { id: true, patenteChasis: true, fleteroId: true },
        orderBy: { patenteChasis: "asc" },
      }),
      prisma.usuario.findMany({
        where: { rol: "CHOFER", activo: true },
        select: { id: true, nombre: true, apellido: true },
        orderBy: { apellido: "asc" },
      }),
      prisma.cuenta.findMany({
        where: { activa: true },
        select: { id: true, nombre: true, bancoOEntidad: true },
        orderBy: { nombre: "asc" },
      }),
    ])
    ;[empresas, camiones, choferes, cuentasBancarias] = data
  }

  return (
    <FacturasClient
      rol={rol}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
      empresaIdPropia={empresaIdPropia}
      cuentasBancarias={cuentasBancarias}
    />
  )
}
