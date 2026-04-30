"use client"

/**
 * ABM unificado de Bancos, Billeteras Virtuales, Brokers y sus Cuentas.
 *
 * Modelo:
 * - Banco / BilleteraVirtual / Broker son entidades maestras (tablas separadas).
 * - Cuenta.tipo = BANCO requiere bancoId; BILLETERA_VIRTUAL requiere billeteraId; BROKER requiere brokerId.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { parsearImporte } from "@/lib/money"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog"
import { Plus, Pencil, Search, Trash2, Building2, Wallet, LineChart } from "lucide-react"

// ─── Tipos compartidos ────────────────────────────────────────────────────────

export interface BancoAbm {
  id: string
  nombre: string
  activo: boolean
  cuentasCount: number
}

export interface BilleteraAbm {
  id: string
  nombre: string
  activa: boolean
  cuentasCount: number
}

export interface BrokerAbm {
  id: string
  nombre: string
  cuit: string
  activo: boolean
  cuentasCount: number
}

export interface CuentaAbm {
  id: string
  nombre: string
  tipo: string
  moneda: string
  activa: boolean
  tieneChequera: boolean
  tieneCuentaRemunerada: boolean
  tieneTarjetasPrepagasChoferes: boolean
  tieneImpuestoDebcred: boolean
  alicuotaImpuesto: number
  tieneIibbSircrebTucuman: boolean
  alicuotaIibbSircrebTucuman: number
  esCuentaComitenteBroker: boolean
  nroCuenta: string | null
  cbu: string | null
  alias: string | null
  bancoId: string | null
  billeteraId: string | null
  brokerId: string | null
  banco: { id: string; nombre: string; activo: boolean } | null
  billetera: { id: string; nombre: string; activa: boolean } | null
  broker: { id: string; nombre: string; cuit: string; activo: boolean } | null
  _count?: { movimientos: number }
}

interface CuentasAbmProps {
  cuentas: CuentaAbm[]
  bancos: BancoAbm[]
  billeteras: BilleteraAbm[]
  brokers: BrokerAbm[]
}

function matchText(text: string, q: string): boolean {
  return text.toLowerCase().includes(q.toLowerCase())
}

function tipoLabel(tipo: string): string {
  if (tipo === "BANCO") return "Cuenta bancaria"
  if (tipo === "BILLETERA_VIRTUAL") return "Billetera virtual"
  if (tipo === "BROKER") return "Broker"
  return tipo
}

function entidadNombre(c: CuentaAbm): string {
  return c.banco?.nombre ?? c.billetera?.nombre ?? c.broker?.nombre ?? ""
}

// ─── Form cuenta bancaria (tipo=BANCO) ─────────────────────────────────────────

function CuentaBancariaForm({
  cuenta,
  bancos,
  onSuccess,
  onCreateBanco,
}: {
  cuenta?: CuentaAbm
  bancos: BancoAbm[]
  onSuccess: () => void
  onCreateBanco: () => void
}) {
  const router = useRouter()
  const isEdit = !!cuenta
  const bancosActivos = bancos.filter((b) => b.activo || b.id === cuenta?.bancoId)
  const [form, setForm] = useState({
    bancoId: cuenta?.bancoId ?? bancosActivos[0]?.id ?? "",
    nombre: cuenta?.nombre ?? "",
    moneda: cuenta?.moneda ?? "PESOS",
    saldoInicial: "0",
    nroCuenta: cuenta?.nroCuenta ?? "",
    cbu: cuenta?.cbu ?? "",
    alias: cuenta?.alias ?? "",
    activa: cuenta?.activa ?? true,
    tieneChequera: cuenta?.tieneChequera ?? false,
    tieneCuentaRemunerada: cuenta?.tieneCuentaRemunerada ?? false,
    tieneTarjetasPrepagasChoferes: cuenta?.tieneTarjetasPrepagasChoferes ?? false,
    tieneImpuestoDebcred: cuenta?.tieneImpuestoDebcred ?? false,
    alicuotaImpuesto: String(cuenta?.alicuotaImpuesto ?? "0.006"),
    tieneIibbSircrebTucuman: cuenta?.tieneIibbSircrebTucuman ?? false,
    alicuotaIibbSircrebTucuman: String(cuenta?.alicuotaIibbSircrebTucuman ?? "0.06"),
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.bancoId) {
      setError("Seleccioná un banco")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const basePayload = {
        tipo: "BANCO",
        bancoId: form.bancoId,
        billeteraId: null,
        brokerId: null,
        nombre: form.nombre.trim(),
        moneda: form.moneda,
        activa: form.activa,
        nroCuenta: form.nroCuenta.trim() || null,
        cbu: form.cbu.trim() || null,
        alias: form.alias.trim() || null,
        tieneChequera: form.tieneChequera,
        tieneCuentaRemunerada: form.tieneCuentaRemunerada,
        tieneTarjetasPrepagasChoferes: form.tieneTarjetasPrepagasChoferes,
        tieneImpuestoDebcred: form.tieneImpuestoDebcred,
        alicuotaImpuesto: parseFloat(form.alicuotaImpuesto),
        tieneIibbSircrebTucuman: form.tieneIibbSircrebTucuman,
        alicuotaIibbSircrebTucuman: parseFloat(form.alicuotaIibbSircrebTucuman),
      }
      const payload = isEdit
        ? basePayload
        : { ...basePayload, saldoInicial: parsearImporte(form.saldoInicial) }

      const url = isEdit ? `/api/cuentas/${cuenta.id}` : "/api/cuentas"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
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
      <div>
        <Label>Banco</Label>
        <div className="flex gap-2">
          <Select
            value={form.bancoId}
            onChange={(e) => setForm((f) => ({ ...f, bancoId: e.target.value }))}
            className="flex-1"
          >
            <option value="">Seleccionar banco…</option>
            {bancosActivos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" onClick={onCreateBanco}>
            <Plus className="h-3 w-3 mr-1" /> Nuevo
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre</Label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Galicia CC ARS"
            required
          />
        </div>
        <div>
          <Label>Moneda</Label>
          <Select
            value={form.moneda}
            onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}
          >
            <option value="PESOS">PESOS (ARS)</option>
            <option value="DOLARES">DOLARES (USD)</option>
            <option value="OTRO">OTRO</option>
          </Select>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div>
          <Label>N° de cuenta</Label>
          <Input
            value={form.nroCuenta}
            onChange={(e) => setForm((f) => ({ ...f, nroCuenta: e.target.value }))}
            placeholder="Opcional"
          />
        </div>
      </div>
      {!isEdit && (
        <div>
          <Label>Saldo inicial</Label>
          <Input
            type="number"
            value={form.saldoInicial}
            onChange={(e) => setForm((f) => ({ ...f, saldoInicial: e.target.value }))}
          />
        </div>
      )}
      <div className="grid grid-cols-2 gap-3 pt-2 border-t">
        {[
          { key: "tieneChequera", label: "Chequera" },
          { key: "tieneCuentaRemunerada", label: "Cuenta remunerada" },
          { key: "tieneTarjetasPrepagasChoferes", label: "Tarjetas prepagas (choferes)" },
          { key: "tieneImpuestoDebcred", label: "Impuesto deb/cred" },
          { key: "tieneIibbSircrebTucuman", label: "IIBB SIRCREB Tucumán" },
        ].map(({ key, label }) => (
          <label key={key} className="flex items-center gap-2 text-sm cursor-pointer">
            <input
              type="checkbox"
              checked={form[key as keyof typeof form] as boolean}
              onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.checked }))}
            />
            {label}
          </label>
        ))}
      </div>
      {form.tieneImpuestoDebcred && (
        <div>
          <Label>Alícuota impuesto deb/cred</Label>
          <Input
            type="number"
            step="0.001"
            value={form.alicuotaImpuesto}
            onChange={(e) => setForm((f) => ({ ...f, alicuotaImpuesto: e.target.value }))}
          />
        </div>
      )}
      {form.tieneIibbSircrebTucuman && (
        <div>
          <Label>Alícuota IIBB SIRCREB Tucumán</Label>
          <Input
            type="number"
            step="0.001"
            value={form.alicuotaIibbSircrebTucuman}
            onChange={(e) =>
              setForm((f) => ({ ...f, alicuotaIibbSircrebTucuman: e.target.value }))
            }
          />
        </div>
      )}
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t">
          <input
            type="checkbox"
            checked={form.activa}
            onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))}
          />
          Activa
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cuenta"}
        </Button>
      </div>
    </form>
  )
}

// ─── Form cuenta de billetera (tipo=BILLETERA_VIRTUAL) ────────────────────────

function CuentaBilleteraForm({
  cuenta,
  billeteras,
  onSuccess,
  onCreateBilletera,
}: {
  cuenta?: CuentaAbm
  billeteras: BilleteraAbm[]
  onSuccess: () => void
  onCreateBilletera: () => void
}) {
  const router = useRouter()
  const isEdit = !!cuenta
  const billeterasActivas = billeteras.filter((b) => b.activa || b.id === cuenta?.billeteraId)
  const [form, setForm] = useState({
    billeteraId: cuenta?.billeteraId ?? billeterasActivas[0]?.id ?? "",
    nombre: cuenta?.nombre ?? "",
    moneda: cuenta?.moneda ?? "PESOS",
    saldoInicial: "0",
    activa: cuenta?.activa ?? true,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.billeteraId) {
      setError("Seleccioná una billetera")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const basePayload = {
        tipo: "BILLETERA_VIRTUAL",
        bancoId: null,
        billeteraId: form.billeteraId,
        brokerId: null,
        nombre: form.nombre.trim(),
        moneda: form.moneda,
        activa: form.activa,
      }
      const payload = isEdit
        ? basePayload
        : { ...basePayload, saldoInicial: parsearImporte(form.saldoInicial) }

      const url = isEdit ? `/api/cuentas/${cuenta.id}` : "/api/cuentas"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
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
      <div>
        <Label>Billetera virtual</Label>
        <div className="flex gap-2">
          <Select
            value={form.billeteraId}
            onChange={(e) => setForm((f) => ({ ...f, billeteraId: e.target.value }))}
            className="flex-1"
          >
            <option value="">Seleccionar billetera…</option>
            {billeterasActivas.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" onClick={onCreateBilletera}>
            <Plus className="h-3 w-3 mr-1" /> Nueva
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre</Label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: MercadoPago principal"
            required
          />
        </div>
        <div>
          <Label>Moneda</Label>
          <Select value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}>
            <option value="PESOS">PESOS (ARS)</option>
            <option value="DOLARES">DOLARES (USD)</option>
            <option value="OTRO">OTRO</option>
          </Select>
        </div>
      </div>
      {!isEdit && (
        <div>
          <Label>Saldo inicial</Label>
          <Input
            type="number"
            value={form.saldoInicial}
            onChange={(e) => setForm((f) => ({ ...f, saldoInicial: e.target.value }))}
          />
        </div>
      )}
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t">
          <input type="checkbox" checked={form.activa} onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))} />
          Activa
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cuenta"}
        </Button>
      </div>
    </form>
  )
}

// ─── Form cuenta de broker (tipo=BROKER) ──────────────────────────────────────

function CuentaBrokerForm({
  cuenta,
  brokers,
  onSuccess,
  onCreateBroker,
}: {
  cuenta?: CuentaAbm
  brokers: BrokerAbm[]
  onSuccess: () => void
  onCreateBroker: () => void
}) {
  const router = useRouter()
  const isEdit = !!cuenta
  const brokersActivos = brokers.filter((b) => b.activo || b.id === cuenta?.brokerId)
  const [form, setForm] = useState({
    brokerId: cuenta?.brokerId ?? brokersActivos[0]?.id ?? "",
    nombre: cuenta?.nombre ?? "",
    moneda: cuenta?.moneda ?? "PESOS",
    saldoInicial: "0",
    activa: cuenta?.activa ?? true,
    esCuentaComitenteBroker: cuenta?.esCuentaComitenteBroker ?? false,
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!form.brokerId) {
      setError("Seleccioná un broker")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const basePayload = {
        tipo: "BROKER",
        bancoId: null,
        billeteraId: null,
        brokerId: form.brokerId,
        nombre: form.nombre.trim(),
        moneda: form.moneda,
        activa: form.activa,
        esCuentaComitenteBroker: form.esCuentaComitenteBroker,
      }
      const payload = isEdit
        ? basePayload
        : { ...basePayload, saldoInicial: parsearImporte(form.saldoInicial) }

      const url = isEdit ? `/api/cuentas/${cuenta.id}` : "/api/cuentas"
      const method = isEdit ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
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
      <div>
        <Label>Broker</Label>
        <div className="flex gap-2">
          <Select
            value={form.brokerId}
            onChange={(e) => setForm((f) => ({ ...f, brokerId: e.target.value }))}
            className="flex-1"
          >
            <option value="">Seleccionar broker…</option>
            {brokersActivos.map((b) => (
              <option key={b.id} value={b.id}>
                {b.nombre}
              </option>
            ))}
          </Select>
          <Button type="button" variant="outline" onClick={onCreateBroker}>
            <Plus className="h-3 w-3 mr-1" /> Nuevo
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <Label>Nombre</Label>
          <Input
            value={form.nombre}
            onChange={(e) => setForm((f) => ({ ...f, nombre: e.target.value }))}
            placeholder="Ej: Bull Market comitente"
            required
          />
        </div>
        <div>
          <Label>Moneda</Label>
          <Select value={form.moneda} onChange={(e) => setForm((f) => ({ ...f, moneda: e.target.value }))}>
            <option value="PESOS">PESOS (ARS)</option>
            <option value="DOLARES">DOLARES (USD)</option>
            <option value="OTRO">OTRO</option>
          </Select>
        </div>
      </div>
      {!isEdit && (
        <div>
          <Label>Saldo inicial</Label>
          <Input
            type="number"
            value={form.saldoInicial}
            onChange={(e) => setForm((f) => ({ ...f, saldoInicial: e.target.value }))}
          />
        </div>
      )}
      <label className="flex items-center gap-2 text-sm cursor-pointer">
        <input
          type="checkbox"
          checked={form.esCuentaComitenteBroker}
          onChange={(e) => setForm((f) => ({ ...f, esCuentaComitenteBroker: e.target.checked }))}
        />
        Es cuenta comitente del broker
      </label>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer pt-2 border-t">
          <input type="checkbox" checked={form.activa} onChange={(e) => setForm((f) => ({ ...f, activa: e.target.checked }))} />
          Activa
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear cuenta"}
        </Button>
      </div>
    </form>
  )
}

// ─── Forms de entidades maestras ──────────────────────────────────────────────

function BancoForm({ banco, onSuccess }: { banco?: BancoAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!banco
  const [nombre, setNombre] = useState(banco?.nombre ?? "")
  const [activo, setActivo] = useState(banco?.activo ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/bancos/${banco.id}` : "/api/bancos"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit ? { nombre: nombre.trim(), activo } : { nombre: nombre.trim() }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
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
      <div>
        <Label>Nombre del banco</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: Banco Galicia" required />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear banco"}
        </Button>
      </div>
    </form>
  )
}

function BilleteraForm({ billetera, onSuccess }: { billetera?: BilleteraAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!billetera
  const [nombre, setNombre] = useState(billetera?.nombre ?? "")
  const [activa, setActiva] = useState(billetera?.activa ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/billeteras-virtuales/${billetera.id}` : "/api/billeteras-virtuales"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit ? { nombre: nombre.trim(), activa } : { nombre: nombre.trim() }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
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
      <div>
        <Label>Nombre de la billetera</Label>
        <Input value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Ej: MercadoPago" required />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={activa} onChange={(e) => setActiva(e.target.checked)} />
          Activa
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear billetera"}
        </Button>
      </div>
    </form>
  )
}

function BrokerForm({ broker, onSuccess }: { broker?: BrokerAbm; onSuccess: () => void }) {
  const router = useRouter()
  const isEdit = !!broker
  const [nombre, setNombre] = useState(broker?.nombre ?? "")
  const [cuit, setCuit] = useState(broker?.cuit ?? "")
  const [activo, setActivo] = useState(broker?.activo ?? true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) {
      setError("El nombre es obligatorio")
      return
    }
    if (!/^\d{11}$/.test(cuit)) {
      setError("El CUIT debe tener 11 dígitos")
      return
    }
    setLoading(true)
    setError(null)
    try {
      const url = isEdit ? `/api/brokers/${broker.id}` : "/api/brokers"
      const method = isEdit ? "PATCH" : "POST"
      const body = isEdit
        ? { nombre: nombre.trim(), cuit, activo }
        : { nombre: nombre.trim(), cuit }
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
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
      <div>
        <Label>Nombre del broker</Label>
        <Input
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
          placeholder="Ej: Bull Market Brokers"
          required
        />
      </div>
      <div>
        <Label>CUIT (11 dígitos)</Label>
        <Input value={cuit} onChange={(e) => setCuit(e.target.value.replace(/\D/g, ""))} maxLength={11} required />
      </div>
      {isEdit && (
        <label className="flex items-center gap-2 text-sm cursor-pointer">
          <input type="checkbox" checked={activo} onChange={(e) => setActivo(e.target.checked)} />
          Activo
        </label>
      )}
      {error && <FormError message={error} />}
      <div className="flex justify-end gap-2 pt-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Guardando…" : isEdit ? "Guardar cambios" : "Crear broker"}
        </Button>
      </div>
    </form>
  )
}

// ─── Sección entidad maestra (reusable) ───────────────────────────────────────

interface EntidadMaestra {
  id: string
  nombre: string
  activo: boolean
  cuentasCount: number
}

function SeccionMaestra<T extends EntidadMaestra>({
  titulo,
  descripcion,
  items,
  icono,
  labelCrear,
  onCrear,
  onEditar,
  onDesactivar,
  desactivandoId,
  extraCol,
}: {
  titulo: string
  descripcion: string
  items: T[]
  icono: React.ReactNode
  labelCrear: string
  onCrear: () => void
  onEditar: (item: T) => void
  onDesactivar: (item: T) => void
  desactivandoId: string | null
  extraCol?: { label: string; render: (item: T) => React.ReactNode }
}) {
  return (
    <section className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold inline-flex items-center gap-2">
            {icono} {titulo}
          </h3>
          <p className="text-sm text-muted-foreground">{descripcion}</p>
        </div>
        <Button onClick={onCrear}>
          <Plus className="h-4 w-4 mr-1" /> {labelCrear}
        </Button>
      </div>
      <div className="border rounded overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted/50">
            <tr>
              <th className="text-left px-4 py-2">Nombre</th>
              {extraCol && <th className="text-left px-4 py-2">{extraCol.label}</th>}
              <th className="text-left px-4 py-2">Cuentas</th>
              <th className="text-left px-4 py-2">Estado</th>
              <th className="text-right px-4 py-2">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {items.length === 0 ? (
              <tr>
                <td colSpan={extraCol ? 5 : 4} className="px-4 py-6 text-center text-muted-foreground">
                  Sin registros. Agregá uno con el botón de arriba.
                </td>
              </tr>
            ) : (
              items.map((b) => (
                <tr key={b.id} className="border-t hover:bg-muted/20">
                  <td className="px-4 py-2 font-medium">{b.nombre}</td>
                  {extraCol && <td className="px-4 py-2 text-muted-foreground">{extraCol.render(b)}</td>}
                  <td className="px-4 py-2 text-muted-foreground">{b.cuentasCount}</td>
                  <td className="px-4 py-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full ${
                        b.activo ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {b.activo ? "Activo" : "Inactivo"}
                    </span>
                  </td>
                  <td className="px-4 py-2 text-right space-x-1">
                    <Button variant="outline" size="sm" onClick={() => onEditar(b)}>
                      <Pencil className="h-3 w-3 mr-1" /> Editar
                    </Button>
                    {b.activo && b.cuentasCount === 0 && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onDesactivar(b)}
                        disabled={desactivandoId === b.id}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-3 w-3 mr-1" />{" "}
                        {desactivandoId === b.id ? "…" : "Desactivar"}
                      </Button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </section>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function CuentasAbm({
  cuentas: cuentasIniciales,
  bancos: bancosIniciales,
  billeteras: billeterasIniciales,
  brokers: brokersIniciales,
}: CuentasAbmProps) {
  const router = useRouter()
  const [cuentas, setCuentas] = useState(cuentasIniciales)
  const [bancos, setBancos] = useState(bancosIniciales)
  const [billeteras, setBilleteras] = useState(billeterasIniciales)
  const [brokers, setBrokers] = useState(brokersIniciales)

  const [busqueda, setBusqueda] = useState("")
  const [filtroTipo, setFiltroTipo] = useState<string>("")

  const [modalCuentaBancaria, setModalCuentaBancaria] = useState(false)
  const [modalCuentaBilletera, setModalCuentaBilletera] = useState(false)
  const [modalCuentaBroker, setModalCuentaBroker] = useState(false)
  const [cuentaEdicion, setCuentaEdicion] = useState<CuentaAbm | null>(null)

  const [modalBancoAlta, setModalBancoAlta] = useState(false)
  const [bancoEdicion, setBancoEdicion] = useState<BancoAbm | null>(null)
  const [modalBilleteraAlta, setModalBilleteraAlta] = useState(false)
  const [billeteraEdicion, setBilleteraEdicion] = useState<BilleteraAbm | null>(null)
  const [modalBrokerAlta, setModalBrokerAlta] = useState(false)
  const [brokerEdicion, setBrokerEdicion] = useState<BrokerAbm | null>(null)

  const [eliminando, setEliminando] = useState<string | null>(null)
  const [desactivandoMaestra, setDesactivandoMaestra] = useState<string | null>(null)

  const cuentasFiltradas = cuentas.filter((c) => {
    if (filtroTipo && c.tipo !== filtroTipo) return false
    if (!busqueda) return true
    return (
      matchText(c.nombre, busqueda) ||
      matchText(entidadNombre(c), busqueda) ||
      matchText(c.nroCuenta ?? "", busqueda) ||
      matchText(c.alias ?? "", busqueda)
    )
  })

  async function recargar() {
    setModalCuentaBancaria(false)
    setModalCuentaBilletera(false)
    setModalCuentaBroker(false)
    setCuentaEdicion(null)
    setModalBancoAlta(false)
    setBancoEdicion(null)
    setModalBilleteraAlta(false)
    setBilleteraEdicion(null)
    setModalBrokerAlta(false)
    setBrokerEdicion(null)
    const [rc, rb, rbi, rbr] = await Promise.all([
      fetch("/api/cuentas"),
      fetch("/api/bancos"),
      fetch("/api/billeteras-virtuales"),
      fetch("/api/brokers"),
    ])
    const [dC, dB, dBi, dBr] = await Promise.all([rc.json(), rb.json(), rbi.json(), rbr.json()])
    if (Array.isArray(dC)) setCuentas(dC as CuentaAbm[])
    if (Array.isArray(dB)) setBancos(dB as BancoAbm[])
    if (Array.isArray(dBi)) setBilleteras(dBi as BilleteraAbm[])
    if (Array.isArray(dBr)) setBrokers(dBr as BrokerAbm[])
  }

  async function recargarBancos() {
    const r = await fetch("/api/bancos")
    const d = await r.json()
    if (Array.isArray(d)) setBancos(d as BancoAbm[])
    router.refresh()
  }
  async function recargarBilleteras() {
    const r = await fetch("/api/billeteras-virtuales")
    const d = await r.json()
    if (Array.isArray(d)) setBilleteras(d as BilleteraAbm[])
    router.refresh()
  }
  async function recargarBrokers() {
    const r = await fetch("/api/brokers")
    const d = await r.json()
    if (Array.isArray(d)) setBrokers(d as BrokerAbm[])
    router.refresh()
  }

  async function desactivarCuenta(cuenta: CuentaAbm) {
    if (!confirm(`Desactivar la cuenta "${cuenta.nombre}"?`)) return
    setEliminando(cuenta.id)
    try {
      const res = await fetch(`/api/cuentas/${cuenta.id}`, { method: "DELETE" })
      if (res.ok) recargar()
      else {
        const d = await res.json()
        alert(d.error ?? "Error al desactivar")
      }
    } finally {
      setEliminando(null)
    }
  }

  async function desactivarMaestra(
    path: "bancos" | "billeteras-virtuales" | "brokers",
    id: string,
    nombre: string,
  ) {
    if (!confirm(`Desactivar "${nombre}"?`)) return
    setDesactivandoMaestra(id)
    try {
      const res = await fetch(`/api/${path}/${id}`, { method: "DELETE" })
      if (res.ok) recargar()
      else {
        const d = await res.json()
        alert(d.error ?? "Error al desactivar")
      }
    } finally {
      setDesactivandoMaestra(null)
    }
  }

  return (
    <div className="space-y-6">
      <SeccionMaestra
        titulo="Bancos"
        descripcion="Entidades bancarias. Agrupan cuentas operativas."
        items={bancos.map((b) => ({ ...b, activo: b.activo }))}
        icono={<Building2 className="h-4 w-4" />}
        labelCrear="Nuevo banco"
        onCrear={() => setModalBancoAlta(true)}
        onEditar={(b) => setBancoEdicion(b as BancoAbm)}
        onDesactivar={(b) => desactivarMaestra("bancos", b.id, b.nombre)}
        desactivandoId={desactivandoMaestra}
      />

      <SeccionMaestra
        titulo="Billeteras virtuales"
        descripcion="Servicios de billetera (MercadoPago, Ualá, Brubank, etc.)."
        items={billeteras.map((b) => ({ ...b, activo: b.activa }))}
        icono={<Wallet className="h-4 w-4" />}
        labelCrear="Nueva billetera"
        onCrear={() => setModalBilleteraAlta(true)}
        onEditar={(b) => setBilleteraEdicion(billeteras.find((x) => x.id === b.id)!)}
        onDesactivar={(b) => desactivarMaestra("billeteras-virtuales", b.id, b.nombre)}
        desactivandoId={desactivandoMaestra}
      />

      <SeccionMaestra
        titulo="Brokers"
        descripcion="Brokers de inversión. Alojan cuentas comitentes."
        items={brokers}
        icono={<LineChart className="h-4 w-4" />}
        labelCrear="Nuevo broker"
        onCrear={() => setModalBrokerAlta(true)}
        onEditar={(b) => setBrokerEdicion(b as BrokerAbm)}
        onDesactivar={(b) => desactivarMaestra("brokers", b.id, b.nombre)}
        desactivandoId={desactivandoMaestra}
        extraCol={{ label: "CUIT", render: (b) => (b as BrokerAbm).cuit }}
      />

      {/* Sección Cuentas */}
      <section className="space-y-3">
        <div className="flex items-center justify-between gap-3 flex-wrap">
          <div>
            <h3 className="text-lg font-semibold">Cuentas</h3>
            <p className="text-sm text-muted-foreground">
              Cuentas operativas bajo cada entidad maestra.
            </p>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button
              onClick={() => setModalCuentaBancaria(true)}
              disabled={bancos.filter((b) => b.activo).length === 0}
              title={bancos.filter((b) => b.activo).length === 0 ? "Primero creá un banco" : undefined}
            >
              <Building2 className="h-4 w-4 mr-1" /> Nueva cuenta bancaria
            </Button>
            <Button
              variant="outline"
              onClick={() => setModalCuentaBilletera(true)}
              disabled={billeteras.filter((b) => b.activa).length === 0}
              title={billeteras.filter((b) => b.activa).length === 0 ? "Primero creá una billetera" : undefined}
            >
              <Wallet className="h-4 w-4 mr-1" /> Nueva cuenta de billetera
            </Button>
            <Button
              variant="outline"
              onClick={() => setModalCuentaBroker(true)}
              disabled={brokers.filter((b) => b.activo).length === 0}
              title={brokers.filter((b) => b.activo).length === 0 ? "Primero creá un broker" : undefined}
            >
              <LineChart className="h-4 w-4 mr-1" /> Nueva cuenta de broker
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              className="pl-9"
              placeholder="Buscar por nombre, entidad, nro, alias…"
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
            />
          </div>
          <div>
            <Select value={filtroTipo} onChange={(e) => setFiltroTipo(e.target.value)}>
              <option value="">Todos los tipos</option>
              <option value="BANCO">Cuenta bancaria</option>
              <option value="BILLETERA_VIRTUAL">Billetera virtual</option>
              <option value="BROKER">Broker</option>
            </Select>
          </div>
        </div>

        <div className="border rounded overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3">Nombre</th>
                <th className="text-left px-4 py-3">Tipo</th>
                <th className="text-left px-4 py-3">Entidad</th>
                <th className="text-left px-4 py-3">Moneda</th>
                <th className="text-left px-4 py-3">N° / Alias</th>
                <th className="text-left px-4 py-3">Estado</th>
                <th className="text-right px-4 py-3">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentasFiltradas.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-muted-foreground">
                    Sin cuentas{busqueda || filtroTipo ? " que coincidan con el filtro" : ""}.
                  </td>
                </tr>
              ) : (
                cuentasFiltradas.map((c) => {
                  const tieneMovimientos = (c._count?.movimientos ?? 0) > 0
                  const icon =
                    c.tipo === "BANCO" ? (
                      <Building2 className="h-3 w-3 text-muted-foreground" />
                    ) : c.tipo === "BILLETERA_VIRTUAL" ? (
                      <Wallet className="h-3 w-3 text-muted-foreground" />
                    ) : (
                      <LineChart className="h-3 w-3 text-muted-foreground" />
                    )
                  return (
                    <tr key={c.id} className="border-t hover:bg-muted/20">
                      <td className="px-4 py-3 font-medium">
                        <span className="inline-flex items-center gap-2">
                          {icon} {c.nombre}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-xs bg-muted px-2 py-0.5 rounded">{tipoLabel(c.tipo)}</span>
                      </td>
                      <td className="px-4 py-3">{entidadNombre(c) || "—"}</td>
                      <td className="px-4 py-3">{c.moneda}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        {c.nroCuenta || c.alias || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            c.activa ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {c.activa ? "Activa" : "Inactiva"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right space-x-1">
                        <Button variant="outline" size="sm" onClick={() => setCuentaEdicion(c)}>
                          <Pencil className="h-3 w-3 mr-1" /> Editar
                        </Button>
                        {!tieneMovimientos && c.activa && (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => desactivarCuenta(c)}
                            disabled={eliminando === c.id}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-3 w-3 mr-1" />{" "}
                            {eliminando === c.id ? "…" : "Desactivar"}
                          </Button>
                        )}
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      {/* Modales Bancos */}
      <Dialog open={modalBancoAlta} onOpenChange={setModalBancoAlta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo banco</DialogTitle>
            <DialogDescription>Agregar una nueva entidad bancaria.</DialogDescription>
          </DialogHeader>
          <BancoForm onSuccess={recargarBancos} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!bancoEdicion} onOpenChange={() => setBancoEdicion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar banco</DialogTitle>
            <DialogDescription>{bancoEdicion?.nombre}</DialogDescription>
          </DialogHeader>
          {bancoEdicion && <BancoForm banco={bancoEdicion} onSuccess={recargar} />}
        </DialogContent>
      </Dialog>

      {/* Modales Billeteras */}
      <Dialog open={modalBilleteraAlta} onOpenChange={setModalBilleteraAlta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva billetera virtual</DialogTitle>
            <DialogDescription>Agregar un servicio de billetera virtual.</DialogDescription>
          </DialogHeader>
          <BilleteraForm onSuccess={recargarBilleteras} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!billeteraEdicion} onOpenChange={() => setBilleteraEdicion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar billetera</DialogTitle>
            <DialogDescription>{billeteraEdicion?.nombre}</DialogDescription>
          </DialogHeader>
          {billeteraEdicion && <BilleteraForm billetera={billeteraEdicion} onSuccess={recargar} />}
        </DialogContent>
      </Dialog>

      {/* Modales Brokers */}
      <Dialog open={modalBrokerAlta} onOpenChange={setModalBrokerAlta}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo broker</DialogTitle>
            <DialogDescription>Agregar una entidad de broker.</DialogDescription>
          </DialogHeader>
          <BrokerForm onSuccess={recargarBrokers} />
        </DialogContent>
      </Dialog>
      <Dialog open={!!brokerEdicion} onOpenChange={() => setBrokerEdicion(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar broker</DialogTitle>
            <DialogDescription>{brokerEdicion?.nombre}</DialogDescription>
          </DialogHeader>
          {brokerEdicion && <BrokerForm broker={brokerEdicion} onSuccess={recargar} />}
        </DialogContent>
      </Dialog>

      {/* Modal Nueva cuenta bancaria */}
      <Dialog open={modalCuentaBancaria} onOpenChange={setModalCuentaBancaria}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nueva cuenta bancaria</DialogTitle>
            <DialogDescription>Asociá la cuenta a un banco existente (o creá uno nuevo).</DialogDescription>
          </DialogHeader>
          <CuentaBancariaForm
            bancos={bancos}
            onSuccess={recargar}
            onCreateBanco={() => {
              setModalCuentaBancaria(false)
              setModalBancoAlta(true)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Nueva cuenta de billetera */}
      <Dialog open={modalCuentaBilletera} onOpenChange={setModalCuentaBilletera}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta de billetera</DialogTitle>
            <DialogDescription>Asociá la cuenta a una billetera existente.</DialogDescription>
          </DialogHeader>
          <CuentaBilleteraForm
            billeteras={billeteras}
            onSuccess={recargar}
            onCreateBilletera={() => {
              setModalCuentaBilletera(false)
              setModalBilleteraAlta(true)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Nueva cuenta de broker */}
      <Dialog open={modalCuentaBroker} onOpenChange={setModalCuentaBroker}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nueva cuenta de broker</DialogTitle>
            <DialogDescription>Asociá la cuenta comitente a un broker existente.</DialogDescription>
          </DialogHeader>
          <CuentaBrokerForm
            brokers={brokers}
            onSuccess={recargar}
            onCreateBroker={() => {
              setModalCuentaBroker(false)
              setModalBrokerAlta(true)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Modal Edición cuenta */}
      <Dialog open={!!cuentaEdicion} onOpenChange={() => setCuentaEdicion(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Editar cuenta</DialogTitle>
            <DialogDescription>{cuentaEdicion?.nombre}</DialogDescription>
          </DialogHeader>
          {cuentaEdicion && cuentaEdicion.tipo === "BANCO" && (
            <CuentaBancariaForm
              cuenta={cuentaEdicion}
              bancos={bancos}
              onSuccess={recargar}
              onCreateBanco={() => {
                setCuentaEdicion(null)
                setModalBancoAlta(true)
              }}
            />
          )}
          {cuentaEdicion && cuentaEdicion.tipo === "BILLETERA_VIRTUAL" && (
            <CuentaBilleteraForm
              cuenta={cuentaEdicion}
              billeteras={billeteras}
              onSuccess={recargar}
              onCreateBilletera={() => {
                setCuentaEdicion(null)
                setModalBilleteraAlta(true)
              }}
            />
          )}
          {cuentaEdicion && cuentaEdicion.tipo === "BROKER" && (
            <CuentaBrokerForm
              cuenta={cuentaEdicion}
              brokers={brokers}
              onSuccess={recargar}
              onCreateBroker={() => {
                setCuentaEdicion(null)
                setModalBrokerAlta(true)
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
