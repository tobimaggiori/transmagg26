"use client"

/**
 * Componente ABM para gestión de empleados de Transmagg.
 * Incluye búsqueda, creación y edición.
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
  DialogDescription,
} from "@/components/ui/dialog"
import { formatearCuit, formatearFecha } from "@/lib/utils"
import { Plus, Pencil, Search } from "lucide-react"
import { hoyLocalYmd } from "@/lib/date-local"

export interface EmpleadoAbm {
  id: string
  nombre: string
  apellido: string
  cuit: string
  cargo: string | null
  fechaIngreso: string
  activo: boolean
}

interface EmpleadosAbmProps {
  empleados: EmpleadoAbm[]
}

/**
 * calcularFiltroEmpleado: EmpleadoAbm string -> boolean
 *
 * Dado un empleado y un texto de búsqueda, devuelve true si el nombre, apellido o CUIT
 * contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de empleados en el ABM sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroEmpleado({ nombre: "Juan", apellido: "Pérez", cuit: "20123456789" }, "juan") === true
 * calcularFiltroEmpleado({ nombre: "Juan", apellido: "Pérez", cuit: "20123456789" }, "pérez") === true
 * calcularFiltroEmpleado({ nombre: "Juan", apellido: "Pérez", cuit: "20123456789" }, "xyz") === false
 */
export function calcularFiltroEmpleado(empleado: EmpleadoAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return (
    empleado.nombre.toLowerCase().includes(q) ||
    empleado.apellido.toLowerCase().includes(q) ||
    empleado.cuit.includes(q)
  )
}

function EmpleadoFormModal({ empleado, onSuccess }: { empleado?: EmpleadoAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!empleado
  const [form, setForm] = useState({
    nombre: empleado?.nombre ?? "",
    apellido: empleado?.apellido ?? "",
    cuit: empleado?.cuit ?? "",
    cargo: empleado?.cargo ?? "",
    fechaIngreso: empleado?.fechaIngreso ? hoyLocalYmd(new Date(empleado.fechaIngreso)) : hoyLocalYmd(),
    activo: empleado?.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/empleados/${empleado.id}` : "/api/empleados"
      const method = isEdit ? "PATCH" : "POST"
      const body = { ...form, cargo: form.cargo || null }
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        onSuccess()
        router.refresh()
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
        <div><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="11 dígitos sin guiones" /></div>
        <div><Label>Cargo</Label><Input value={form.cargo} onChange={(e) => setForm(f => ({ ...f, cargo: e.target.value }))} /></div>
      </div>
      <div><Label>Fecha de ingreso</Label><Input type="date" value={form.fechaIngreso} onChange={(e) => setForm(f => ({ ...f, fechaIngreso: e.target.value }))} required /></div>
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

/**
 * EmpleadosAbm: EmpleadosAbmProps -> JSX.Element
 *
 * Dado la lista inicial de empleados, renderiza la tabla ABM con búsqueda, alta y edición.
 * Existe para centralizar la gestión de empleados de Transmagg en el ABM del administrador.
 *
 * Ejemplos:
 * <EmpleadosAbm empleados={[]} /> // tabla vacía con botón alta
 * <EmpleadosAbm empleados={empleados} /> // lista filtrable por nombre/CUIT
 * <EmpleadosAbm empleados={empleados} /> // modal al hacer click en Editar
 */
export function EmpleadosAbm({ empleados: empleadosIniciales }: EmpleadosAbmProps) {
  const [empleados, setEmpleados] = useState(empleadosIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [empleadoEdicion, setEmpleadoEdicion] = useState<EmpleadoAbm | null>(null)

  const filtrados = empleados.filter((e) => !busqueda || calcularFiltroEmpleado(e, busqueda))

  function onSuccess() {
    setModalAlta(false)
    setEmpleadoEdicion(null)
    fetch("/api/empleados").then(r => r.json()).then(d => setEmpleados(Array.isArray(d) ? d : []))
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
          <DialogHeader><DialogTitle>Nuevo empleado</DialogTitle><DialogDescription>Dar de alta un empleado de Transmagg</DialogDescription></DialogHeader>
          <EmpleadoFormModal onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!empleadoEdicion} onOpenChange={() => setEmpleadoEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar empleado</DialogTitle><DialogDescription>{empleadoEdicion?.apellido}, {empleadoEdicion?.nombre}</DialogDescription></DialogHeader>
          {empleadoEdicion && <EmpleadoFormModal empleado={empleadoEdicion} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
