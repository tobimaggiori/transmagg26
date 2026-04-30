"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FormError } from "@/components/ui/form-error"
import { hoyLocalYmd } from "@/lib/date-local"
import { formatearMoneda } from "@/lib/utils"

type Cuenta = { id: string; nombre: string }
type Tarjeta = { id: string; nombre: string }

interface Props { cuentas: Cuenta[]; tarjetas: Tarjeta[] }

const TIPOS_IMPUESTO = ["IVA", "IIBB", "GANANCIAS", "MONOTRIBUTO", "AUTONOMO", "DEBCRED", "MUNICIPAL", "PROVINCIAL", "OTRO"]

export function NuevoPagoImpuestoJmClient({ cuentas, tarjetas }: Props) {
  const router = useRouter()
  const [tipoImpuesto, setTipoImpuesto] = useState("IVA")
  const [descripcion, setDescripcion] = useState("")
  const [periodo, setPeriodo] = useState(hoyLocalYmd().slice(0, 7))
  const [monto, setMonto] = useState("")
  const [fechaPago, setFechaPago] = useState(hoyLocalYmd())
  const [medioPago, setMedioPago] = useState<"TRANSFERENCIA" | "EFECTIVO" | "TARJETA">("TRANSFERENCIA")
  const [cuentaId, setCuentaId] = useState("")
  const [tarjetaId, setTarjetaId] = useState("")
  const [observaciones, setObservaciones] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const montoNum = Number(monto) || 0
  const puedeGuardar = tipoImpuesto && periodo && montoNum > 0 && fechaPago &&
    (medioPago !== "TRANSFERENCIA" || cuentaId) && (medioPago !== "TARJETA" || tarjetaId)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null); setSuccess(null)
    try {
      const res = await fetch("/api/jm/pagos-impuesto", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipoImpuesto,
          descripcion: descripcion.trim() || undefined,
          periodo,
          monto: montoNum,
          fechaPago,
          medioPago,
          cuentaId: medioPago === "TRANSFERENCIA" ? cuentaId : undefined,
          tarjetaId: medioPago === "TARJETA" ? tarjetaId : undefined,
          observaciones: observaciones.trim() || undefined,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al guardar")
        return
      }
      setSuccess(`Pago de ${formatearMoneda(montoNum)} registrado`)
      setMonto(""); setDescripcion(""); setObservaciones("")
      router.refresh()
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Registrar pago de impuesto</h1>

      <form onSubmit={handleSubmit}>
        <Card>
          <CardHeader><CardTitle className="text-base">Datos del pago</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <Label>Tipo</Label>
                <Select value={tipoImpuesto} onChange={(e) => setTipoImpuesto(e.target.value)}>
                  {TIPOS_IMPUESTO.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <div><Label>Período (YYYY-MM)</Label><Input value={periodo} onChange={(e) => setPeriodo(e.target.value)} placeholder="2026-04" required /></div>
              <div><Label>Monto</Label><Input type="number" step="0.01" value={monto} onChange={(e) => setMonto(e.target.value)} required /></div>
            </div>

            <div>
              <Label>Descripción</Label>
              <Input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div><Label>Fecha pago</Label><Input type="date" value={fechaPago} onChange={(e) => setFechaPago(e.target.value)} required /></div>
              <div>
                <Label>Medio</Label>
                <Select value={medioPago} onChange={(e) => setMedioPago(e.target.value as typeof medioPago)}>
                  <option value="TRANSFERENCIA">Transferencia</option>
                  <option value="EFECTIVO">Efectivo</option>
                  <option value="TARJETA">Tarjeta</option>
                </Select>
              </div>
              {medioPago === "TRANSFERENCIA" && (
                <div>
                  <Label>Cuenta</Label>
                  <Select value={cuentaId} onChange={(e) => setCuentaId(e.target.value)} required>
                    <option value="">— Elegir —</option>
                    {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
                  </Select>
                </div>
              )}
              {medioPago === "TARJETA" && (
                <div>
                  <Label>Tarjeta</Label>
                  <Select value={tarjetaId} onChange={(e) => setTarjetaId(e.target.value)} required>
                    <option value="">— Elegir —</option>
                    {tarjetas.map(t => <option key={t.id} value={t.id}>{t.nombre}</option>)}
                  </Select>
                </div>
              )}
            </div>

            <div>
              <Label>Observaciones</Label>
              <Input value={observaciones} onChange={(e) => setObservaciones(e.target.value)} />
            </div>

            {error && <FormError message={error} />}
            {success && <p className="text-sm text-green-700 bg-green-50 border border-green-200 rounded px-3 py-2">{success}</p>}

            <div className="flex justify-end">
              <Button type="submit" disabled={!puedeGuardar || loading}>{loading ? "Guardando..." : "Registrar pago"}</Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  )
}
