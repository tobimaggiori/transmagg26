"use client"

/**
 * ABM de empresas JM. Clon adaptado de src/components/abm/empresas-abm.tsx.
 * Diferencias vs Transmagg:
 * - Llama a /api/jm/empresas en lugar de /api/empresas.
 * - Sin BotonBuscarPadron (requiere ARCA configurado en JM — TODO).
 * - Sin ContactosEmailSubseccion (TODO — agregar cuando esté la API).
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
} from "@/components/ui/dialog"
import { formatearCuit } from "@/lib/utils"
import { CondicionIva } from "@/types"
import { Plus, Pencil, Trash2, Search, PowerOff, Power } from "lucide-react"

export interface EmpresaJmAbm {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion: string | null
  padronFce: boolean
  activa: boolean
}

interface EmpresasAbmJmProps {
  empresas: EmpresaJmAbm[]
}

function EmpresaFormModal({
  empresa,
  onSuccess,
}: {
  empresa?: EmpresaJmAbm
  onSuccess: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: empresa?.razonSocial ?? "",
    cuit: empresa?.cuit ?? "",
    condicionIva: empresa?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    direccion: empresa?.direccion ?? "",
    padronFce: empresa?.padronFce ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!empresa

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/jm/empresas/${empresa.id}` : "/api/jm/empresas"
      const res = await fetch(url, {
        method: isEdit ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
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
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" value={form.direccion} onChange={handleChange} disabled={loading} />
      </div>
      <label htmlFor="padronFce" className="flex items-center gap-2 cursor-pointer">
        <input
          type="checkbox"
          id="padronFce"
          checked={form.padronFce}
          onChange={(e) => setForm((prev) => ({ ...prev, padronFce: e.target.checked }))}
          disabled={loading}
          className="h-4 w-4 rounded border-input accent-primary"
        />
        <span className="text-sm">Padrón FCE</span>
      </label>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empresa"}</Button>
      </div>
    </form>
  )
}

export function EmpresasAbmJm({ empresas }: EmpresasAbmJmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<EmpresaJmAbm | null>(null)
  const [dialogToggle, setDialogToggle] = useState<EmpresaJmAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<EmpresaJmAbm | null>(null)
  const [loadingToggle, setLoadingToggle] = useState(false)
  const [errorToggle, setErrorToggle] = useState<string | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtradas = busqueda
    ? empresas.filter((e) =>
        e.razonSocial.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.cuit.includes(busqueda)
      )
    : empresas

  async function handleToggle() {
    if (!dialogToggle) return
    setLoadingToggle(true); setErrorToggle(null)
    try {
      const res = await fetch(`/api/jm/empresas/${dialogToggle.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activa: !dialogToggle.activa }),
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
    setLoadingElim(true); setErrorElim(null)
    try {
      const res = await fetch(`/api/jm/empresas/${dialogEliminar.id}`, { method: "DELETE" })
      if (!res.ok) {
        const data = await res.json()
        setErrorElim(data.error ?? "Error al eliminar")
        return
      }
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
          <Plus className="h-4 w-4 mr-1" /> Nueva empresa
        </Button>
      </div>

      {filtradas.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay empresas registradas."}
        </p>
      ) : (
        <div className="border rounded-lg">
          {filtradas.map((emp) => (
            <div key={emp.id} className="border-b last:border-b-0">
              <div className="flex items-center justify-between px-4 py-3">
                <div className="flex-1 min-w-0">
                  <p className="font-medium flex items-center gap-2">
                    {emp.razonSocial}
                    {!emp.activa && (
                      <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-xs font-medium text-red-800">
                        Inactiva
                      </span>
                    )}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    CUIT: {formatearCuit(emp.cuit)} &middot; {emp.condicionIva.replace(/_/g, " ")}
                    {emp.direccion ? ` · ${emp.direccion}` : ""}
                  </p>
                </div>
                <div className="flex gap-2 ml-3">
                  <Button variant="outline" size="sm" onClick={() => setDialogEditar(emp)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  {emp.activa ? (
                    <Button variant="outline" size="sm" onClick={() => setDialogToggle(emp)}>
                      <PowerOff className="h-3.5 w-3.5 mr-1" /> Desactivar
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm" onClick={() => setDialogToggle(emp)}>
                      <Power className="h-3.5 w-3.5 mr-1" /> Activar
                    </Button>
                  )}
                  <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(emp)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Eliminar
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa</DialogTitle>
          </DialogHeader>
          <EmpresaFormModal onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
          </DialogHeader>
          {dialogEditar && <EmpresaFormModal empresa={dialogEditar} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogToggle} onOpenChange={(o) => { if (!o) { setDialogToggle(null); setErrorToggle(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{dialogToggle?.activa ? "Desactivar empresa" : "Activar empresa"}</DialogTitle>
          </DialogHeader>
          <FormError message={errorToggle} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogToggle(null)} disabled={loadingToggle}>Cancelar</Button>
            <Button variant={dialogToggle?.activa ? "destructive" : "default"} onClick={handleToggle} disabled={loadingToggle}>
              {loadingToggle ? "Guardando..." : dialogToggle?.activa ? "Desactivar" : "Activar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar empresa</DialogTitle>
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
