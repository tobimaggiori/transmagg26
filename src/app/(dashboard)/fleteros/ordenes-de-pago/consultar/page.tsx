"use client"

/**
 * Propósito: Página de consulta de Órdenes de Pago emitidas.
 * Muestra un listado con filtros por fletero, número y rango de fechas.
 */

import { useState, useEffect, useCallback } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Input } from "@/components/ui/input"

interface OrdenPago {
  id: string
  nro: number
  fecha: string
  fletero: { id: string; razonSocial: string }
  total: number
  pdfS3Key: string | null
}

export default function ConsultarOrdenesDePagoPage() {
  const [ordenes, setOrdenes] = useState<OrdenPago[]>([])
  const [cargando, setCargando] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [filtroFletero, setFiltroFletero] = useState("")
  const [filtroNro, setFiltroNro] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  const cargar = useCallback(async () => {
    setCargando(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (filtroNro) params.set("nro", filtroNro)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      const res = await fetch(`/api/ordenes-pago?${params}`)
      if (!res.ok) throw new Error("Error al cargar órdenes de pago")
      setOrdenes(await res.json())
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargando(false)
    }
  }, [filtroNro, filtroDesde, filtroHasta])

  useEffect(() => { cargar() }, [cargar])

  const ordenesFiltradas = ordenes.filter((op) =>
    filtroFletero
      ? op.fletero.razonSocial.toLowerCase().includes(filtroFletero.toLowerCase())
      : true
  )

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold">Consultar Órdenes de Pago</h1>
        <p className="text-sm text-muted-foreground mt-1">Historial de órdenes de pago emitidas a fleteros.</p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-3">
        <div>
          <label className="text-xs font-medium block mb-1">Fletero</label>
          <Input
            value={filtroFletero}
            onChange={(e) => setFiltroFletero(e.target.value)}
            placeholder="Buscar por fletero..."
            className="h-8 text-sm w-52"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Nro OP</label>
          <Input
            value={filtroNro}
            onChange={(e) => setFiltroNro(e.target.value)}
            placeholder="Ej: 42"
            className="h-8 text-sm w-24"
            type="number"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Desde</label>
          <Input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
        <div>
          <label className="text-xs font-medium block mb-1">Hasta</label>
          <Input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="h-8 text-sm w-36"
          />
        </div>
      </div>

      {/* Tabla */}
      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : cargando ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : ordenesFiltradas.length === 0 ? (
        <div className="rounded-lg border p-8 text-center text-sm text-muted-foreground">
          No hay órdenes de pago que coincidan con los filtros.
        </div>
      ) : (
        <div className="rounded-lg border overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-4 py-2.5 text-left font-medium">Nro OP</th>
                <th className="px-4 py-2.5 text-left font-medium">Fecha</th>
                <th className="px-4 py-2.5 text-left font-medium">Fletero</th>
                <th className="px-4 py-2.5 text-right font-medium">Total</th>
                <th className="px-4 py-2.5" />
              </tr>
            </thead>
            <tbody className="divide-y">
              {ordenesFiltradas.map((op) => (
                <tr key={op.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 font-mono font-semibold">
                    {op.nro.toLocaleString("es-AR")}
                  </td>
                  <td className="px-4 py-3">{formatearFecha(new Date(op.fecha))}</td>
                  <td className="px-4 py-3">{op.fletero.razonSocial}</td>
                  <td className="px-4 py-3 text-right font-medium">{formatearMoneda(op.total)}</td>
                  <td className="px-4 py-3 text-right">
                    <button
                      onClick={() => window.open(`/api/ordenes-pago/${op.id}/pdf`, "_blank")}
                      className="h-7 px-3 rounded-md border text-xs font-medium hover:bg-accent"
                    >
                      Ver PDF
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <div className="px-4 py-2 bg-muted/30 text-xs text-muted-foreground border-t">
            {ordenesFiltradas.length} orden{ordenesFiltradas.length !== 1 ? "es" : ""}
          </div>
        </div>
      )}
    </div>
  )
}
