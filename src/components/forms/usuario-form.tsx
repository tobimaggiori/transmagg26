"use client"

/**
 * Formulario para crear un nuevo usuario del sistema.
 * Solo accesible para ADMIN_TRANSMAGG.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Roles } from "@/types"

const LABELS_ROL: Record<string, string> = {
  ADMIN_TRANSMAGG: "Admin Transmagg",
  OPERADOR_TRANSMAGG: "Operador Transmagg",
  FLETERO: "Fletero",
  CHOFER: "Chofer",
  ADMIN_EMPRESA: "Admin Empresa",
  OPERADOR_EMPRESA: "Operador Empresa",
}

interface UsuarioFormProps {
  empresas: Array<{ id: string; razonSocial: string }>
  onSuccess?: () => void
}

/**
 * UsuarioForm: UsuarioFormProps -> JSX.Element
 *
 * Dado el listado de empresas y el callback onSuccess,
 * renderiza un formulario para crear un nuevo usuario del sistema con cualquier rol.
 * Muestra el selector de empresa solo cuando el rol elegido es ADMIN_EMPRESA u OPERADOR_EMPRESA.
 * Envía POST /api/usuarios y llama onSuccess al completarse exitosamente.
 * Existe para que el ADMIN_TRANSMAGG dé de alta usuarios de todos los roles desde el panel de admin.
 *
 * Ejemplos:
 * <UsuarioForm empresas={[{ id: "e1", razonSocial: "ADS SA" }]} onSuccess={() => setOpen(false)} />
 * // => formulario con selector de rol; al elegir ADMIN_EMPRESA aparece selector de empresa
 * <UsuarioForm empresas={[]} onSuccess={() => setOpen(false)} />
 * // => formulario sin empresas disponibles (campo empresa oculto para roles empresa)
 * // => email duplicado → muestra error "El email ya está registrado"
 */
export function UsuarioForm({ empresas, onSuccess }: UsuarioFormProps) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    rol: "OPERADOR_TRANSMAGG",
    empresaId: empresas[0]?.id ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const necesitaEmpresa = form.rol === "ADMIN_EMPRESA" || form.rol === "OPERADOR_EMPRESA"

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)

    try {
      const payload = {
        ...form,
        telefono: form.telefono || undefined,
        empresaId: necesitaEmpresa ? form.empresaId : undefined,
      }

      const res = await fetch("/api/usuarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Error al crear el usuario")
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
        <Label htmlFor="rol">Rol *</Label>
        <Select id="rol" name="rol" value={form.rol} onChange={handleChange} disabled={loading}>
          {Object.keys(Roles).map((rol) => (
            <option key={rol} value={rol}>{LABELS_ROL[rol] ?? rol}</option>
          ))}
        </Select>
      </div>

      {necesitaEmpresa && (
        <div className="space-y-1.5">
          <Label htmlFor="empresaId">Empresa *</Label>
          <Select id="empresaId" name="empresaId" value={form.empresaId} onChange={handleChange} disabled={loading} required>
            <option value="">Seleccionar empresa...</option>
            {empresas.map((e) => (
              <option key={e.id} value={e.id}>{e.razonSocial}</option>
            ))}
          </Select>
        </div>
      )}

      <FormError message={error} />

      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>
          Cancelar
        </Button>
        <Button type="submit" disabled={loading}>
          {loading ? "Creando..." : "Crear usuario"}
        </Button>
      </div>
    </form>
  )
}
