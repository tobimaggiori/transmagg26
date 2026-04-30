import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { EmpresasAbmJm, type EmpresaJmAbm } from "@/jm/components/empresas-abm"

export default async function EmpresasAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  const empresas = await prismaJm.empresa.findMany({ orderBy: { razonSocial: "asc" } })
  const empresasAbm: EmpresaJmAbm[] = empresas.map((e) => ({
    id: e.id,
    razonSocial: e.razonSocial,
    cuit: e.cuit,
    condicionIva: e.condicionIva,
    direccion: e.direccion,
    padronFce: e.padronFce,
    activa: e.activa,
  }))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Empresas</h2>
        <p className="text-muted-foreground">Gestión de empresas del sistema.</p>
      </div>
      <EmpresasAbmJm empresas={empresasAbm} />
    </div>
  )
}
