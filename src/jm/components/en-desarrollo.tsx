/**
 * Placeholder reutilizable para pantallas JM aún no implementadas.
 * Ver docs/jm/README.md para el roadmap.
 */

import { Wrench } from "lucide-react"

export function EnDesarrolloJm({ titulo }: { titulo: string }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center space-y-3">
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
        <Wrench className="h-6 w-6 text-muted-foreground" />
      </div>
      <h1 className="text-2xl font-bold tracking-tight">{titulo}</h1>
      <p className="text-muted-foreground">En desarrollo</p>
    </div>
  )
}
