"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Gasto = { fecha: string; categoria: string; descripcion: string; total: number }
interface Props { desde: string; hasta: string; gastos: Gasto[] }

export function LibroGastosJmClient({ desde, hasta, gastos }: Props) {
  const router = useRouter()
  const [d, setD] = useState(desde)
  const [h, setH] = useState(hasta)

  function aplicar() {
    router.push(`/jm/contabilidad/gastos?desde=${encodeURIComponent(d)}&hasta=${encodeURIComponent(h)}`)
  }

  // Agrupar por categoría
  const porCategoria = new Map<string, number>()
  for (const g of gastos) porCategoria.set(g.categoria, (porCategoria.get(g.categoria) ?? 0) + g.total)
  const total = Array.from(porCategoria.values()).reduce((s, x) => s + x, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Libro de Gastos</h1>

      <div className="bg-white rounded-lg border p-4 flex items-end gap-3">
        <div><Label>Desde</Label><Input type="date" value={d} onChange={(e) => setD(e.target.value)} /></div>
        <div><Label>Hasta</Label><Input type="date" value={h} onChange={(e) => setH(e.target.value)} /></div>
        <Button onClick={aplicar}>Aplicar</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">Por categoría</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Categoría</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {porCategoria.size === 0 ? (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">Sin gastos.</td></tr>
            ) : Array.from(porCategoria.entries()).map(([cat, monto]) => (
              <tr key={cat} className="border-t">
                <td className="px-3 py-2">{cat}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(monto)}</td>
              </tr>
            ))}
          </tbody>
          {porCategoria.size > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td className="px-3 py-2">Total general</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(total)}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">Detalle</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Categoría</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {gastos.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Sin gastos.</td></tr>
            ) : gastos.map((g, i) => (
              <tr key={i} className="border-t">
                <td className="px-3 py-2 text-xs">{formatearFecha(new Date(g.fecha))}</td>
                <td className="px-3 py-2 text-xs">{g.categoria}</td>
                <td className="px-3 py-2 max-w-[400px] truncate">{g.descripcion}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(g.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
