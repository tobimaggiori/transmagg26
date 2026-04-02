import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { esAdmin } from "@/lib/permissions"
import { ActionCard } from "@/components/ui/action-card"
import { FileText, Mail } from "lucide-react"
import type { Rol } from "@/types"

export default async function ConfiguracionesPage() {
  const session = await auth()
  if (!session?.user) redirect("/login")
  if (!esAdmin(session.user.rol as Rol)) redirect("/dashboard")

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Configuraciones</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés configurar?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard title="ARCA" subtitle="Configuración ARCA" href="/abm/arca" icon={FileText} />
        <ActionCard title="OTP"  subtitle="Configuración OTP"  href="/abm/otp"  icon={Mail} />
      </div>
    </div>
  )
}
