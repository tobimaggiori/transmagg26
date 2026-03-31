"use client"

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { formatearMoneda } from "@/lib/utils"

type Proveedor = {
  id: string
  razonSocial: string
  cuit: string
}

type FacturaProveedorIngresoClientProps = {
  proveedores: Proveedor[]
}

const TIPOS_CBTE = ["A", "B", "C", "M", "X"] as const
const ALICUOTAS_IVA = [0, 10.5, 21, 27] as const

/**
 * FacturaProveedorIngresoClient: FacturaProveedorIngresoClientProps -> JSX.Element
 *
 * Dado la lista de proveedores, muestra un formulario para ingresar una factura de proveedor.
 * Calcula IVA y total en tiempo real. Al enviar, hace POST a /api/proveedores/[id]/facturas.
 * Existe para el módulo de carga de facturas de proveedores en /proveedores/factura.
 *
 * Ejemplos:
 * <FacturaProveedorIngresoClient proveedores={[{ id: "p1", razonSocial: "Peajes SRL", cuit: "30-12345678-9" }]} />
 */
export function FacturaProveedorIngresoClient({ proveedores }: FacturaProveedorIngresoClientProps) {
  const [proveedorId, setProveedorId] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [tipoCbte, setTipoCbte] = useState<string>("A")
  const [fechaCbte, setFechaCbte] = useState("")
  const [neto, setNeto] = useState("")
  const [alicuotaIva, setAlicuotaIva] = useState<number>(21)
  const [loading, setLoading] = useState(false)
  const [exito, setExito] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const netoNum = parseFloat(neto) || 0
  const ivaMonto = netoNum * (alicuotaIva / 100)
  const total = netoNum + ivaMonto

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setExito(false)

    if (!proveedorId) {
      setError("Seleccioná un proveedor")
      return
    }
    if (!nroComprobante.trim()) {
      setError("Ingresá el número de comprobante")
      return
    }
    if (!fechaCbte) {
      setError("Ingresá la fecha del comprobante")
      return
    }
    if (netoNum <= 0) {
      setError("El neto debe ser mayor a 0")
      return
    }

    setLoading(true)
    try {
      const res = await fetch(`/api/proveedores/${proveedorId}/facturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nroComprobante: nroComprobante.trim(),
          tipoCbte,
          neto: netoNum,
          alicuotaIva,
          total,
          fechaCbte,
        }),
      })

      if (!res.ok) {
        const data = await res.json() as { error?: string }
        setError(data.error ?? "Error al guardar la factura")
        return
      }

      setExito(true)
      setProveedorId("")
      setNroComprobante("")
      setTipoCbte("A")
      setFechaCbte("")
      setNeto("")
      setAlicuotaIva(21)
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingresar Factura de Proveedor</h2>
        <p className="text-muted-foreground">Cargá una factura recibida de un proveedor.</p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>Nueva Factura</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1.5">
              <Label>Proveedor</Label>
              <SearchCombobox
                items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
                value={proveedorId}
                onChange={setProveedorId}
                placeholder="Buscar proveedor..."
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="tipoCbte">Tipo</Label>
                <select
                  id="tipoCbte"
                  value={tipoCbte}
                  onChange={(e) => setTipoCbte(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {TIPOS_CBTE.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nroComprobante">Número de comprobante</Label>
                <Input
                  id="nroComprobante"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="0001-00000123"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="fechaCbte">Fecha del comprobante</Label>
              <Input
                id="fechaCbte"
                type="date"
                value={fechaCbte}
                onChange={(e) => setFechaCbte(e.target.value)}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="neto">Neto</Label>
                <Input
                  id="neto"
                  type="number"
                  step="0.01"
                  min="0"
                  value={neto}
                  onChange={(e) => setNeto(e.target.value)}
                  placeholder="0.00"
                  required
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="alicuotaIva">Alícuota IVA</Label>
                <select
                  id="alicuotaIva"
                  value={alicuotaIva}
                  onChange={(e) => setAlicuotaIva(parseFloat(e.target.value))}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                >
                  {ALICUOTAS_IVA.map((a) => (
                    <option key={a} value={a}>{a}%</option>
                  ))}
                </select>
              </div>
            </div>

            {netoNum > 0 && (
              <div className="rounded-lg border bg-muted/40 p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({alicuotaIva}%)</span>
                  <span>{formatearMoneda(ivaMonto)}</span>
                </div>
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
            )}

            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}

            {exito && (
              <p className="text-sm text-green-600">Factura registrada correctamente.</p>
            )}

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Guardando..." : "Registrar Factura"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
