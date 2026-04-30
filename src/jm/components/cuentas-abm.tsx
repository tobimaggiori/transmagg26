"use client"

/**
 * ABM Cuentas + Bancos + Billeteras Virtuales + Brokers para JM.
 * Versión simplificada (sin libro de banco, sin conciliación, sin FCI).
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Plus, Search } from "lucide-react"

export interface CuentaJmAbm {
  id: string
  nombre: string
  tipo: string
  moneda: string
  saldoInicial: number | string
  banco: { id: string; nombre: string } | null
  billetera: { id: string; nombre: string } | null
  broker: { id: string; nombre: string } | null
  nroCuenta: string | null
  cbu: string | null
  alias: string | null
  activa: boolean
}

export interface BancoJmAbm { id: string; nombre: string }
export interface BilleteraJmAbm { id: string; nombre: string }
export interface BrokerJmAbm { id: string; nombre: string; cuit: string }

interface Props {
  cuentas: CuentaJmAbm[]
  bancos: BancoJmAbm[]
  billeteras: BilleteraJmAbm[]
  brokers: BrokerJmAbm[]
}

function CuentaForm({
  bancos, billeteras, brokers, onSuccess,
}: {
  bancos: BancoJmAbm[]
  billeteras: BilleteraJmAbm[]
  brokers: BrokerJmAbm[]
  onSuccess: () => void
}) {
  const router = useRouter()
  const [form, setForm] = useState({
    nombre: "",
    tipo: "BANCO",
    bancoId: "",
    billeteraId: "",
    brokerId: "",
    moneda: "PESOS",
    saldoInicial: "0",
    fechaSaldoInicial: "",
    nroCuenta: "",
    cbu: "",
    alias: "",
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const body: Record<string, unknown> = {
        nombre: form.nombre,
        tipo: form.tipo,
        moneda: form.moneda,
        saldoInicial: Number(form.saldoInicial) || 0,
        fechaSaldoInicial: form.fechaSaldoInicial || null,
        nroCuenta: form.nroCuenta.trim() || null,
        cbu: form.cbu.trim() || null,
        alias: form.alias.trim() || null,
      }
      if (form.tipo === "BANCO") body.bancoId = form.bancoId
      if (form.tipo === "BILLETERA_VIRTUAL") body.billeteraId = form.billeteraId
      if (form.tipo === "BROKER") body.brokerId = form.brokerId

      const res = await fetch("/api/jm/cuentas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        router.refresh()
        onSuccess()
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required /></div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Tipo</Label>
          <Select value={form.tipo} onChange={(e) => setForm(f => ({ ...f, tipo: e.target.value }))}>
            <option value="BANCO">Banco</option>
            <option value="BILLETERA_VIRTUAL">Billetera virtual</option>
            <option value="BROKER">Broker</option>
          </Select>
        </div>
        <div>
          <Label>Moneda</Label>
          <Select value={form.moneda} onChange={(e) => setForm(f => ({ ...f, moneda: e.target.value }))}>
            <option value="PESOS">Pesos</option>
            <option value="DOLARES">Dólares</option>
            <option value="OTRO">Otro</option>
          </Select>
        </div>
      </div>
      {form.tipo === "BANCO" && (
        <div>
          <Label>Banco</Label>
          <Select value={form.bancoId} onChange={(e) => setForm(f => ({ ...f, bancoId: e.target.value }))} required>
            <option value="">— Elegí —</option>
            {bancos.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </div>
      )}
      {form.tipo === "BILLETERA_VIRTUAL" && (
        <div>
          <Label>Billetera</Label>
          <Select value={form.billeteraId} onChange={(e) => setForm(f => ({ ...f, billeteraId: e.target.value }))} required>
            <option value="">— Elegí —</option>
            {billeteras.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </div>
      )}
      {form.tipo === "BROKER" && (
        <div>
          <Label>Broker</Label>
          <Select value={form.brokerId} onChange={(e) => setForm(f => ({ ...f, brokerId: e.target.value }))} required>
            <option value="">— Elegí —</option>
            {brokers.map(b => <option key={b.id} value={b.id}>{b.nombre}</option>)}
          </Select>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Saldo inicial</Label><Input type="number" step="0.01" value={form.saldoInicial} onChange={(e) => setForm(f => ({ ...f, saldoInicial: e.target.value }))} /></div>
        <div><Label>Fecha saldo inicial</Label><Input type="date" value={form.fechaSaldoInicial} onChange={(e) => setForm(f => ({ ...f, fechaSaldoInicial: e.target.value }))} /></div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div><Label>Nro Cuenta</Label><Input value={form.nroCuenta} onChange={(e) => setForm(f => ({ ...f, nroCuenta: e.target.value }))} /></div>
        <div><Label>CBU</Label><Input value={form.cbu} onChange={(e) => setForm(f => ({ ...f, cbu: e.target.value }))} maxLength={22} /></div>
      </div>
      <div><Label>Alias</Label><Input value={form.alias} onChange={(e) => setForm(f => ({ ...f, alias: e.target.value }))} /></div>
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear cuenta"}</Button>
      </div>
    </form>
  )
}

function NombreSimpleForm({ url, onSuccess }: { url: string; onSuccess: () => void }) {
  const router = useRouter()
  const [nombre, setNombre] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ nombre }),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        router.refresh()
        onSuccess()
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label>Nombre</Label><Input value={nombre} onChange={(e) => setNombre(e.target.value)} required autoFocus /></div>
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear"}</Button>
      </div>
    </form>
  )
}

function BrokerForm({ onSuccess }: { onSuccess: () => void }) {
  const router = useRouter()
  const [form, setForm] = useState({ nombre: "", cuit: "" })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/jm/brokers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!res.ok) {
        const d = await res.json()
        setError(d.error ?? "Error al guardar")
      } else {
        router.refresh()
        onSuccess()
      }
    } finally { setLoading(false) }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div><Label>Nombre</Label><Input value={form.nombre} onChange={(e) => setForm(f => ({ ...f, nombre: e.target.value }))} required autoFocus /></div>
      <div><Label>CUIT</Label><Input value={form.cuit} onChange={(e) => setForm(f => ({ ...f, cuit: e.target.value.replace(/\D/g, "") }))} maxLength={11} required /></div>
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>{loading ? "Guardando..." : "Crear broker"}</Button>
      </div>
    </form>
  )
}

export function CuentasAbmJm({ cuentas, bancos, billeteras, brokers }: Props) {
  const [tab, setTab] = useState<"cuentas" | "bancos" | "billeteras" | "brokers">("cuentas")
  const [busqueda, setBusqueda] = useState("")
  const [modal, setModal] = useState<null | "cuenta" | "banco" | "billetera" | "broker">(null)

  const cuentasFiltradas = cuentas.filter(c =>
    !busqueda ||
    c.nombre.toLowerCase().includes(busqueda.toLowerCase())
  )

  return (
    <div className="space-y-4">
      <div className="flex gap-2 border-b">
        <button onClick={() => setTab("cuentas")} className={`px-4 py-2 text-sm font-medium ${tab === "cuentas" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Cuentas</button>
        <button onClick={() => setTab("bancos")} className={`px-4 py-2 text-sm font-medium ${tab === "bancos" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Bancos</button>
        <button onClick={() => setTab("billeteras")} className={`px-4 py-2 text-sm font-medium ${tab === "billeteras" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Billeteras</button>
        <button onClick={() => setTab("brokers")} className={`px-4 py-2 text-sm font-medium ${tab === "brokers" ? "border-b-2 border-primary text-foreground" : "text-muted-foreground"}`}>Brokers</button>
      </div>

      {tab === "cuentas" && (
        <>
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar cuenta..." value={busqueda} onChange={(e) => setBusqueda(e.target.value)} />
            </div>
            <Button onClick={() => setModal("cuenta")}><Plus className="h-4 w-4 mr-1" /> Nueva cuenta</Button>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3">Nombre</th>
                  <th className="text-left px-4 py-3">Tipo</th>
                  <th className="text-left px-4 py-3">Banco/Bill./Broker</th>
                  <th className="text-left px-4 py-3">Moneda</th>
                  <th className="text-left px-4 py-3">CBU/Alias</th>
                  <th className="text-left px-4 py-3">Estado</th>
                </tr>
              </thead>
              <tbody>
                {cuentasFiltradas.map(c => (
                  <tr key={c.id} className="border-t hover:bg-muted/20">
                    <td className="px-4 py-3 font-medium">{c.nombre}</td>
                    <td className="px-4 py-3">{c.tipo.replace(/_/g, " ")}</td>
                    <td className="px-4 py-3">{c.banco?.nombre ?? c.billetera?.nombre ?? c.broker?.nombre ?? "—"}</td>
                    <td className="px-4 py-3">{c.moneda}</td>
                    <td className="px-4 py-3 text-xs">{c.alias ?? c.cbu ?? "—"}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${c.activa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"}`}>
                        {c.activa ? "Activa" : "Inactiva"}
                      </span>
                    </td>
                  </tr>
                ))}
                {cuentasFiltradas.length === 0 && <tr><td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">Sin cuentas.</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === "bancos" && (
        <SimpleListSection title="Bancos" items={bancos} onAdd={() => setModal("banco")} />
      )}
      {tab === "billeteras" && (
        <SimpleListSection title="Billeteras" items={billeteras} onAdd={() => setModal("billetera")} />
      )}
      {tab === "brokers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-sm font-medium">Brokers</h3>
            <Button onClick={() => setModal("broker")}><Plus className="h-4 w-4 mr-1" /> Nuevo broker</Button>
          </div>
          <div className="border rounded overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-muted/50"><tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">CUIT</th>
              </tr></thead>
              <tbody>
                {brokers.map(b => <tr key={b.id} className="border-t"><td className="px-4 py-3 font-medium">{b.nombre}</td><td className="px-4 py-3">{b.cuit}</td></tr>)}
                {brokers.length === 0 && <tr><td colSpan={2} className="px-4 py-8 text-center text-muted-foreground">Sin brokers.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      )}

      <Dialog open={modal === "cuenta"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent>
          <DialogHeader><DialogTitle>Nueva cuenta</DialogTitle></DialogHeader>
          <CuentaForm bancos={bancos} billeteras={billeteras} brokers={brokers} onSuccess={() => setModal(null)} />
        </DialogContent>
      </Dialog>
      <Dialog open={modal === "banco"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo banco</DialogTitle></DialogHeader><NombreSimpleForm url="/api/jm/bancos" onSuccess={() => setModal(null)} /></DialogContent>
      </Dialog>
      <Dialog open={modal === "billetera"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent><DialogHeader><DialogTitle>Nueva billetera</DialogTitle></DialogHeader><NombreSimpleForm url="/api/jm/billeteras-virtuales" onSuccess={() => setModal(null)} /></DialogContent>
      </Dialog>
      <Dialog open={modal === "broker"} onOpenChange={(o) => !o && setModal(null)}>
        <DialogContent><DialogHeader><DialogTitle>Nuevo broker</DialogTitle></DialogHeader><BrokerForm onSuccess={() => setModal(null)} /></DialogContent>
      </Dialog>
    </div>
  )
}

function SimpleListSection({ title, items, onAdd }: { title: string; items: { id: string; nombre: string }[]; onAdd: () => void }) {
  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">{title}</h3>
        <Button onClick={onAdd}><Plus className="h-4 w-4 mr-1" /> Nuevo</Button>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50"><tr><th className="text-left px-4 py-3">Nombre</th></tr></thead>
          <tbody>
            {items.map(it => <tr key={it.id} className="border-t"><td className="px-4 py-3 font-medium">{it.nombre}</td></tr>)}
            {items.length === 0 && <tr><td className="px-4 py-8 text-center text-muted-foreground">Sin registros.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  )
}
