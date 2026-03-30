"use client"

/**
 * Componente ABM para gestión de empresas clientes.
 * Incluye búsqueda, creación, edición y desactivación con dialogs.
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
import { Plus, Pencil, Trash2, Search } from "lucide-react"

export interface EmpresaAbm {
  id: string
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion: string | null
}

interface EmpresasAbmProps {
  empresas: EmpresaAbm[]
}

/**
 * calcularFiltroEmpresa: EmpresaAbm string -> boolean
 *
 * Dado una empresa y un texto de búsqueda, devuelve true si la razón social
 * o el CUIT contienen el texto (insensible a mayúsculas/minúsculas).
 * Existe para filtrar la lista de empresas en el cliente sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroEmpresa({ razonSocial: "ADS SA", cuit: "30714295698", ... }, "ads") === true
 * calcularFiltroEmpresa({ razonSocial: "ADS SA", cuit: "30714295698", ... }, "307") === true
 * calcularFiltroEmpresa({ razonSocial: "ADS SA", cuit: "30714295698", ... }, "xyz") === false
 */
export function calcularFiltroEmpresa(empresa: EmpresaAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return empresa.razonSocial.toLowerCase().includes(q) || empresa.cuit.includes(q)
}

function EmpresaFormModal({
  empresa,
  onSuccess,
}: {
  empresa?: EmpresaAbm
  onSuccess: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    razonSocial: empresa?.razonSocial ?? "",
    cuit: empresa?.cuit ?? "",
    condicionIva: empresa?.condicionIva ?? "RESPONSABLE_INSCRIPTO",
    direccion: empresa?.direccion ?? "",
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
      const url = isEdit ? `/api/empresas/${empresa.id}` : "/api/empresas"
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
        <Label htmlFor="razonSocial">Razón social *</Label>
        <Input id="razonSocial" name="razonSocial" value={form.razonSocial} onChange={handleChange} required disabled={loading} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label htmlFor="cuit">CUIT (sin guiones) *</Label>
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
        <Label htmlFor="direccion">Dirección</Label>
        <Input id="direccion" name="direccion" value={form.direccion} onChange={handleChange} disabled={loading} />
      </div>
      <FormError message={error} />
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="outline" onClick={onSuccess} disabled={loading}>Cancelar</Button>
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear empresa"}</Button>
      </div>
    </form>
  )
}

/**
 * EmpresasAbm: EmpresasAbmProps -> JSX.Element
 *
 * Dado el listado de empresas, renderiza la tabla ABM con buscador por razón social/CUIT,
 * botones Editar/Desactivar por fila y dialog de nueva empresa.
 * Existe para centralizar el alta, baja y modificación de empresas clientes
 * en la sección ABM, separada de la operatoria.
 *
 * Ejemplos:
 * <EmpresasAbm empresas={[{ id:"e1", razonSocial:"ADS SA", cuit:"30714295698", ... }]} />
 * // => lista filtrable con "ADS SA" + botones Editar/Desactivar
 * <EmpresasAbm empresas={[]} />
 * // => mensaje "No hay empresas" + botón "Nueva empresa"
 * // => búsqueda "xyz" en lista vacía → "Sin resultados"
 */
export function EmpresasAbm({ empresas }: EmpresasAbmProps) {
  const router = useRouter()
  const [busqueda, setBusqueda] = useState("")
  const [dialogCrear, setDialogCrear] = useState(false)
  const [dialogEditar, setDialogEditar] = useState<EmpresaAbm | null>(null)
  const [dialogEliminar, setDialogEliminar] = useState<EmpresaAbm | null>(null)
  const [loadingElim, setLoadingElim] = useState(false)
  const [errorElim, setErrorElim] = useState<string | null>(null)

  const filtradas = busqueda
    ? empresas.filter((e) => calcularFiltroEmpresa(e, busqueda))
    : empresas

  async function handleEliminar() {
    if (!dialogEliminar) return
    setLoadingElim(true)
    setErrorElim(null)
    try {
      const res = await fetch(`/api/empresas/${dialogEliminar.id}`, { method: "DELETE" })
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
        <div className="border rounded-lg divide-y">
          {filtradas.map((emp) => (
            <div key={emp.id} className="flex items-center justify-between px-4 py-3">
              <div>
                <p className="font-medium">{emp.razonSocial}</p>
                <p className="text-sm text-muted-foreground">
                  CUIT: {formatearCuit(emp.cuit)} &middot; {emp.condicionIva.replace(/_/g, " ")}
                  {emp.direccion ? ` · ${emp.direccion}` : ""}
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setDialogEditar(emp)}>
                  <Pencil className="h-3.5 w-3.5 mr-1" /> Editar
                </Button>
                <Button variant="destructive" size="sm" onClick={() => setDialogEliminar(emp)}>
                  <Trash2 className="h-3.5 w-3.5 mr-1" /> Desactivar
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Dialog: Nueva empresa */}
      <Dialog open={dialogCrear} onOpenChange={setDialogCrear}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva empresa</DialogTitle>
            <DialogDescription>Registrá una nueva empresa cliente.</DialogDescription>
          </DialogHeader>
          <EmpresaFormModal onSuccess={() => setDialogCrear(false)} />
        </DialogContent>
      </Dialog>

      {/* Dialog: Editar empresa */}
      <Dialog open={!!dialogEditar} onOpenChange={(o) => { if (!o) setDialogEditar(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar empresa</DialogTitle>
            <DialogDescription>Modificá los datos de la empresa.</DialogDescription>
          </DialogHeader>
          {dialogEditar && <EmpresaFormModal empresa={dialogEditar} onSuccess={() => setDialogEditar(null)} />}
        </DialogContent>
      </Dialog>

      {/* Dialog: Confirmar desactivación */}
      <Dialog open={!!dialogEliminar} onOpenChange={(o) => { if (!o) { setDialogEliminar(null); setErrorElim(null) } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Desactivar empresa</DialogTitle>
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
