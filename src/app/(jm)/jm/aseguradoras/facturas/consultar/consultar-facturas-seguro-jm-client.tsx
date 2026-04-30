"use client"

import { useEffect, useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

type Aseguradora = { id: string; razonSocial: string; cuit: string }

type FacturaSeguroItem = {
  id: string
  aseguradora: { id: string; razonSocial: string; cuit: string } | null
  nroComprobante: string
  tipoComprobante: string
  fecha: string
  periodoDesde: string
  periodoHasta: string
  total: string | number
  estadoPago: string
  formaPago: string
  cantCuotas: number | null
  polizas: Array<{ id: string; nroPoliza: string; vigenciaHasta: string }>
}

interface Props { aseguradoras: Aseguradora[] }

export function ConsultarFacturasSeguroJmClient({ aseguradoras }: Props) {
  const [aseguradoraId, setAseguradoraId] = useState("")
  const [facturas, setFacturas] = useState<FacturaSeguroItem[]>([])
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const params = aseguradoraId ? `?aseguradoraId=${aseguradoraId}` : ""
      const res = await fetch(`/api/jm/facturas-seguro${params}`)
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } finally { setCargando(false) }
  }

  useEffect(() => { void cargar() }, [aseguradoraId]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Facturas y pólizas</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="md:col-span-2">
            <Label>Aseguradora</Label>
            <SearchCombobox
              items={[{ id: "", label: "Todas", sublabel: "" }, ...aseguradoras.map(a => ({ id: a.id, label: a.razonSocial, sublabel: a.cuit }))]}
              value={aseguradoraId}
              onChange={setAseguradoraId}
              placeholder="Aseguradora"
            />
          </div>
          <div className="flex items-end"><Button onClick={cargar}>Refrescar</Button></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Aseguradora</th>
              <th className="px-3 py-2 text-left">Comp.</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Vigencia</th>
              <th className="px-3 py-2 text-left">Pólizas</th>
              <th className="px-3 py-2 text-left">Forma pago</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : facturas.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Sin facturas.</td></tr>
            ) : facturas.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{f.aseguradora?.razonSocial ?? "—"}</td>
                <td className="px-3 py-2 font-mono text-xs">{f.tipoComprobante} {f.nroComprobante}</td>
                <td className="px-3 py-2">{formatearFecha(new Date(f.fecha))}</td>
                <td className="px-3 py-2 text-xs">{formatearFecha(new Date(f.periodoDesde))} → {formatearFecha(new Date(f.periodoHasta))}</td>
                <td className="px-3 py-2 text-xs">{f.polizas.length === 0 ? "—" : f.polizas.map(p => p.nroPoliza).join(", ")}</td>
                <td className="px-3 py-2 text-xs">{f.formaPago}{f.cantCuotas ? ` (${f.cantCuotas} cuotas)` : ""}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${f.estadoPago === "PAGADA" ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{f.estadoPago.replace(/_/g, " ")}</span></td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(f.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
