/**
 * Propósito: Landing de Reportes Contables (ruta /contabilidad/reportes).
 * Muestra accesos directos a los distintos reportes disponibles — filtrados
 * según los permisos granulares del operador.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"

export default async function ReportesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.reportes"))) redirect("/dashboard")

  const [verIva, verIibb, verNotasCD, verComprobantes] = await Promise.all([
    tienePermiso(session.user.id, rol, "iva"),
    tienePermiso(session.user.id, rol, "iibb"),
    tienePermiso(session.user.id, rol, "notas_credito_debito"),
    tienePermiso(session.user.id, rol, "contabilidad.comprobantes"),
  ])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes Contables</h2>
        <p className="text-muted-foreground">Seleccioná un reporte para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        {verIva && <ActionCard title="LIBRO" subtitle="IVA" href="/contabilidad/iva" />}
        {verIibb && <ActionCard title="LIBRO" subtitle="Ingresos Brutos" href="/contabilidad/iibb" />}
        <ActionCard title="LIBRO" subtitle="GASTOS" href="/contabilidad/gastos" />
        <ActionCard title="CONCILIACIÓN" subtitle="DE VIAJES" href="/contabilidad/lp-vs-facturas" />
        <ActionCard title="VIAJES" subtitle="PROPIOS" href="/contabilidad/viajes-sin-lp" />
        {verNotasCD && <ActionCard title="NOTAS" subtitle="C/D" href="/contabilidad/notas-credito-debito" />}
        {verComprobantes && <ActionCard title="COMPROBANTES" subtitle="R2" href="/contabilidad/comprobantes" />}
        <ActionCard title="LIBRO" subtitle="Percepciones" href="/contabilidad/percepciones" />
      </div>
    </div>
  )
}
