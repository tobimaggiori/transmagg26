"use client"

import { useEffect, useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

type Proveedor = { id: string; razonSocial: string; cuit: string }

type FacturaItem = {
  id: string
  proveedor: { id: string; razonSocial: string; cuit: string } | null
  nroComprobante: string
  ptoVenta: string | null
  tipoCbte: string
  fechaCbte: string
  total: string | number
  estadoPago: string
  saldoPendiente: number
  concepto: string | null
}

interface Props { proveedores: Proveedor[] }

export function ConsultarFacturasProveedorJmClient({ proveedores }: Props) {
  const [proveedorId, setProveedorId] = useState("")
  const [estadoPago, setEstadoPago] = useState<"" | "PENDIENTE" | "PARCIALMENTE_PAGADA" | "PAGADA">("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [facturas, setFacturas] = useState<FacturaItem[]>([])
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (proveedorId) params.set("proveedorId", proveedorId)
      if (estadoPago) params.set("estadoPago", estadoPago)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/jm/facturas-proveedor?${params.toString()}`)
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { void cargar() }, [proveedorId, estadoPago, desde, hasta]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Consultar facturas de proveedor</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <div>
            <Label>Proveedor</Label>
            <SearchCombobox
              items={[{ id: "", label: "Todos", sublabel: "" }, ...proveedores.map(p => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))]}
              value={proveedorId}
              onChange={setProveedorId}
              placeholder="Proveedor"
            />
          </div>
          <div><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div>
            <Label>Estado pago</Label>
            <Select value={estadoPago} onChange={(e) => setEstadoPago(e.target.value as typeof estadoPago)}>
              <option value="">Todas</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIALMENTE_PAGADA">Parc. pagada</option>
              <option value="PAGADA">Pagada</option>
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={cargar}>Refrescar</Button></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Nro</th>
              <th className="px-3 py-2 text-left">Proveedor</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Concepto</th>
              <th className="px-3 py-2 text-left">Estado pago</th>
              <th className="px-3 py-2 text-right">Total</th>
              <th className="px-3 py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : facturas.length === 0 ? (
              <tr><td colSpan={8} className="px-3 py-6 text-center text-muted-foreground">Sin facturas para los filtros.</td></tr>
            ) : facturas.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{f.tipoCbte}</td>
                <td className="px-3 py-2 font-mono">{f.ptoVenta ? `${f.ptoVenta}-` : ""}{f.nroComprobante}</td>
                <td className="px-3 py-2">{f.proveedor?.razonSocial ?? "—"}</td>
                <td className="px-3 py-2">{formatearFecha(new Date(f.fechaCbte))}</td>
                <td className="px-3 py-2 max-w-[180px] truncate">{f.concepto ?? "—"}</td>
                <td className="px-3 py-2"><span className={`text-xs px-2 py-0.5 rounded-full ${f.estadoPago === "PAGADA" ? "bg-green-100 text-green-800" : f.estadoPago === "PARCIALMENTE_PAGADA" ? "bg-amber-100 text-amber-800" : "bg-red-100 text-red-800"}`}>{f.estadoPago.replace(/_/g, " ")}</span></td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(f.total))}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(f.saldoPendiente)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
