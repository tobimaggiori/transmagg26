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
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
        <p className="text-muted-foreground">Gestión de proveedores del sistema.</p>
      </div>
      <ProveedoresAbmJm proveedores={proveedoresAbm} />
    </div>
  )
}
