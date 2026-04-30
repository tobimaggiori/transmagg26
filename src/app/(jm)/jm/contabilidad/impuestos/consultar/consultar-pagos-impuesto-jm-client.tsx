"use client"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { useEffect, useState } from "react"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type PagoItem = {
  id: string
  tipoImpuesto: string
  descripcion: string | null
  periodo: string
  monto: string | number
  fechaPago: string
  medioPago: string
  observaciones: string | null
  cuenta: { id: string; nombre: string } | null
  tarjeta: { id: string; nombre: string } | null
}

interface Props { pagosIniciales: PagoItem[] }

export function ConsultarPagosImpuestoJmClient({ pagosIniciales }: Props) {
  const [pagos, setPagos] = useState<PagoItem[]>(pagosIniciales)
  const [tipoFiltro, setTipoFiltro] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/jm/pagos-impuesto?${params.toString()}`)
      const data = await res.json()
      setPagos(Array.isArray(data) ? data : [])
    } finally { setCargando(false) }
  }

  useEffect(() => { void cargar() }, [desde, hasta]) // eslint-disable-line react-hooks/exhaustive-deps

  const filtrados = tipoFiltro ? pagos.filter(p => p.tipoImpuesto === tipoFiltro) : pagos
  const tipos = Array.from(new Set(pagos.map(p => p.tipoImpuesto))).sort()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Pagos de impuestos</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div>
            <Label>Tipo</Label>
            <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t}</option>)}
            </Select>
          </div>
          <div className="flex items-end"><Button onClick={cargar}>Refrescar</Button></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Período</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-left">Medio</th>
              <th className="px-3 py-2 text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : filtrados.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Sin pagos.</td></tr>
            ) : filtrados.map((p) => (
              <tr key={p.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{formatearFecha(new Date(p.fechaPago))}</td>
                <td className="px-3 py-2 font-medium">{p.tipoImpuesto}</td>
                <td className="px-3 py-2">{p.periodo}</td>
                <td className="px-3 py-2 max-w-[180px] truncate">{p.descripcion ?? "—"}</td>
                <td className="px-3 py-2 text-xs">{p.medioPago}{p.cuenta ? ` · ${p.cuenta.nombre}` : ""}{p.tarjeta ? ` · ${p.tarjeta.nombre}` : ""}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(p.monto))}</td>
              </tr>
            ))}
          </tbody>
          {filtrados.length > 0 && (
            <tfoot>
              <tr className="border-t-2 bg-muted/40 font-semibold">
                <td colSpan={5} className="px-3 py-2 text-right">Total</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(filtrados.reduce((s, p) => s + Number(p.monto), 0))}</td>
              </tr>
            </tfoot>
          )}
        </table>
      </div>
    </div>
  )
}
