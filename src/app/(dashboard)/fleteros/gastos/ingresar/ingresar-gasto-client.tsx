"use client"

import { useState } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { parsearImporte, multiplicarImporte, calcularIva, sumarImportes, formatearMoneda } from "@/lib/money"
import { Plus, Trash2 } from "lucide-react"

type Proveedor = { id: string; razonSocial: string; cuit: string }
type Fletero = { id: string; razonSocial: string; cuit: string }

type IngresarGastoClientProps = {
  proveedores: Proveedor[]
  fleteros: Fletero[]
}

type AlicuotaValue = "0" | "10.5" | "21" | "27"

type ItemForm = {
  id: string
  descripcion: string
  cantidad: string
  precioUnitario: string
  alicuotaIva: AlicuotaValue
}

const TIPOS_CBTE = ["A", "B", "C", "M", "X", "LIQ_PROD"] as const
const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])

const SELECT_CLS =
  "flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring"

function nuevoItem(): ItemForm {
  return {
    id: Math.random().toString(36).slice(2),
    descripcion: "",
    cantidad: "1",
    precioUnitario: "",
    alicuotaIva: "21",
  }
}

/**
 * IngresarGastoClient: IngresarGastoClientProps -> JSX.Element
 *
 * Formulario para ingresar un gasto de fletero (factura de proveedor pagada
 * por Transmagg por cuenta del fletero). Sin PDF obligatorio.
 * Crea FacturaProveedor + GastoFletero en estado PENDIENTE_PAGO.
 */
export function IngresarGastoClient({ proveedores, fleteros }: IngresarGastoClientProps) {
  const [fleteroId, setFleteroId] = useState("")
  const [proveedorId, setProveedorId] = useState("")
  const [tipoCbte, setTipoCbte] = useState<string>("A")
  const [ptoVenta, setPtoVenta] = useState("")
  const [nroComprobante, setNroComprobante] = useState("")
  const [fechaComprobante, setFechaComprobante] = useState("")
  const [tipo, setTipo] = useState("COMBUSTIBLE")
  const [items, setItems] = useState<ItemForm[]>([nuevoItem()])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [exito, setExito] = useState<{ nroComprobante: string; total: number } | null>(null)

  const discriminaIVA = TIPOS_CON_IVA.has(tipoCbte)

  function agregarItem() {
    setItems((prev) => [...prev, nuevoItem()])
  }

  function actualizarItem(id: string, campo: keyof ItemForm, valor: string) {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, [campo]: valor } : it)))
  }

  function eliminarItem(id: string) {
    setItems((prev) => prev.filter((it) => it.id !== id))
  }

  // Cálculo de totales en tiempo real
  const itemsCalculados = items.map((it) => {
    const cant = parsearImporte(it.cantidad)
    const precio = parsearImporte(it.precioUnitario)
    const neto = multiplicarImporte(cant, precio)
    const alicuota = discriminaIVA ? parsearImporte(it.alicuotaIva) : 0
    const iva = alicuota > 0 ? calcularIva(neto, alicuota) : 0
    return { neto, iva, total: sumarImportes([neto, iva]) }
  })
  const totalNeto = sumarImportes(itemsCalculados.map(i => i.neto))
  const totalIva = sumarImportes(itemsCalculados.map(i => i.iva))
  const total = sumarImportes([totalNeto, totalIva])

  const puedeGuardar =
    fleteroId &&
    proveedorId &&
    ptoVenta &&
    nroComprobante &&
    fechaComprobante &&
    items.length > 0 &&
    items.every((it) => it.descripcion && parsearImporte(it.precioUnitario) > 0)

  function resetForm() {
    setFleteroId("")
    setProveedorId("")
    setTipoCbte("A")
    setPtoVenta("")
    setNroComprobante("")
    setFechaComprobante("")
    setTipo("COMBUSTIBLE")
    setItems([nuevoItem()])
    setError("")
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return
    setLoading(true)
    setError("")
    setExito(null)

    try {
      const res = await fetch("/api/fleteros/gastos", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleteroId,
          proveedorId,
          tipoCbte,
          ptoVenta,
          nroComprobante,
          fechaComprobante,
          tipo,
          items: items.map((it) => ({
            descripcion: it.descripcion,
            cantidad: parseFloat(it.cantidad) || 1,
            precioUnitario: parsearImporte(it.precioUnitario),
            alicuotaIva: discriminaIVA ? parseFloat(it.alicuotaIva) : 0,
          })),
        }),
      })

      if (!res.ok) {
        const data = (await res.json()) as { error?: string }
        setError(data.error ?? "Error al guardar el gasto")
        return
      }

      const data = (await res.json()) as { nroComprobante: string; total: number }
      setExito(data)
      resetForm()
    } catch {
      setError("Error de conexión")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingresar Gasto de Fletero</h2>
        <p className="text-muted-foreground">Registrá una factura de proveedor pagada por Transmagg por cuenta de un fletero.</p>
      </div>

      {exito && (
        <div className="rounded-md bg-green-50 border border-green-200 p-4 text-sm text-green-800">
          <p className="font-semibold">Gasto registrado correctamente</p>
          <p>Comprobante: {exito.nroComprobante} · Total: {formatearMoneda(exito.total)}</p>
          <p className="mt-1 text-xs text-green-700">La deuda del fletero queda en estado Pendiente. Podés descontarla al emitir una Liquidación.</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* ── Cabecera ─────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader>
            <CardTitle>Datos del gasto</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Fletero *</Label>
                <SearchCombobox
                  items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
                  value={fleteroId}
                  onChange={setFleteroId}
                  placeholder="Buscar fletero..."
                />
              </div>
              <div className="space-y-1.5">
                <Label>Proveedor *</Label>
                <SearchCombobox
                  items={proveedores.map((p) => ({ id: p.id, label: p.razonSocial, sublabel: p.cuit }))}
                  value={proveedorId}
                  onChange={setProveedorId}
                  placeholder="Buscar proveedor..."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="tipo">Tipo de gasto *</Label>
                <select
                  id="tipo"
                  value={tipo}
                  onChange={(e) => setTipo(e.target.value)}
                  className={SELECT_CLS}
                >
                  <option value="COMBUSTIBLE">Combustible</option>
                  <option value="OTRO">Otro</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="tipoCbte">Tipo de comprobante *</Label>
                <select
                  id="tipoCbte"
                  value={tipoCbte}
                  onChange={(e) => setTipoCbte(e.target.value)}
                  className={SELECT_CLS}
                >
                  {TIPOS_CBTE.map((t) => (
                    <option key={t} value={t}>{t}</option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ptoVenta">Punto de venta *</Label>
                <Input
                  id="ptoVenta"
                  value={ptoVenta}
                  onChange={(e) => setPtoVenta(e.target.value)}
                  placeholder="0001"
                  maxLength={4}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="nroComprobante">Número *</Label>
                <Input
                  id="nroComprobante"
                  value={nroComprobante}
                  onChange={(e) => setNroComprobante(e.target.value)}
                  placeholder="00000001"
                  maxLength={8}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="fechaComprobante">Fecha *</Label>
                <Input
                  id="fechaComprobante"
                  type="date"
                  value={fechaComprobante}
                  onChange={(e) => setFechaComprobante(e.target.value)}
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* ── Ítems ────────────────────────────────────────────────────────── */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Ítems de la factura</CardTitle>
            <Button type="button" variant="outline" size="sm" onClick={agregarItem}>
              <Plus className="h-4 w-4 mr-1" /> Agregar ítem
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {items.map((item, idx) => (
              <div key={item.id} className="grid grid-cols-12 gap-2 items-end border rounded-md p-3">
                <div className="col-span-4 space-y-1">
                  <Label className="text-xs">Descripción *</Label>
                  <Input
                    value={item.descripcion}
                    onChange={(e) => actualizarItem(item.id, "descripcion", e.target.value)}
                    placeholder="Ej: Gasoil"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Cantidad</Label>
                  <Input
                    type="number"
                    min="0.001"
                    step="0.001"
                    value={item.cantidad}
                    onChange={(e) => actualizarItem(item.id, "cantidad", e.target.value)}
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  <Label className="text-xs">Precio Unit.</Label>
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.precioUnitario}
                    onChange={(e) => actualizarItem(item.id, "precioUnitario", e.target.value)}
                    placeholder="0.00"
                  />
                </div>
                {discriminaIVA && (
                  <div className="col-span-2 space-y-1">
                    <Label className="text-xs">Alíc. IVA</Label>
                    <select
                      value={item.alicuotaIva}
                      onChange={(e) => actualizarItem(item.id, "alicuotaIva", e.target.value as AlicuotaValue)}
                      className={SELECT_CLS}
                    >
                      <option value="0">0%</option>
                      <option value="10.5">10.5%</option>
                      <option value="21">21%</option>
                      <option value="27">27%</option>
                    </select>
                  </div>
                )}
                <div className="col-span-1 space-y-1">
                  <Label className="text-xs">Total</Label>
                  <p className="text-sm font-medium pt-2">
                    {formatearMoneda(itemsCalculados[idx]?.total ?? 0)}
                  </p>
                </div>
                <div className="col-span-1">
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => eliminarItem(item.id)}
                    disabled={items.length === 1}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {/* Totales */}
            <div className="flex justify-end">
              <div className="text-sm space-y-1 text-right min-w-[200px]">
                <div className="flex justify-between gap-8">
                  <span className="text-muted-foreground">Neto:</span>
                  <span>{formatearMoneda(totalNeto)}</span>
                </div>
                {discriminaIVA && (
                  <div className="flex justify-between gap-8">
                    <span className="text-muted-foreground">IVA:</span>
                    <span>{formatearMoneda(totalIva)}</span>
                  </div>
                )}
                <div className="flex justify-between gap-8 font-semibold border-t pt-1">
                  <span>Total:</span>
                  <span>{formatearMoneda(total)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/30 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <div className="flex justify-end">
          <Button type="submit" disabled={!puedeGuardar || loading}>
            {loading ? "Guardando..." : "Registrar Gasto"}
          </Button>
        </div>
      </form>
    </div>
  )
}
