"use client"

/**
 * ABM Proveedores JM. Clon adaptado de proveedores-abm.tsx.
 * Sin BotonBuscarPadron (requiere ARCA configurado).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { formatearCuit } from "@/lib/utils"
import { CondicionIva } from "@/types"
import { Plus, Pencil, Trash2, Search, PowerOff, Power } from "lucide-react"

export interface ProveedorJmAbm {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  rubro: string | null
  tipo: string
  activo: boolean
}

interface ProveedoresAbmJmProps {
  proveedores: ProveedorJmAbm[]
}

function ProveedorFormModal({ proveedor, onSuccess }: { proveedor?: ProveedorJmAbm; onSuccess: () => void }) {
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
    setLoading(true); setError(null)
    try {
      const url = isEdit ? `/api/jm/proveedores/${proveedor.id}` : "/api/jm/proveedores"
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
        <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
        <Input id="cuit" name="cuit" value={form.cuit} onChange={handleChange} required disabled={loading || isEdit} maxLength={11} pattern="\d{11}" placeholder="30123456789" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input id="razonSocial" name="razonSocial" value={form.razonSocial} onChange={handleChange} required disabled={loading} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="condicionIva">Condición IVA *</Label>
        <Select id="condicionIva" name="condicionIva" value={form.condicionIva} onChange={handleChange} disabled={loading}>
          {Object.entries(CondicionIva).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </Select>
      </div>
      <div className="space-y-1">
        <Label htmlFor="rubro">Rubro</Label>
        <Input id="rubro" name="rubro" value={form.rubro} onChange={handleChange} disabled={loading} placeholder="Combustible, neumáticos, etc." />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tipo">Tipo</Label>
        <Select id="tipo" name="tipo" value={form.tipo} onChange={handleChange} disabled={loading}>
          <option value="GENERAL">General</option>
          <option value="ASEGURADORA">Aseguradora</option>
        </Select>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear proveedor"}</Button>
      </div>
    </form>
  )
}

export function ProveedoresAbmJm({ proveedores: proveedoresIniciales }: ProveedoresAbmJmProps) {
  const router = useRouter()
  const [proveedores, setProveedores] = useState(proveedoresIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<ProveedorJmAbm | null>(null)
  const [dialogToggle, setDialogToggle] = useState<ProveedorJmAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<ProveedorJmAbm | null>(null)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [errorToggle, setErrorToggle] = useState<string | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtrados = busqueda
    ? proveedores.filter((p) =>
        p.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) || p.cuit.includes(busqueda)
      )
    : proveedores

  function refrescar() {
    fetch("/api/jm/proveedores").then(r => r.json()).then(d => setProveedores(Array.isArray(d) ? d : []))
  }

  async function handleToggle() {
    if (!dialogToggle) return
    setLoadingToggle(true); setErrorToggle(null)
    try {
      const res = await fetch(`/api/jm/proveedores/${dialogToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !dialogToggle.activo }),
      })
      const data = await res.json()
      if (!res.ok) { setErrorToggle(data.error ?? "Error al actualizar"); return }
      router.refresh(); refrescar()
      setDialogToggle(null)
    } catch {
      setErrorToggle("Error de conexión.")
    } finally {
      setLoadingToggle(false)
    }
  }

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true); setErrorElim(null)
    try {
      const res = await fetch(`/api/jm/proveedores/${dialogEliminar.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setErrorElim(data.error ?? "Error al eliminar")
        return
      }
      router.refresh(); refrescar()
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
          <Input placeholder="Buscar por razón social o CUIT..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} className="pl-9" />
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
        <div className="border rounded-lg">
          {filtrados.map((p) => (
            <div key={p.id} className="border-b last:border-b-0 px-4 py-3 flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <p className="font-medium flex items-center gap-2">
                  {p.razonSocial}
                  {!p.activo && (
                    <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">Inactivo</span>
                  )}
                  {p.tipo === "ASEGURADORA" && (
                    <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Aseguradora</span>
                  )}
                </p>
                <p className="text-sm text-muted-foreground">
                  CUIT: {formatearCuit(p.cuit)} &middot; {p.condicionIva.replace(/_/g, " ")}
                  {p.rubro ? ` · ${p.rubro}` : ""}
                </p>
              </div>
              <div className="flex gap-2 ml-3">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(p)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button variant="outline" size="sm" onClick={() => setDialogToggle(p)}>
                  {p.activo ? <PowerOff className="h-3.5 w-3.5 mr-1" /> : <Power className="h-3.5 w-3.5 mr-1" />}
                  {p.activo ? "Desactivar" : "Activar"}
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(p)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo proveedor</DialogTitle></DialogHeader>
          <ProveedorFormModal onSuccess={() => { setDialogCrear(false); refrescar() }} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar proveedor</DialogTitle></DialogHeader>
          {dialogEditar && <ProveedorFormModal proveedor={dialogEditar} onSuccess={() => { setDialogEditar(null); refrescar() }} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogToggle} onOpenChange={(o) => { if (!o) { setDialogToggle(null); setErrorToggle(null) } }}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogToggle?.activo ? "Desactivar proveedor" : "Activar proveedor"}</DialogTitle></DialogHeader>
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
          <DialogHeader><DialogTitle>Eliminar proveedor</DialogTitle></DialogHeader>
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
