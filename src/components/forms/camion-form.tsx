"use client"

/**
 * Formulario para crear un camión.
 * Para admins: permite seleccionar el fletero.
 * Para fleteros: el fleteroId viene fijo por prop.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"

interface CamionFormProps {
  /** Cuando se usa desde el panel de un FLETERO, el fleteroId es fijo */
  fleteroIdFijo?: string
  fleteros?: Array<{ id: string; razonSocial: string }>
  onSuccess?: () => void
}

/**
 * CamionForm: CamionFormProps -> JSX.Element
 *
 * Dado fleteroIdFijo opcional, el listado de fleteros y onSuccess,
 * renderiza un formulario para crear un camión. Si fleteroIdFijo está presente,
 * el campo de fletero queda bloqueado (uso para rol FLETERO).
 * Envía POST /api/camiones y llama onSuccess al completarse exitosamente.
 * Existe para registrar vehículos en el sistema con validación de patente única.
 *
 * Ejemplos:
 * <CamionForm fleteros={[{ id: "f1", razonSocial: "JP SRL" }]} onSuccess={() => setOpen(false)} />
 * // => formulario con selector de fletero libre
 * <CamionForm fleteroIdFijo="f1" onSuccess={() => setOpen(false)} />
 * // => formulario con fletero fijo "f1" (rol FLETERO)
 * // => patente duplicada → muestra error "La patente chasis ya está registrada"
 */
export function CamionForm({ fleteroIdFijo, fleteros = [], onSuccess }: CamionFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    fleteroId: fleteroIdFijo ?? fleteros[0]?.id ?? "",
    patenteChasis: "",
    patenteAcoplado: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    const val = e.target.name === "patenteChasis" || e.target.name === "patenteAcoplado"
      ? e.target.value.toUpperCase()
      : e.target.value
    setForm((prev) => ({ ...prev, [e.target.name]: val }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const body = {
        fleteroId: form.fleteroId,
        patenteChasis: form.patenteChasis,
        ...(form.patenteAcoplado ? { patenteAcoplado: form.patenteAcoplado } : {}),
      }

      const res = await fetch("/api/camiones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al crear el camión")
        return
      }

      router.refresh()
      onSuccess?.()
    } catch {
      setError("Error de conexión. Intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!fleteroIdFijo && fleteros.length > 0 && (
        <div className="space-y-1.5">
          <Label htmlFor="fleteroId">Fletero *</Label>
          <Select id="fleteroId" name="fleteroId" value={form.fleteroId} onChange={handleChange} disabled={loading} required>
            {fleteros.map((f) => (
              <option key={f.id} value={f.id}>{f.razonSocial}</option>
            ))}
          </Select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="patenteChasis">Patente chasis *</Label>
          <Input
            id="patenteChasis"
            name="patenteChasis"
            value={form.patenteChasis}
            onChange={handleChange}
            required
            disabled={loading}
            maxLength={8}
            placeholder="AB123CD"
            className="uppercase"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="patenteAcoplado">Patente acoplado</Label>
          <Input
            id="patenteAcoplado"
            name="patenteAcoplado"
            value={form.patenteAcoplado}
            onChange={handleChange}
            disabled={loading}
            maxLength={8}
            placeholder="XY456ZW"
            className="uppercase"
          />
        </div>
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear camión"}
        </Button>
      </div>
    </form>
  )
}
