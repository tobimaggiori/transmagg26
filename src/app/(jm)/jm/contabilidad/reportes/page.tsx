/**
 * Reportes contables JM. Clon de /contabilidad/reportes.
 * Sin "Conciliación de viajes" (LP) ni "Viajes propios" como las de Transmagg
 * porque JM no tiene LPs.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"

export default async function ReportesJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes Contables</h2>
        <p className="text-muted-foreground">Seleccioná un reporte para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        <ActionCard title="LIBRO" subtitle="IVA" href="/jm/contabilidad/iva" />
        <ActionCard title="LIBRO" subtitle="Ingresos Brutos" href="/jm/contabilidad/iibb" />
        <ActionCard title="LIBRO" subtitle="GASTOS" href="/jm/contabilidad/gastos" />
        <ActionCard title="NOTAS" subtitle="C/D" href="/jm/contabilidad/notas-credito-debito" />
        <ActionCard title="COMPROBANTES" subtitle="R2" href="/jm/contabilidad/comprobantes" />
        <ActionCard title="LIBRO" subtitle="Percepciones" href="/jm/contabilidad/percepciones" />
      </div>
    </div>
  )
}
