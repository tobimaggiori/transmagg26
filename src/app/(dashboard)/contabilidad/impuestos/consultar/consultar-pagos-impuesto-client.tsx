"use client"

/**
 * Consulta de pagos de impuestos con filtros por tipo, año y medio de pago.
 */

import { useState, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

interface PagoImpuesto {
  id: string
  tipoImpuesto: string
  descripcion: string | null
  periodo: string
  monto: number
  fechaPago: string
  medioPago: string
  cuentaId: string | null
  cuentaNombre: string | null
  comprobantePdfS3Key: string | null
  observaciones: string | null
}

const TIPOS_IMPUESTO = [
  { value: "", label: "Todos" },
  { value: "IIBB", label: "Ingresos Brutos" },
  { value: "IVA", label: "IVA" },
  { value: "GANANCIAS", label: "Ganancias" },
  { value: "OTRO", label: "Otro" },
]

const MEDIOS_PAGO = [
  { value: "", label: "Todos" },
  { value: "CUENTA_BANCARIA", label: "Cuenta bancaria" },
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TARJETA", label: "Tarjeta" },
]

function labelTipo(tipo: string): string {
  const map: Record<string, string> = {
    IIBB: "IIBB",
    IVA: "IVA",
    GANANCIAS: "Ganancias",
    OTRO: "Otro",
  }
  return map[tipo] ?? tipo
}

function labelMedio(medio: string): string {
  const map: Record<string, string> = {
    CUENTA_BANCARIA: "Cuenta bancaria",
    EFECTIVO: "Efectivo",
    TARJETA: "Tarjeta",
  }
  return map[medio] ?? medio
}

function getAnios(): number[] {
  const current = new Date().getFullYear()
  const anios: number[] = []
  for (let y = current; y >= current - 5; y--) anios.push(y)
  return anios
}

export function ConsultarPagosImpuestoClient() {
  const [pagos, setPagos] = useState<PagoImpuesto[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [filterTipo, setFilterTipo] = useState("")
  const [filterAnio, setFilterAnio] = useState("")
  const [filterMedio, setFilterMedio] = useState("")

  async function fetchPagos() {
    setLoading(true)
    setError("")
    try {
      const params = new URLSearchParams()
      if (filterTipo) params.set("tipoImpuesto", filterTipo)
      if (filterAnio) params.set("anio", filterAnio)
      if (filterMedio) params.set("medioPago", filterMedio)
      const res = await fetch(`/api/contabilidad/impuestos?${params}`)
      if (!res.ok) throw new Error("Error al cargar pagos")
      const data = await res.json()
      setPagos(data.pagos ?? [])
    } catch {
      setError("Error al cargar los pagos")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPagos()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filterTipo, filterAnio, filterMedio])

  const total = pagos.reduce((sum, p) => sum + p.monto, 0)

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Pagos de Impuestos</h1>
        <p className="text-muted-foreground text-sm mt-1">Historial de pagos impositivos registrados.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={filterTipo}
            onChange={(e) => setFilterTipo(e.target.value)}
          >
            {TIPOS_IMPUESTO.map((t) => (
              <option key={t.value} value={t.value}>{t.label}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Año</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={filterAnio}
            onChange={(e) => setFilterAnio(e.target.value)}
          >
            <option value="">Todos</option>
            {getAnios().map((y) => (
              <option key={y} value={String(y)}>{y}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="text-xs font-medium text-muted-foreground block mb-1">Medio de pago</label>
          <select
            className="border rounded px-3 py-1.5 text-sm"
            value={filterMedio}
            onChange={(e) => setFilterMedio(e.target.value)}
          >
            {MEDIOS_PAGO.map((m) => (
              <option key={m.value} value={m.value}>{m.label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : error ? (
        <p className="text-sm text-red-600">{error}</p>
      ) : pagos.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">No hay pagos registrados con los filtros seleccionados.</p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs font-semibold text-muted-foreground uppercase tracking-wide">
              <tr>
                <th className="px-3 py-2.5 text-left">Fecha</th>
                <th className="px-3 py-2.5 text-left">Tipo</th>
                <th className="px-3 py-2.5 text-left">Período</th>
                <th className="px-3 py-2.5 text-right">Monto</th>
                <th className="px-3 py-2.5 text-left">Medio</th>
                <th className="px-3 py-2.5 text-left">Cuenta</th>
                <th className="px-3 py-2.5 text-left">Comprobante</th>
                <th className="px-3 py-2.5 text-left">Observaciones</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {pagos.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">{formatearFecha(p.fechaPago)}</td>
                  <td className="px-3 py-2 font-medium">
                    {labelTipo(p.tipoImpuesto)}
                    {p.descripcion && <span className="block text-xs text-muted-foreground">{p.descripcion}</span>}
                  </td>
                  <td className="px-3 py-2">{p.periodo}</td>
                  <td className="px-3 py-2 text-right font-medium tabular-nums">{formatearMoneda(p.monto)}</td>
                  <td className="px-3 py-2">{labelMedio(p.medioPago)}</td>
                  <td className="px-3 py-2 text-muted-foreground">{p.cuentaNombre ?? "—"}</td>
                  <td className="px-3 py-2">
                    {p.comprobantePdfS3Key ? (
                      <a
                        href={`/api/storage/${p.comprobantePdfS3Key}`}
                        target="_blank"
                        rel="noreferrer"
                        className="text-primary underline text-xs"
                      >
                        Ver
                      </a>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2 text-muted-foreground text-xs max-w-[200px] truncate">{p.observaciones ?? "—"}</td>
                </tr>
              ))}
            </tbody>
            <tfoot className="bg-gray-50 font-semibold">
              <tr>
                <td colSpan={3} className="px-3 py-2 text-right text-sm">Total:</td>
                <td className="px-3 py-2 text-right text-sm tabular-nums">{formatearMoneda(total)}</td>
                <td colSpan={4} />
              </tr>
            </tfoot>
          </table>
        </div>
      )}
    </div>
  )
}
