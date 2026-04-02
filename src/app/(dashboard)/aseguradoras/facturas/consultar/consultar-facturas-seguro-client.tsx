"use client"

/**
 * Propósito: Lista de facturas de seguro con filtros por aseguradora, estado y fechas.
 */

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import Link from "next/link"

interface Proveedor {
  id: string
  razonSocial: string
}

interface FacturaSeguro {
  id: string
  nroComprobante: string
  tipoComprobante: string
  fecha: string
  total: number
  formaPago: string
  estadoPago: string
  aseguradora: { id: string; razonSocial: string }
  polizas: Array<{ id: string; nroPoliza: string }>
}

interface Props {
  proveedores: Proveedor[]
}

export function ConsultarFacturasSeguroClient({ proveedores }: Props) {
  const [facturas, setFacturas] = useState<FacturaSeguro[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [aseguradoraId, setAseguradoraId] = useState("")
  const [estado, setEstado] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (aseguradoraId) params.set("aseguradoraId", aseguradoraId)
      if (estado) params.set("estado", estado)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const res = await fetch(`/api/aseguradoras/facturas?${params}`)
      if (!res.ok) throw new Error("Error al cargar facturas")
      const data = await res.json()
      setFacturas(data.facturas)
    } catch {
      setError("Error al cargar las facturas")
    } finally {
      setLoading(false)
    }
  }, [aseguradoraId, estado, desde, hasta])

  useEffect(() => {
    buscar()
  }, [buscar])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Facturas de Seguro</h2>
          <p className="text-muted-foreground">Consultá y filtrá las facturas registradas</p>
        </div>
        <Link href="/aseguradoras/facturas/nueva">
          <Button>Nueva factura</Button>
        </Link>
      </div>

      {/* Filtros */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div>
          <Label>Aseguradora</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={aseguradoraId}
            onChange={(e) => setAseguradoraId(e.target.value)}
          >
            <option value="">Todas</option>
            {proveedores.map((p) => (
              <option key={p.id} value={p.id}>{p.razonSocial}</option>
            ))}
          </select>
        </div>
        <div>
          <Label>Estado</Label>
          <select
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            value={estado}
            onChange={(e) => setEstado(e.target.value)}
          >
            <option value="">Todos</option>
            <option value="PENDIENTE">Pendiente</option>
            <option value="PAGADO">Pagado</option>
          </select>
        </div>
        <div>
          <Label>Desde</Label>
          <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
        </div>
        <div>
          <Label>Hasta</Label>
          <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
        </div>
      </div>

      {error && (
        <div className="rounded-md bg-destructive/10 border border-destructive/30 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Tabla */}
      {loading ? (
        <p className="text-sm text-muted-foreground">Cargando...</p>
      ) : (
        <div className="rounded-md border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b bg-muted/50">
                <th className="px-3 py-3 text-left font-medium">Fecha</th>
                <th className="px-3 py-3 text-left font-medium">Aseguradora</th>
                <th className="px-3 py-3 text-left font-medium">Comprobante</th>
                <th className="px-3 py-3 text-right font-medium">Total</th>
                <th className="px-3 py-3 text-left font-medium">Forma pago</th>
                <th className="px-3 py-3 text-left font-medium">Estado</th>
                <th className="px-3 py-3 text-center font-medium">Pólizas</th>
              </tr>
            </thead>
            <tbody>
              {facturas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-3 py-8 text-center text-muted-foreground">
                    No hay facturas que coincidan con los filtros
                  </td>
                </tr>
              ) : (
                facturas.map((f) => (
                  <tr key={f.id} className="border-b last:border-0 hover:bg-muted/30">
                    <td className="px-3 py-2">{formatearFecha(new Date(f.fecha))}</td>
                    <td className="px-3 py-2">{f.aseguradora.razonSocial}</td>
                    <td className="px-3 py-2">
                      {f.tipoComprobante} {f.nroComprobante}
                    </td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(f.total)}</td>
                    <td className="px-3 py-2">{f.formaPago}</td>
                    <td className="px-3 py-2">
                      <span
                        className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                          f.estadoPago === "PAGADO"
                            ? "bg-green-100 text-green-700"
                            : "bg-yellow-100 text-yellow-700"
                        }`}
                      >
                        {f.estadoPago}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-center">{f.polizas.length}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
