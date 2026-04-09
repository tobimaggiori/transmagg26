"use client"

/**
 * Propósito: Formulario para registrar un adelanto a un fletero.
 * Campos: fletero, tipo, monto, fecha, descripción (opcional).
 */

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatearMoneda } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import { hoyLocalYmd } from "@/lib/date-local"

interface Fletero {
  id: string
  razonSocial: string
}

const TIPOS = [
  { value: "EFECTIVO", label: "Efectivo" },
  { value: "TRANSFERENCIA", label: "Transferencia" },
  { value: "COMBUSTIBLE", label: "Combustible (Gas-Oil)" },
  { value: "CHEQUE_PROPIO", label: "Cheque propio" },
  { value: "CHEQUE_TERCERO", label: "Cheque de tercero" },
] as const

export function IngresarAdelantoClient({ fleteros }: { fleteros: Fletero[] }) {
  const [fleteroId, setFleteroId] = useState("")
  const [tipo, setTipo] = useState("EFECTIVO")
  const [monto, setMonto] = useState("")
  const [fecha, setFecha] = useState(hoyLocalYmd())
  const [descripcion, setDescripcion] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ monto: number; fletero: string } | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!fleteroId) { setError("Seleccioná un fletero"); return }
    const montoNum = parsearImporte(monto)
    if (montoNum <= 0) { setError("El monto debe ser mayor a 0"); return }

    setError(null)
    setLoading(true)
    try {
      const res = await fetch("/api/adelantos-fleteros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleteroId,
          tipo,
          monto: montoNum,
          fecha: new Date(fecha + "T12:00:00"),
          descripcion: descripcion.trim() || null,
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al registrar el adelanto")
        return
      }
      const fletero = fleteros.find((f) => f.id === fleteroId)
      setExito({ monto: montoNum, fletero: fletero?.razonSocial ?? "" })
      setFleteroId("")
      setTipo("EFECTIVO")
      setMonto("")
      setFecha(hoyLocalYmd())
      setDescripcion("")
    } catch {
      setError("Error de red al registrar el adelanto")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-lg space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Ingresar Adelanto</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Registrá un anticipo entregado a un fletero, a descontar en futuras liquidaciones.
        </p>
      </div>

      {exito && (
        <div className="rounded-md border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          Adelanto de {formatearMoneda(exito.monto)} registrado para {exito.fletero}.
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <Label>Fletero <span className="text-destructive">*</span></Label>
          <Select
            value={fleteroId}
            onChange={(e) => setFleteroId(e.target.value)}
            className="mt-1"
          >
            <option value="">Seleccionar fletero...</option>
            {fleteros.map((f) => (
              <option key={f.id} value={f.id}>{f.razonSocial}</option>
            ))}
          </Select>
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label>Tipo <span className="text-destructive">*</span></Label>
            <Select
              value={tipo}
              onChange={(e) => setTipo(e.target.value)}
              className="mt-1"
            >
              {TIPOS.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
            </Select>
          </div>
          <div>
            <Label>Fecha <span className="text-destructive">*</span></Label>
            <Input
              type="date"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              className="mt-1"
              required
            />
          </div>
        </div>

        <div>
          <Label>Monto <span className="text-destructive">*</span></Label>
          <Input
            type="number"
            min="0.01"
            step="0.01"
            value={monto}
            onChange={(e) => setMonto(e.target.value)}
            placeholder="0,00"
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label>Descripción <span className="text-muted-foreground text-xs">(opcional)</span></Label>
          <Input
            value={descripcion}
            onChange={(e) => setDescripcion(e.target.value)}
            placeholder="Ej: Adelanto para viaje del 05/04"
            className="mt-1"
          />
        </div>

        {error && <p className="text-sm text-destructive">{error}</p>}

        <Button type="submit" disabled={loading} className="w-full">
          {loading ? "Registrando..." : "Registrar adelanto"}
        </Button>
      </form>
    </div>
  )
}
