"use client"

/**
 * Componente ABM para gestión de usuarios del sistema.
 * Incluye búsqueda, creación, edición, desactivación y asignación de roles.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Pencil, Trash2, Search } from "lucide-react"
import type { Rol } from "@/types"

export interface UsuarioAbm {
  id: string
  nombre: string
  apellido: string
  email: string
  telefono: string | null
  rol: string
  activo: boolean
  empresaUsuarios: { empresa: { razonSocial: string }; nivelAcceso: string }[]
}

export interface EmpresaSimple {
  id: string
  razonSocial: string
}

interface UsuariosAbmProps {
  usuarios: UsuarioAbm[]
  empresas: EmpresaSimple[]
}

const ROLES_DISPLAY: Record<string, string> = {
  ADMIN_TRANSMAGG: "Admin Transmagg",
  OPERADOR_TRANSMAGG: "Operador Transmagg",
  FLETERO: "Fletero",
  CHOFER: "Chofer",
  ADMIN_EMPRESA: "Admin Empresa",
  OPERADOR_EMPRESA: "Operador Empresa",
}

/**
 * calcularFiltroUsuario: UsuarioAbm string -> boolean
 *
 * Dado un usuario y un texto de búsqueda, devuelve true si el nombre, apellido,
 * email o rol contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de usuarios en el cliente sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroUsuario({ nombre: "Ana", apellido: "García", rol: "OPERADOR_TRANSMAGG", email: "ana@x.com" }, "gar") === true
 * calcularFiltroUsuario({ nombre: "Ana", apellido: "García", rol: "OPERADOR_TRANSMAGG", email: "ana@x.com" }, "fletero") === false
 * calcularFiltroUsuario({ nombre: "Ana", apellido: "García", rol: "OPERADOR_TRANSMAGG", email: "ana@x.com" }, "operador") === true
 */
export function calcularFiltroUsuario(usuario: UsuarioAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return (
    usuario.nombre.toLowerCase().includes(q) ||
    usuario.apellido.toLowerCase().includes(q) ||
    usuario.email.toLowerCase().includes(q) ||
    usuario.rol.toLowerCase().includes(q)
  )
}

function UsuarioFormModal({
  usuario,
  empresas,
  onSuccess,
}: {
  usuario?: UsuarioAbm
  empresas: EmpresaSimple[]
  onSuccess: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: usuario?.nombre ?? "",
    apellido: usuario?.apellido ?? "",
    email: usuario?.email ?? "",
    telefono: usuario?.telefono ?? "",
    rol: (usuario?.rol ?? "OPERADOR_TRANSMAGG") as Rol,
    empresaId: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!usuario

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const necesitaEmpresa = !isEdit && (form.rol === "ADMIN_EMPRESA" || form.rol === "OPERADOR_EMPRESA")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/usuarios/${usuario.id}` : "/api/usuarios"
      const body = isEdit
        ? { nombre: form.nombre, apellido: form.apellido, telefono: form.telefono || undefined, rol: form.rol }
        : {
            nombre: form.nombre,
            apellido: form.apellido,
            email: form.email,
            telefono: form.telefono || undefined,
            rol: form.rol,
            ...(necesitaEmpresa && form.empresaId ? { empresaId: form.empresaId } : {}),
          }
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
      <div className="space-y-1">
        <Label htmlFor="rol">Rol *</Label>
        <Select id="rol" name="rol" value={form.rol} onChange={handleChange} disabled={loading}>
          {Object.entries(ROLES_DISPLAY).map(([k, v]) => (
            <option key={k} value={k}>{v}</option>
          ))}
        </Select>
      </div>
      {necesitaEmpresa && (
        <div className="space-y-1">
          <Label htmlFor="empresaId">Empresa *</Label>
          <Select id="empresaId" name="empresaId" value={form.empresaId} onChange={handleChange} disabled={loading} required>
            <option value="">Seleccioná una empresa...</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
          </Select>
        </div>
      )}
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear usuario"}</Button>
      </div>
    </form>
  )
}

/**
 * UsuariosAbm: UsuariosAbmProps -> JSX.Element
 *
 * Dado el listado de usuarios y empresas, renderiza la tabla ABM con buscador,
 * botones de acción y dialog de creación/edición con asignación de roles.
 * Existe para gestionar todos los usuarios del sistema independientemente de su rol,
 * incluyendo la asignación de empresa para roles ADMIN_EMPRESA/OPERADOR_EMPRESA.
 *
 * Ejemplos:
 * <UsuariosAbm usuarios={[{ id:"u1", nombre:"Ana", rol:"OPERADOR_TRANSMAGG" }]} empresas={[...]} />
 * // => lista con "Ana" + badge de rol + botones editar/desactivar
 * <UsuariosAbm usuarios={[]} empresas={[]} />
 * // => mensaje "No hay usuarios" + botón "Nuevo usuario"
 */
export function UsuariosAbm({ usuarios, empresas }: UsuariosAbmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<UsuarioAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<UsuarioAbm | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtrados = busqueda
    ? usuarios.filter((u) => calcularFiltroUsuario(u, busqueda))
    : usuarios

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/usuarios/${dialogEliminar.id}`, { method: "DELETE" })
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

  const colores: Record<string, string> = {
    ADMIN_TRANSMAGG: "bg-purple-100 text-purple-800",
    OPERADOR_TRANSMAGG: "bg-blue-100 text-blue-800",
    FLETERO: "bg-orange-100 text-orange-800",
    CHOFER: "bg-yellow-100 text-yellow-800",
    ADMIN_EMPRESA: "bg-green-100 text-green-800",
    OPERADOR_EMPRESA: "bg-teal-100 text-teal-800",
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, apellido, email o rol..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogCrear(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo usuario
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay usuarios registrados."}
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {filtrados.map((u) => (
            <div key={u.id} className="flex items-center justify-between px-4 py-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium">{u.apellido}, {u.nombre}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${colores[u.rol] ?? "bg-gray-100 text-gray-800"}`}>
                    {ROLES_DISPLAY[u.rol] ?? u.rol}
                  </span>
                  {!u.activo && <span className="text-xs text-destructive">(inactivo)</span>}
                </div>
                <p className="text-sm text-muted-foreground">
                  {u.email}
                  {u.empresaUsuarios.length > 0 && ` · ${u.empresaUsuarios[0].empresa.razonSocial}`}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(u)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(u)} disabled={!u.activo}>
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
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>Registrá un nuevo usuario y asigná su rol.</DialogDescription>
          </DialogHeader>
          <UsuarioFormModal empresas={empresas} onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
            <DialogDescription>Modificá los datos del usuario.</DialogDescription>
          </DialogHeader>
          {dialogEditar && <UsuarioFormModal usuario={dialogEditar} empresas={empresas} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar usuario</DialogTitle>
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
