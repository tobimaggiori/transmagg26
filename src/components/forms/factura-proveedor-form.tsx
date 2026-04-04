"use client"

/**
 * Formulario para ingresar una factura de proveedor.
 * Al guardar genera automáticamente el asiento IVA COMPRAS correspondiente.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { TipoCbte } from "@/types"
import { parsearImporte, calcularNetoMasIva, formatearMoneda } from "@/lib/money"

interface FacturaProveedorFormProps {
  proveedorId: string
  onSuccess: () => void
}

/**
 * FacturaProveedorForm: FacturaProveedorFormProps -> JSX.Element
 *
 * Dado el id del proveedor, renderiza un formulario para ingresar una factura.
 * Calcula automáticamente el IVA a partir del neto y la alícuota seleccionada.
 * Al enviar, POST a /api/proveedores/[id]/facturas que genera el asiento IVA COMPRAS.
 * Existe para registrar comprobantes de proveedores y actualizar el libro IVA
 * sin necesidad de asientos manuales.
 *
 * Ejemplos:
 * <FacturaProveedorForm proveedorId="p1" onSuccess={() => {}} />
 * // => form con campos nroComprobante, tipoCbte, fechaCbte, neto, alicuota
 * // => al enviar: POST /api/proveedores/p1/facturas + asiento IVA COMPRAS
 */
export function FacturaProveedorForm({ proveedorId, onSuccess }: FacturaProveedorFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    nroComprobante: "",
    tipoCbte: "A",
    fechaCbte: "",
    neto: "",
    alicuotaIva: "21",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const netoInput = parsearImporte(form.neto)
  const alicuota = parsearImporte(form.alicuotaIva)
  const { neto, iva: ivaMonto, total } = calcularNetoMasIva(netoInput, alicuota)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(`/api/proveedores/${proveedorId}/facturas`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nroComprobante: form.nroComprobante,
          tipoCbte: form.tipoCbte,
          fechaCbte: form.fechaCbte,
          neto,
          alicuotaIva: alicuota,
          total,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return }
      router.refresh()
      onSuccess()
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="nroComprobante">N° Comprobante *</Label>
          <Input
            id="nroComprobante"
            name="nroComprobante"
            value={form.nroComprobante}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="0001-00000001"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="tipoCbte">Tipo *</Label>
          <Select id="tipoCbte" name="tipoCbte" value={form.tipoCbte} onChange={handleChange} disabled={loading}>
            {Object.keys(TipoCbte).map((k) => <option key={k} value={k}>{k}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="fechaCbte">Fecha del comprobante *</Label>
        <Input
          id="fechaCbte"
          name="fechaCbte"
          type="date"
          value={form.fechaCbte}
          onChange={handleChange}
          required
          disabled={loading}
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="neto">Neto ($) *</Label>
          <Input
            id="neto"
            name="neto"
            type="number"
            min="0.01"
            step="0.01"
            value={form.neto}
            onChange={handleChange}
            required
            disabled={loading}
            placeholder="10000.00"
          />
        </div>
        <div className="space-y-1">
          <Label htmlFor="alicuotaIva">Alícuota IVA (%) *</Label>
          <Select id="alicuotaIva" name="alicuotaIva" value={form.alicuotaIva} onChange={handleChange} disabled={loading}>
            <option value="0">0% (Exento)</option>
            <option value="10.5">10.5%</option>
            <option value="21">21%</option>
            <option value="27">27%</option>
          </Select>
        </div>
      </div>
      {neto > 0 && (
        <div className="rounded-md bg-muted p-3 text-sm space-y-1">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Neto:</span>
            <span className="font-medium">{formatearMoneda(neto)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">IVA ({alicuota}%):</span>
            <span className="font-medium">{formatearMoneda(ivaMonto)}</span>
          </div>
          <div className="flex justify-between font-semibold border-t pt-1">
            <span>Total:</span>
            <span>{formatearMoneda(total)}</span>
          </div>
        </div>
      )}
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading || !form.neto || !form.fechaCbte}>
          {loading ? "Guardando..." : "Registrar factura"}
        </Button>
      </div>
    </form>
  )
}
