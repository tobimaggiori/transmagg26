"use client"

/**
 * Propósito: Tabla completa de viajes con filtros, paginación y acciones por estado.
 * Columnas: Fecha, Fletero, Camión, Empresa, Mercadería, Prov. Origen, Prov. Destino,
 *           Kilos, Tarifa, Carta de Porte, LP, Factura, Estado, Acciones.
 * Acciones: Cambiar empresa, Cambiar fletero, Eliminar viaje.
 * Paginación: 20 viajes por página (client-side sobre los ya cargados).
 */

import { useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string }
type Empresa = { id: string; razonSocial: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }

type ViajeAPI = {
  id: string
  fechaViaje: string
  fleteroId: string | null
  esCamionPropio: boolean
  empresaId: string
  camionId: string
  mercaderia: string | null
  provinciaOrigen: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaOperativaInicial: number | null
  estadoLiquidacion: string
  estadoFactura: string
  nroCartaPorte: string | null
  cartaPorteS3Key: string | null
  historialCambios?: string | null
  toneladas?: number | null
  total?: number | null
  fletero: { razonSocial: string } | null
  empresa: { razonSocial: string }
  camion: { patenteChasis: string; tipoCamion?: string }
  chofer: { nombre: string; apellido: string }
  enLiquidaciones?: Array<{
    liquidacion: {
      estado: string
      cae: string | null
      arcaEstado: string | null
      nroComprobante: number | null
      ptoVenta: number | null
      pdfS3Key: string | null
    } | null
  }>
  enFacturas?: Array<{
    factura: {
      id: string
      nroComprobante: string | null
      pdfS3Key: string | null
      estado: string
      tipoCbte: string
    } | null
  }>
}

const PER_PAGE = 20

type EstadoFiltro = "" | "PENDIENTE_LIQUIDAR" | "LIQUIDADO" | "PENDIENTE_FACTURAR" | "FACTURADO"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function badgeLiq(estado: string) {
  if (estado === "LIQUIDADO")
    return <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">LP</span>
  return <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Sin LP</span>
}

function badgeFact(estado: string) {
  if (estado === "FACTURADO")
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Fact.</span>
  return <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Sin fact.</span>
}

function PDFLink({ label, s3Key }: { label: string; s3Key: string }) {
  const [loading, setLoading] = useState(false)

  async function abrir() {
    setLoading(true)
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(s3Key)}`)
      const data = await res.json()
      if (res.ok && data.url) window.open(data.url as string, "_blank", "noopener,noreferrer")
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      type="button"
      onClick={abrir}
      disabled={loading}
      className="text-xs text-primary hover:underline disabled:opacity-50 whitespace-nowrap"
    >
      {loading ? "…" : label}
    </button>
  )
}

// ─── Modal Cambiar Empresa ────────────────────────────────────────────────────

type EntradaHistorial = {
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  motivo: string
}

function ModalCambiarEmpresa({
  viaje,
  empresas,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  empresas: Empresa[]
  onGuardar: (data: { empresaId: string; tarifaOperativaInicial?: number; motivoCambioEmpresa: string }) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [nuevaEmpresaId, setNuevaEmpresaId] = useState("")
  const [nuevaTarifa, setNuevaTarifa] = useState(viaje.tarifaOperativaInicial?.toString() ?? "")
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const mismaEmpresa = nuevaEmpresaId === viaje.empresaId
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = nuevaEmpresaId && !mismaEmpresa && motivoValido

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar empresa del viaje</h2>
          <button type="button" onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <p className="text-sm text-muted-foreground">
          Empresa actual: <span className="font-medium text-foreground">{viaje.empresa.razonSocial}</span>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!puedeConfirmar) return
            onGuardar({
              empresaId: nuevaEmpresaId,
              tarifaOperativaInicial: nuevaTarifa ? Number(nuevaTarifa) : undefined,
              motivoCambioEmpresa: motivo.trim(),
            })
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Nueva empresa</label>
            <select
              value={nuevaEmpresaId}
              onChange={(e) => setNuevaEmpresaId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Seleccioná una empresa —</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Nueva tarifa operativa ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={nuevaTarifa}
              onChange={(e) => setNuevaTarifa(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Dejar vacío para mantener la actual"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo del cambio <span className="text-muted-foreground">(mín. 10 caracteres)</span></label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              placeholder="Ej: Cliente reasignado por acuerdo comercial..."
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{motivo.trim().length}/10 mín.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeConfirmar || cargando}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              {cargando ? "Guardando…" : "Confirmar cambio"}
            </button>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {mostrarHistorial ? "▲ Ocultar historial" : `▼ Historial de cambios (${historial.length})`}
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial.map((e, i) => (
                  <div key={i} className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-0.5">
                    <p className="text-muted-foreground">{formatearFecha(new Date(e.fecha))}</p>
                    <p><span className="font-medium">{e.valorAnterior}</span>{" → "}<span className="font-medium">{e.valorNuevo}</span></p>
                    <p className="text-muted-foreground italic">&ldquo;{e.motivo}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal Cambiar Fletero ────────────────────────────────────────────────────

function ModalCambiarFletero({
  viaje,
  fleteros,
  camiones,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  fleteros: Fletero[]
  camiones: Camion[]
  onGuardar: (data: { fleteroId: string | null; camionId?: string; motivoCambioFletero: string }) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [nuevoFleteroId, setNuevoFleteroId] = useState(viaje.fleteroId ?? "")
  const [nuevoCamionId, setNuevoCamionId] = useState(viaje.camionId ?? "")
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const camionesDisponibles = camiones.filter((c) =>
    nuevoFleteroId ? c.fleteroId === nuevoFleteroId : c.esPropio
  )
  const mismoFletero = nuevoFleteroId === (viaje.fleteroId ?? "")
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = !mismoFletero && motivoValido

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar fletero del viaje</h2>
          <button type="button" onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <p className="text-sm text-muted-foreground">
          Fletero actual: <span className="font-medium text-foreground">{viaje.fletero?.razonSocial ?? "(propio)"}</span>
        </p>

        {viaje.estadoLiquidacion === "LIQUIDADO" && (
          <p className="text-sm text-destructive">Este viaje ya fue liquidado. No se puede cambiar el fletero.</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!puedeConfirmar) return
            onGuardar({
              fleteroId: nuevoFleteroId || null,
              camionId: nuevoCamionId || undefined,
              motivoCambioFletero: motivo.trim(),
            })
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Nuevo fletero</label>
            <select
              value={nuevoFleteroId}
              onChange={(e) => { setNuevoFleteroId(e.target.value); setNuevoCamionId("") }}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            >
              <option value="">— (Camión propio Transmagg) —</option>
              {fleteros.map((f) => (
                <option key={f.id} value={f.id}>{f.razonSocial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Camión</label>
            <select
              value={nuevoCamionId}
              onChange={(e) => setNuevoCamionId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            >
              <option value="">— Mantener camión actual —</option>
              {camionesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.patenteChasis}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Motivo del cambio <span className="text-muted-foreground">(mín. 10 caracteres)</span></label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              placeholder="Ej: Fletero original no disponible..."
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{motivo.trim().length}/10 mín.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeConfirmar || cargando || viaje.estadoLiquidacion === "LIQUIDADO"}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              {cargando ? "Guardando…" : "Confirmar cambio"}
            </button>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {mostrarHistorial ? "▲ Ocultar historial" : `▼ Historial de cambios (${historial.length})`}
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial.map((e, i) => (
                  <div key={i} className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-0.5">
                    <p className="text-muted-foreground">{formatearFecha(new Date(e.fecha))}</p>
                    <p><span className="font-medium">{e.valorAnterior}</span>{" → "}<span className="font-medium">{e.valorNuevo}</span></p>
                    <p className="text-muted-foreground italic">&ldquo;{e.motivo}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal Eliminar Viaje ─────────────────────────────────────────────────────

function ModalEliminar({
  viaje,
  onEliminar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  onEliminar: () => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const tieneLP = (viaje.enLiquidaciones?.length ?? 0) > 0
  const tieneFactura = (viaje.enFacturas?.length ?? 0) > 0

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Eliminar viaje</h2>

        <p className="text-sm">
          ¿Eliminar el viaje del <span className="font-medium">{formatearFecha(new Date(viaje.fechaViaje))}</span>?
          {viaje.fletero && <> Fletero: <span className="font-medium">{viaje.fletero.razonSocial}</span>.</>}
        </p>

        {(tieneLP || tieneFactura) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Este viaje tiene {tieneLP ? "liquidaciones" : ""}{tieneLP && tieneFactura ? " y " : ""}{tieneFactura ? "facturas" : ""} asociadas y no puede eliminarse.
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onEliminar}
            disabled={cargando || tieneLP || tieneFactura}
            className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-40"
          >
            {cargando ? "Eliminando…" : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarViajesClient({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  rol: _rol,
  fleteros,
  empresas,
  camiones,
}: {
  rol: Rol
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
}) {
  // Filtros
  const [filtroFleteroId, setFiltroFleteroId] = useState("")
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroEstadoLiq, setFiltroEstadoLiq] = useState<EstadoFiltro>("")
  const [filtroEstadoFact, setFiltroEstadoFact] = useState<EstadoFiltro>("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  // Datos
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // Paginación
  const [pagina, setPagina] = useState(1)

  // Modales
  const [viajeCambioEmpresa, setViajeCambioEmpresa] = useState<ViajeAPI | null>(null)
  const [viajeCambioFletero, setViajeCambioFletero] = useState<ViajeAPI | null>(null)
  const [viajeEliminar, setViajeEliminar] = useState<ViajeAPI | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargandoViajes(true)
    setErrorCarga(null)
    try {
      const params = new URLSearchParams()
      if (filtroFleteroId) params.set("fleteroId", filtroFleteroId)
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroEstadoLiq) params.set("estadoLiquidacion", filtroEstadoLiq)
      if (filtroEstadoFact) params.set("estadoFactura", filtroEstadoFact)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      const res = await fetch(`/api/viajes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cargar viajes")
      setViajes(data as ViajeAPI[])
      setPagina(1)
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargandoViajes(false)
    }
  }, [filtroFleteroId, filtroEmpresaId, filtroEstadoLiq, filtroEstadoFact, filtroDesde, filtroHasta])

  useEffect(() => { void cargar() }, [cargar])

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(viajes.length / PER_PAGE))
  const viajesPagina = viajes.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  // ── Acción: cambiar empresa ───────────────────────────────────────────────
  async function handleCambiarEmpresa(data: { empresaId: string; tarifaOperativaInicial?: number; motivoCambioEmpresa: string }) {
    if (!viajeCambioEmpresa) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeCambioEmpresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setErrorModal(json.error ?? "Error al guardar"); return }
      setViajeCambioEmpresa(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  // ── Acción: cambiar fletero ───────────────────────────────────────────────
  async function handleCambiarFletero(data: { fleteroId: string | null; camionId?: string; motivoCambioFletero: string }) {
    if (!viajeCambioFletero) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeCambioFletero.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setErrorModal(json.error ?? "Error al guardar"); return }
      setViajeCambioFletero(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  // ── Acción: eliminar ──────────────────────────────────────────────────────
  async function handleEliminar() {
    if (!viajeEliminar) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeEliminar.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        setErrorModal(json.error ?? "Error al eliminar")
        return
      }
      setViajeEliminar(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consultar Viajes</h1>
        <span className="text-sm text-muted-foreground">{viajes.length} viaje(s)</span>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fletero</label>
          <select
            value={filtroFleteroId}
            onChange={(e) => setFiltroFleteroId(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Empresa</label>
          <select
            value={filtroEmpresaId}
            onChange={(e) => setFiltroEmpresaId(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado LP</label>
          <select
            value={filtroEstadoLiq}
            onChange={(e) => setFiltroEstadoLiq(e.target.value as EstadoFiltro)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todos</option>
            <option value="PENDIENTE_LIQUIDAR">Sin liquidar</option>
            <option value="LIQUIDADO">Liquidado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado Factura</label>
          <select
            value={filtroEstadoFact}
            onChange={(e) => setFiltroEstadoFact(e.target.value as EstadoFiltro)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          >
            <option value="">Todas</option>
            <option value="PENDIENTE_FACTURAR">Sin facturar</option>
            <option value="FACTURADO">Facturado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desde</label>
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hasta</label>
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"
          />
        </div>
      </div>

      {errorCarga && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{errorCarga}</div>
      )}

      {/* Tabla */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              {["Fecha", "Fletero", "Camión", "Empresa", "Mercadería", "Prov. Orig.", "Prov. Dest.", "Kilos", "Tarifa", "Total", "CdP", "LP", "Factura", "Estado", ""].map((h) => (
                <th key={h} className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {cargandoViajes ? (
              <tr><td colSpan={15} className="py-8 text-center text-sm text-muted-foreground">Cargando...</td></tr>
            ) : viajesPagina.length === 0 ? (
              <tr><td colSpan={15} className="py-8 text-center text-sm text-muted-foreground">Sin viajes para los filtros seleccionados.</td></tr>
            ) : viajesPagina.map((v) => {
              const lp = v.enLiquidaciones?.[0]?.liquidacion
              const fact = v.enFacturas?.[0]?.factura
              return (
                <tr key={v.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                  <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">{v.fletero?.razonSocial ?? <span className="text-muted-foreground italic">Propio</span>}</td>
                  <td className="px-3 py-2 whitespace-nowrap">{v.camion.patenteChasis}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">{v.empresa.razonSocial}</td>
                  <td className="px-3 py-2 whitespace-nowrap max-w-[120px] truncate">{v.mercaderia ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{v.provinciaOrigen ?? "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap text-xs">{v.provinciaDestino ?? "—"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{v.kilos != null ? v.kilos.toLocaleString("es-AR") : "—"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap">{v.tarifaOperativaInicial != null ? formatearMoneda(v.tarifaOperativaInicial) : "—"}</td>
                  <td className="px-3 py-2 text-right whitespace-nowrap font-medium">{v.total != null ? formatearMoneda(v.total) : "—"}</td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {v.nroCartaPorte ? (
                      v.cartaPorteS3Key
                        ? <PDFLink label={v.nroCartaPorte} s3Key={v.cartaPorteS3Key} />
                        : <span className="text-xs">{v.nroCartaPorte}</span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {lp?.pdfS3Key && lp.nroComprobante != null && lp.ptoVenta != null ? (
                      <PDFLink
                        label={`LP ${String(lp.ptoVenta).padStart(4, "0")}-${String(lp.nroComprobante).padStart(8, "0")}`}
                        s3Key={lp.pdfS3Key}
                      />
                    ) : lp ? (
                      <span className="text-xs text-muted-foreground">{lp.estado}</span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fact?.pdfS3Key && fact.nroComprobante ? (
                      <PDFLink label={fact.nroComprobante} s3Key={fact.pdfS3Key} />
                    ) : fact ? (
                      <span className="text-xs text-muted-foreground">{fact.estado}</span>
                    ) : "—"}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      {badgeLiq(v.estadoLiquidacion)}
                      {badgeFact(v.estadoFactura)}
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-1">
                      {/* Cambiar empresa: solo si no facturado */}
                      {v.estadoFactura !== "FACTURADO" && (
                        <button
                          type="button"
                          onClick={() => { setViajeCambioEmpresa(v); setErrorModal(null) }}
                          className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                          title="Cambiar empresa"
                        >
                          Emp.
                        </button>
                      )}
                      {/* Cambiar fletero: solo si no liquidado */}
                      {v.estadoLiquidacion !== "LIQUIDADO" && (
                        <button
                          type="button"
                          onClick={() => { setViajeCambioFletero(v); setErrorModal(null) }}
                          className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                          title="Cambiar fletero"
                        >
                          Flet.
                        </button>
                      )}
                      {/* Eliminar: siempre visible, se bloquea en el modal si tiene LP/factura */}
                      <button
                        type="button"
                        onClick={() => { setViajeEliminar(v); setErrorModal(null) }}
                        className="text-xs px-2 py-1 rounded border border-destructive/30 text-destructive hover:bg-destructive/10 transition-colors"
                        title="Eliminar viaje"
                      >
                        ✕
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas} · {viajes.length} viaje(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-40"
            >
              ← Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-40"
            >
              Siguiente →
            </button>
          </div>
        </div>
      )}

      {/* Modales */}
      {viajeCambioEmpresa && (
        <ModalCambiarEmpresa
          viaje={viajeCambioEmpresa}
          empresas={empresas}
          onGuardar={handleCambiarEmpresa}
          onCerrar={() => setViajeCambioEmpresa(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}

      {viajeCambioFletero && (
        <ModalCambiarFletero
          viaje={viajeCambioFletero}
          fleteros={fleteros}
          camiones={camiones}
          onGuardar={handleCambiarFletero}
          onCerrar={() => setViajeCambioFletero(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}

      {viajeEliminar && (
        <ModalEliminar
          viaje={viajeEliminar}
          onEliminar={handleEliminar}
          onCerrar={() => setViajeEliminar(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}
    </div>
  )
}
