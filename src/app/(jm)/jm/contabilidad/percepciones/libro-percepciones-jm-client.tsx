"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/utils"

type Percepcion = {
  id: string
  tipo: string
  categoria: string
  descripcion: string | null
  monto: string | number
  proveedor: string | null
  cuit: string | null
  nroComprobante: string | null
}

interface Props { periodo: string; percepciones: Percepcion[] }

export function LibroPercepcionesJmClient({ periodo, percepciones }: Props) {
  const router = useRouter()
  const [periodoLocal, setPeriodoLocal] = useState(periodo)

  const porTipo = new Map<string, number>()
  for (const p of percepciones) porTipo.set(p.tipo, (porTipo.get(p.tipo) ?? 0) + Number(p.monto))
  const totalGeneral = Array.from(porTipo.values()).reduce((s, x) => s + x, 0)

  function aplicar() {
    router.push(`/jm/contabilidad/percepciones?periodo=${encodeURIComponent(periodoLocal)}`)
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Libro Percepciones</h1>

      <div className="bg-white rounded-lg border p-4 flex items-end gap-3">
        <div>
          <Label>Período (YYYY-MM)</Label>
          <Input value={periodoLocal} onChange={(e) => setPeriodoLocal(e.target.value)} />
        </div>
        <Button onClick={aplicar}>Aplicar</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">Resumen por tipo</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {porTipo.size === 0 ? (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">Sin percepciones.</td></tr>
            ) : Array.from(porTipo.entries()).map(([tipo, monto]) => (
              <tr key={tipo} className="border-t">
                <td className="px-3 py-2">{tipo.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(monto)}</td>
              </tr>
            ))}
          </tbody>
          {porTipo.size > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td className="px-3 py-2">Total</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(totalGeneral)}</td>
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
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Proveedor</th>
              <th className="px-3 py-2 text-left">CUIT</th>
              <th className="px-3 py-2 text-left">Comprobante</th>
              <th className="px-3 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {percepciones.length === 0 ? (
              <tr><td colSpan={5} className="px-3 py-6 text-center text-muted-foreground">Sin percepciones.</td></tr>
            ) : percepciones.map((p) => (
              <tr key={p.id} className="border-t">
                <td className="px-3 py-2 text-xs">{p.tipo.replace(/_/g, " ")}</td>
                <td className="px-3 py-2">{p.proveedor ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{p.cuit ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{p.nroComprobante ?? "—"}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(p.monto))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
