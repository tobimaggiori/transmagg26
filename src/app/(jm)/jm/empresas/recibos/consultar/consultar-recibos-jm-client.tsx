"use client"

/**
 * Consultar recibos JM. Listado con filtros (empresa, fecha).
 */

import { useEffect, useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Empresa = { id: string; razonSocial: string; cuit: string }

type ReciboItem = {
  id: string
  nro: number
  ptoVenta: number
  fecha: string
  totalCobrado: string | number
  totalRetenciones: string | number
  totalComprobantes: string | number
  saldoACuenta: string | number
  empresa: { razonSocial: string; cuit: string } | null
}

interface Props { empresas: Empresa[] }

export function ConsultarRecibosJmClient({ empresas }: Props) {
  const [empresaId, setEmpresaId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [recibos, setRecibos] = useState<ReciboItem[]>([])
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (empresaId) params.set("empresaId", empresaId)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/jm/recibos-cobranza?${params.toString()}`)
      const data = await res.json()
      setRecibos(Array.isArray(data) ? data : [])
    } finally {
      setCargando(false)
    }
  }

  useEffect(() => { void cargar() }, [empresaId, desde, hasta]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Consultar Recibos por Cobranza</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Empresa</Label>
            <SearchCombobox
              items={[{ id: "", label: "Todas", sublabel: "" }, ...empresas.map(e => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))]}
              value={empresaId}
              onChange={setEmpresaId}
              placeholder="Empresa"
            />
          </div>
          <div><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={cargar}>Refrescar</Button></div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Nro</th>
              <th className="px-3 py-2 text-left">Empresa</th>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-right">Cobrado</th>
              <th className="px-3 py-2 text-right">Retenciones</th>
              <th className="px-3 py-2 text-right">Aplicado a fact.</th>
              <th className="px-3 py-2 text-right">Saldo a cuenta</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : recibos.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin recibos.</td></tr>
            ) : recibos.map((r) => (
              <tr key={r.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 font-mono">{String(r.ptoVenta).padStart(4, "0")}-{String(r.nro).padStart(8, "0")}</td>
                <td className="px-3 py-2">{r.empresa?.razonSocial ?? "—"}</td>
                <td className="px-3 py-2">{formatearFecha(new Date(r.fecha))}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(r.totalCobrado))}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(r.totalRetenciones))}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(r.totalComprobantes))}</td>
                <td className="px-3 py-2 text-right">{formatearMoneda(Number(r.saldoACuenta))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
