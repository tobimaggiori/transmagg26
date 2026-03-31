"use client"

/**
 * Componente ABM para gestión de choferes.
 * Incluye búsqueda, creación, edición y desactivación.
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
import { Plus, Pencil, Trash2, Search } from "lucide-react"

export interface ChoferAbm {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  activo: boolean
}

interface ChoforesAbmProps {
  choferes: ChoferAbm[]
}

/**
 * calcularFiltroChofer: ChoferAbm string -> boolean
 *
 * Dado un chofer y un texto de búsqueda, devuelve true si el nombre, apellido
 * o email contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de choferes en el cliente sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroChofer({ nombre: "Carlos", apellido: "Rodríguez", email: "c@x.com" }, "rod") === true
 * calcularFiltroChofer({ nombre: "Carlos", apellido: "Rodríguez", email: "c@x.com" }, "c@x") === true
 * calcularFiltroChofer({ nombre: "Carlos", apellido: "Rodríguez", email: "c@x.com" }, "xyz") === false
 */
export function calcularFiltroChofer(chofer: ChoferAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return (
    chofer.nombre.toLowerCase().includes(q) ||
    chofer.apellido.toLowerCase().includes(q) ||
    chofer.email.toLowerCase().includes(q)
  )
}

function ChoferFormModal({ chofer, onSuccess }: { chofer?: ChoferAbm; onSuccess: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: chofer?.nombre ?? "",
    apellido: chofer?.apellido ?? "",
    email: chofer?.email ?? "",
    telefono: chofer?.telefono ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!chofer

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/usuarios/${chofer.id}` : "/api/usuarios"
      const body = isEdit
        ? { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono || undefined }
        : { ...form, telefono: form.telefono || undefined, rol: "CHOFER" }
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al guardar"); return }
      router.refresh()
      onSuccess()
    } catch {
      setError("Error de conexión.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="nombre">Nombre *</Label>
          <Input id="nombre" name="nombre" value={form.nombre} onChange={handleChange} required disabled={loading} />
        </div>
        <div className="space-y-1">
          <Label htmlFor="apellido">Apellido *</Label>
          <Input id="apellido" name="apellido" value={form.apellido} onChange={handleChange} required disabled={loading} />
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading || isEdit} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="telefono">Teléfono</Label>
        <Input id="telefono" name="telefono" value={form.telefono} onChange={handleChange} disabled={loading} />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear chofer"}</Button>
      </div>
    </form>
  )
}

/**
 * ChoforesAbm: ChoforesAbmProps -> JSX.Element
 *
 * Dado el listado de choferes, renderiza la tabla ABM con buscador,
 * botones Editar/Desactivar y dialog de nuevo chofer.
 * Existe para gestionar el alta, baja y modificación de choferes
 * en la sección ABM, separada de la operatoria.
 *
 * Ejemplos:
 * <ChoforesAbm choferes={[{ id:"c1", nombre:"Carlos", apellido:"Rodríguez", ... }]} />
 * // => lista filtrable con "Carlos Rodríguez" + botones
 * <ChoforesAbm choferes={[]} />
 * // => mensaje "No hay choferes" + botón "Nuevo chofer"
 */
export function ChoforesAbm({ choferes }: ChoforesAbmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<ChoferAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<ChoferAbm | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtrados = busqueda
    ? choferes.filter((c) => calcularFiltroChofer(c, busqueda))
    : choferes

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/usuarios/${dialogEliminar.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: false }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorElim(data.error ?? "Error al desactivar"); return }
      router.refresh()
      setDialogEliminar(null)
    } catch {
      setErrorElim("Error de conexión.")
    } finally {
      setLoadingElim(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogCrear(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo chofer
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay choferes registrados."}
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {filtrados.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{c.apellido}, {c.nombre}</p>
                <p className="text-sm text-muted-foreground">
                  {c.email}{c.telefono ? ` · ${c.telefono}` : ""}
                  {!c.activo && <span className="ml-2 text-destructive">(inactivo)</span>}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(c)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(c)} disabled={!c.activo}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Desactivar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo chofer</DialogTitle>
            <DialogDescription>Registrá un nuevo chofer en el sistema.</DialogDescription>
          </DialogHeader>
          <ChoferFormModal onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar chofer</DialogTitle>
            <DialogDescription>Modificá los datos del chofer.</DialogDescription>
          </DialogHeader>
          {dialogEditar && <ChoferFormModal chofer={dialogEditar} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar chofer</DialogTitle>
            <DialogDescription>
              ¿Desactivar a <strong>{dialogEliminar?.nombre} {dialogEliminar?.apellido}</strong>?
            </DialogDescription>
          </DialogHeader>
          <FormError message={errorElim} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogEliminar(null)} disabled={loadingElim}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={loadingElim}>
              {loadingElim ? "Desactivando..." : "Desactivar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
