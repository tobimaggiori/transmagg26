/**
 * Propósito: Landing de Facturas y Pólizas de Seguro (/aseguradoras/facturas).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"
import { Plus, Search } from "lucide-react"

export default async function AseguradorasFacturasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "aseguradoras")) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturas y Pólizas</h2>
        <p className="text-muted-foreground">Seleccioná una opción para continuar</p>
      </div>
      <div className="grid grid-cols-2 gap-6 max-w-2xl">
        <ActionCard
          title="NUEVA"
          subtitle="FACTURA DE SEGURO"
          href="/aseguradoras/facturas/nueva"
          icon={Plus}
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="FACTURAS Y PÓLIZAS"
          href="/aseguradoras/facturas/consultar"
          icon={Search}
        />
      </div>
    </div>
  )
}
