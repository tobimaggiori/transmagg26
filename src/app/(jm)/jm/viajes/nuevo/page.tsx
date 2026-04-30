/**
 * Página servidora para cargar un nuevo viaje en JM.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NuevoViajeJmClient } from "./nuevo-viaje-jm-client"

export default async function NuevoViajeJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const [empresas, camiones, choferes] = await Promise.all([
    prismaJm.empresa.findMany({
      where: { activa: true },
      select: { id: true, razonSocial: true, cuit: true },
      orderBy: { razonSocial: "asc" },
    }),
    prismaJm.camion.findMany({
      where: { activo: true },
      select: { id: true, patenteChasis: true },
      orderBy: { patenteChasis: "asc" },
    }),
    prismaJm.empleado.findMany({
      where: { activo: true },
      select: { id: true, nombre: true, apellido: true, email: true },
      orderBy: { apellido: "asc" },
    }),
  ])

  return (
    <NuevoViajeJmClient empresas={empresas} camiones={camiones} choferes={choferes} />
  )
}
