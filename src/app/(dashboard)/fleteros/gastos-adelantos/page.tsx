import { Plus, Search } from "lucide-react"
import { ActionCard } from "@/components/ui/action-card"

export default function GastosAdelantosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Adelantos a Fleteros</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard
          title="INGRESAR"
          subtitle="ADELANTO"
          href="/fleteros/adelantos/ingresar"
          icon={Plus}
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="ADELANTOS"
          href="/fleteros/adelantos"
          icon={Search}
        />
      </div>
    </div>
  )
}
