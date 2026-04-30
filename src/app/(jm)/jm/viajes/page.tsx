import { PlusCircle, Search } from "lucide-react"
import { ActionCard } from "@/components/ui/action-card"

export default function ViajesJmLandingPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Viajes</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard
          title="NUEVO"
          subtitle="VIAJE"
          href="/jm/viajes/nuevo"
          icon={PlusCircle}
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="VIAJES"
          href="/jm/viajes/consultar"
          icon={Search}
        />
      </div>
    </div>
  )
}
