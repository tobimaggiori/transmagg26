/**
 * Propósito: Página de Mi Flota para el rol FLETERO.
 * Server component que verifica auth, carga la flota del fletero autenticado
 * y renderiza MiFlotaClient con los datos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeGestionarFlota } from "@/lib/permissions"
import type { Rol } from "@/types"
import { MiFlotaClient } from "./mi-flota-client"

/**
 * MiFlotaPage: () -> Promise<JSX.Element>
 *
 * Verifica que el usuario autenticado tenga rol FLETERO, carga su fletero
 * con camiones (y chofer actual por camión) y choferes sin camión asignado,
 * y renderiza MiFlotaClient con esos datos.
 * Existe para que el rol FLETERO pueda ver el estado de su flota sin acceder al ABM.
 *
 * Ejemplos:
 * // Sesión FLETERO → MiFlotaClient con su flota completa
 * <MiFlotaPage />
 * // Sesión ADMIN_TRANSMAGG → redirect /dashboard
 * <MiFlotaPage />
 * // Sesión FLETERO sin fletero vinculado → redirect /dashboard
 * <MiFlotaPage />
 */
export default async function MiFlotaPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeGestionarFlota(rol)) redirect("/dashboard")

  const fletero = await prisma.fletero.findFirst({
    where: { usuario: { email: session.user.email ?? "" } },
    select: {
      id: true,
      razonSocial: true,
      camiones: {
        where: { activo: true },
        orderBy: { patenteChasis: "asc" },
        select: {
          id: true,
          patenteChasis: true,
          patenteAcoplado: true,
          tipoCamion: true,
          choferHistorial: {
            where: { hasta: null },
            select: { chofer: { select: { id: true, nombre: true, apellido: true, email: true } } },
            take: 1,
          },
        },
      },
      choferes: {
        where: { rol: "CHOFER", activo: true },
        select: { id: true, nombre: true, apellido: true, email: true },
        orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
      },
    },
  })

  if (!fletero) redirect("/dashboard")

  // IDs de choferes con camión activo
  const choferesConCamion = new Set(
    fletero.camiones.flatMap((c) => c.choferHistorial.map((h) => h.chofer.id))
  )

  return (
    <MiFlotaClient
      razonSocial={fletero.razonSocial}
      camiones={fletero.camiones.map((c) => ({
        id: c.id,
        patenteChasis: c.patenteChasis,
        patenteAcoplado: c.patenteAcoplado,
        tipoCamion: c.tipoCamion,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
      }))}
      choferesSinCamion={fletero.choferes.filter((c) => !choferesConCamion.has(c.id))}
    />
  )
}
