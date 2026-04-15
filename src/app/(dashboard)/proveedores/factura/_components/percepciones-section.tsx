import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/money"
import { Plus, Trash2 } from "lucide-react"
import { type PercepcionForm, PERCEPCION_OPTIONS, SELECT_CLS } from "./types"

type PercepcionesSectionProps = {
  percepciones: PercepcionForm[]
  totalPercepciones: number
  onAgregar: () => void
  onEliminar: (id: string) => void
  onActualizar: (id: string, campo: keyof PercepcionForm, valor: string) => void
}

export function PercepcionesSection({
  percepciones,
  totalPercepciones,
  onAgregar,
  onEliminar,
  onActualizar,
}: PercepcionesSectionProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">Percepciones e impuestos</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAgregar}>
          <Plus className="h-4 w-4 mr-1" /> Agregar
        </Button>
      </CardHeader>
      <CardContent className="space-y-3">
        {percepciones.length === 0 && (
          <p className="text-sm text-muted-foreground py-2">
            Sin percepciones ni impuestos adicionales.
          </p>
        )}
        {percepciones.map((p) => (
          <div key={p.id} className="grid grid-cols-[1.5fr_1fr_0.8fr_auto] gap-2 items-center">
            <select
              value={p.tipo}
              onChange={(e) => onActualizar(p.id, "tipo", e.target.value)}
              className={SELECT_CLS}
            >
              <optgroup label="Percepciones">
                {PERCEPCION_OPTIONS.filter((o) => o.group === "PERCEPCIONES").map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
              <optgroup label="Impuestos">
                {PERCEPCION_OPTIONS.filter((o) => o.group === "IMPUESTOS").map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </optgroup>
            </select>
            {p.tipo === "OTRO" ? (
              <Input
                value={p.descripcion}
                onChange={(e) => onActualizar(p.id, "descripcion", e.target.value)}
                placeholder="Descripcion..."
              />
            ) : (
              <span className="text-sm text-muted-foreground">—</span>
            )}
            <Input
              type="number"
              step="0.01"
              min="0"
              value={p.monto}
              onChange={(e) => onActualizar(p.id, "monto", e.target.value)}
              placeholder="0.00"
            />
            <button
              type="button"
              onClick={() => onEliminar(p.id)}
              className="text-muted-foreground hover:text-destructive p-1"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}
        {totalPercepciones > 0 && (
          <div className="flex justify-end gap-8 text-sm font-medium border-t pt-2">
            <span>Total percepciones/impuestos</span>
            <span className="w-28 text-right tabular-nums">{formatearMoneda(totalPercepciones)}</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
