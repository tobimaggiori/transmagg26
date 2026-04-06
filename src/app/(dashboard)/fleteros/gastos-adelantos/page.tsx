import { Plus, Search } from "lucide-react"
import { ActionCard } from "@/components/ui/action-card"

export default function GastosAdelantosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Gastos y Adelantos a Fleteros</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>

      <div className="w-full max-w-2xl space-y-6">
        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Gastos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <ActionCard
              title="INGRESAR"
              subtitle="GASTO"
              href="/fleteros/gastos/ingresar"
              icon={Plus}
            />
            <ActionCard
              title="CONSULTAR"
              subtitle="GASTOS"
              href="/fleteros/gastos"
              icon={Search}
            />
          </div>
        </div>

        <div>
          <p className="text-sm font-semibold uppercase tracking-wide text-muted-foreground mb-3">Adelantos</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
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
      </div>
    </div>
  )
}
