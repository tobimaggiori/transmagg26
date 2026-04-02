/**
 * Propósito: Landing page del módulo Facturas a Empresas.
 * Muestra acciones: nueva factura o consultar facturas.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { FileText, Search } from "lucide-react"
import type { Rol } from "@/types"

export default async function FacturasEmpresasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Facturas a Empresas</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard title="NUEVA" subtitle="FACTURA" href="/empresas/facturar" icon={FileText} />
        <ActionCard title="CONSULTAR" subtitle="FACTURAS" href="/empresas/facturas/consultar" icon={Search} />
      </div>
    </div>
  )
}
