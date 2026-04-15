import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Plus, Trash2 } from "lucide-react"
import { type ItemForm, SELECT_CLS } from "./types"

type ItemsSectionProps = {
  items: ItemForm[]
  discriminaIVA: boolean
  onAgregarItem: () => void
  onEliminarItem: (id: string) => void
  onActualizarItem: (id: string, campo: keyof ItemForm, valor: string) => void
}

const GRID_IVA =
  "grid-cols-[minmax(180px,2.5fr)_minmax(70px,0.5fr)_minmax(130px,1fr)_minmax(90px,0.7fr)_36px]"
const GRID_SIN_IVA =
  "grid-cols-[minmax(180px,2.5fr)_minmax(70px,0.5fr)_minmax(130px,1fr)_36px]"

export function ItemsSection({
  items,
  discriminaIVA,
  onAgregarItem,
  onEliminarItem,
  onActualizarItem,
}: ItemsSectionProps) {
  const gridCls = discriminaIVA ? GRID_IVA : GRID_SIN_IVA

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle>Items de la factura</CardTitle>
        <Button type="button" variant="outline" size="sm" onClick={onAgregarItem}>
          <Plus className="h-4 w-4 mr-1" /> Agregar item
        </Button>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <div className="min-w-[400px] space-y-2">
            {/* Encabezado de tabla */}
            <div className={`grid gap-3 text-xs font-medium text-muted-foreground uppercase tracking-wide pb-2 border-b ${gridCls}`}>
              <span>Descripcion</span>
              <span className="text-right">Cant.</span>
              <span className="text-right">P. Unitario</span>
              {discriminaIVA && <span>Alic. IVA</span>}
              <span />
            </div>

            {/* Filas de items */}
            {items.map((item, idx) => (
              <div
                key={item.id}
                className={`grid gap-3 items-center py-1 ${gridCls}`}
              >
                <Input
                  value={item.descripcion}
                  onChange={(e) => onActualizarItem(item.id, "descripcion", e.target.value)}
                  placeholder={`Item ${idx + 1}`}
                />
                <Input
                  type="number"
                  step="0.001"
                  min="0.001"
                  value={item.cantidad}
                  onChange={(e) => onActualizarItem(item.id, "cantidad", e.target.value)}
                  className="text-right tabular-nums"
                />
                <Input
                  type="number"
                  step="0.01"
                  min="0"
                  value={item.precioUnitario}
                  onChange={(e) => onActualizarItem(item.id, "precioUnitario", e.target.value)}
                  placeholder="0.00"
                  className="text-right tabular-nums"
                />
                {discriminaIVA && (
                  <select
                    value={item.alicuotaIva}
                    onChange={(e) => onActualizarItem(item.id, "alicuotaIva", e.target.value)}
                    className={SELECT_CLS}
                  >
                    <option value="EXENTO">Exento</option>
                    <option value="0">0%</option>
                    <option value="10.5">10.5%</option>
                    <option value="21">21%</option>
                    <option value="27">27%</option>
                  </select>
                )}
                <button
                  type="button"
                  onClick={() => onEliminarItem(item.id)}
                  disabled={items.length === 1}
                  className="text-muted-foreground hover:text-destructive disabled:opacity-30 p-1"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
