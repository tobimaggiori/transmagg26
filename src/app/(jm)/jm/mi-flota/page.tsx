/**
 * Mi Flota JM — gestión de camiones propios.
 * Versión simplificada: solo CRUD de camiones (sin pólizas ni infracciones aún).
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { CamionesAbmJm, type CamionJmAbm } from "@/jm/components/camiones-abm"

export default async function MiFlotaJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const camiones = await prismaJm.camion.findMany({ orderBy: [{ activo: "desc" }, { patenteChasis: "asc" }] })
  const camionesAbm: CamionJmAbm[] = camiones.map((c) => ({
    id: c.id,
    patenteChasis: c.patenteChasis,
    patenteAcoplado: c.patenteAcoplado,
    activo: c.activo,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Mi Flota</h2>
        <p className="text-muted-foreground">Camiones propios y choferes asignados.</p>
      </div>
      <CamionesAbmJm camiones={camionesAbm} />
    </div>
  )
}
