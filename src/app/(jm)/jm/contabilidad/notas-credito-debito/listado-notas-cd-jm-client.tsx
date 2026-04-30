"use client"

import { useState } from "react"
import { Select } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Nota = {
  id: string
  tipo: string
  subtipo: string | null
  nroComprobante: number | null
  ptoVenta: number | null
  nroComprobanteExterno: string | null
  montoTotal: string | number
  montoDescontado: string | number
  estado: string
  arcaEstado: string | null
  creadoEn: string
  descripcion: string | null
  facturaInfo: string | null
  facturaProveedorInfo: string | null
}

interface Props { notas: Nota[] }

export function ListadoNotasCDJmClient({ notas }: Props) {
  const [tipoFiltro, setTipoFiltro] = useState("")

  const filtradas = tipoFiltro ? notas.filter(n => n.tipo === tipoFiltro) : notas
  const tipos = Array.from(new Set(notas.map(n => n.tipo))).sort()

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Notas de Crédito y Débito</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <Label>Tipo</Label>
            <Select value={tipoFiltro} onChange={(e) => setTipoFiltro(e.target.value)}>
              <option value="">Todos</option>
              {tipos.map(t => <option key={t} value={t}>{t.replace(/_/g, " ")}</option>)}
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
              <th className="px-3 py-2 text-left">Vinculado a</th>
              <th className="px-3 py-2 text-left">Creada</th>
              <th className="px-3 py-2 text-left">Estado</th>
              <th className="px-3 py-2 text-right">Monto</th>
              <th className="px-3 py-2 text-right">Aplicado</th>
            </tr>
          </thead>
          <tbody>
            {filtradas.length === 0 ? (
              <tr><td colSpan={7} className="px-3 py-6 text-center text-muted-foreground">Sin notas.</td></tr>
            ) : filtradas.map((n) => {
              const nro = n.nroComprobante
                ? `${String(n.ptoVenta ?? 1).padStart(4, "0")}-${String(n.nroComprobante).padStart(8, "0")}`
                : n.nroComprobanteExterno ?? "—"
              return (
                <tr key={n.id} className="border-t hover:bg-muted/20">
                  <td className="px-3 py-2"><span className="text-xs px-2 py-0.5 rounded-full bg-blue-100 text-blue-800">{n.tipo.replace(/_/g, " ")}</span></td>
                  <td className="px-3 py-2 font-mono text-xs">{nro}</td>
                  <td className="px-3 py-2 text-xs max-w-[300px] truncate">{n.facturaInfo ?? n.facturaProveedorInfo ?? n.descripcion ?? "—"}</td>
                  <td className="px-3 py-2 text-xs">{formatearFecha(new Date(n.creadoEn))}</td>
                  <td className="px-3 py-2 text-xs">{n.estado}{n.arcaEstado ? ` · ARCA: ${n.arcaEstado}` : ""}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(Number(n.montoTotal))}</td>
                  <td className="px-3 py-2 text-right text-muted-foreground">{formatearMoneda(Number(n.montoDescontado))}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    </div>
  )
}
