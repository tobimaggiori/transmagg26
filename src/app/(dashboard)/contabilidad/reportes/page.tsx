/**
 * Propósito: Landing de Reportes Contables (ruta /contabilidad/reportes).
 * Muestra accesos directos a los distintos reportes disponibles.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import type { Rol } from "@/types"

export default async function ReportesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  const tieneAcceso = await tienePermiso(session.user.id, rol, "contabilidad.reportes")
  if (!tieneAcceso) redirect("/dashboard")

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Reportes Contables</h2>
        <p className="text-muted-foreground">Seleccioná un reporte para continuar</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 max-w-4xl">
        <ActionCard
          title="LIBRO"
          subtitle="IVA"
          href="/contabilidad/iva"
        />
        <ActionCard
          title="LIBRO"
          subtitle="IIBB"
          href="/contabilidad/iibb"
        />
        <ActionCard
          title="LIBRO"
          subtitle="GASTOS"
          href="/contabilidad/gastos"
        />
        <ActionCard
          title="CONCILIACIÓN"
          subtitle="DE VIAJES"
          href="/contabilidad/lp-vs-facturas"
        />
        <ActionCard
          title="VIAJES"
          subtitle="SIN LP"
          href="/contabilidad/viajes-sin-lp"
        />
        <ActionCard
          title="NOTAS"
          subtitle="C/D"
          href="/contabilidad/notas-credito-debito"
        />
      </div>
    </div>
  )
}
