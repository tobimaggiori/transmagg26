"use client"

/**
 * Componente cliente para la gestión de la flota propia de Transmagg.
 * Solo accesible por roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 * ABM completo: camiones, choferes asignados, pólizas de seguro e infracciones.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Truck, User, UserX, Plus, Pencil, Trash2, ShieldAlert, ShieldCheck, ShieldX, X } from "lucide-react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"

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
  camionId: string | null
  aseguradora: string
  nroPoliza: string
  cobertura: string | null
  montoMensual: number | null
  vigenciaDesde: string
  vigenciaHasta: string
  estadoPoliza: "VIGENTE" | "POR_VENCER" | "VENCIDA"
}

interface InfraccionFlota {
  id: string
  fecha: string
  organismo: string
  descripcion: string
  monto: number
  estado: string
  comprobantePdfS3Key: string | null
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
  infracciones: InfraccionFlota[]
  infrasPendientes: number
  montoInfrasPendientes: number
}

interface CuentaDisponible {
  id: string
  nombre: string
}

interface FlotaPropiaClientProps {
  camiones: CamionPropio[]
  choferes: ChoferDisponible[]
  cuentas: CuentaDisponible[]
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

function todayISO() {
  return new Date().toISOString().slice(0, 10)
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
      onSaved({
        ...data,
        choferActual: camion?.choferActual ?? null,
        polizas: camion?.polizas ?? [],
        alertaPoliza: camion?.alertaPoliza ?? "SIN_COBERTURA",
        infracciones: camion?.infracciones ?? [],
        infrasPendientes: camion?.infrasPendientes ?? 0,
        montoInfrasPendientes: camion?.montoInfrasPendientes ?? 0,
      })
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

function ModalNuevaInfraccion({
  camionId,
  onClose,
  onSaved,
}: {
  camionId: string
  onClose: () => void
  onSaved: () => void
}) {
  const [fecha, setFecha] = useState(todayISO())
  const [organismo, setOrganismo] = useState("")
  const [descripcion, setDescripcion] = useState("")
  const [monto, setMonto] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res = await fetch("/api/mi-flota/infracciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ camionId, fecha, organismo, descripcion, monto: parsearImporte(monto) }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      onSaved()
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
          <h3 className="font-semibold text-lg">Nueva infracción</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Fecha *</label>
            <input
              type="date"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={fecha}
              onChange={(e) => setFecha(e.target.value)}
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Organismo *</label>
            <input
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={organismo}
              onChange={(e) => setOrganismo(e.target.value)}
              placeholder="Ej: Municipalidad de Rosario"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Descripción *</label>
            <textarea
              className="mt-1 w-full border rounded px-3 py-2 text-sm resize-none"
              rows={2}
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Exceso de velocidad"
              required
            />
          </div>
          <div>
            <label className="text-sm font-medium">Monto *</label>
            <input
              type="number"
              step="0.01"
              min="0"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={monto}
              onChange={(e) => setMonto(e.target.value)}
              placeholder="0.00"
              required
            />
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Guardando..." : "Registrar"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

function ModalPagoInfraccion({
  infraccion,
  cuentas,
  onClose,
  onSaved,
}: {
  infraccion: InfraccionFlota
  cuentas: CuentaDisponible[]
  onClose: () => void
  onSaved: () => void
}) {
  const [medioPago, setMedioPago] = useState("TRANSFERENCIA")
  const [cuentaId, setCuentaId] = useState("")
  const [fechaPago, setFechaPago] = useState(todayISO())
  const [comprobante, setComprobante] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const mostrarCuenta = medioPago === "TRANSFERENCIA"
  const mostrarComprobante = medioPago === "TRANSFERENCIA"

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      let comprobantePdfS3Key: string | undefined
      if (comprobante && mostrarComprobante) {
        const fd = new FormData()
        fd.append("file", comprobante)
        fd.append("prefijo", "comprobantes-infracciones")
        const upRes = await fetch("/api/storage/upload", { method: "POST", body: fd })
        if (!upRes.ok) {
          const d = await upRes.json()
          setError(d.error ?? "Error al subir comprobante")
          return
        }
        const upData = await upRes.json()
        comprobantePdfS3Key = upData.key
      }

      const res = await fetch(`/api/mi-flota/infracciones/${infraccion.id}/pagar`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          medioPago,
          cuentaId: mostrarCuenta && cuentaId ? cuentaId : undefined,
          fechaPago,
          comprobantePdfS3Key,
        }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error"); return }
      onSaved()
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
          <h3 className="font-semibold text-lg">Registrar pago de infracción</h3>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="h-5 w-5" /></button>
        </div>

        {/* Detalles de la infracción */}
        <div className="mb-4 p-3 bg-gray-50 rounded text-sm space-y-1">
          <p><span className="text-muted-foreground">Organismo:</span> <strong>{infraccion.organismo}</strong></p>
          <p><span className="text-muted-foreground">Descripción:</span> {infraccion.descripcion}</p>
          <p><span className="text-muted-foreground">Monto:</span> <strong>{formatearMoneda(infraccion.monto)}</strong></p>
          <p><span className="text-muted-foreground">Fecha infracción:</span> {formatearFecha(infraccion.fecha)}</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-sm font-medium">Medio de pago *</label>
            <select
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={medioPago}
              onChange={(e) => setMedioPago(e.target.value)}
              required
            >
              <option value="TRANSFERENCIA">Transferencia</option>
              <option value="EFECTIVO">Efectivo</option>
              <option value="TARJETA">Tarjeta</option>
            </select>
          </div>

          {mostrarCuenta && (
            <div>
              <label className="text-sm font-medium">Cuenta</label>
              <select
                className="mt-1 w-full border rounded px-3 py-2 text-sm"
                value={cuentaId}
                onChange={(e) => setCuentaId(e.target.value)}
              >
                <option value="">Seleccionar cuenta...</option>
                {cuentas.map((c) => (
                  <option key={c.id} value={c.id}>{c.nombre}</option>
                ))}
              </select>
            </div>
          )}

          <div>
            <label className="text-sm font-medium">Fecha de pago *</label>
            <input
              type="date"
              className="mt-1 w-full border rounded px-3 py-2 text-sm"
              value={fechaPago}
              onChange={(e) => setFechaPago(e.target.value)}
              required
            />
          </div>

          {mostrarComprobante && (
            <div>
              <label className="text-sm font-medium">Comprobante PDF</label>
              <input
                type="file"
                accept="application/pdf"
                className="mt-1 w-full text-sm"
                onChange={(e) => setComprobante(e.target.files?.[0] ?? null)}
              />
            </div>
          )}

          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm border rounded hover:bg-gray-50">Cancelar</button>
            <button type="submit" disabled={loading} className="px-4 py-2 text-sm bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50">
              {loading ? "Guardando..." : "Registrar pago"}
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
  cuentas,
  onEditar,
  onEliminar,
  onCamionUpdate,
}: {
  camion: CamionPropio
  choferes: ChoferDisponible[]
  cuentas: CuentaDisponible[]
  onEditar: () => void
  onEliminar: () => void
  onCamionUpdate: (updated: CamionPropio) => void
}) {
  const router = useRouter()
  const [modalChofer, setModalChofer] = useState(false)
  const [modalNuevaInfraccion, setModalNuevaInfraccion] = useState(false)
  const [infraccionPago, setInfraccionPago] = useState<InfraccionFlota | null>(null)

  function handleChoferSaved(choferId: string) {
    const chofer = choferes.find((c) => c.id === choferId) ?? null
    onCamionUpdate({ ...camion, choferActual: chofer })
    setModalChofer(false)
  }

  function handleInfraccionSaved() {
    setModalNuevaInfraccion(false)
    router.refresh()
  }

  function handlePagoSaved() {
    setInfraccionPago(null)
    router.refresh()
  }

  const polizaActiva = camion.polizas.find((p) => p.estadoPoliza !== "VENCIDA")

  return (
    <div className="border rounded-lg overflow-hidden">
      {/* Header del camión */}
      <div className="p-4 bg-gray-50 flex items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-muted-foreground shrink-0" />
          <div>
            <div className="flex items-center gap-2">
              <p className="font-semibold">
                {camion.patenteChasis}
                {camion.patenteAcoplado && <span className="font-normal text-muted-foreground"> / {camion.patenteAcoplado}</span>}
              </p>
              {camion.infrasPendientes > 0 && (
                <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-1.5 py-0.5">
                  ⚠ {camion.infrasPendientes} infrac.
                </span>
              )}
            </div>
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

        {/* Póliza vigente (solo lectura — gestionar en Aseguradoras) */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider">Seguro</p>
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

        {/* Historial pólizas */}
        {camion.polizas.filter((p) => p.estadoPoliza === "VENCIDA").length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase text-muted-foreground tracking-wider mb-1.5">Pólizas anteriores</p>
            <div className="space-y-1.5">
              {camion.polizas
                .filter((p) => p.estadoPoliza === "VENCIDA")
                .map((p) => (
                  <div key={p.id} className="text-xs text-muted-foreground border-b pb-1.5">
                    {p.aseguradora} · {p.nroPoliza} · {fmt(p.vigenciaDesde)}→{fmt(p.vigenciaHasta)}
                  </div>
                ))}
            </div>
          </div>
        )}

        <div className="flex justify-end pt-1">
          <Link
            href="/aseguradoras/facturas"
            className="text-xs text-muted-foreground hover:text-foreground hover:underline"
          >
            Gestionar seguros en Aseguradoras →
          </Link>
        </div>

        {/* Infracciones */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Infracciones</h4>
            <button
              type="button"
              onClick={() => setModalNuevaInfraccion(true)}
              className="inline-flex items-center gap-1 text-xs border rounded px-2 py-1 hover:bg-gray-50"
            >
              <Plus className="h-3 w-3" /> Nueva
            </button>
          </div>

          {camion.infrasPendientes > 0 && (
            <div className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
              ⚠ {camion.infrasPendientes} pendiente{camion.infrasPendientes > 1 ? "s" : ""} — {formatearMoneda(camion.montoInfrasPendientes)}
            </div>
          )}

          {camion.infracciones.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin infracciones registradas.</p>
          ) : (
            <div className="divide-y border rounded text-xs">
              {camion.infracciones.map((inf) => (
                <div key={inf.id} className="flex items-center gap-2 px-2 py-1.5">
                  <span className="text-muted-foreground whitespace-nowrap">{formatearFecha(inf.fecha)}</span>
                  <span className="flex-1 truncate">{inf.organismo} — {inf.descripcion}</span>
                  <span className="font-medium whitespace-nowrap">{formatearMoneda(inf.monto)}</span>
                  {inf.estado === "PENDIENTE" ? (
                    <button
                      type="button"
                      onClick={() => setInfraccionPago(inf)}
                      className="shrink-0 border rounded px-2 py-0.5 text-xs hover:bg-gray-50"
                    >
                      Registrar pago
                    </button>
                  ) : (
                    <div className="flex items-center gap-1 shrink-0">
                      <span className="text-green-700">Pagada</span>
                      {inf.comprobantePdfS3Key && (
                        <a
                          href={`/api/storage/${inf.comprobantePdfS3Key}`}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Ver comp.
                        </a>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {modalChofer && (
        <ModalAsignarChofer
          camion={camion}
          choferes={choferes}
          onClose={() => setModalChofer(false)}
          onSaved={handleChoferSaved}
        />
      )}

      {modalNuevaInfraccion && (
        <ModalNuevaInfraccion
          camionId={camion.id}
          onClose={() => setModalNuevaInfraccion(false)}
          onSaved={handleInfraccionSaved}
        />
      )}

      {infraccionPago && (
        <ModalPagoInfraccion
          infraccion={infraccionPago}
          cuentas={cuentas}
          onClose={() => setInfraccionPago(null)}
          onSaved={handlePagoSaved}
        />
      )}
    </div>
  )
}

// ── Componente principal ───────────────────────────────────────────────────────

export function FlotaPropiaClient({ camiones: initialCamiones, choferes, cuentas }: FlotaPropiaClientProps) {
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
              cuentas={cuentas}
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
