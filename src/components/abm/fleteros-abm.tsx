"use client"

/**
 * Componente ABM para gestión de fleteros con subsección de camiones.
 * Incluye búsqueda, creación, edición y desactivación de fleteros.
 * Al seleccionar un fletero, muestra sus camiones en formato lista con CRUD propio.
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
import { Plus, Pencil, Trash2, Search, ChevronDown, ChevronRight, Truck } from "lucide-react"

export interface CamionAbm {
  id: string
  patenteChasis: string
  patenteAcoplado: string | null
  tipoCamion: string
}

export interface FleteroAbm {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  comisionDefault: number
  usuario: { nombre: string; apellido: string; email: string }
  camiones: CamionAbm[]
}

interface FleterosAbmProps {
  fleteros: FleteroAbm[]
}

/**
 * calcularFiltroFletero: FleteroAbm string -> boolean
 *
 * Dado un fletero y un texto de búsqueda, devuelve true si la razón social,
 * CUIT o email del usuario contienen el texto (insensible a mayúsculas).
 * Existe para filtrar la lista de fleteros en el cliente sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroFletero({ razonSocial: "JP SRL", cuit: "20123456789", ... }, "jp") === true
 * calcularFiltroFletero({ razonSocial: "JP SRL", cuit: "20123456789", ... }, "201") === true
 * calcularFiltroFletero({ razonSocial: "JP SRL", cuit: "20123456789", ... }, "xyz") === false
 */
export function calcularFiltroFletero(fletero: FleteroAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return (
    fletero.razonSocial.toLowerCase().includes(q) ||
    fletero.cuit.includes(q) ||
    fletero.usuario.email.toLowerCase().includes(q)
  )
}

function FleteroFormModal({ fletero, onSuccess }: { fletero?: Pick<FleteroAbm, "id" | "razonSocial" | "cuit" | "condicionIva" | "comisionDefault">; onSuccess: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: fletero?.razonSocial ?? "",
    condicionIva: fletero?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    comisionDefault: String(fletero?.comisionDefault ?? "10"),
    // Solo para creación:
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    cuit: fletero?.cuit ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!fletero

  function handleChange(e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/fleteros/${fletero.id}` : "/api/fleteros"
      const body = isEdit
        ? { razonSocial: form.razonSocial, condicionIva: form.condicionIva, comisionDefault: Number(form.comisionDefault) }
        : { ...form, comisionDefault: Number(form.comisionDefault) }
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
      {!isEdit && (
        <>
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
            <Input id="email" name="email" type="email" value={form.email} onChange={handleChange} required disabled={loading} />
          </div>
          <div className="space-y-1">
            <Label htmlFor="cuit">CUIT (11 dígitos, sin guiones) *</Label>
            <Input id="cuit" name="cuit" value={form.cuit} onChange={handleChange} required disabled={loading} maxLength={11} pattern="\d{11}" placeholder="20123456789" />
          </div>
        </>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="condicionIva">Condición IVA *</Label>
          <Select id="condicionIva" name="condicionIva" value={form.condicionIva} onChange={handleChange} disabled={loading}>
            {Object.entries(CondicionIva).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </Select>
        </div>
        <div className="space-y-1">
          <Label htmlFor="comisionDefault">Comisión por defecto (%) *</Label>
          <Input id="comisionDefault" name="comisionDefault" type="number" min="0" max="100" step="0.1" value={form.comisionDefault} onChange={handleChange} required disabled={loading} />
        </div>
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear fletero"}</Button>
      </div>
    </form>
  )
}

function CamionFormModal({ fleteroId, camion, onSuccess }: { fleteroId: string; camion?: CamionAbm; onSuccess: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({
    patenteChasis: camion?.patenteChasis ?? "",
    patenteAcoplado: camion?.patenteAcoplado ?? "",
    tipoCamion: camion?.tipoCamion ?? "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const isEdit = !!camion

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value.toUpperCase() }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/camiones/${camion.id}` : "/api/camiones"
      const body = isEdit
        ? { patenteAcoplado: form.patenteAcoplado || undefined, tipoCamion: form.tipoCamion }
        : { fleteroId, patenteChasis: form.patenteChasis, patenteAcoplado: form.patenteAcoplado || undefined, tipoCamion: form.tipoCamion }
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
      {!isEdit && (
        <div className="space-y-1">
          <Label htmlFor="patenteChasis">Patente chasis *</Label>
          <Input id="patenteChasis" name="patenteChasis" value={form.patenteChasis} onChange={handleChange} required disabled={loading} maxLength={8} placeholder="ABC123" />
        </div>
      )}
      <div className="space-y-1">
        <Label htmlFor="patenteAcoplado">Patente acoplado</Label>
        <Input id="patenteAcoplado" name="patenteAcoplado" value={form.patenteAcoplado} onChange={handleChange} disabled={loading} maxLength={8} placeholder="XYZ789" />
      </div>
      <div className="space-y-1">
        <Label htmlFor="tipoCamion">Tipo de camión *</Label>
        <Input id="tipoCamion" name="tipoCamion" value={form.tipoCamion} onChange={(e) => setForm(p => ({ ...p, tipoCamion: e.target.value }))} required disabled={loading} placeholder="Semi, Camión 3/4, etc." />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Agregar camión"}</Button>
      </div>
    </form>
  )
}

function CamionesSubseccion({ fleteroId, camiones }: { fleteroId: string; camiones: CamionAbm[] }) {
  const router = useRouter()
  const [dialogCamion, setDialogCamion] = useState(false)
  const [dialogEditarCamion, setDialogEditarCamion] = useState<CamionAbm | null>(null)
  const [dialogEliminarCamion, setDialogEliminarCamion] = useState<CamionAbm | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  async function handleEliminarCamion() {
    if (!dialogEliminarCamion) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/camiones/${dialogEliminarCamion.id}`, { method: "DELETE" })
      const data = await res.json()
      if (!res.ok) { setErrorElim(data.error ?? "Error al desactivar"); return }
      router.refresh()
      setDialogEliminarCamion(null)
    } catch {
      setErrorElim("Error de conexión.")
    } finally {
      setLoadingElim(false)
    }
  }

  return (
    <div className="ml-6 mt-2 mb-2 border-l-2 border-gray-200 pl-4">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-1">
          <Truck className="h-3 w-3" /> Camiones ({camiones.length})
        </p>
        <Button size="sm" variant="outline" onClick={() => setDialogCamion(true)}>
          <Plus className="h-3.5 w-3.5 mr-1" /> Agregar camión
        </Button>
      </div>
      {camiones.length === 0 ? (
        <p className="text-xs text-muted-foreground py-2">Sin camiones registrados.</p>
      ) : (
        <div className="border rounded-md divide-y">
          {camiones.map((c) => (
            <div key={c.id} className="flex items-center justify-between px-3 py-2">
              <div>
                <p className="text-sm font-medium">{c.patenteChasis} {c.patenteAcoplado ? `/ ${c.patenteAcoplado}` : ""}</p>
                <p className="text-xs text-muted-foreground">{c.tipoCamion}</p>
              </div>
              <div className="flex gap-1.5">
                <Button variant="outline" size="sm" onClick={() => setDialogEditarCamion(c)}>
                  <Pencil className="h-3 w-3" />
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminarCamion(c)}>
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCamion} onOpenChange={setDialogCamion}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Agregar camión</DialogTitle>
            <DialogDescription>Registrá un nuevo camión para este fletero.</DialogDescription>
          </DialogHeader>
          <CamionFormModal fleteroId={fleteroId} onSuccess={() => setDialogCamion(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditarCamion} onOpenChange={(o) => { if (!o) setDialogEditarCamion(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar camión</DialogTitle>
            <DialogDescription>Modificá los datos del camión.</DialogDescription>
          </DialogHeader>
          {dialogEditarCamion && <CamionFormModal fleteroId={fleteroId} camion={dialogEditarCamion} onSuccess={() => setDialogEditarCamion(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminarCamion} onOpenChange={(o) => { if (!o) { setDialogEliminarCamion(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar camión</DialogTitle>
            <DialogDescription>
              ¿Desactivar <strong>{dialogEliminarCamion?.patenteChasis}</strong>?
            </DialogDescription>
          </DialogHeader>
          <FormError message={errorElim} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="outline" onClick={() => setDialogEliminarCamion(null)} disabled={loadingElim}>Cancelar</Button>
            <Button variant="destructive" onClick={handleEliminarCamion} disabled={loadingElim}>
              {loadingElim ? "Desactivando..." : "Desactivar"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}

/**
 * FleterosAbm: FleterosAbmProps -> JSX.Element
 *
 * Dado el listado de fleteros, renderiza la tabla ABM con buscador, botones de
 * acción y subsección de camiones expandible por cada fletero.
 * Existe para centralizar el ABM de fleteros y sus vehículos en una sola vista,
 * donde el ADMIN puede gestionar la flota completa de cada transportista.
 *
 * Ejemplos:
 * <FleterosAbm fleteros={[{ id:"f1", razonSocial:"JP SRL", camiones:[...] }]} />
 * // => lista filtrable con "JP SRL" + botón expandir + subsección camiones
 * <FleterosAbm fleteros={[]} />
 * // => mensaje "No hay fleteros" + botón "Nuevo fletero"
 * // => búsqueda "xyz" → "Sin resultados"
 */
export function FleterosAbm({ fleteros }: FleterosAbmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<FleteroAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<FleteroAbm | null>(null)
  const [expandido, setExpandido] = useState<string | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtrados = busqueda
    ? fleteros.filter((f) => calcularFiltroFletero(f, busqueda))
    : fleteros

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/fleteros/${dialogEliminar.id}`, { method: "DELETE" })
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
            placeholder="Buscar por razón social, CUIT o email..."
            value={busqueda}
            onChange={(e) => setBusqueda(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button onClick={() => setDialogCrear(true)}>
          <Plus className="h-4 w-4 mr-1" /> Nuevo fletero
        </Button>
      </div>

      {filtrados.length === 0 ? (
        <p className="text-center py-8 text-muted-foreground">
          {busqueda ? "Sin resultados para la búsqueda." : "No hay fleteros registrados."}
        </p>
      ) : (
        <div className="border rounded-lg">
          {filtrados.map((flet) => (
            <div key={flet.id} className="border-b last:border-b-0">
              <div className="flex items-center justify-between px-4 py-3">
                <button
                  className="flex items-center gap-2 text-left flex-1 min-w-0"
                  onClick={() => setExpandido(expandido === flet.id ? null : flet.id)}
                >
                  {expandido === flet.id
                    ? <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0" />
                    : <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                  }
                  <div>
                    <p className="font-medium">{flet.razonSocial}</p>
                    <p className="text-sm text-muted-foreground">
                      CUIT: {formatearCuit(flet.cuit)} &middot; {flet.usuario.nombre} {flet.usuario.apellido} &middot; {flet.comisionDefault}% comisión
                    </p>
                  </div>
                </button>
                <div className="flex gap-2 ml-3">
                  <Button variant="outline" size="sm" onClick={() => setDialogEditar(flet)}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                  </Button>
                  <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(flet)}>
                    <Trash2 className="h-3.5 w-3.5 mr-1" /> Desactivar
                  </Button>
                </div>
              </div>
              {expandido === flet.id && (
                <CamionesSubseccion fleteroId={flet.id} camiones={flet.camiones} />
              )}
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo fletero</DialogTitle>
            <DialogDescription>Registrá un nuevo fletero con su usuario de acceso.</DialogDescription>
          </DialogHeader>
          <FleteroFormModal onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar fletero</DialogTitle>
            <DialogDescription>Modificá los datos del fletero.</DialogDescription>
          </DialogHeader>
          {dialogEditar && <FleteroFormModal fletero={dialogEditar} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar fletero</DialogTitle>
            <DialogDescription>
              ¿Desactivar <strong>{dialogEliminar?.razonSocial}</strong>? No se eliminarán registros históricos.
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
