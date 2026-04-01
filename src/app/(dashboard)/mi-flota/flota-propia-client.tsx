"use client"

/**
 * Componente cliente para la gestión de la flota propia de Transmagg.
 * Solo accesible por roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 * ABM completo: camiones, choferes asignados y pólizas de seguro.
 */

import { useState } from "react"
import { Truck, User, UserX, Plus, Pencil, Trash2, ShieldAlert, ShieldCheck, ShieldX, X } from "lucide-react"

// ── Tipos ─────────────────────────────────────────────────────────────────────

interface Empleado {
  id: string
  nombre: string
  apellido: string
}

interface ChoferDisponible {
  id: string
  nombre: string
  apellido: string
  email: string
  empleado: Empleado | null
}

interface Poliza {
  id: string
  camionId: string
  aseguradora: string
  nroPoliza: string
  cobertura: string | null
  montoMensual: number | null
  vigenciaDesde: string
  vigenciaHasta: string
  estadoPoliza: "VIGENTE" | "POR_VENCER" | "VENCIDA"
}

interface CamionPropio {
  id: string
  patenteChasis: string
  patenteAcoplado: string | null
  tipoCamion: string
  activo: boolean
  esPropio: boolean
  choferActual: ChoferDisponible | null
  polizas: Poliza[]
  alertaPoliza: "SIN_COBERTURA" | "POR_VENCER" | null
}

interface FlotaPropiaClientProps {
  camiones: CamionPropio[]
  choferes: ChoferDisponible[]
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function badgePoliza(alerta: CamionPropio["alertaPoliza"]) {
  if (alerta === "SIN_COBERTURA") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 border border-red-200 rounded px-1.5 py-0.5">
        <ShieldX className="h-3 w-3" /> Sin cobertura
      </span>
    )
  }
  if (alerta === "POR_VENCER") {
    return (
      <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
        <ShieldAlert className="h-3 w-3" /> Por vencer
      </span>
    )
  }
  return (
    <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded px-1.5 py-0.5">
      <ShieldCheck className="h-3 w-3" /> Al día
    </span>
  )
}

function estadoBadge(estado: Poliza["estadoPoliza"]) {
  const map = {
    VIGENTE: "bg-green-50 text-green-700 border-green-200",
    POR_VENCER: "bg-amber-50 text-amber-700 border-amber-200",
    VENCIDA: "bg-red-50 text-red-700 border-red-200",
  }
  const labels = { VIGENTE: "Vigente", POR_VENCER: "Por vencer", VENCIDA: "Vencida" }
  return (
    <span className={`inline-block text-xs font-medium border rounded px-1.5 py-0.5 ${map[estado]}`}>
      {labels[estado]}
    </span>
  )
}

function fmt(iso: string) {
  return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })
}

// ── Modales ───────────────────────────────────────────────────────────────────

function ModalCamion({
  camion,
  onClose,
  onSaved,
}: {
  camion: CamionPropio | null
  onClose: () => void
  onSaved: (c: CamionPropio) => void
}) {
  const [patenteChasis, setPatenteChasis] = useState(camion?.patenteChasis ?? "")
  const [patenteAcoplado, setPatenteAcoplado] = useState(camion?.patenteAcoplado ?? "")
  const [tipoCamion, setTipoCamion] = useState(camion?.tipoCamion ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = camion
        ? await fetch(`/api/camiones/${camion.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patenteChasis: patenteChasis.toUpperCase(),
              patenteAcoplado: patenteAcoplado || null,
              tipoCamion,
            }),
          })
        : await fetch("/api/camiones/propios", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              patenteChasis: patenteChasis.toUpperCase(),
              patenteAcoplado: patenteAcoplado || null,
              tipoCamion,
            }),
          })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      onSaved({ ...data, choferActual: camion?.choferActual ?? null, polizas: camion?.polizas ?? [], alertaPoliza: camion?.alertaPoliza ?? "SIN_COBERTURA" })
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{camion ? "Editar camión" : "Nuevo camión propio"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Patente chasis *</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm uppercase"
              value={patenteChasis}
              onChange={(e) => setPatenteChasis(e.target.value.toUpperCase())}
              placeholder="ABC123"
              required
              maxLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Patente acoplado</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm uppercase"
              value={patenteAcoplado}
              onChange={(e) => setPatenteAcoplado(e.target.value.toUpperCase())}
              placeholder="Opcional"
              maxLength={8}
            />
          </div>
          <div>
            <label className="text-sm font-medium">Tipo de camión *</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={tipoCamion}
              onChange={(e) => setTipoCamion(e.target.value)}
              placeholder="Ej: Semi, Chasis, Zorra"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalAsignarChofer({
  camion,
  choferes,
  onClose,
  onSaved,
}: {
  camion: CamionPropio
  choferes: ChoferDisponible[]
  onClose: () => void
  onSaved: (choferId: string) => void
}) {
  const [choferId, setChoferId] = useState(camion.choferActual?.id ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!choferId) { setError("Seleccioná un chofer"); return }
    setLoading(true)
    setError("")
    try {
      const res = await fetch(`/api/camiones/${camion.id}/asignar-chofer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ choferId }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      onSaved(choferId)
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">Asignar chofer</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <p className="text-sm text-muted-foreground mb-4">Camión: <strong>{camion.patenteChasis}</strong></p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Chofer *</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={choferId}
              onChange={(e) => setChoferId(e.target.value)}
              required
            >
              <option value="">Seleccionar...</option>
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.apellido}, {c.nombre}
                </option>
              ))}
            </select>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Asignando..." : "Asignar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalPoliza({
  camionId,
  poliza,
  onClose,
  onSaved,
}: {
  camionId: string
  poliza: Poliza | null
  onClose: () => void
  onSaved: (p: Poliza) => void
}) {
  const [aseguradora, setAseguradora] = useState(poliza?.aseguradora ?? "")
  const [nroPoliza, setNroPoliza] = useState(poliza?.nroPoliza ?? "")
  const [cobertura, setCobertura] = useState(poliza?.cobertura ?? "")
  const [montoMensual, setMontoMensual] = useState(poliza?.montoMensual?.toString() ?? "")
  const [vigenciaDesde, setVigenciaDesde] = useState(poliza?.vigenciaDesde?.slice(0, 10) ?? "")
  const [vigenciaHasta, setVigenciaHasta] = useState(poliza?.vigenciaHasta?.slice(0, 10) ?? "")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    const body = {
      aseguradora,
      nroPoliza,
      cobertura: cobertura || null,
      montoMensual: montoMensual ? parseFloat(montoMensual) : null,
      vigenciaDesde,
      vigenciaHasta,
    }
    try {
      const url = poliza
        ? `/api/camiones/${camionId}/polizas/${poliza.id}`
        : `/api/camiones/${camionId}/polizas`
      const res = await fetch(url, {
        method: poliza ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      const now = new Date()
      const vd = new Date(data.vigenciaDesde)
      const vh = new Date(data.vigenciaHasta)
      const estadoPoliza: Poliza["estadoPoliza"] =
        vh < now ? "VENCIDA" : vh <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) ? "POR_VENCER" : "VIGENTE"
      onSaved({ ...data, estadoPoliza, vigenciaDesde: vd.toISOString(), vigenciaHasta: vh.toISOString() })
    } catch {
      setError("Error de red")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-lg">{poliza ? "Editar póliza" : "Nueva póliza de seguro"}</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Aseguradora *</label>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={aseguradora} onChange={(e) => setAseguradora(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Nro. póliza *</label>
              <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={nroPoliza} onChange={(e) => setNroPoliza(e.target.value)} required />
            </div>
          </div>
          <div>
            <label className="text-sm font-medium">Cobertura</label>
            <input className="mt-1 w-full border rounded px-3 py-2 text-sm" value={cobertura} onChange={(e) => setCobertura(e.target.value)} placeholder="Ej: Todo riesgo" />
          </div>
          <div>
            <label className="text-sm font-medium">Monto mensual ($)</label>
            <input type="number" step="0.01" className="mt-1 w-full border rounded px-3 py-2 text-sm" value={montoMensual} onChange={(e) => setMontoMensual(e.target.value)} placeholder="Opcional" />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium">Vigencia desde *</label>
              <input type="date" className="mt-1 w-full border rounded px-3 py-2 text-sm" value={vigenciaDesde} onChange={(e) => setVigenciaDesde(e.target.value)} required />
            </div>
            <div>
              <label className="text-sm font-medium">Vigencia hasta *</label>
              <input type="date" className="mt-1 w-full border rounded px-3 py-2 text-sm" value={vigenciaHasta} onChange={(e) => setVigenciaHasta(e.target.value)} required />
            </div>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ── Panel de detalle de camión ─────────────────────────────────────────────────

function PanelCamion({
  camion,
  choferes,
  onEditar,
  onEliminar,
  onCamionUpdate,
}: {
  camion: CamionPropio
  choferes: ChoferDisponible[]
  onEditar: () => void
  onEliminar: () => void
  onCamionUpdate: (updated: CamionPropio) => void
}) {
  const [modalChofer, setModalChofer] = useState(false)
  const [modalPoliza, setModalPoliza] = useState<Poliza | null | "nueva">(null)
  const [deletingPoliza, setDeletingPoliza] = useState<string | null>(null)

  function handleChoferSaved(choferId: string) {
    const chofer = choferes.find((c) => c.id === choferId) ?? null
    onCamionUpdate({ ...camion, choferActual: chofer })
    setModalChofer(false)
  }

  function handlePolizaSaved(p: Poliza) {
    const existing = camion.polizas.findIndex((x) => x.id === p.id)
    const nuevas = existing >= 0
      ? camion.polizas.map((x) => (x.id === p.id ? p : x))
      : [p, ...camion.polizas]
    const alerta = calcularAlerta(nuevas)
    onCamionUpdate({ ...camion, polizas: nuevas, alertaPoliza: alerta })
    setModalPoliza(null)
  }

  async function handleEliminarPoliza(polizaId: string) {
    setDeletingPoliza(polizaId)
    try {
      await fetch(`/api/camiones/${camion.id}/polizas/${polizaId}`, { method: "DELETE" })
      const nuevas = camion.polizas.filter((p) => p.id !== polizaId)
      onCamionUpdate({ ...camion, polizas: nuevas, alertaPoliza: calcularAlerta(nuevas) })
    } finally {
      setDeletingPoliza(null)
    }
  }

  function calcularAlerta(polizas: Poliza[]): CamionPropio["alertaPoliza"] {
    const now = new Date()
    const activa = polizas.find((p) => p.estadoPoliza !== "VENCIDA")
    if (!activa) return "SIN_COBERTURA"
    if (activa.estadoPoliza === "POR_VENCER") return "POR_VENCER"
    return null
  }

  const polizaActiva = camion.polizas.find((p) => p.estadoPoliza !== "VENCIDA")

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header del camión */}
      <div className="p-4 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <p className="font-semibold">
              {camion.patenteChasis}
              {camion.patenteAcoplado && <span className="font-normal text-muted-foreground"> / {camion.patenteAcoplado}</span>}
            </p>
            <p className="text-xs text-muted-foreground">{camion.tipoCamion}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {badgePoliza(camion.alertaPoliza)}
          <button onClick={onEditar} className="p-1.5 rounded hover:bg-gray-200 text-muted-foreground" title="Editar">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={onEliminar} className="p-1.5 rounded hover:bg-red-50 text-red-500" title="Dar de baja">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Cuerpo */}
      <div className="p-4 space-y-4">
        {/* Chofer */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Chofer</p>
            <button onClick={() => setModalChofer(true)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <User className="h-3.5 w-3.5" /> {camion.choferActual ? "Cambiar" : "Asignar"}
            </button>
          </div>
          {camion.choferActual ? (
            <p className="text-sm font-medium">{camion.choferActual.apellido}, {camion.choferActual.nombre}</p>
          ) : (
            <p className="text-sm text-amber-600 flex items-center gap-1"><UserX className="h-3.5 w-3.5" /> Sin chofer</p>
          )}
        </div>

        {/* Póliza vigente */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Seguro</p>
            <button onClick={() => setModalPoliza("nueva")} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Plus className="h-3.5 w-3.5" /> Nueva póliza
            </button>
          </div>
          {polizaActiva ? (
            <div className="text-sm space-y-0.5">
              <div className="flex items-center gap-2">
                <span className="font-medium">{polizaActiva.aseguradora}</span>
                {estadoBadge(polizaActiva.estadoPoliza)}
              </div>
              <p className="text-muted-foreground">Nro. {polizaActiva.nroPoliza}</p>
              <p className="text-muted-foreground text-xs">
                {fmt(polizaActiva.vigenciaDesde)} → {fmt(polizaActiva.vigenciaHasta)}
                {polizaActiva.cobertura && ` · ${polizaActiva.cobertura}`}
              </p>
            </div>
          ) : (
            <p className="text-sm text-red-600 flex items-center gap-1"><ShieldX className="h-3.5 w-3.5" /> Sin cobertura vigente</p>
          )}
        </div>

        {/* Historial pólizas (colapsable, solo si hay vencidas) */}
        {camion.polizas.filter((p) => p.estadoPoliza === "VENCIDA").length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5">Pólizas anteriores</p>
            <div className="space-y-1.5">
              {camion.polizas
                .filter((p) => p.estadoPoliza === "VENCIDA")
                .map((p) => (
                  <div key={p.id} className="flex items-center justify-between text-xs text-muted-foreground border-b pb-1.5">
                    <span>{p.aseguradora} · {p.nroPoliza} · {fmt(p.vigenciaDesde)}→{fmt(p.vigenciaHasta)}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setModalPoliza(p)} className="hover:text-foreground" title="Editar"><Pencil className="h-3 w-3" /></button>
                      <button
                        onClick={() => handleEliminarPoliza(p.id)}
                        disabled={deletingPoliza === p.id}
                        className="hover:text-red-600 disabled:opacity-50"
                        title="Eliminar"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
        {polizaActiva && (
          <div className="flex gap-2 justify-end">
            <button onClick={() => setModalPoliza(polizaActiva)} className="text-xs text-blue-600 hover:underline flex items-center gap-1">
              <Pencil className="h-3 w-3" /> Editar póliza vigente
            </button>
          </div>
        )}
      </div>

      {modalChofer && (
        <ModalAsignarChofer
          camion={camion}
          choferes={choferes}
          onClose={() => setModalChofer(false)}
          onSaved={handleChoferSaved}
        />
      )}
      {modalPoliza !== null && (
        <ModalPoliza
          camionId={camion.id}
          poliza={modalPoliza === "nueva" ? null : modalPoliza}
          onClose={() => setModalPoliza(null)}
          onSaved={handlePolizaSaved}
        />
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function FlotaPropiaClient({ camiones: initialCamiones, choferes }: FlotaPropiaClientProps) {
  const [camiones, setCamiones] = useState<CamionPropio[]>(initialCamiones)
  const [modalCamion, setModalCamion] = useState<CamionPropio | null | "nuevo">(null)
  const [confirmando, setConfirmando] = useState<string | null>(null)
  const [bajando, setBajando] = useState<string | null>(null)

  function handleCamionSaved(c: CamionPropio) {
    setCamiones((prev) => {
      const idx = prev.findIndex((x) => x.id === c.id)
      if (idx >= 0) return prev.map((x) => (x.id === c.id ? c : x))
      return [c, ...prev]
    })
    setModalCamion(null)
  }

  async function handleBaja(id: string) {
    setBajando(id)
    try {
      const res = await fetch(`/api/camiones/${id}`, { method: "DELETE" })
      if (res.ok || res.status === 204) {
        setCamiones((prev) => prev.filter((c) => c.id !== id))
      }
    } finally {
      setBajando(null)
      setConfirmando(null)
    }
  }

  const alertas = camiones.filter((c) => c.alertaPoliza !== null)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Flota propia</h2>
          <p className="text-muted-foreground">Camiones propios de Transmagg</p>
        </div>
        <button
          onClick={() => setModalCamion("nuevo")}
          className="inline-flex items-center gap-2 px-4 py-2 bg-black text-white text-sm rounded hover:bg-gray-800"
        >
          <Plus className="h-4 w-4" /> Agregar camión
        </button>
      </div>

      {/* Alertas */}
      {alertas.length > 0 && (
        <div className="border border-amber-200 bg-amber-50 rounded-lg p-4 space-y-1">
          <p className="text-sm font-semibold text-amber-800">Alertas de seguros</p>
          {alertas.map((c) => (
            <p key={c.id} className="text-sm text-amber-700">
              <strong>{c.patenteChasis}</strong>:{" "}
              {c.alertaPoliza === "SIN_COBERTURA" ? "Sin cobertura vigente" : "Póliza por vencer en 30 días"}
            </p>
          ))}
        </div>
      )}

      {/* Lista */}
      {camiones.length === 0 ? (
        <div className="text-center py-12 border rounded-lg text-muted-foreground">
          <Truck className="h-10 w-10 mx-auto mb-3 opacity-30" />
          <p>No hay camiones propios registrados.</p>
          <button onClick={() => setModalCamion("nuevo")} className="mt-3 text-sm text-blue-600 hover:underline">
            Agregar el primero
          </button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {camiones.map((c) => (
            <PanelCamion
              key={c.id}
              camion={c}
              choferes={choferes}
              onEditar={() => setModalCamion(c)}
              onEliminar={() => setConfirmando(c.id)}
              onCamionUpdate={(updated) => setCamiones((prev) => prev.map((x) => (x.id === updated.id ? updated : x)))}
            />
          ))}
        </div>
      )}

      {/* Modal nuevo/editar camión */}
      {modalCamion !== null && (
        <ModalCamion
          camion={modalCamion === "nuevo" ? null : modalCamion}
          onClose={() => setModalCamion(null)}
          onSaved={handleCamionSaved}
        />
      )}

      {/* Confirmación baja */}
      {confirmando && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-sm p-6 space-y-4">
            <h3 className="font-semibold">¿Dar de baja este camión?</h3>
            <p className="text-sm text-muted-foreground">Esta acción lo marcará como inactivo. Los viajes existentes no se modifican.</p>
            <div className="flex justify-end gap-2">
              <button onClick={() => setConfirmando(null)} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
              <button
                onClick={() => handleBaja(confirmando)}
                disabled={bajando === confirmando}
                className="px-4 py-2 text-sm bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                {bajando === confirmando ? "Procesando..." : "Dar de baja"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
