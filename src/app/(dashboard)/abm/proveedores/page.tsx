import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import { ProveedoresAbm } from "@/components/abm/proveedores-abm"
import type { Rol } from "@/types"

export default async function ProveedoresPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) redirect("/dashboard")

  const proveedores = await prisma.proveedor.findMany({
    orderBy: [{ activo: "desc" }, { razonSocial: "asc" }],
    select: { id: true, razonSocial: true, cuit: true, condicionIva: true, rubro: true, tipo: true, activo: true, _count: { select: { facturas: true } } },
  })

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Proveedores</h2>
        <p className="text-muted-foreground">Gestión de proveedores del sistema.</p>
      </div>
      <ProveedoresAbm proveedores={proveedores.map(p => ({
        ...p,
        puedeEliminar: p.activo && p._count.facturas === 0,
      }))} />
    </div>
  )
}
