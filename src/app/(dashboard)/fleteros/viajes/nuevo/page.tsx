/**
 * Propósito: Página para crear un nuevo viaje desde la sección Fleteros.
 * Reutiliza ViajesClient con autoOpenModal=true para abrir el modal de carga al entrar.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ViajesClient } from "@/app/(dashboard)/viajes/viajes-client"

export default async function NuevoViajePage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "viajes") || !esRolInterno(rol)) redirect("/dashboard")

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
      select: { id: true, nombre: true, apellido: true, fleteroId: true },
      orderBy: { apellido: "asc" },
    }),
  ])

  return (
    <ViajesClient
      rol={rol}
      fleteros={fleteros}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
      fleteroIdPropio={null}
      empresaIdPropio={null}
      initialFleteroId={null}
      initialEmpresaId={null}
      autoOpenModal={true}
    />
  )
}
