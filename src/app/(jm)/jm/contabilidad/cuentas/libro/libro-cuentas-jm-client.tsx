"use client"

import { useEffect, useState } from "react"
import { Select } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { formatearFecha, formatearMoneda } from "@/lib/utils"

type Cuenta = { id: string; nombre: string; moneda: string; saldoInicial: string | number }

type Movimiento = {
  id: string
  fecha: string
  orden: number
  tipo: string
  categoria: string
  monto: string | number
  descripcion: string
}

interface Props { cuentas: Cuenta[] }

export function LibroCuentasJmClient({ cuentas }: Props) {
  const [cuentaId, setCuentaId] = useState(cuentas[0]?.id ?? "")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [movs, setMovs] = useState<Movimiento[]>([])
  const [cargando, setCargando] = useState(false)

  async function cargar() {
    if (!cuentaId) return
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/jm/cuentas/${cuentaId}/movimientos?${params.toString()}`)
      const data = await res.json()
      setMovs(Array.isArray(data) ? data : [])
    } finally { setCargando(false) }
  }

  useEffect(() => { void cargar() }, [cuentaId, desde, hasta]) // eslint-disable-line react-hooks/exhaustive-deps

  const cuenta = cuentas.find((c) => c.id === cuentaId)
  const saldoInicial = Number(cuenta?.saldoInicial ?? 0)

  // Calcular saldo corriendo
  let saldo = saldoInicial
  const movsConSaldo = movs.map((m) => {
    saldo += m.tipo === "INGRESO" ? Number(m.monto) : -Number(m.monto)
    return { ...m, saldo }
  })

  const totalIngresos = movs.filter(m => m.tipo === "INGRESO").reduce((s, m) => s + Number(m.monto), 0)
  const totalEgresos = movs.filter(m => m.tipo === "EGRESO").reduce((s, m) => s + Number(m.monto), 0)

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Libro de Cuentas</h1>

      <div className="bg-white rounded-lg border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <Label>Cuenta</Label>
            <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)}>
              {cuentas.length === 0 && <option value="">Sin cuentas</option>}
              {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre} ({c.moneda})</option>)}
            </Select>
          </div>
          <div><Label>Desde</Label><Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} /></div>
          <div><Label>Hasta</Label><Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} /></div>
          <div className="flex items-end"><Button onClick={cargar}>Refrescar</Button></div>
        </div>
      </div>

      {cuenta && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
          <div className="bg-white border rounded p-3"><p className="text-xs text-muted-foreground">Saldo inicial</p><p className="font-semibold">{formatearMoneda(saldoInicial)}</p></div>
          <div className="bg-white border rounded p-3"><p className="text-xs text-muted-foreground">Ingresos</p><p className="font-semibold text-green-700">{formatearMoneda(totalIngresos)}</p></div>
          <div className="bg-white border rounded p-3"><p className="text-xs text-muted-foreground">Egresos</p><p className="font-semibold text-red-700">{formatearMoneda(totalEgresos)}</p></div>
          <div className="bg-white border rounded p-3"><p className="text-xs text-muted-foreground">Saldo final</p><p className="font-semibold">{formatearMoneda(saldo)}</p></div>
        </div>
      )}

      <div className="bg-white rounded-lg border overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/40">
            <tr>
              <th className="px-3 py-2 text-left">Fecha</th>
              <th className="px-3 py-2 text-left">Categoría</th>
              <th className="px-3 py-2 text-left">Descripción</th>
              <th className="px-3 py-2 text-right">Ingreso</th>
              <th className="px-3 py-2 text-right">Egreso</th>
              <th className="px-3 py-2 text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            {cargando ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Cargando...</td></tr>
            ) : movsConSaldo.length === 0 ? (
              <tr><td colSpan={6} className="px-3 py-6 text-center text-muted-foreground">Sin movimientos.</td></tr>
            ) : movsConSaldo.map((m) => (
              <tr key={m.id} className="border-t hover:bg-muted/20">
                <td className="px-3 py-2 text-xs">{formatearFecha(new Date(m.fecha))}</td>
                <td className="px-3 py-2 text-xs">{m.categoria.replace(/_/g, " ")}</td>
                <td className="px-3 py-2 max-w-[300px] truncate">{m.descripcion}</td>
                <td className="px-3 py-2 text-right text-green-700">{m.tipo === "INGRESO" ? formatearMoneda(Number(m.monto)) : ""}</td>
                <td className="px-3 py-2 text-right text-red-700">{m.tipo === "EGRESO" ? formatearMoneda(Number(m.monto)) : ""}</td>
                <td className="px-3 py-2 text-right font-medium">{formatearMoneda(m.saldo)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
