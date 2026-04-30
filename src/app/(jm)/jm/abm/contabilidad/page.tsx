import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Users, CreditCard, TrendingUp } from "lucide-react"
import type { Rol } from "@/types"

export default async function ContabilidadAbmJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esRolInterno(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Contabilidad</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés gestionar?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard title="EMPLEADOS" subtitle="ABM Empleados" href="/jm/abm/empleados" icon={Users} />
        <ActionCard title="BILLETERAS, BANCOS Y BROKERS" subtitle="ABM Billeteras, Bancos y Brokers" href="/jm/abm/cuentas" icon={CreditCard} />
      </div>
      <div className="w-full max-w-xs">
        <ActionCard title="FCI" subtitle="ABM FCI" href="/jm/abm/fci" icon={TrendingUp} />
      </div>
    </div>
  )
}
