import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"
import { ProveedoresAbmJm, type ProveedorJmAbm } from "@/jm/components/proveedores-abm"

export default async function ProveedoresAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  const proveedores = await prismaJm.proveedor.findMany({ orderBy: { razonSocial: "asc" } })
  const proveedoresAbm: ProveedorJmAbm[] = proveedores.map((p) => ({
    id: p.id,
    razonSocial: p.razonSocial,
    cuit: p.cuit,
    condicionIva: p.condicionIva,
    rubro: p.rubro,
    tipo: p.tipo,
    activo: p.activo,
  }))

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">ABM Proveedores</h1>
      <ProveedoresAbmJm proveedores={proveedoresAbm} />
    </div>
  )
}
