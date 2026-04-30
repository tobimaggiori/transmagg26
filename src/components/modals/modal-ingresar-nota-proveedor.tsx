"use client"

/**
 * Modal para ingresar una NC/ND recibida de un proveedor sobre una factura.
 *
 * El tipoCbte de la nota se fuerza al de la factura original (misma clase A/B/C).
 * El operador ingresa: nro, fecha, neto, %IVA, percepciones (opcionales) y descripción.
 */

import { useState, useMemo } from "react"
import { formatearMoneda } from "@/lib/utils"
import { calcularNetoMasIva } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"

const ALICUOTAS_IVA = [
  { value: 0, label: "0%" },
  { value: 10.5, label: "10.5%" },
  { value: 21, label: "21%" },
  { value: 27, label: "27%" },
]

export function ModalIngresarNotaProveedor({
  facturaProveedorId,
  proveedorRazonSocial,
  tipoNota,
  tipoCbteFactura,
  onClose,
  onSuccess,
}: {
  facturaProveedorId: string
  proveedorRazonSocial: string
  tipoNota: "NC" | "ND"
  tipoCbteFactura: string
  onClose: () => void
  onSuccess: () => void
}) {
  const [nro, setNro] = useState("")
  const [fecha, setFecha] = useState("")
  const [montoNeto, setMontoNeto] = useState("")
  const [ivaPct, setIvaPct] = useState(21)
  const [percepcionIIBB, setPercepcionIIBB] = useState("")
  const [percepcionIVA, setPercepcionIVA] = useState("")
  const [percepcionGanancias, setPercepcionGanancias] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const preview = useMemo(() => {
    const neto = parseFloat(montoNeto) || 0
    if (neto <= 0) return null
    const r = calcularNetoMasIva(neto, ivaPct)
    const extras =
      (parseFloat(percepcionIIBB) || 0) +
      (parseFloat(percepcionIVA) || 0) +
      (parseFloat(percepcionGanancias) || 0)
    return { ...r, totalFinal: r.total + extras }
  }, [montoNeto, ivaPct, percepcionIIBB, percepcionIVA, percepcionGanancias])

  const labelTipo = tipoNota === "NC" ? "Nota de Crédito" : "Nota de Débito"
  const tipoFull = tipoNota === "NC" ? "NC_RECIBIDA" : "ND_RECIBIDA"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    const neto = parseFloat(montoNeto)
    if (!neto || neto <= 0) { setError("El monto neto debe ser mayor a 0"); return }
    if (!nro.trim()) { setError("Ingresá el nro de comprobante"); return }
    if (!fecha) { setError("Ingresá la fecha del comprobante"); return }
    if (!descripcion.trim()) { setError("Ingresá una descripción"); return }

    setEnviando(true)
    try {
      const body = {
        tipo: tipoFull,
        subtipo: "PROVEEDOR",
        facturaProveedorId,
        nroComprobanteExterno: nro.trim(),
        fechaComprobanteExterno: fecha,
        montoNeto: neto,
        ivaPct,
        descripcion: descripcion.trim(),
        percepcionIIBB: parseFloat(percepcionIIBB) || undefined,
        percepcionIVA: parseFloat(percepcionIVA) || undefined,
        percepcionGanancias: parseFloat(percepcionGanancias) || undefined,
      }
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError((data as { error?: string }).error ?? "Error al registrar")
        return
      }
      onSuccess()
    } catch {
      setError("Error de conexión.")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Ingresar {labelTipo}</h2>
            <p className="text-sm text-muted-foreground">
              Proveedor: {proveedorRazonSocial} · Factura tipo {tipoCbteFactura}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="nro">Nro comprobante *</Label>
              <Input id="nro" value={nro} onChange={(e) => setNro(e.target.value)} placeholder="0001-00000123" required disabled={enviando} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="fecha">Fecha *</Label>
              <Input id="fecha" type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required disabled={enviando} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="montoNeto">Neto *</Label>
              <Input id="montoNeto" type="number" step="0.01" min="0" value={montoNeto} onChange={(e) => setMontoNeto(e.target.value)} required disabled={enviando} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="ivaPct">IVA</Label>
              <Select id="ivaPct" value={String(ivaPct)} onChange={(e) => setIvaPct(parseFloat(e.target.value))} disabled={enviando}>
                {ALICUOTAS_IVA.map((a) => <option key={a.value} value={a.value}>{a.label}</option>)}
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-1">
              <Label htmlFor="percepcionIIBB">Perc. IIBB</Label>
              <Input id="percepcionIIBB" type="number" step="0.01" min="0" value={percepcionIIBB} onChange={(e) => setPercepcionIIBB(e.target.value)} disabled={enviando} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="percepcionIVA">Perc. IVA</Label>
              <Input id="percepcionIVA" type="number" step="0.01" min="0" value={percepcionIVA} onChange={(e) => setPercepcionIVA(e.target.value)} disabled={enviando} />
            </div>
            <div className="space-y-1">
              <Label htmlFor="percepcionGanancias">Perc. Gcias</Label>
              <Input id="percepcionGanancias" type="number" step="0.01" min="0" value={percepcionGanancias} onChange={(e) => setPercepcionGanancias(e.target.value)} disabled={enviando} />
            </div>
          </div>

          <div className="space-y-1">
            <Label htmlFor="descripcion">Descripción *</Label>
            <Input id="descripcion" value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required disabled={enviando} />
          </div>

          {preview && (
            <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
              <span className="text-muted-foreground">Neto</span>
              <span className="text-right font-medium">{formatearMoneda(preview.neto)}</span>
              <span className="text-muted-foreground">IVA</span>
              <span className="text-right">{formatearMoneda(preview.iva)}</span>
              <span className="text-muted-foreground">Subtotal</span>
              <span className="text-right">{formatearMoneda(preview.total)}</span>
              <span className="text-muted-foreground font-semibold">Total (con percepciones)</span>
              <span className="text-right font-semibold">{formatearMoneda(preview.totalFinal)}</span>
            </div>
          )}

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button type="button" variant="outline" onClick={onClose} disabled={enviando}>Cancelar</Button>
            <Button type="submit" disabled={enviando}>{enviando ? "Guardando..." : `Registrar ${tipoNota}`}</Button>
          </div>
        </form>
      </div>
    </div>
  )
}
