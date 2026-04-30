"use client"

/**
 * ABM Empleados JM. Clon adaptado de empleados-abm.tsx.
 * Sin `usuarioId` (auth vive en Transmagg).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { formatearCuit, formatearFecha } from "@/lib/utils"
import { Plus, Pencil, Search } from "lucide-react"
import { hoyLocalYmd } from "@/lib/date-local"

export interface EmpleadoJmAbm {
  id: string
  nombre: string
  apellido: string
  cuit: string
  cargo: string | null
  email: string | null
  fechaIngreso: string
  activo: boolean
}

interface EmpleadosAbmJmProps {
  empleados: EmpleadoJmAbm[]
}

function EmpleadoFormModal({ empleado, onSuccess }: { empleado?: EmpleadoJmAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!empleado
  const [form, setForm] = useState({
    nombre: empleado?.nombre ?? "",
    apellido: empleado?.apellido ?? "",
    cuit: empleado?.cuit ?? "",
    cargo: empleado?.cargo ?? "",
    email: empleado?.email ?? "",
    fechaIngreso: empleado?.fechaIngreso ? hoyLocalYmd(new Date(empleado.fechaIngreso)) : hoyLocalYmd(),
    activo: empleado?.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const url = isEdit ? `/api/jm/empleados/${empleado.id}` : "/api/jm/empleados"
      const method = isEdit ? "PATCH" : "POST"
      const body = {
        ...form,
        cargo: form.cargo || null,
        email: form.email.trim() || null,
      }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        onSuccess(); router.refresh()
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required /></div>
        <div><Label>Apellido</Label><Input value={form.apellido} onChange={(e) => setForm(f => ({ ...f, apellido: e.target.value }))} required /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>CUIT / CUIL</Label><Input value={form.cuit} onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value.replace(/\D/g, "") }))} maxLength={11} required disabled={isEdit} /></div>
        <div>
          <Label>Cargo</Label>
          <select
            value={form.cargo}
            onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))}
            className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">—</option>
            <option value="CHOFER">Chofer</option>
            <option value="ADMINISTRATIVO">Administrativo</option>
            <option value="MECANICO">Mecánico</option>
            <option value="OTRO">Otro</option>
          </select>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Email</Label><Input type="email" value={form.email} onChange={(e) => setForm(f => ({ ...f, email: e.target.value }))} /></div>
        <div><Label>Fecha de ingreso</Label><Input type="date" value={form.fechaIngreso} onChange={(e) => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} required /></div>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empleado"}</Button>
      </div>
    </form>
  )
}

export function EmpleadosAbmJm({ empleados: empleadosIniciales }: EmpleadosAbmJmProps) {
  const [empleados, setEmpleados] = useState(empleadosIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [empleadoEdicion, setEmpleadoEdicion] = useState<EmpleadoJmAbm | null>(null)

  const filtrados = empleados.filter((e) => {
    if (!busqueda) return true
    const q = busqueda.toLowerCase()
    return (
      e.nombre.toLowerCase().includes(q) ||
      e.apellido.toLowerCase().includes(q) ||
      e.cuit.includes(q)
    )
  })

  function onSuccess() {
    setModalAlta(false)
    setEmpleadoEdicion(null)
    fetch("/api/jm/empleados").then(r => r.json()).then(d => setEmpleados(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar empleado..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button onClick={() => setModalAlta(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo empleado</Button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">CUIT</th>
              <th className="text-left px-4 py-3">Cargo</th>
              <th className="text-left px-4 py-3">Ingreso</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((e) => (
              <tr key={e.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{e.apellido}, {e.nombre}</td>
                <td className="px-4 py-3">{formatearCuit(e.cuit)}</td>
                <td className="px-4 py-3">{e.cargo ?? "-"}</td>
                <td className="px-4 py-3">{formatearFecha(e.fechaIngreso)}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${e.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {e.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setEmpleadoEdicion(e)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin empleados{busqueda ? " que coincidan" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo empleado</DialogTitle></DialogHeader>
          <EmpleadoFormModal onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!empleadoEdicion} onOpenChange={() => setEmpleadoEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar empleado</DialogTitle></DialogHeader>
          {empleadoEdicion && <EmpleadoFormModal empleado={empleadoEdicion} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
