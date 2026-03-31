"use client"

import { useState, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

type Proveedor = {
  id: string
  razonSocial: string
  cuit: string
}

type FacturaProveedor = {
  id: string
  nroComprobante: string
  tipoCbte: string
  fechaCbte: string
  neto: number
  ivaMonto: number
  total: number
  proveedor: { id: string; razonSocial: string; cuit: string }
  saldoPendiente: number
  estado: string
}

type FacturasProveedorClientProps = {
  proveedores: Proveedor[]
}

/**
 * FacturasProveedorClient: FacturasProveedorClientProps -> JSX.Element
 *
 * Dado la lista de proveedores, muestra filtros y tabla de facturas de proveedores.
 * Fetches desde /api/facturas-proveedor con los filtros activos.
 * Existe para el módulo de consulta de facturas de proveedores en /proveedores/facturas.
 *
 * Ejemplos:
 * <FacturasProveedorClient proveedores={[...]} />
 */
export function FacturasProveedorClient({ proveedores }: FacturasProveedorClientProps) {
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [facturas, setFacturas] = useState<FacturaProveedor[]>([])
  const [loading, setLoading] = useState(false)
  const [buscado, setBuscado] = useState(false)

  const buscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      if (proveedorId) params.set("proveedorId", proveedorId)
      if (nroComprobante) params.set("nroComprobante", nroComprobante)

      const res = await fetch(`/api/facturas-proveedor?${params.toString()}`)
      if (res.ok) {
        const data = await res.json() as FacturaProveedor[]
        setFacturas(data)
      }
    } finally {
      setLoading(false)
      setBuscado(true)
    }
  }, [desde, hasta, proveedorId, nroComprobante])

  const totalGeneral = facturas.reduce((acc, f) => acc + f.total, 0)
  const totalPendiente = facturas.reduce((acc, f) => acc + f.saldoPendiente, 0)

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultar Facturas de Proveedores</h2>
        <p className="text-muted-foreground">Buscá y filtrá las facturas recibidas de proveedores.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Filtros</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="desde">Desde</Label>
              <Input id="desde" type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="hasta">Hasta</Label>
              <Input id="hasta" type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label>Proveedor</Label>
            <SearchCombobox
              items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
              value={proveedorId}
              onChange={setProveedorId}
              placeholder="Todos los proveedores..."
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nroComprobante">Número de comprobante</Label>
            <Input
              id="nroComprobante"
              value={nroComprobante}
              onChange={(e) => setNroComprobante(e.target.value)}
              placeholder="0001-..."
            />
          </div>
          <Button onClick={buscar} disabled={loading}>
            {loading ? "Buscando..." : "Buscar"}
          </Button>
        </CardContent>
      </Card>

      {buscado && (
        <>
          {facturas.length === 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>Sin resultados</CardTitle>
                <CardDescription>No se encontraron facturas con los filtros aplicados.</CardDescription>
              </CardHeader>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Resultados</CardTitle>
                <CardDescription>
                  {facturas.length} factura(s) · Total: {formatearMoneda(totalGeneral)} · Pendiente: {formatearMoneda(totalPendiente)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b text-left text-muted-foreground">
                        <th className="pb-2 pr-4">Fecha</th>
                        <th className="pb-2 pr-4">Número</th>
                        <th className="pb-2 pr-4">Tipo</th>
                        <th className="pb-2 pr-4">Proveedor</th>
                        <th className="pb-2 pr-4 text-right">Subtotal</th>
                        <th className="pb-2 pr-4 text-right">IVA</th>
                        <th className="pb-2 pr-4 text-right">Total</th>
                        <th className="pb-2 text-center">Estado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {facturas.map((f) => (
                        <tr key={f.id} className="hover:bg-muted/50">
                          <td className="py-2 pr-4">{formatearFecha(f.fechaCbte)}</td>
                          <td className="py-2 pr-4 font-mono text-xs">{f.nroComprobante}</td>
                          <td className="py-2 pr-4">{f.tipoCbte}</td>
                          <td className="py-2 pr-4">{f.proveedor.razonSocial}</td>
                          <td className="py-2 pr-4 text-right">{formatearMoneda(f.neto)}</td>
                          <td className="py-2 pr-4 text-right">{formatearMoneda(f.ivaMonto)}</td>
                          <td className="py-2 pr-4 text-right font-semibold">{formatearMoneda(f.total)}</td>
                          <td className="py-2 text-center">
                            <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${f.estado === "Pagada" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
                              {f.estado}
                            </span>
                          </td>
                        </tr>
                      ))}
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
