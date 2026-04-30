import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Users, CreditCard, TrendingUp } from "lucide-react"
import type { Rol } from "@/types"

export default async function ContabilidadPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!puedeAcceder(rol, "abm")) redirect("/dashboard")

  const [verEmpleados, verCuentas, verFci] = await Promise.all([
    tienePermiso(session.user.id, rol, "abm.empleados"),
    tienePermiso(session.user.id, rol, "abm.cuentas"),
    tienePermiso(session.user.id, rol, "abm.fci"),
  ])

  if (!verEmpleados && !verCuentas && !verFci) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contabilidad</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés gestionar?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {verEmpleados && <ActionCard title="EMPLEADOS" subtitle="ABM Empleados" href="/abm/empleados" icon={Users} />}
        {verCuentas   && <ActionCard title="BILLETERAS, BANCOS Y BROKERS" subtitle="ABM Billeteras, Bancos y Brokers" href="/abm/cuentas" icon={CreditCard} />}
      </div>
      {verFci && (
        <div className="w-full max-w-xs">
          <ActionCard title="FCI" subtitle="ABM FCI" href="/abm/fci" icon={TrendingUp} />
        </div>
      )}
    </div>
  )
}
