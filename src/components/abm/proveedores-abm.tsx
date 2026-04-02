"use client"

/**
 * Componente ABM para gestión de proveedores.
 * Incluye búsqueda, creación, edición, activar/desactivar y eliminación.
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
import { formatearCuit } from "@/lib/utils"
import { CondicionIva } from "@/types"
import { Plus, Pencil, Trash2, Search, PowerOff, Power } from "lucide-react"

export interface ProveedorAbm {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  rubro: string | null
  tipo: string
  activo: boolean
  puedeEliminar: boolean
}

interface ProveedoresAbmProps {
  proveedores: ProveedorAbm[]
}

/**
 * calcularFiltroProveedor: ProveedorAbm string -> boolean
 *
 * Dado un proveedor y un texto de búsqueda, devuelve true si la razón social
 * o el CUIT contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de proveedores en el ABM sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroProveedor({ razonSocial: "Gas SA", cuit: "30111222333" }, "gas") === true
 * calcularFiltroProveedor({ razonSocial: "Gas SA", cuit: "30111222333" }, "301") === true
 * calcularFiltroProveedor({ razonSocial: "Gas SA", cuit: "30111222333" }, "xyz") === false
 */
export function calcularFiltroProveedor(proveedor: ProveedorAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return proveedor.razonSocial.toLowerCase().includes(q) || proveedor.cuit.includes(q)
}

function ProveedorFormModal({ proveedor, onSuccess }: { proveedor?: ProveedorAbm; onSuccess: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: proveedor?.razonSocial ?? "",
    cuit: proveedor?.cuit ?? "",
    condicionIva: proveedor?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    rubro: proveedor?.rubro ?? "",
    tipo: proveedor?.tipo ?? "GENERAL",
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
      const body = isEdit
        ? { razonSocial: form.razonSocial, condicionIva: form.condicionIva, rubro: form.rubro || undefined, tipo: form.tipo }
        : { ...form, rubro: form.rubro || undefined }
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
      <div className="space-y-1">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input id="razonSocial" name="razonSocial" value={form.razonSocial} onChange={handleChange} required disabled={loading} />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cuit">CUIT (11 dígitos) *</Label>
          <Input id="cuit" name="cuit" value={form.cuit} onChange={handleChange} required disabled={loading || isEdit} maxLength={11} pattern="\d{11}" placeholder="30123456789" />
        </div>
        <div className="space-y-1">
          <Label htmlFor="condicionIva">Condición IVA *</Label>
          <Select id="condicionIva" name="condicionIva" value={form.condicionIva} onChange={handleChange} disabled={loading}>
            {Object.entries(CondicionIva).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rubro">Rubro</Label>
        <Input id="rubro" name="rubro" value={form.rubro} onChange={handleChange} disabled={loading} placeholder="Combustible, Peajes, etc." />
      </div>
      <div className="space-y-1">
        <Label>Tipo de proveedor</Label>
        <div className="flex gap-4 pt-1">
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="GENERAL" checked={form.tipo === "GENERAL"} onChange={() => setForm((p) => ({ ...p, tipo: "GENERAL" }))} disabled={loading} />
            Proveedor general
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input type="radio" value="ASEGURADORA" checked={form.tipo === "ASEGURADORA"} onChange={() => setForm((p) => ({ ...p, tipo: "ASEGURADORA" }))} disabled={loading} />
            Aseguradora
          </label>
        </div>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}</Button>
      </div>
    </form>
  )
}

/**
 * ProveedoresAbm: ProveedoresAbmProps -> JSX.Element
 *
 * Dado el listado de proveedores, renderiza la tabla ABM con buscador,
 * botones Editar/Activar/Desactivar/Eliminar y dialog de nuevo proveedor.
 * Existe para gestionar el alta, baja y modificación de proveedores
 * en la sección ABM, separada de la operatoria de facturas.
 */
export function ProveedoresAbm({ proveedores }: ProveedoresAbmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<ProveedorAbm | null>(null)
  const [dialogToggle, setDialogToggle] = useState<ProveedorAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<ProveedorAbm | null>(null)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [errorToggle, setErrorToggle] = useState<string | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtrados = busqueda
    ? proveedores.filter((p) => calcularFiltroProveedor(p, busqueda))
    : proveedores

  async function handleToggle() {
    if (!dialogToggle) return
    setLoadingToggle(true)
    setErrorToggle(null)
    try {
      const res = await fetch(`/api/proveedores/${dialogToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !dialogToggle.activo }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorToggle(data.error ?? "Error al actualizar"); return }
      router.refresh()
      setDialogToggle(null)
    } catch {
      setErrorToggle("Error de conexión.")
    } finally {
      setLoadingToggle(false)
    }
  }

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/proveedores/${dialogEliminar.id}`, { method: "DELETE" })
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
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por razón social o CUIT..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogCrear(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo proveedor
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay proveedores registrados."}
        </p>
      ) : (
        <div className="border rounded-lg divide-y">
          {filtrados.map((p) => (
            <div key={p.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium flex items-center gap-2">
                  {p.razonSocial}
                  {p.tipo === "ASEGURADORA" && (
                    <span className="inline-flex items-center rounded-full bg-violet-100 px-2 py-0.5 text-xs font-medium text-violet-800">
                      Aseguradora
                    </span>
                  )}
                  {!p.activo && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                      Inactivo
                    </span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  CUIT: {formatearCuit(p.cuit)}
                  {p.rubro ? ` · ${p.rubro}` : ""}
                  {" · "}{p.condicionIva.replace(/_/g, " ")}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(p)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                {p.activo ? (
                  <Button variant="outline" size="sm" onClick={() => setDialogToggle(p)}>
                    <PowerOff className="h-3.5 w-3.5 mr-1" /> Desactivar
                  </Button>
                ) : (
                  <Button variant="outline" size="sm" onClick={() => setDialogToggle(p)}>
                    <Power className="h-3.5 w-3.5 mr-1" /> Activar
                  </Button>
                )}
                {p.puedeEliminar && (
                  <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(p)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo proveedor</DialogTitle>
            <DialogDescription>Registrá un nuevo proveedor de servicios.</DialogDescription>
          </DialogHeader>
          <ProveedorFormModal onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar proveedor</DialogTitle>
            <DialogDescription>Modificá los datos del proveedor.</DialogDescription>
          </DialogHeader>
          {dialogEditar && <ProveedorFormModal proveedor={dialogEditar} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogToggle} onOpenChange={(o) => { if (!o) { setDialogToggle(null); setErrorToggle(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogToggle?.activo ? "Desactivar proveedor" : "Activar proveedor"}</DialogTitle>
            <DialogDescription>
              {dialogToggle?.activo
                ? <>¿Desactivar <strong>{dialogToggle?.razonSocial}</strong>? No aparecerá en formularios de nuevas facturas.</>
                : <>¿Activar <strong>{dialogToggle?.razonSocial}</strong>? Volverá a estar disponible en los formularios.</>
              }
            </DialogDescription>
          </DialogHeader>
          <FormError message={errorToggle} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogToggle(null)} disabled={loadingToggle}>Cancelar</Button>
            <Button variant={dialogToggle?.activo ? "destructive" : "default"} onClick={handleToggle} disabled={loadingToggle}>
              {loadingToggle ? "Guardando..." : dialogToggle?.activo ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar proveedor</DialogTitle>
            <DialogDescription>
              ¿Eliminar permanentemente <strong>{dialogEliminar?.razonSocial}</strong>? Esta acción no se puede deshacer.
              Solo es posible si el proveedor no tiene facturas registradas.
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
