/**
 * Landing de Facturas de Proveedores JM. Clon de /proveedores/facturas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"

export default async function FacturasProveedorJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas de Proveedores</h2>
        <p className="text-muted-foreground">Seleccioná una opción para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ActionCard title="INGRESAR"  subtitle="FACTURA"   href="/jm/proveedores/factura" />
        <ActionCard title="CONSULTAR" subtitle="FACTURAS"  href="/jm/proveedores/facturas/consultar" />
      </div>
    </div>
  )
}
