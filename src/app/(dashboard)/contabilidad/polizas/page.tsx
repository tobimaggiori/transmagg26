import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { puedeAcceder } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { Plus, Search } from "lucide-react"
import type { Rol } from "@/types"

export default async function PolizasPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!puedeAcceder(session.user.rol as Rol, "cuentas")) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Pólizas de Seguro</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
        <ActionCard title="NUEVA"     subtitle="PÓLIZA DE SEGURO" href="/contabilidad/polizas/nueva"     icon={Plus} />
        <ActionCard title="CONSULTAR" subtitle="PÓLIZAS"          href="/contabilidad/polizas/consultar" icon={Search} />
      </div>
    </div>
  )
}
