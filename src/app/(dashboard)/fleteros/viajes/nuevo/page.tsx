import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { NuevoViajeClient } from "./nuevo-viaje-client"

export default async function NuevoViajePage() {
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
      select: {
        id: true,
        patenteChasis: true,
        fleteroId: true,
        esPropio: true,
        choferHistorial: {
          where: { hasta: null },
          select: { choferId: true },
          take: 1,
        },
        polizas: {
          where: { activa: true, vigenciaHasta: { gte: new Date() } },
          select: { id: true },
          take: 1,
        },
      },
      orderBy: { patenteChasis: "asc" },
    }).then((cs) => cs.map((c) => ({
      id: c.id,
      patenteChasis: c.patenteChasis,
      fleteroId: c.fleteroId,
      esPropio: c.esPropio,
      choferActualId: c.choferHistorial[0]?.choferId ?? null,
      polizaVigente: c.polizas.length > 0,
    }))),
    prisma.empleado.findMany({
      where: { cargo: "CHOFER", activo: true },
      select: { id: true, nombre: true, apellido: true, fleteroId: true },
      orderBy: { apellido: "asc" },
    }),
  ])

  return (
    <NuevoViajeClient
      fleteros={fleteros}
      empresas={empresas}
      camiones={camiones}
      choferes={choferes}
    />
  )
}
