"use client"

/**
 * Componente ABM para gestión de Fondos Comunes de Inversión (FCI).
 * Incluye búsqueda, creación y edición de FCIs.
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
import { Plus, Pencil, Search } from "lucide-react"

export interface FciAbm {
  id: string
  nombre: string
  cuentaId: string
  moneda: string
  activo: boolean
  diasHabilesAlerta: number
  cuenta?: { nombre: string }
}

interface FciAbmProps {
  fcis: FciAbm[]
  cuentas: Array<{ id: string; nombre: string }>
}

/**
 * calcularFiltroFci: FciAbm string -> boolean
 *
 * Dado un FCI y un texto de búsqueda, devuelve true si el nombre contiene el texto.
 * Existe para filtrar la lista de FCIs en el ABM sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroFci({ nombre: "Sigma Pesos", ... }, "sigma") === true
 * calcularFiltroFci({ nombre: "Sigma Pesos", ... }, "pesos") === true
 * calcularFiltroFci({ nombre: "Sigma Pesos", ... }, "dolar") === false
 */
export function calcularFiltroFci(fci: FciAbm, busqueda: string): boolean {
  return fci.nombre.toLowerCase().includes(busqueda.toLowerCase())
}

function FciFormModal({ fci, cuentas, onSuccess }: { fci?: FciAbm; cuentas: Array<{ id: string; nombre: string }>; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!fci
  const [form, setForm] = useState({
    nombre: fci?.nombre ?? "",
    cuentaId: fci?.cuentaId ?? (cuentas[0]?.id ?? ""),
    moneda: fci?.moneda ?? "PESOS",
    activo: fci?.activo ?? true,
    diasHabilesAlerta: String(fci?.diasHabilesAlerta ?? "1"),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/fci/${fci.id}` : "/api/fci"
      const method = isEdit ? "PATCH" : "POST"
      const body = { ...form, diasHabilesAlerta: parseInt(form.diasHabilesAlerta) }
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
      <div><Label htmlFor="nombre">Nombre</Label><Input id="nombre" value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required /></div>
      <div><Label htmlFor="cuentaId">Cuenta</Label>
        <Select id="cuentaId" value={form.cuentaId} onChange={(e) => setForm(f => ({ ...f, cuentaId: e.target.value }))}>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Moneda</Label>
          <Select value={form.moneda} onChange={(e) => setForm(f => ({ ...f, moneda: e.target.value }))}>
            <option value="PESOS">PESOS</option>
            <option value="DOLARES">DOLARES</option>
            <option value="OTRO">OTRO</option>
          </Select>
        </div>
        <div><Label>Días hábiles alerta</Label><Input type="number" min="1" value={form.diasHabilesAlerta} onChange={(e) => setForm(f => ({ ...f, diasHabilesAlerta: e.target.value }))} /></div>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear FCI"}</Button>
      </div>
    </form>
  )
}

/**
 * FciAbm: FciAbmProps -> JSX.Element
 *
 * Dado la lista inicial de FCIs y cuentas disponibles, renderiza la tabla ABM con búsqueda, alta y edición.
 * Existe para centralizar la gestión de FCIs en el ABM del administrador.
 *
 * Ejemplos:
 * <FciAbm fcis={[]} cuentas={[]} /> // tabla vacía
 * <FciAbm fcis={fcis} cuentas={cuentas} /> // lista con botones editar
 * <FciAbm fcis={fcis} cuentas={cuentas} /> // búsqueda filtra por nombre
 */
export function FciAbm({ fcis: fcisIniciales, cuentas }: FciAbmProps) {
  const [fcis, setFcis] = useState(fcisIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [fciEdicion, setFciEdicion] = useState<FciAbm | null>(null)

  const filtrados = fcis.filter((f) => !busqueda || calcularFiltroFci(f, busqueda))

  function onSuccess() {
    setModalAlta(false)
    setFciEdicion(null)
    fetch("/api/fci").then(r => r.json()).then(d => setFcis(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar FCI..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button onClick={() => setModalAlta(true)} disabled={cuentas.length === 0}><Plus className="h-4 w-4 mr-1" /> Nuevo FCI</Button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">Cuenta</th>
              <th className="text-left px-4 py-3">Moneda</th>
              <th className="text-left px-4 py-3">Alerta (días háb.)</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((f) => (
              <tr key={f.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{f.nombre}</td>
                <td className="px-4 py-3">{f.cuenta?.nombre ?? cuentas.find(c => c.id === f.cuentaId)?.nombre ?? f.cuentaId}</td>
                <td className="px-4 py-3">{f.moneda}</td>
                <td className="px-4 py-3">{f.diasHabilesAlerta}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${f.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {f.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setFciEdicion(f)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin FCIs{busqueda ? " que coincidan" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo FCI</DialogTitle><DialogDescription>Agregar un fondo común de inversión</DialogDescription></DialogHeader>
          <FciFormModal cuentas={cuentas} onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!fciEdicion} onOpenChange={() => setFciEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar FCI</DialogTitle><DialogDescription>{fciEdicion?.nombre}</DialogDescription></DialogHeader>
          {fciEdicion && <FciFormModal fci={fciEdicion} cuentas={cuentas} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
