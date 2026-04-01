import { FileText, Search } from "lucide-react"
import { ActionCard } from "@/components/ui/action-card"

export default function LiquidosProductosPage() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-8">
      <div className="text-center">
        <h1 className="text-3xl font-bold tracking-tight">Líquidos Productos</h1>
        <p className="text-muted-foreground mt-2">¿Qué querés hacer?</p>
      </div>
      <div className="grid grid-cols-2 gap-6 w-full max-w-2xl">
        <ActionCard
          title="EMITIR"
          subtitle="LÍQUIDO PRODUCTO"
          href="/fleteros/liquidar"
          icon={FileText}
        />
        <ActionCard
          title="CONSULTAR"
          subtitle="LÍQUIDOS PRODUCTOS"
          href="/fleteros/liquidaciones"
          icon={Search}
        />
      </div>
    </div>
  )
}
