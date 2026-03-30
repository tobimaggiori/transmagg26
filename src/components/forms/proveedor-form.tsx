"use client"

/**
 * Formulario para crear o editar un proveedor.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { CondicionIva } from "@/types"

interface ProveedorFormProps {
  proveedor?: {
    id: string
    razonSocial: string
    cuit: string
    condicionIva: string
    rubro?: string | null
  }
  onSuccess?: () => void
}

/**
 * ProveedorForm: ProveedorFormProps -> JSX.Element
 *
 * Dado opcionalmente un proveedor existente y el callback onSuccess,
 * renderiza un formulario para crear o editar un proveedor.
 * Envía POST /api/proveedores (crear) o PATCH /api/proveedores/[id] (editar)
 * y llama onSuccess al completarse exitosamente.
 * Existe para el alta y modificación de proveedores externos desde el panel interno.
 *
 * Ejemplos:
 * <ProveedorForm onSuccess={() => setOpen(false)} />
 * // => formulario vacío para nuevo proveedor
 * <ProveedorForm proveedor={{ id: "p1", razonSocial: "YPF SA", cuit: "30546524278", condicionIva: "RI", rubro: "Combustible" }} onSuccess={() => setOpen(false)} />
 * // => formulario pre-cargado para editar proveedor existente
 * // => CUIT duplicado → muestra error "El CUIT ya está registrado"
 */
export function ProveedorForm({ proveedor, onSuccess }: ProveedorFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: proveedor?.razonSocial ?? "",
    cuit: proveedor?.cuit ?? "",
    condicionIva: proveedor?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    rubro: proveedor?.rubro ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!proveedor

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const url = isEdit ? `/api/proveedores/${proveedor.id}` : "/api/proveedores"
      const method = isEdit ? "PATCH" : "POST"

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          rubro: form.rubro || undefined,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al guardar el proveedor")
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
        <Label htmlFor="rubro">Rubro</Label>
        <Input id="rubro" name="rubro" value={form.rubro} onChange={handleChange} disabled={loading} placeholder="Ej: Combustible, Repuestos..." />
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}
        </Button>
      </div>
    </form>
  )
}
