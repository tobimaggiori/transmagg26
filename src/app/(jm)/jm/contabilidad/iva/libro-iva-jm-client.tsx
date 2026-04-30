"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Asiento = {
  id: string
  tipo: string
  tipoReferencia: string
  baseImponible: string | number
  alicuota: number
  montoIva: string | number
  cuit: string | null
  razonSocial: string | null
  nroComprobante: string | null
  fecha: string | null
}

interface Props { periodo: string; asientos: Asiento[] }

export function LibroIvaJmClient({ periodo, asientos }: Props) {
  const router = useRouter()
  const [periodoLocal, setPeriodoLocal] = useState(periodo)

  const ventas = asientos.filter(a => a.tipo === "VENTA")
  const compras = asientos.filter(a => a.tipo === "COMPRA")

  const sumar = (lst: Asiento[]) => lst.reduce((acc, a) => ({
    base: acc.base + Number(a.baseImponible),
    iva: acc.iva + Number(a.montoIva),
  }), { base: 0, iva: 0 })

  const totalVentas = sumar(ventas)
  const totalCompras = sumar(compras)

  function aplicarPeriodo() {
    router.push(`/jm/contabilidad/iva?periodo=${encodeURIComponent(periodoLocal)}`)
  }

  function tabla(asiento: Asiento[], titulo: string) {
    return (
      <div className="bg-white rounded-lg border overflow-hidden">
        <div className="px-4 py-2 border-b font-semibold">{titulo} ({asiento.length})</div>
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Comprobante</th>
              <th className="px-3 py-2 text-left">CUIT</th>
              <th className="px-3 py-2 text-left">Razón social</th>
              <th className="px-3 py-2 text-right">Base imponible</th>
              <th className="px-3 py-2 text-right">Alícuota</th>
              <th className="px-3 py-2 text-right">IVA</th>
            </tr>
          </thead>
          <tbody>
            {asiento.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin asientos.</td></tr>
            ) : asiento.map((a) => (
              <tr key={a.id} className="border-t">
                <td className="px-3 py-2 text-xs">{a.fecha ? formatearFecha(new Date(a.fecha)) : "—"}</td>
                <td className="px-3 py-2 text-xs">{a.nroComprobante ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{a.cuit ?? "—"}</td>
                <td className="px-3 py-2">{a.razonSocial ?? "—"}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(a.baseImponible))}</td>
                <td className="px-3 py-2 text-right">{a.alicuota}%</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(a.montoIva))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Libro IVA</h1>

      <div className="bg-white rounded-lg border p-4 flex items-end gap-3">
        <div>
          <Label>Período (YYYY-MM)</Label>
          <Input value={periodoLocal} onChange={(e) => setPeriodoLocal(e.target.value)} placeholder="2026-04" />
        </div>
        <Button onClick={aplicarPeriodo}>Aplicar</Button>
      </div>

      {tabla(ventas, "IVA Ventas")}
      <div className="bg-muted/40 rounded p-3 flex justify-between text-sm">
        <span>Total ventas — base {formatearMoneda(totalVentas.base)}</span>
        <span className="font-semibold">IVA Ventas: {formatearMoneda(totalVentas.iva)}</span>
      </div>

      {tabla(compras, "IVA Compras")}
      <div className="bg-muted/40 rounded p-3 flex justify-between text-sm">
        <span>Total compras — base {formatearMoneda(totalCompras.base)}</span>
        <span className="font-semibold">IVA Compras: {formatearMoneda(totalCompras.iva)}</span>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded p-3 flex justify-between text-sm font-semibold">
        <span>Saldo IVA del período</span>
        <span>{formatearMoneda(totalVentas.iva - totalCompras.iva)}</span>
      </div>
    </div>
  )
}
