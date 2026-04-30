/**
 * Propósito: Landing page del módulo Recibos por Cobranza.
 * Muestra acciones: nuevo recibo o consultar recibos.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Receipt, Search } from "lucide-react"
import type { Rol } from "@/types"

export default async function RecibosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!(await tienePermiso(session.user.id, session.user.rol as Rol, "facturas"))) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Recibos por Cobranza</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard title="NUEVO" subtitle="RECIBO" href="/empresas/recibos/nuevo" icon={Receipt} />
        <ActionCard title="CONSULTAR" subtitle="RECIBOS" href="/empresas/recibos/consultar" icon={Search} />
      </div>
    </div>
  )
}
