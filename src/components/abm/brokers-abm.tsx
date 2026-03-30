"use client"

/**
 * Componente ABM para gestión de brokers financieros.
 * Incluye búsqueda, creación y edición.
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
import { Plus, Pencil, Search } from "lucide-react"

export interface BrokerAbm {
  id: string
  nombre: string
  cuit: string
  cuentaId: string
  activo: boolean
  cuenta?: { nombre: string }
}

interface BrokersAbmProps {
  brokers: BrokerAbm[]
  cuentas: Array<{ id: string; nombre: string }>
}

/**
 * calcularFiltroBroker: BrokerAbm string -> boolean
 *
 * Dado un broker y un texto de búsqueda, devuelve true si el nombre o CUIT contienen el texto.
 * Existe para filtrar la lista de brokers en el ABM sin roundtrips al servidor.
 *
 * Ejemplos:
 * calcularFiltroBroker({ nombre: "IOL", cuit: "30123456789", ... }, "iol") === true
 * calcularFiltroBroker({ nombre: "IOL", cuit: "30123456789", ... }, "301") === true
 * calcularFiltroBroker({ nombre: "IOL", cuit: "30123456789", ... }, "xyz") === false
 */
export function calcularFiltroBroker(broker: BrokerAbm, busqueda: string): boolean {
  const q = busqueda.toLowerCase()
  return broker.nombre.toLowerCase().includes(q) || broker.cuit.includes(q)
}

function BrokerFormModal({ broker, cuentas, onSuccess }: { broker?: BrokerAbm; cuentas: Array<{ id: string; nombre: string }>; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!broker
  const [form, setForm] = useState({
    nombre: broker?.nombre ?? "",
    cuit: broker?.cuit ?? "",
    cuentaId: broker?.cuentaId ?? (cuentas[0]?.id ?? ""),
    activo: broker?.activo ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/brokers/${broker.id}` : "/api/brokers"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) })
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
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required /></div>
        <div><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value }))} placeholder="11 dígitos sin guiones" /></div>
      </div>
      <div><Label>Cuenta comitente</Label>
        <Select value={form.cuentaId} onChange={(e) => setForm(f => ({ ...f, cuentaId: e.target.value }))}>
          {cuentas.map(c => <option key={c.id} value={c.id}>{c.nombre}</option>)}
        </Select>
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={form.activo} onChange={(e) => setForm(f => ({ ...f, activo: e.target.checked }))} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : isEdit ? "Guardar cambios" : "Crear broker"}</Button>
      </div>
    </form>
  )
}

/**
 * BrokersAbm: BrokersAbmProps -> JSX.Element
 *
 * Dado la lista inicial de brokers y cuentas, renderiza la tabla ABM con búsqueda, alta y edición.
 * Existe para centralizar la gestión de brokers financieros en el ABM del administrador.
 *
 * Ejemplos:
 * <BrokersAbm brokers={[]} cuentas={[]} /> // tabla vacía
 * <BrokersAbm brokers={brokers} cuentas={cuentas} /> // lista filtrable
 * <BrokersAbm brokers={brokers} cuentas={cuentas} /> // modal al hacer click en Editar
 */
export function BrokersAbm({ brokers: brokersIniciales, cuentas }: BrokersAbmProps) {
  const [brokers, setBrokers] = useState(brokersIniciales)
  const [busqueda, setBusqueda] = useState("")
  const [modalAlta, setModalAlta] = useState(false)
  const [brokerEdicion, setBrokerEdicion] = useState<BrokerAbm | null>(null)

  const filtrados = brokers.filter((b) => !busqueda || calcularFiltroBroker(b, busqueda))

  function onSuccess() {
    setModalAlta(false)
    setBrokerEdicion(null)
    fetch("/api/brokers").then(r => r.json()).then(d => setBrokers(Array.isArray(d) ? d : []))
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar broker..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
        </div>
        <Button onClick={() => setModalAlta(true)} disabled={cuentas.length === 0}><Plus className="h-4 w-4 mr-1" /> Nuevo broker</Button>
      </div>

      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-3">Nombre</th>
              <th className="text-left px-4 py-3">CUIT</th>
              <th className="text-left px-4 py-3">Cuenta comitente</th>
              <th className="text-left px-4 py-3">Estado</th>
              <th className="text-right px-4 py-3">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((b) => (
              <tr key={b.id} className="border-t hover:bg-muted/20">
                <td className="px-4 py-3 font-medium">{b.nombre}</td>
                <td className="px-4 py-3">{formatearCuit(b.cuit)}</td>
                <td className="px-4 py-3">{b.cuenta?.nombre ?? cuentas.find(c => c.id === b.cuentaId)?.nombre ?? "-"}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${b.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                    {b.activo ? "Activo" : "Inactivo"}
                  </span>
                </td>
                <td className="px-4 py-3 text-right">
                  <Button variant="outline" size="sm" onClick={() => setBrokerEdicion(b)}>
                    <Pencil className="h-3 w-3 mr-1" /> Editar
                  </Button>
                </td>
              </tr>
            ))}
            {filtrados.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">Sin brokers{busqueda ? " que coincidan" : ""}.</td></tr>
            )}
          </tbody>
        </table>
      </div>

      <Dialog open={modalAlta} onOpenChange={setModalAlta}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nuevo broker</DialogTitle><DialogDescription>Agregar un broker de inversión</DialogDescription></DialogHeader>
          <BrokerFormModal cuentas={cuentas} onSuccess={onSuccess} />
        </DialogContent>
      </Dialog>

      <Dialog open={!!brokerEdicion} onOpenChange={() => setBrokerEdicion(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Editar broker</DialogTitle><DialogDescription>{brokerEdicion?.nombre}</DialogDescription></DialogHeader>
          {brokerEdicion && <BrokerFormModal broker={brokerEdicion} cuentas={cuentas} onSuccess={onSuccess} />}
        </DialogContent>
      </Dialog>
    </div>
  )
}
