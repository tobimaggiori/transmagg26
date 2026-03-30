"use client"

/**
 * Propósito: Componente cliente de la página de viajes.
 * Maneja selección de fletero/empresa, carga de viajes via API, tabs y modales de ABM.
 * SEGURIDAD: tarifaOperativaInicial nunca se muestra a roles externos.
 */

import { useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { describirCircuitoViaje, resumirWorkflowViajes } from "@/lib/viaje-ui"
import { WorkflowSummaryCard } from "@/components/workflow/workflow-summary-card"
import { CircuitBadge } from "@/components/workflow/circuit-badge"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; comisionDefault?: number }
type Empresa = { id: string; razonSocial: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string }
type Chofer = { id: string; nombre: string; apellido: string }

type ViajeAPI = {
  id: string
  fechaViaje: string
  fleteroId: string
  empresaId: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaOperativaInicial?: number | null
  estadoLiquidacion: string
  estadoFactura: string
  toneladas?: number | null
  total?: number | null
  fletero: { razonSocial: string }
  empresa: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
  camionId: string
  choferId: string
}

type Vista = "todos" | "pend_liquidar" | "pend_facturar" | "pend_ambos"

const VISTAS: { id: Vista; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pend_liquidar", label: "Pend. liquidar" },
  { id: "pend_facturar", label: "Pend. facturar" },
  { id: "pend_ambos", label: "Pend. ambos" },
]


// ─── Props ────────────────────────────────────────────────────────────────────

type ViajesClientProps = {
  rol: Rol
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  fleteroIdPropio: string | null
  empresaIdPropio: string | null
  initialFleteroId: string | null
  initialEmpresaId: string | null
}

// ─── Modal Nuevo/Editar Viaje ─────────────────────────────────────────────────

/**
 * ModalViaje: props -> JSX.Element
 *
 * Dado los datos del formulario de viaje (nuevo o edición), renderiza un modal con
 * todos los campos y cálculo en tiempo real de toneladas y total.
 * Existe para ABM de viajes desde el panel.
 *
 * Ejemplos:
 * <ModalViaje modo="nuevo" onGuardar={fn} onCerrar={fn} fleteros={[]} ... />
 * <ModalViaje modo="editar" viaje={v} onGuardar={fn} onCerrar={fn} ... />
 * // Al ingresar kilos y tarifaOperativaInicial → muestra toneladas y total en tiempo real
 */
function ModalViaje({
  modo,
  viaje,
  fleteros,
  empresas,
  camiones,
  choferes,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  modo: "nuevo" | "editar"
  viaje?: ViajeAPI
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  onGuardar: (data: Record<string, unknown>) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [fleteroId, setFleteroId] = useState(viaje?.fleteroId ?? "")
  const [camionId, setCamionId] = useState(viaje?.camionId ?? "")
  const [choferId, setChoferId] = useState(viaje?.choferId ?? "")
  const [empresaId, setEmpresaId] = useState(viaje?.empresaId ?? "")
  const [fechaViaje, setFechaViaje] = useState(
    viaje ? viaje.fechaViaje.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [remito, setRemito] = useState(viaje?.remito ?? "")
  const [cupo, setCupo] = useState(viaje?.cupo ?? "")
  const [mercaderia, setMercaderia] = useState(viaje?.mercaderia ?? "")
  const [procedencia, setProcedencia] = useState(viaje?.procedencia ?? "")
  const [provinciaOrigen, setProvinciaOrigen] = useState(viaje?.provinciaOrigen ?? "")
  const [destino, setDestino] = useState(viaje?.destino ?? "")
  const [provinciaDestino, setProvinciaDestino] = useState(viaje?.provinciaDestino ?? "")
  const [kilos, setKilos] = useState(viaje?.kilos?.toString() ?? "")
  const [tarifaOperativaInicial, setTarifaBase] = useState(viaje?.tarifaOperativaInicial?.toString() ?? "")

  const camionesDelFletero = camiones.filter((c) => c.fleteroId === fleteroId)

  const kilosNum = parseFloat(kilos) || 0
  const tarifaNum = parseFloat(tarifaOperativaInicial) || 0
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    onGuardar({
      fleteroId,
      camionId,
      choferId,
      empresaId,
      fechaViaje,
      remito: remito || undefined,
      cupo: cupo || undefined,
      mercaderia: mercaderia || undefined,
      procedencia: procedencia || undefined,
      provinciaOrigen: provinciaOrigen || undefined,
      destino: destino || undefined,
      provinciaDestino: provinciaDestino || undefined,
      kilos: kilosNum > 0 ? kilosNum : undefined,
      tarifaOperativaInicial: tarifaNum > 0 ? tarifaNum : undefined,
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">{modo === "nuevo" ? "Nuevo viaje" : "Editar viaje"}</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {modo === "editar" && viaje?.estadoLiquidacion === "LIQUIDADO" && (
          <div className="mb-3 p-3 bg-blue-50 text-blue-800 rounded-md text-sm">
            Este viaje ya fue incluido en una liquidación. Los datos de la liquidación no se actualizarán.
          </div>
        )}
        {modo === "editar" && viaje?.estadoFactura === "FACTURADO" && (
          <div className="mb-3 p-3 bg-green-50 text-green-800 rounded-md text-sm">
            Este viaje ya fue incluido en una factura. Los datos de la factura no se actualizarán.
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 text-red-700 rounded-md text-sm">{error}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Fletero *</label>
              <select
                value={fleteroId}
                onChange={(e) => { setFleteroId(e.target.value); setCamionId("") }}
                required
                disabled={modo === "editar"}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Empresa *</label>
              <select
                value={empresaId}
                onChange={(e) => setEmpresaId(e.target.value)}
                required
                disabled={modo === "editar"}
                className="w-full h-9 rounded-md border bg-background px-2 text-sm disabled:opacity-50"
              >
                <option value="">Seleccionar...</option>
                {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Camión *</label>
              <select
                value={camionId}
                onChange={(e) => setCamionId(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {(fleteroId ? camionesDelFletero : camiones).map((c) => (
                  <option key={c.id} value={c.id}>{c.patenteChasis}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Chofer *</label>
              <select
                value={choferId}
                onChange={(e) => setChoferId(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {choferes.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Fecha de viaje *</label>
            <input
              type="date"
              value={fechaViaje}
              onChange={(e) => setFechaViaje(e.target.value)}
              required
              className="w-full h-9 rounded-md border bg-background px-2 text-sm"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Remito</label>
              <input type="text" value={remito} onChange={(e) => setRemito(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Cupo</label>
              <input type="text" value={cupo} onChange={(e) => setCupo(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Mercadería</label>
            <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Procedencia</label>
              <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Destino</label>
              <input type="text" value={destino} onChange={(e) => setDestino(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Provincia origen</label>
              <input type="text" value={provinciaOrigen} onChange={(e) => setProvinciaOrigen(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Provincia destino</label>
              <input type="text" value={provinciaDestino} onChange={(e) => setProvinciaDestino(e.target.value)} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Kilos</label>
              <input
                type="number"
                value={kilos}
                onChange={(e) => setKilos(e.target.value)}
                min="0"
                step="1"
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              />
              {toneladas != null && (
                <p className="text-xs text-muted-foreground mt-1">{toneladas} toneladas</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tarifa operativa inicial / ton *</label>
              <input
                type="number"
                value={tarifaOperativaInicial}
                onChange={(e) => setTarifaBase(e.target.value)}
                min="0"
                step="0.01"
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              />
              {totalCalc != null && (
                <p className="text-xs text-muted-foreground mt-1">
                  Referencia inicial del viaje: {formatearMoneda(totalCalc)}
                </p>
              )}
              <p className="text-[11px] text-muted-foreground mt-1">
                Esta tarifa es editable y sirve como base operativa antes de definir la tarifa al fletero o a la empresa.
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={cargando}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {cargando ? "Guardando..." : modo === "nuevo" ? "Crear viaje" : "Guardar cambios"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * ViajesClient: ViajesClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI completa de viajes:
 * selectores de fletero/empresa, tabs de estado, tabla de viajes y modales ABM.
 * Fetches API al seleccionar fletero o empresa. No muestra tabla hasta selección.
 * Existe para la gestión interactiva de viajes desde el panel de operadores.
 *
 * Ejemplos:
 * // Sin selección → muestra instrucción
 * <ViajesClient rol="OPERADOR_TRANSMAGG" fleteros={[...]} ... />
 * // Con fleteroId → tabla filtrada
 * <ViajesClient rol="OPERADOR_TRANSMAGG" initialFleteroId="f1" ... />
 * // Con rol FLETERO → vista propia automática
 * <ViajesClient rol="FLETERO" fleteroIdPropio="f1" ... />
 */
export function ViajesClient({
  rol,
  fleteros,
  empresas,
  camiones,
  choferes,
  fleteroIdPropio,
  empresaIdPropio,
  initialFleteroId,
  initialEmpresaId,
}: ViajesClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [fleteroId, setFleteroId] = useState<string>(
    fleteroIdPropio ?? initialFleteroId ?? ""
  )
  const [empresaId, setEmpresaId] = useState<string>(
    empresaIdPropio ?? initialEmpresaId ?? ""
  )
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargando, setCargando] = useState(false)
  const [vista, setVista] = useState<Vista>("todos")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [modalAbierto, setModalAbierto] = useState(false)
  const [viajeEditando, setViajeEditando] = useState<ViajeAPI | undefined>(undefined)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const tieneSeleccion = Boolean(fleteroId || empresaId)

  const cargarViajes = useCallback(async () => {
    if (!tieneSeleccion && !fleteroIdPropio && !empresaIdPropio) return
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (fleteroId) params.set("fleteroId", fleteroId)
      if (empresaId) params.set("empresaId", empresaId)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)
      const res = await fetch(`/api/viajes?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setViajes(data)
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, empresaId, desde, hasta, tieneSeleccion, fleteroIdPropio, empresaIdPropio])

  useEffect(() => {
    if (tieneSeleccion || fleteroIdPropio || empresaIdPropio) {
      cargarViajes()
    }
  }, [cargarViajes, tieneSeleccion, fleteroIdPropio, empresaIdPropio])

  // Filtrar viajes según la vista
  const viajesFiltrados = viajes.filter((v) => {
    if (vista === "pend_liquidar") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR"
    if (vista === "pend_facturar") return v.estadoFactura === "PENDIENTE_FACTURAR"
    if (vista === "pend_ambos") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR" && v.estadoFactura === "PENDIENTE_FACTURAR"
    return true
  })
  const resumen = resumirWorkflowViajes(viajesFiltrados)

  async function handleGuardarViaje(data: Record<string, unknown>) {
    setGuardando(true)
    setErrorModal(null)
    try {
      const url = viajeEditando ? `/api/viajes/${viajeEditando.id}` : "/api/viajes"
      const method = viajeEditando ? "PATCH" : "POST"
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorModal(err.error ?? "Error al guardar")
        return
      }
      setModalAbierto(false)
      setViajeEditando(undefined)
      cargarViajes()
    } finally {
      setGuardando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Viajes</h2>
          <p className="text-muted-foreground">
            {esInterno
              ? "El viaje base se puede corregir antes de liquidar al fletero y antes de facturar a la empresa."
              : "Tus viajes registrados en el sistema."}
          </p>
        </div>
        {esInterno && (
          <button
            onClick={() => { setViajeEditando(undefined); setErrorModal(null); setModalAbierto(true) }}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            + Nuevo viaje
          </button>
        )}
      </div>

      {/* Selectores de Fletero y Empresa (solo internos) */}
      {esInterno && (
        <div className="rounded-2xl border bg-slate-50 p-4">
          <div className="mb-4 grid gap-3 md:grid-cols-3">
            <WorkflowNote
              titulo="Lado Fletero"
              descripcion="El viaje aparece pendiente hasta que el operador arma el líquido producto."
            />
            <WorkflowNote
              titulo="Lado Empresa"
              descripcion="El mismo viaje puede seguir pendiente de facturar aunque ya haya sido liquidado."
            />
            <WorkflowNote
              titulo="Tarifa Base"
              descripcion="Se usa como referencia operativa inicial. La tarifa final al fletero y a la empresa se define al generar cada comprobante."
            />
          </div>
          <div className="flex flex-wrap gap-4">
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select
              value={fleteroId}
              onChange={(e) => setFleteroId(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Todos / seleccionar...</option>
              {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1 min-w-[200px]">
            <label className="text-xs font-medium text-muted-foreground">Empresa</label>
            <select
              value={empresaId}
              onChange={(e) => setEmpresaId(e.target.value)}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Todos / seleccionar...</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Desde</label>
            <input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Hasta</label>
            <input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm" />
          </div>
          <div className="flex items-end gap-2">
            <button onClick={cargarViajes} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              Filtrar
            </button>
          </div>
        </div>
        </div>
      )}

      {/* Sin selección — instrucción */}
      {!tieneSeleccion && !fleteroIdPropio && !empresaIdPropio && esInterno && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Seleccioná un Fletero o una Empresa para ver los viajes</p>
          <p className="text-sm mt-1">O dejá ambos en blanco y filtrá para ver todos.</p>
        </div>
      )}

      {/* Tabs */}
      {(tieneSeleccion || !esInterno) && (
        <>
          <div className="grid gap-3 md:grid-cols-4">
            <WorkflowSummaryCard titulo="Viajes visibles" valor={resumen.total} />
            <WorkflowSummaryCard titulo="Pendientes de liquidar" valor={resumen.pendientesLiquidar} tono="warning" />
            <WorkflowSummaryCard titulo="Pendientes de facturar" valor={resumen.pendientesFacturar} tono="warning" />
            <WorkflowSummaryCard titulo="Cerrados en ambos circuitos" valor={resumen.cerradosAmbos} tono="success" />
          </div>

          <div className="border-b">
            <nav className="flex gap-0 -mb-px">
              {VISTAS.map((v) => (
                <button
                  key={v.id}
                  onClick={() => setVista(v.id)}
                  className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                    vista === v.id
                      ? "border-primary text-primary"
                      : "border-transparent text-muted-foreground hover:text-foreground hover:border-gray-300"
                  }`}
                >
                  {v.label}
                </button>
              ))}
            </nav>
          </div>

          {cargando ? (
            <div className="text-center py-8 text-muted-foreground">Cargando...</div>
          ) : viajesFiltrados.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No hay viajes que coincidan con los filtros.
            </div>
          ) : (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">{viajesFiltrados.length} viaje(s)</p>
              <div className="overflow-x-auto rounded-2xl border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2 text-left font-medium">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium">Carga</th>
                      <th className="px-3 py-2 text-left font-medium">Recorrido</th>
                      <th className="px-3 py-2 text-right font-medium">Kilos</th>
                      <th className="px-3 py-2 text-right font-medium">Ton</th>
                      {esInterno && <th className="px-3 py-2 text-right font-medium">Tarifa operativa inicial</th>}
                      {esInterno && <th className="px-3 py-2 text-right font-medium">Referencia</th>}
                      <th className="px-3 py-2 text-left font-medium">Workflow</th>
                      {esInterno && <th className="px-3 py-2 text-center font-medium">Acc.</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesFiltrados.map((v) => {
                      const toneladas = v.kilos != null ? calcularToneladas(v.kilos) : null
                      const tarifaOperativa = v.tarifaOperativaInicial ?? null
                      const total = v.kilos != null && tarifaOperativa != null
                        ? calcularTotalViaje(v.kilos, tarifaOperativa)
                        : null
                      return (
                        <tr key={v.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                          <td className="px-3 py-2">
                            <div className="space-y-0.5">
                              <p className="font-medium">{v.empresa.razonSocial}</p>
                              <p className="text-xs text-muted-foreground">{v.fletero.razonSocial}</p>
                              <p className="text-xs text-muted-foreground">
                                Remito {v.remito ?? "-"} · Cupo {v.cupo ?? "-"}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2">
                            <div className="space-y-0.5">
                              <p>{v.mercaderia ?? "Sin mercadería cargada"}</p>
                              <p className="text-xs text-muted-foreground">
                                {v.provinciaOrigen ?? v.procedencia ?? "-"} → {v.provinciaDestino ?? v.destino ?? "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Camión {v.camion.patenteChasis} · {v.chofer.apellido}, {v.chofer.nombre}
                              </p>
                            </div>
                          </td>
                          <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                          <td className="px-3 py-2 text-right">{toneladas?.toLocaleString("es-AR") ?? "-"}</td>
                          {esInterno && <td className="px-3 py-2 text-right">{tarifaOperativa != null ? formatearMoneda(tarifaOperativa) : "-"}</td>}
                          {esInterno && <td className="px-3 py-2 text-right font-medium">{total != null ? formatearMoneda(total) : "-"}</td>}
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1.5">
                                <CircuitBadge etiqueta="Fletero" estado={v.estadoLiquidacion} />
                                <CircuitBadge etiqueta="Empresa" estado={v.estadoFactura} />
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {describirCircuitoViaje(v.estadoLiquidacion, v.estadoFactura)}
                              </p>
                            </div>
                          </td>
                          {esInterno && (
                            <td className="px-3 py-2 text-center">
                              <button
                                onClick={() => { setViajeEditando(v); setErrorModal(null); setModalAbierto(true) }}
                                className="text-xs text-primary hover:underline"
                              >
                                Editar
                              </button>
                            </td>
                          )}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {/* Modal nuevo/editar */}
      {modalAbierto && esInterno && (
        <ModalViaje
          modo={viajeEditando ? "editar" : "nuevo"}
          viaje={viajeEditando}
          fleteros={fleteros}
          empresas={empresas}
          camiones={camiones}
          choferes={choferes}
          onGuardar={handleGuardarViaje}
          onCerrar={() => { setModalAbierto(false); setViajeEditando(undefined) }}
          cargando={guardando}
          error={errorModal}
        />
      )}
    </div>
  )
}
