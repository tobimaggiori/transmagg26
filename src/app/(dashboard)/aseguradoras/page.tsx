/**
 * Propósito: Landing del módulo Aseguradoras (/aseguradoras).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"
import { FileText, CreditCard } from "lucide-react"

export default async function AseguradorasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "aseguradoras")) redirect("/dashboard")

  const tieneAcceso = await tienePermiso(session.user.id, rol, "aseguradoras")
  if (!tieneAcceso) redirect("/dashboard")

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
          href="/aseguradoras/facturas"
          icon={FileText}
        />
        <ActionCard
          title="RESUMEN"
          subtitle="DE TARJETAS"
          href="/aseguradoras/resumen-tarjetas"
          icon={CreditCard}
        />
      </div>
    </div>
  )
}
