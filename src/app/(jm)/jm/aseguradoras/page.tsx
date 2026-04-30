/**
 * Landing del módulo Aseguradoras JM (/jm/aseguradoras).
 * Solo accesible para roles internos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { FileText } from "lucide-react"
import type { Rol } from "@/types"

export default async function AseguradorasJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Aseguradoras</h2>
        <p className="text-muted-foreground">Seleccioná una opción para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-2xl">
        <ActionCard
          title="FACTURAS"
          subtitle="Y PÓLIZAS"
          href="/jm/aseguradoras/facturas"
          icon={FileText}
        />
      </div>
    </div>
  )
}
