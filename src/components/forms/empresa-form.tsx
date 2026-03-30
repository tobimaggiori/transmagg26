"use client"

/**
 * Formulario para crear o editar una empresa cliente.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { CondicionIva } from "@/types"

interface EmpresaFormProps {
  empresa?: {
    id: string
    razonSocial: string
    cuit: string
    condicionIva: string
    direccion?: string | null
  }
  onSuccess?: () => void
}

/**
 * EmpresaForm: EmpresaFormProps -> JSX.Element
 *
 * Dado opcionalmente un empresa existente y el callback onSuccess,
 * renderiza un formulario para crear o editar una empresa cliente.
 * Envía POST /api/empresas (crear) o PATCH /api/empresas/[id] (editar)
 * y llama onSuccess al completarse exitosamente.
 * Existe para el alta y modificación de empresas clientes desde el panel interno.
 *
 * Ejemplos:
 * <EmpresaForm onSuccess={() => setOpen(false)} />
 * // => formulario vacío para nueva empresa
 * <EmpresaForm empresa={{ id: "e1", razonSocial: "ADS SA", cuit: "30714295698", condicionIva: "RI" }} onSuccess={() => setOpen(false)} />
 * // => formulario pre-cargado para editar empresa existente
 * // => CUIT duplicado → muestra error "El CUIT ya está registrado"
 */
export function EmpresaForm({ empresa, onSuccess }: EmpresaFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: empresa?.razonSocial ?? "",
    cuit: empresa?.cuit ?? "",
    condicionIva: empresa?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    direccion: empresa?.direccion ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!empresa

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/empresas/${empresa.id}` : "/api/empresas"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al guardar la empresa")
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
      <div className="space-y-1.5">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input id="razonSocial" name="razonSocial" value={form.razonSocial} onChange={handleChange} required disabled={loading} />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
          <Input
            id="cuit"
            name="cuit"
            value={form.cuit}
            onChange={handleChange}
            required
            disabled={loading || isEdit}
            maxLength={11}
            pattern="\d{11}"
            placeholder="30123456789"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="condicionIva">Condición IVA *</Label>
          <Select id="condicionIva" name="condicionIva" value={form.condicionIva} onChange={handleChange} disabled={loading}>
            {Object.entries(CondicionIva).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </Select>
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" value={form.direccion} onChange={handleChange} disabled={loading} />
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empresa"}
        </Button>
      </div>
    </form>
  )
}
