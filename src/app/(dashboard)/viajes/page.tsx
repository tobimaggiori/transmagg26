/**
 * Propósito: Página de gestión de viajes de Transmagg.
 * Server component que verifica auth y renderiza el cliente interactivo.
 * El operador selecciona un Fletero o Empresa para ver viajes.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno, esRolEmpresa } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ViajesClient } from "./viajes-client"

/**
 * ViajesPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Verifica autenticación y permisos, carga listas de fleteros/empresas/camiones/choferes,
 * y renderiza ViajesClient con esos datos.
 * Existe como server component para separar autenticación del cliente interactivo.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG → ViajesClient con todos los selectores y botón nuevo viaje
 * <ViajesPage searchParams={{}} />
 * // Sesión CHOFER sin permiso → redirect /dashboard
 * <ViajesPage searchParams={{}} />
 * // Sesión FLETERO → ViajesClient con vista propia sin selectores de empresa
 * <ViajesPage searchParams={{}} />
 */
export default async function ViajesPage({
  searchParams,
}: {
  searchParams: { fleteroId?: string; empresaId?: string; desde?: string; hasta?: string; vista?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "viajes")) redirect("/dashboard")

  const esInterno = esRolInterno(rol)

  const [fleteros, empresas, camiones, choferes] = await Promise.all([
    esInterno
      ? prisma.fletero.findMany({
          where: { activo: true },
          select: { id: true, razonSocial: true, cuit: true, comisionDefault: true },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    esInterno
      ? prisma.empresa.findMany({
          where: { activa: true },
          select: { id: true, razonSocial: true, cuit: true },
          orderBy: { razonSocial: "asc" },
        })
      : [],
    esInterno
      ? prisma.camion.findMany({
          where: { activo: true },
          select: { id: true, patenteChasis: true, fleteroId: true },
          orderBy: { patenteChasis: "asc" },
        })
      : [],
    esInterno
      ? prisma.usuario.findMany({
          where: { rol: "CHOFER", activo: true },
          select: { id: true, nombre: true, apellido: true },
          orderBy: { apellido: "asc" },
        })
      : [],
  ])

  // Para FLETERO: obtener su propio fleteroId
  let fleteroIdPropio: string | null = null
  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    fleteroIdPropio = fletero?.id ?? null
  }

  // Para roles empresa: obtener su empresaId
  let empresaIdPropio: string | null = null
  if (esRolEmpresa(rol)) {
    const empUsr = await prisma.empresaUsuario.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { empresaId: true },
    })
    empresaIdPropio = empUsr?.empresaId ?? null
  }

  return (
    <ViajesClient
      rol={rol}
      fleteros={fleteros}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
      fleteroIdPropio={fleteroIdPropio}
      empresaIdPropio={empresaIdPropio}
      initialFleteroId={searchParams.fleteroId ?? null}
      initialEmpresaId={searchParams.empresaId ?? null}
    />
  )
}
