"use client"

/**
 * Form mínimo de ConfiguracionArca JM. Sin upload de certificado, sin
 * tester ARCA, sin gestión de comprobantes habilitados con UI rica.
 * Suficiente para que JM tenga datos de emisor en PDFs.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"

export interface ConfiguracionArcaJmInicial {
  cuit: string
  razonSocial: string
  modo: string
  puntosVenta: string
  comprobantesHabilitados: string
  cbuMiPymes: string | null
  montoMinimoFce: string | null
  activa: boolean
}

export function ConfiguracionArcaFormJm({ inicial }: { inicial: ConfiguracionArcaJmInicial }) {
  const router = useRouter()
  const [form, setForm] = useState({
    cuit: inicial.cuit ?? "",
    razonSocial: inicial.razonSocial ?? "",
    modo: inicial.modo ?? "homologacion",
    puntosVenta: inicial.puntosVenta || "{}",
    comprobantesHabilitados: inicial.comprobantesHabilitados || "[]",
    cbuMiPymes: inicial.cbuMiPymes ?? "",
    montoMinimoFce: inicial.montoMinimoFce ?? "",
    activa: inicial.activa,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(false)
    try {
      const body: Record<string, unknown> = {
        cuit: form.cuit,
        razonSocial: form.razonSocial,
        modo: form.modo,
        puntosVenta: form.puntosVenta || "{}",
        comprobantesHabilitados: form.comprobantesHabilitados || "[]",
        cbuMiPymes: form.cbuMiPymes.trim() || null,
        montoMinimoFce: form.montoMinimoFce.trim() ? Number(form.montoMinimoFce) : null,
        activa: form.activa,
      }
      // Validar JSON sintáctico antes de enviar
      try { JSON.parse(form.puntosVenta || "{}") } catch { setError("Puntos de venta debe ser JSON válido"); setLoading(false); return }
      try { JSON.parse(form.comprobantesHabilitados || "[]") } catch { setError("Comprobantes habilitados debe ser JSON válido"); setLoading(false); return }
      const res = await fetch("/api/jm/configuracion-arca", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        setSuccess(true)
        router.refresh()
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-2xl">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value.replace(/\D/g, "") }))} maxLength={11} /></div>
        <div><Label>Razón social</Label><Input value={form.razonSocial} onChange={(e) => setForm(f => ({ ...f, razonSocial: e.target.value }))} /></div>
      </div>
      <div>
        <Label>Modo</Label>
        <Select value={form.modo} onChange={(e) => setForm(f => ({ ...f, modo: e.target.value }))}>
          <option value="homologacion">Homologación</option>
          <option value="produccion">Producción</option>
        </Select>
      </div>
      <div>
        <Label>Puntos de venta (JSON)</Label>
        <textarea
          value={form.puntosVenta}
          onChange={(e) => setForm(f => ({ ...f, puntosVenta: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          placeholder='{"1": "Casa central", "2": "Sucursal"}'
        />
      </div>
      <div>
        <Label>Comprobantes habilitados (JSON array)</Label>
        <textarea
          value={form.comprobantesHabilitados}
          onChange={(e) => setForm(f => ({ ...f, comprobantesHabilitados: e.target.value }))}
          rows={3}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm font-mono"
          placeholder='[1, 6, 201]'
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CBU MiPymes</Label><Input value={form.cbuMiPymes} onChange={(e) => setForm(f => ({ ...f, cbuMiPymes: e.target.value.replace(/\D/g, "") }))} maxLength={22} /></div>
        <div><Label>Monto mínimo FCE</Label><Input type="number" step="0.01" value={form.montoMinimoFce} onChange={(e) => setForm(f => ({ ...f, montoMinimoFce: e.target.value }))} /></div>
      </div>
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input type="checkbox" checked={form.activa} onChange={(e) => setForm(f => ({ ...f, activa: e.target.checked }))} />
        ARCA activa (al desactivar, no se autorizan comprobantes contra ARCA)
      </label>
      {error && <FormError message={error} />}
      {success && <p className="text-sm text-green-600">Configuración guardada.</p>}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Guardar"}</Button>
      </div>
    </form>
  )
}
