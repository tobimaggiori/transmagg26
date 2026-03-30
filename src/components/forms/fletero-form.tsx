"use client"

/**
 * Formulario para crear o editar un fletero.
 * Usado en /fleteros con un modal Dialog.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { CondicionIva } from "@/types"

interface FleteroFormProps {
  onSuccess?: () => void
}

interface FormState {
  nombre: string
  apellido: string
  email: string
  telefono: string
  razonSocial: string
  cuit: string
  condicionIva: string
  comisionDefault: string
}

const INITIAL: FormState = {
  nombre: "",
  apellido: "",
  email: "",
  telefono: "",
  razonSocial: "",
  cuit: "",
  condicionIva: "RESPONSABLE_INSCRIPTO",
  comisionDefault: "10",
}

/**
 * FleteroForm: FleteroFormProps -> JSX.Element
 *
 * Dado el callback onSuccess, renderiza un formulario para crear un nuevo fletero
 * con sus datos personales, fiscales y comisión. Envía POST /api/fleteros y llama
 * onSuccess al completarse exitosamente.
 * Existe para registrar fleteros en el sistema creando simultáneamente el usuario
 * con rol FLETERO y el registro de fletero asociado.
 *
 * Ejemplos:
 * <FleteroForm onSuccess={() => setOpen(false)} />
 * // => formulario con campos nombre, apellido, email, CUIT, comisión, condiciónIVA
 * // => submit exitoso → llama onSuccess y refresca la página
 * <FleteroForm />
 * // => formulario sin callback (onSuccess es opcional)
 * // => CUIT duplicado → muestra error "El CUIT ya está registrado"
 */
export function FleteroForm({ onSuccess }: FleteroFormProps) {
  const router = useRouter()
  const [form, setForm] = useState<FormState>(INITIAL)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/fleteros", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          comisionDefault: parseFloat(form.comisionDefault),
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al crear el fletero")
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
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1.5">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required disabled={loading} />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} required disabled={loading} />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} disabled={loading} />
      </div>

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
            disabled={loading}
            maxLength={11}
            pattern="\d{11}"
            placeholder="20123456789"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="comisionDefault">Comisión % *</Label>
          <Input
            id="comisionDefault"
            name="comisionDefault"
            type="number"
            min="0"
            max="100"
            step="0.01"
            value={form.comisionDefault}
            onChange={handleChange}
            required
            disabled={loading}
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="condicionIva">Condición IVA *</Label>
        <Select id="condicionIva" name="condicionIva" value={form.condicionIva} onChange={handleChange} disabled={loading}>
          {Object.entries(CondicionIva).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </Select>
      </div>

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando..." : "Crear fletero"}
        </Button>
      </div>
    </form>
  )
}
