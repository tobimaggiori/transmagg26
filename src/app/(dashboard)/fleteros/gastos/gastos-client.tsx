"use client"

import { useState, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes, maxMonetario } from "@/lib/money"

type Fletero = { id: string; razonSocial: string; cuit: string }

type FacturaResumen = {
  id: string
  tipoCbte: string
  nroComprobante: string
  fechaCbte: string
  total: number
  estadoPago: string
  proveedor: { id: string; razonSocial: string; cuit: string }
}

type Descuento = {
  id: string
  montoDescontado: number
  fecha: string
  liquidacion: { id: string }
}

type GastoFletero = {
  id: string
  tipo: string
  montoPagado: number
  montoDescontado: number
  estado: string
  creadoEn: string
  fletero: { id: string; razonSocial: string; cuit: string }
  facturaProveedor: FacturaResumen
  descuentos: Descuento[]
}

type GastosClientProps = { fleteros: Fletero[] }

const BADGE_ESTADO: Record<string, string> = {
  PENDIENTE_PAGO: "bg-red-100 text-red-800",
  PAGADO: "bg-blue-100 text-blue-800",
  DESCONTADO_PARCIAL: "bg-yellow-100 text-yellow-800",
  DESCONTADO_TOTAL: "bg-green-100 text-green-800",
}

const LABEL_ESTADO: Record<string, string> = {
  PENDIENTE_PAGO: "Pendiente",
  PAGADO: "Pagado",
  DESCONTADO_PARCIAL: "Desc. Parcial",
  DESCONTADO_TOTAL: "Desc. Total",
}

const LABEL_TIPO: Record<string, string> = {
  COMBUSTIBLE: "Combustible",
  OTRO: "Otro",
}

/**
 * GastosClient: GastosClientProps -> JSX.Element
 *
 * Dado la lista de fleteros, muestra filtros y tabla de gastos de fleteros.
 * Incluye saldo pendiente de descuento y historial de descuentos aplicados en LPs.
 */
export function GastosClient({ fleteros }: GastosClientProps) {
  const [fleteroId, setFleteroId] = useState("")
  const [estado, setEstado] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [gastos, setGastos] = useState<GastoFletero[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (fleteroId) params.set("fleteroId", fleteroId)
      if (estado) params.set("estado", estado)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const res = await fetch(`/api/fleteros/gastos?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as GastoFletero[]
        setGastos(data)
      }
    } finally {
      setLoading(false)
      setBuscado(true)
    }
  }, [fleteroId, estado, desde, hasta])

  const totalMontoPagado = sumarImportes(gastos.map(g => g.montoPagado))
  const totalPendiente = sumarImportes(gastos.map(g => maxMonetario(0, restarImportes(g.montoPagado, g.montoDescontado))))

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultar Gastos de Fleteros</h2>
        <p className="text-muted-foreground">Buscá y filtrá los gastos registrados por cuenta de fleteros.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-1.5">
            <Label>Fletero</Label>
            <SearchCombobox
              items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
              value={fleteroId}
              onChange={setFleteroId}
              placeholder="Todos los fleteros..."
            />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Estado</Label>
              <Select value={estado} onChange={(e) => setEstado(e.target.value)}>
                <option value="">Todos</option>
                <option value="PENDIENTE_PAGO">Pendiente</option>
                <option value="PAGADO">Pagado</option>
                <option value="DESCONTADO_PARCIAL">Desc. Parcial</option>
                <option value="DESCONTADO_TOTAL">Desc. Total</option>
              </Select>
            </div>
          </div>
          <Button onClick={buscar} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      {buscado && (
        <>
          {gastos.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sin resultados</CardTitle>
                <CardDescription>No se encontraron gastos con los filtros aplicados.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {gastos.length} gasto(s) · Total pagado: {formatearMoneda(totalMontoPagado)} · Pendiente descuento: {formatearMoneda(totalPendiente)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-3">Fecha</th>
                        <th className="pb-2 pr-3">Fletero</th>
                        <th className="pb-2 pr-3">Proveedor</th>
                        <th className="pb-2 pr-3">Comprobante</th>
                        <th className="pb-2 pr-3 text-center">Tipo</th>
                        <th className="pb-2 pr-3 text-right">Monto</th>
                        <th className="pb-2 pr-3 text-right">Descontado</th>
                        <th className="pb-2 pr-3 text-right">Saldo</th>
                        <th className="pb-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {gastos.map((g) => {
                        const saldo = maxMonetario(0, restarImportes(g.montoPagado, g.montoDescontado))
                        return (
                          <tr key={g.id} className="hover:bg-muted/50">
                            <td className="py-2 pr-3 whitespace-nowrap">
                              {formatearFecha(g.facturaProveedor.fechaCbte)}
                            </td>
                            <td className="py-2 pr-3">{g.fletero.razonSocial}</td>
                            <td className="py-2 pr-3">{g.facturaProveedor.proveedor.razonSocial}</td>
                            <td className="py-2 pr-3 font-mono text-xs">
                              {g.facturaProveedor.tipoCbte} {g.facturaProveedor.nroComprobante}
                            </td>
                            <td className="py-2 pr-3 text-center">
                              <span className="inline-flex items-center rounded px-1.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                                {LABEL_TIPO[g.tipo] ?? g.tipo}
                              </span>
                            </td>
                            <td className="py-2 pr-3 text-right font-semibold">
                              {formatearMoneda(g.montoPagado)}
                            </td>
                            <td className="py-2 pr-3 text-right text-muted-foreground">
                              {g.montoDescontado > 0 ? formatearMoneda(g.montoDescontado) : "—"}
                            </td>
                            <td className="py-2 pr-3 text-right">
                              {saldo > 0.01 ? (
                                <span className="text-destructive font-medium">{formatearMoneda(saldo)}</span>
                              ) : (
                                "—"
                              )}
                            </td>
                            <td className="py-2 text-center">
                              <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${BADGE_ESTADO[g.estado] ?? "bg-gray-100 text-gray-800"}`}>
                                {LABEL_ESTADO[g.estado] ?? g.estado}
                              </span>
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  )
}
