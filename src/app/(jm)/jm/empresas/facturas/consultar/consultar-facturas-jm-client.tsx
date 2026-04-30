"use client"

/**
 * Consultar Facturas JM. Listado simple con filtros (empresa, fecha, estado).
 */

import { useEffect, useState, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Empresa = { id: string; razonSocial: string; cuit: string }

type FacturaItem = {
  id: string
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  total: string | number
  emitidaEn: string
  estado: string
  estadoArca: string
  estadoCobro: string
  empresa: { id: string; razonSocial: string; cuit: string } | null
}

interface Props { empresas: Empresa[] }

export function ConsultarFacturasJmClient({ empresas }: Props) {
  const [empresaId, setEmpresaId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [estadoCobro, setEstadoCobro] = useState<"" | "PENDIENTE" | "PARCIALMENTE_COBRADA" | "COBRADA">("")
  const [facturas, setFacturas] = useState<FacturaItem[]>([])
  const [cargando, setCargando] = useState(false)

  const cargar = useCallback(async () => {
    setCargando(true)
    try {
      const res = await fetch("/api/jm/facturas")
      const data = await res.json()
      setFacturas(Array.isArray(data) ? data : [])
    } finally {
      setCargando(false)
    }
  }, [])

  useEffect(() => { void cargar() }, [cargar])

  const filtradas = facturas.filter((f) => {
    if (empresaId && f.empresa?.id !== empresaId) return false
    if (estadoCobro && f.estadoCobro !== estadoCobro) return false
    if (desde && new Date(f.emitidaEn) < new Date(desde)) return false
    if (hasta && new Date(f.emitidaEn) > new Date(`${hasta}T23:59:59.999Z`)) return false
    return true
  })

  const tipoLabel = (tipoCbte: number) => tipoCbte === 1 ? "A" : tipoCbte === 6 ? "B" : tipoCbte === 201 ? "A MiPyME" : `T${tipoCbte}`

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Consultar Facturas</h1>

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
          <div>
            <Label>Estado cobro</Label>
            <Select value={estadoCobro} onChange={(e) => setEstadoCobro(e.target.value as typeof estadoCobro)}>
              <option value="">Todas</option>
              <option value="PENDIENTE">Pendiente</option>
              <option value="PARCIALMENTE_COBRADA">Parc. cobrada</option>
              <option value="COBRADA">Cobrada</option>
            </Select>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Tipo</th>
              <th className="px-3 py-2 text-left">Nro</th>
              <th className="px-3 py-2 text-left">Empresa</th>
              <th className="px-3 py-2 text-left">Emitida</th>
              <th className="px-3 py-2 text-left">Estado ARCA</th>
              <th className="px-3 py-2 text-left">Cobro</th>
              <th className="px-3 py-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : filtradas.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin facturas para los filtros.</td></tr>
            ) : filtradas.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2">{tipoLabel(f.tipoCbte)}</td>
                <td className="px-3 py-2 font-mono">{String(f.ptoVenta ?? 1).padStart(4, "0")}-{f.nroComprobante ?? "—"}</td>
                <td className="px-3 py-2">{f.empresa?.razonSocial ?? "—"}</td>
                <td className="px-3 py-2">{formatearFecha(new Date(f.emitidaEn))}</td>
                <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-800">{f.estadoArca}</span></td>
                <td className="px-3 py-2">{f.estadoCobro}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(Number(f.total))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
