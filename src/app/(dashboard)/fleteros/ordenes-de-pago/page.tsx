import { CreditCard, Search } from "lucide-react"
import { ActionCard } from "@/components/ui/action-card"

export default function OrdenesDePagoPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Órdenes de Pago</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
        <ActionCard
          title="EMITIR"
          subtitle="ORDEN DE PAGO"
          href="/fleteros/pago"
          icon={CreditCard}
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="ÓRDENES DE PAGO"
          href="/fleteros/ordenes-de-pago/consultar"
          icon={Search}
        />
      </div>
    </div>
  )
}
