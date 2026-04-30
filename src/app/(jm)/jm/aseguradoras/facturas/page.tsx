/**
 * Landing de Facturas y Pólizas de Seguro JM.
 * Clon de /aseguradoras/facturas en Transmagg.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Plus, Search } from "lucide-react"
import type { Rol } from "@/types"

export default async function AseguradorasFacturasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas y Pólizas</h2>
        <p className="text-muted-foreground">Seleccioná una opción para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ActionCard title="NUEVA"     subtitle="FACTURA DE SEGURO"   href="/jm/aseguradoras/facturas/nueva"    icon={Plus} />
        <ActionCard title="CONSULTAR" subtitle="FACTURAS Y PÓLIZAS"  href="/jm/aseguradoras/facturas/consultar" icon={Search} />
      </div>
    </div>
  )
}
