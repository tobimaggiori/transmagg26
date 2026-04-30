import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder, tienePermiso } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Building2, Truck, Package, Users } from "lucide-react"
import type { Rol } from "@/types"

export default async function BaseDeDatosPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  const rol = session.user.rol as Rol
  if (!puedeAcceder(rol, "abm")) redirect("/dashboard")

  const [verEmpresas, verFleteros, verProveedores, verUsuarios] = await Promise.all([
    tienePermiso(session.user.id, rol, "abm.empresas"),
    tienePermiso(session.user.id, rol, "abm.fleteros"),
    tienePermiso(session.user.id, rol, "abm.proveedores"),
    tienePermiso(session.user.id, rol, "abm.usuarios"),
  ])

  if (!verEmpresas && !verFleteros && !verProveedores && !verUsuarios) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Base de datos</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés gestionar?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        {verEmpresas    && <ActionCard title="EMPRESAS"    subtitle="ABM Empresas"    href="/abm/empresas"    icon={Building2} />}
        {verFleteros    && <ActionCard title="FLETEROS"    subtitle="ABM Fleteros"    href="/abm/fleteros"    icon={Truck} />}
        {verProveedores && <ActionCard title="PROVEEDORES" subtitle="ABM Proveedores" href="/abm/proveedores" icon={Package} />}
        {verUsuarios    && <ActionCard title="USUARIOS"    subtitle="ABM Usuarios"    href="/abm/usuarios"    icon={Users} />}
      </div>
    </div>
  )
}
