"use client"

/**
 * ABM Camiones JM. Versión simplificada (sin pólizas ni infracciones por ahora).
 * Todos los camiones son propios en JM.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Pencil, Search } from "lucide-react"

export interface CamionJmAbm {
  id: string
  patenteChasis: string
  patenteAcoplado: string | null
  activo: boolean
}

interface CamionesAbmJmProps {
  camiones: CamionJmAbm[]
}

function CamionFormModal({ camion, onSuccess }: { camion?: CamionJmAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!camion
  const [form, setForm] = useState({
    patenteChasis: camion?.patenteChasis ?? "",
    patenteAcoplado: camion?.patenteAcoplado ?? "",
    activo: camion?.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const url = isEdit ? `/api/jm/camiones/${camion.id}` : "/api/jm/camiones"
      const method = isEdit ? "PATCH" : "POST"
      const body = {
        ...(isEdit ? {} : { patenteChasis: form.patenteChasis.toUpperCase() }),
        patenteAcoplado: form.patenteAcoplado.trim() ? form.patenteAcoplado.toUpperCase() : null,
        ...(isEdit ? { activo: form.activo } : {}),
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
      <div><Label>Patente chasis</Label><Input value={form.patenteChasis} onChange={(e) => setForm(f => ({ ...f, patenteChasis: e.target.value.toUpperCase() }))} required disabled={isEdit} /></div>
      <div><Label>Patente acoplado <span className="text-muted-foreground text-xs">(opcional)</span></Label><Input value={form.patenteAcoplado} onChange={(e) => setForm(f => ({ ...f, patenteAcoplado: e.target.value.toUpperCase() }))} /></div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear camión"}</Button>
      </div>
    </form>
  )
}

export function CamionesAbmJm({ camiones: camionesIniciales }: CamionesAbmJmProps) {
  const [camiones, setCamiones] = useState(camionesIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [edicion, setEdicion] = useState<CamionJmAbm | null>(null)

  const filtrados = camiones.filter((c) =>
    !busqueda ||
    c.patenteChasis.toLowerCase().includes(busqueda.toLowerCase()) ||
    (c.patenteAcoplado ?? "").toLowerCase().includes(busqueda.toLowerCase())
  )

  function onSuccess() {
    setModalAlta(false); setEdicion(null)
    fetch("/api/jm/camiones").then(r => r.json()).then(d => setCamiones(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por patente..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button onClick={() => setModalAlta(true)}><Plus className="h-4 w-4 mr-1" /> Nuevo camión</Button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3">Patente chasis</th>
              <th className="text-left px-4 py-3">Patente acoplado</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((c) => (
              <tr key={c.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{c.patenteChasis}</td>
                <td className="px-4 py-3">{c.patenteAcoplado ?? "—"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${c.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {c.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setEdicion(c)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={4} className="px-4 py-8 text-center text-muted-foreground">Sin camiones{busqueda ? " que coincidan" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo camión</DialogTitle></DialogHeader>
          <CamionFormModal onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!edicion} onOpenChange={() => setEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar camión</DialogTitle></DialogHeader>
          {edicion && <CamionFormModal camion={edicion} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
