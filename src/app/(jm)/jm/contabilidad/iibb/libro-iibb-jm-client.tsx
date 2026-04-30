"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/utils"

type Asiento = {
  id: string
  provincia: string
  montoIngreso: string | number
  empresa: string | null
  nroComprobante: string | null
}

interface Props { periodo: string; asientos: Asiento[] }

export function LibroIibbJmClient({ periodo, asientos }: Props) {
  const router = useRouter()
  const [periodoLocal, setPeriodoLocal] = useState(periodo)

  function aplicar() {
    router.push(`/jm/contabilidad/iibb?periodo=${encodeURIComponent(periodoLocal)}`)
  }

  // Agrupar por provincia
  const porProvincia = new Map<string, number>()
  for (const a of asientos) {
    porProvincia.set(a.provincia, (porProvincia.get(a.provincia) ?? 0) + Number(a.montoIngreso))
  }
  const totalGeneral = Array.from(porProvincia.values()).reduce((s, x) => s + x, 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Libro IIBB</h1>

      <div className="bg-white rounded-lg border p-4 flex items-end gap-3">
        <div>
          <Label>Período (YYYY-MM)</Label>
          <Input value={periodoLocal} onChange={(e) => setPeriodoLocal(e.target.value)} placeholder="2026-04" />
        </div>
        <Button onClick={aplicar}>Aplicar</Button>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">Resumen por provincia</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Provincia</th>
              <th className="px-3 py-2 text-right">Ingresos brutos</th>
            </tr>
          </thead>
          <tbody>
            {porProvincia.size === 0 ? (
              <tr><td colSpan={2} className="px-3 py-6 text-center text-muted-foreground">Sin asientos en el período.</td></tr>
            ) : Array.from(porProvincia.entries()).map(([prov, monto]) => (
              <tr key={prov} className="border-t">
                <td className="px-3 py-2">{prov}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(monto)}</td>
              </tr>
            ))}
          </tbody>
          {porProvincia.size > 0 && (
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
              <th className="px-3 py-2 text-left">Provincia</th>
              <th className="px-3 py-2 text-left">Empresa</th>
              <th className="px-3 py-2 text-left">Comprobante</th>
              <th className="px-3 py-2 text-right">Monto ingreso</th>
            </tr>
          </thead>
          <tbody>
            {asientos.length === 0 ? (
              <tr><td colSpan={4} className="px-3 py-6 text-center text-muted-foreground">Sin asientos.</td></tr>
            ) : asientos.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2">{a.provincia}</td>
                <td className="px-3 py-2">{a.empresa ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{a.nroComprobante ?? "—"}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(a.montoIngreso))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
