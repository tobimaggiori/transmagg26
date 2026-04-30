/**
 * Propósito: Página de consulta de viajes con tabla completa y acciones por estado.
 * Server component: auth, carga selectores y renderiza el cliente interactivo.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ConsultarViajesClient } from "./consultar-viajes-client"

export default async function ConsultarViajesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "fleteros.viajes")) || !esRolInterno(rol)) redirect("/dashboard")

  const [fleteros, empresas, camiones, choferes] = await Promise.all([
    prisma.fletero.findMany({
      where: { activo: true },
      select: { id: true, razonSocial: true, cuit: true, comisionDefault: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prisma.camion.findMany({
      where: { activo: true },
      select: { id: true, patenteChasis: true, fleteroId: true, esPropio: true },
      orderBy: { patenteChasis: "asc" },
    }),
    prisma.usuario.findMany({
      where: { rol: "CHOFER", activo: true },
      select: { id: true, nombre: true, apellido: true, email: true },
      orderBy: { apellido: "asc" },
    }),
  ])

  return (
    <ConsultarViajesClient
      rol={rol}
      fleteros={fleteros}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
    />
  )
}
