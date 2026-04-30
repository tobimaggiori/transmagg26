/**
 * Cuentas y Tarjetas: dos accesos a los flujos de conciliación.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Landmark, CreditCard } from "lucide-react"
import type { Rol } from "@/types"

export default async function CuentasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!(await tienePermiso(session.user.id, rol, "cuentas"))) redirect("/dashboard")

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Cuentas y Tarjetas</h1>
        <p className="text-muted-foreground">Conciliación mensual de cuentas bancarias, billeteras, brokers y tarjetas.</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 max-w-3xl">
        <ActionCard
          title="LIBRO"
          subtitle="DE CUENTAS"
          href="/contabilidad/cuentas/libro"
          icon={Landmark}
          description="Mirá todos los movimientos de cada cuenta en tiempo real, conciliá días y cerrá el mes con el extracto."
        />
        <ActionCard
          title="CONCILIACIÓN"
          subtitle="DE TARJETAS"
          href="/contabilidad/cuentas/conciliacion-tarjetas"
          icon={CreditCard}
          description="Conciliá cada tarjeta por ciclo, día a día contra el resumen emitido."
        />
      </div>
    </div>
  )
}
