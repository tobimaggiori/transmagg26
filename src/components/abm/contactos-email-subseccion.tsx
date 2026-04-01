"use client"

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
import { Plus, Pencil, Trash2, Mail } from "lucide-react"

export type ContactoEmailItem = {
  id: string
  email: string
  nombre: string | null
}

type Props = {
  parentId: string
  parentType: "empresa" | "fletero"
  contactos: ContactoEmailItem[]
}

function ContactoFormModal({
  parentId,
  parentType,
  contacto,
  onSuccess,
}: {
  parentId: string
  parentType: "empresa" | "fletero"
  contacto?: ContactoEmailItem
  onSuccess: () => void
}) {
  const router = useRouter()
  const [email, setEmail] = useState(contacto?.email ?? "")
  const [nombre, setNombre] = useState(contacto?.nombre ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!contacto

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      let res: Response
      if (isEdit) {
        res = await fetch(`/api/contactos-email/${contacto.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, nombre: nombre || undefined }),
        })
      } else {
        const url = parentType === "empresa"
          ? `/api/empresas/${parentId}/contactos-email`
          : `/api/fleteros/${parentId}/contactos-email`
        res = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, nombre: nombre || undefined }),
        })
      }
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
      <div className="space-y-1">
        <Label htmlFor="email">Email *</Label>
        <Input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
          disabled={loading}
          placeholder="administracion@empresa.com"
        />
      </div>
      <div className="space-y-1">
        <Label htmlFor="nombre">Nombre / descripción (opcional)</Label>
        <Input
          id="nombre"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          disabled={loading}
          placeholder="Ej: Administración, Contador"
        />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar"}</Button>
      </div>
    </form>
  )
}

/**
 * ContactosEmailSubseccion: Props -> JSX.Element
 *
 * Dado el parentId (empresa o fletero), tipo, y lista de contactos activos,
 * renderiza la subsección de gestión de contactos de email con botones agregar/editar/eliminar.
 */
export function ContactosEmailSubseccion({ parentId, parentType, contactos: initialContactos }: Props) {
  const router = useRouter()
  const [dialogAgregar, setDialogAgregar] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<ContactoEmailItem | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<ContactoEmailItem | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/contactos-email/${dialogEliminar.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { setErrorElim(data.error ?? "Error al eliminar"); return }
      router.refresh()
      setDialogEliminar(null)
    } catch {
      setErrorElim("Error de conexión.")
    } finally {
      setLoadingElim(false)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Mail className="h-3 w-3" /> Contactos de email ({initialContactos.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setDialogAgregar(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar
        </Button>
      </div>

      {initialContactos.length === 0 ? (
        <p className="text-xs text-muted-foreground py-1">Sin contactos de email cargados.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {initialContactos.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-mono">{c.email}</p>
                {c.nombre && <p className="text-xs text-muted-foreground">{c.nombre}</p>}
              </div>
              <div className="flex gap-1.5 ml-3">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(c)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(c)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogAgregar} onOpenChange={setDialogAgregar}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar contacto de email</DialogTitle>
            <DialogDescription>Ingresá el email y opcionalmente un nombre o descripción.</DialogDescription>
          </DialogHeader>
          <ContactoFormModal parentId={parentId} parentType={parentType} onSuccess={() => setDialogAgregar(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar contacto</DialogTitle>
            <DialogDescription>Modificá el email o nombre del contacto.</DialogDescription>
          </DialogHeader>
          {dialogEditar && (
            <ContactoFormModal
              parentId={parentId}
              parentType={parentType}
              contacto={dialogEditar}
              onSuccess={() => setDialogEditar(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar contacto</DialogTitle>
            <DialogDescription>
              ¿Eliminar <strong>{dialogEliminar?.email}</strong>?
            </DialogDescription>
          </DialogHeader>
          <FormError message={errorElim} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogEliminar(null)} disabled={loadingElim}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminar} disabled={loadingElim}>
              {loadingElim ? "Eliminando..." : "Eliminar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
