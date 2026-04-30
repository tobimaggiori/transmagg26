import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esRolInterno } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Building2, Package } from "lucide-react"
import type { Rol } from "@/types"

export default async function BaseDeDatosJmPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Base de datos</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés gestionar?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard title="EMPRESAS"    subtitle="ABM Empresas"    href="/jm/abm/empresas"    icon={Building2} />
        <ActionCard title="PROVEEDORES" subtitle="ABM Proveedores" href="/jm/abm/proveedores" icon={Package} />
      </div>
    </div>
  )
}
