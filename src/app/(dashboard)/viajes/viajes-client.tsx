"use client"

/**
 * Propósito: Componente cliente de la página de viajes.
 * Maneja selección de fletero/empresa, carga de viajes via API, tabs y modales de ABM.
 * SEGURIDAD: tarifaFletero/tarifaEmpresa nunca se muestra a roles externos.
 */

import { useState, useCallback, useEffect } from "react"
import { ShieldAlert } from "lucide-react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { describirCircuitoViaje, resumirWorkflowViajes } from "@/lib/viaje-ui"
import { WorkflowSummaryCard } from "@/components/workflow/workflow-summary-card"
import { CircuitBadge } from "@/components/workflow/circuit-badge"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { viajeEsFacturable, razonNoFacturable } from "@/lib/facturacion"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { UploadPDF } from "@/components/upload-pdf"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }
type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean; polizaVigente?: boolean; choferActualId?: string | null }
type Chofer = { id: string; nombre: string; apellido: string; fleteroId: string | null }

type ViajeAPI = {
  id: string
  fechaViaje: string
  fleteroId: string | null
  esCamionPropio: boolean
  empresaId: string
  remito: string | null
  tieneCupo: boolean | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaFletero?: number | null
  tarifaEmpresa?: number | null
  estadoLiquidacion: string
  estadoFactura: string
  nroCartaPorte?: string | null
  cartaPorteS3Key?: string | null
  enLiquidaciones?: Array<{
    liquidacion: { estado: string; cae: string | null; arcaEstado: string | null }
  }>
  toneladas?: number | null
  total?: number | null
  fletero: { razonSocial: string } | null
  empresa: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
  camionId: string
  choferId: string
  historialCambios?: string | null
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
  autoOpenModal?: boolean
}

// ─── Carta de porte cell ──────────────────────────────────────────────────────

function CartaPorteCell({ nro, s3Key }: { nro: string; s3Key?: string }) {
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState("")

  async function verPDF() {
    if (!s3Key) return
    setCargando(true)
    setError("")
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(s3Key)}`)
      const data = await res.json()
      if (res.ok && data.url) {
        window.open(data.url as string, "_blank", "noopener,noreferrer")
      } else {
        setError(data.error ?? "Error al obtener el PDF")
      }
    } catch {
      setError("Error de red")
    } finally {
      setCargando(false)
    }
  }

  return (
    <div className="space-y-0.5">
      <p className="text-sm font-medium">{nro}</p>
      {s3Key && (
        <button
          type="button"
          onClick={verPDF}
          disabled={cargando}
          className="text-xs text-primary hover:underline disabled:opacity-50"
        >
          {cargando ? "Cargando..." : "Ver PDF"}
        </button>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  )
}

// ─── Modal Cambiar Empresa ────────────────────────────────────────────────────

type EntradaHistorial = {
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  motivo: string
  operadorId: string
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
  onGuardar: (data: Record<string, unknown>) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [nuevaEmpresaId, setNuevaEmpresaId] = useState("")
  const [nuevaTarifa, setNuevaTarifa] = useState(viaje.tarifaEmpresa?.toString() ?? "")
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const empresaActual = empresas.find((e) => e.id === viaje.empresaId)
  const empresaNueva = empresas.find((e) => e.id === nuevaEmpresaId)
  const mismaEmpresa = nuevaEmpresaId === viaje.empresaId
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = nuevaEmpresaId && !mismaEmpresa && motivoValido && !cargando

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeConfirmar) return
    const payload: Record<string, unknown> = {
      empresaId: nuevaEmpresaId,
      motivoCambioEmpresa: motivo.trim(),
    }
    const tarifaNum = parseFloat(nuevaTarifa)
    if (tarifaNum > 0 && tarifaNum !== viaje.tarifaEmpresa) {
      payload.tarifa = tarifaNum
    }
    onGuardar(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg space-y-5 p-6">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cambiar empresa del viaje</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatearFecha(new Date(viaje.fechaViaje))} — {viaje.provinciaOrigen ?? viaje.procedencia ?? "-"} → {viaje.provinciaDestino ?? viaje.destino ?? "-"}
              {viaje.mercaderia ? ` — ${viaje.mercaderia}` : ""}
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground rounded-md p-1" aria-label="Cerrar">✕</button>
        </div>

        {viaje.estadoFactura === "FACTURADA" ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Este viaje ya fue facturado. No se puede cambiar la empresa.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Empresa actual</p>
                <p className="font-medium">{empresaActual?.razonSocial ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tarifa actual</p>
                <p className="font-medium">{viaje.tarifaEmpresa != null ? formatearMoneda(viaje.tarifaEmpresa) : "-"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva empresa <span className="text-destructive">*</span></label>
              <select
                value={nuevaEmpresaId}
                onChange={(e) => setNuevaEmpresaId(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccioná una empresa...</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.razonSocial}</option>
                ))}
              </select>
              {mismaEmpresa && nuevaEmpresaId && (
                <p className="text-xs text-amber-600">La empresa nueva es igual a la actual.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva tarifa operativa</label>
              <input
                type="number"
                value={nuevaTarifa}
                onChange={(e) => setNuevaTarifa(e.target.value)}
                min="0"
                step="0.01"
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                placeholder="Dejar igual si no cambia"
              />
              <p className="text-xs text-muted-foreground">Modificar solo si fue acordada con la nueva empresa.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Motivo del cambio <span className="text-destructive">*</span></label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm resize-none"
                placeholder="Mínimo 10 caracteres. Este motivo queda registrado en el historial del viaje."
                required
              />
              {motivo.length > 0 && !motivoValido && (
                <p className="text-xs text-destructive">El motivo debe tener al menos 10 caracteres.</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Preview del cambio */}
            {empresaNueva && !mismaEmpresa && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{empresaActual?.razonSocial}</span>
                {" → "}
                <span className="font-medium text-primary">{empresaNueva.razonSocial}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!puedeConfirmar}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargando ? "Guardando…" : "Confirmar cambio"}
              </button>
            </div>
          </form>
        )}

        {/* Historial colapsable */}
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
                    <p>
                      <span className="font-medium">{e.valorAnterior}</span>
                      {" → "}
                      <span className="font-medium">{e.valorNuevo}</span>
                    </p>
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
 * // Al ingresar kilos y tarifa → muestra toneladas y total en tiempo real
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
  const [esCamionPropio, setEsCamionPropio] = useState(viaje?.esCamionPropio ?? false)
  const [fleteroId, setFleteroId] = useState(viaje?.fleteroId ?? "")
  const [camionId, setCamionId] = useState(viaje?.camionId ?? "")
  const [choferId, setChoferId] = useState(viaje?.choferId ?? "")
  const [empresaId, setEmpresaId] = useState(viaje?.empresaId ?? "")
  const [fechaViaje, setFechaViaje] = useState(
    viaje ? viaje.fechaViaje.slice(0, 10) : new Date().toISOString().slice(0, 10)
  )
  const [remito, setRemito] = useState(viaje?.remito ?? "")
  const [tieneCupo, setTieneCupo] = useState(viaje?.tieneCupo ?? false)
  const [cupo, setCupo] = useState(viaje?.cupo ?? "")
  const [mercaderia, setMercaderia] = useState(viaje?.mercaderia ?? "")
  const [procedencia, setProcedencia] = useState(viaje?.procedencia ?? "")
  const [provinciaOrigen, setProvinciaOrigen] = useState(viaje?.provinciaOrigen ?? "")
  const [destino, setDestino] = useState(viaje?.destino ?? "")
  const [provinciaDestino, setProvinciaDestino] = useState(viaje?.provinciaDestino ?? "")
  const [kilos, setKilos] = useState(viaje?.kilos?.toString() ?? "")
  const [tarifaInput, setTarifaBase] = useState(viaje?.tarifaEmpresa?.toString() ?? "")
  const [nroCartaPorte, setNroCartaPorte] = useState(viaje?.nroCartaPorte ?? "")
  const [cartaPorteS3Key, setCartaPorteS3Key] = useState(viaje?.cartaPorteS3Key ?? "")

  const camionesDelFletero = esCamionPropio
    ? camiones.filter((c) => c.esPropio)
    : camiones.filter((c) => c.fleteroId === fleteroId)
  const choferesDelFletero = esCamionPropio
    ? choferes.filter((c) => !c.fleteroId)
    : fleteroId
    ? choferes.filter((c) => c.fleteroId === fleteroId)
    : choferes

  const fleteroItems = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))

  const kilosNum = parseFloat(kilos) || 0
  const tarifaNum = parseFloat(tarifaInput) || 0
  const toneladas = kilosNum > 0 ? calcularToneladas(kilosNum) : null
  const totalCalc = kilosNum > 0 && tarifaNum > 0 ? calcularTotalViaje(kilosNum, tarifaNum) : null

  const esNuevo = modo === "nuevo"
  const puedeGuardar =
    (esCamionPropio || fleteroId) && camionId && choferId && empresaId && fechaViaje &&
    provinciaOrigen && provinciaDestino && tarifaNum > 0 &&
    (!esNuevo || (nroCartaPorte.trim() !== "" && cartaPorteS3Key !== ""))

  const tooltipDeshabilitado = !puedeGuardar
    ? !cartaPorteS3Key && esNuevo
      ? "Debés subir el PDF de la carta de porte para continuar"
      : !nroCartaPorte.trim() && esNuevo
        ? "Ingresá el número de carta de porte"
        : "Completá todos los campos obligatorios"
    : undefined

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeGuardar) return
    onGuardar({
      ...(esCamionPropio ? { esCamionPropio: true } : { fleteroId }),
      camionId,
      choferId,
      empresaId,
      fechaViaje,
      remito: remito || undefined,
      tieneCupo,
      cupo: tieneCupo ? (cupo || undefined) : null,
      mercaderia: mercaderia || undefined,
      procedencia: procedencia || undefined,
      provinciaOrigen: provinciaOrigen || undefined,
      destino: destino || undefined,
      provinciaDestino: provinciaDestino || undefined,
      kilos: kilosNum > 0 ? kilosNum : undefined,
      tarifa: tarifaNum > 0 ? tarifaNum : undefined,
      ...(esNuevo ? { nroCartaPorte: nroCartaPorte.trim(), cartaPorteS3Key } : {}),
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
          {/* Toggle camión propio (solo al crear) */}
          {esNuevo && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de viaje</label>
              <div className="flex rounded-md border overflow-hidden h-9 w-fit">
                <button
                  type="button"
                  onClick={() => { setEsCamionPropio(false); setCamionId(""); setChoferId("") }}
                  className={`px-4 text-xs font-medium border-r ${!esCamionPropio ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Con fletero externo
                </button>
                <button
                  type="button"
                  onClick={() => { setEsCamionPropio(true); setFleteroId(""); setCamionId(""); setChoferId("") }}
                  className={`px-4 text-xs font-medium ${esCamionPropio ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Camión propio Transmagg
                </button>
              </div>
            </div>
          )}
          {esCamionPropio && (
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-md text-xs text-blue-800">
              Este viaje usa un camión propio de Transmagg. No genera liquidación al fletero.
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {!esCamionPropio && (
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Fletero *</label>
              <SearchCombobox
                items={fleteroItems}
                value={fleteroId}
                onChange={(id) => { setFleteroId(id); setCamionId("") }}
                placeholder="Buscar por nombre o CUIT..."
                required={!esCamionPropio}
                disabled={modo === "editar"}
              />
            </div>
            )}
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Empresa *</label>
              <SearchCombobox
                items={empresaItems}
                value={empresaId}
                onChange={setEmpresaId}
                placeholder="Buscar por nombre o CUIT..."
                required
                disabled={modo === "editar"}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Camión *</label>
              <select
                value={camionId}
                onChange={(e) => {
                  const id = e.target.value
                  setCamionId(id)
                  if (esCamionPropio && id) {
                    const c = camiones.find((x) => x.id === id)
                    if (c?.choferActualId) setChoferId(c.choferActualId)
                  }
                }}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccionar...</option>
                {(esCamionPropio || fleteroId ? camionesDelFletero : camiones).map((c) => (
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
                {choferesDelFletero.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
              </select>
            </div>
          </div>

          {/* Aviso: camión propio sin cobertura vigente */}
          {esCamionPropio && camionId && (() => {
            const c = camiones.find((x) => x.id === camionId)
            return c && c.polizaVigente === false ? (
              <div className="flex items-center gap-2 p-3 bg-amber-50 border border-amber-200 rounded-md text-xs text-amber-800">
                <ShieldAlert className="h-4 w-4 shrink-0" />
                Este camión no tiene seguro vigente. Verificá la cobertura antes de registrar el viaje.
              </div>
            ) : null
          })()}

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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Remito</label>
              <input type="text" value={remito} onChange={(e) => setRemito(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">¿Lleva cupo?</label>
              <div className="flex rounded-md border overflow-hidden h-9">
                <button
                  type="button"
                  onClick={() => { setTieneCupo(false); setCupo("") }}
                  className={`flex-1 text-xs font-medium border-r ${!tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  No
                </button>
                <button
                  type="button"
                  onClick={() => setTieneCupo(true)}
                  className={`flex-1 text-xs font-medium ${tieneCupo ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  Sí
                </button>
              </div>
              {tieneCupo && (
                <input
                  type="text"
                  value={cupo}
                  onChange={(e) => setCupo(e.target.value.toUpperCase())}
                  placeholder="Nro. de cupo"
                  style={{ textTransform: "uppercase" }}
                  className="w-full h-9 rounded-md border bg-background px-2 text-sm mt-2"
                />
              )}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-muted-foreground block mb-1">Mercadería</label>
            <input type="text" value={mercaderia} onChange={(e) => setMercaderia(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Procedencia</label>
              <input type="text" value={procedencia} onChange={(e) => setProcedencia(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Destino</label>
              <input type="text" value={destino} onChange={(e) => setDestino(e.target.value.toUpperCase())} style={{ textTransform: "uppercase" }} className="w-full h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Provincia origen *</label>
              <select
                value={provinciaOrigen}
                onChange={(e) => setProvinciaOrigen(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccioná una provincia...</option>
                {PROVINCIAS_ARGENTINA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Provincia destino *</label>
              <select
                value={provinciaDestino}
                onChange={(e) => setProvinciaDestino(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccioná una provincia...</option>
                {PROVINCIAS_ARGENTINA.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
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
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tarifa / ton *</label>
              <input
                type="number"
                value={tarifaInput}
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

          {/* Carta de Porte */}
          {modo === "nuevo" && (
            <div className="space-y-3 border-t pt-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carta de Porte</p>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Nro. de carta de porte *</label>
                  <input
                    type="text"
                    value={nroCartaPorte}
                    onChange={(e) => setNroCartaPorte(e.target.value)}
                    placeholder="Ej: 12345678"
                    className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                  />
                  <p className="text-[11px] text-muted-foreground mt-1">Debe ser único en el sistema.</p>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">PDF de la carta de porte *</label>
                  <UploadPDF
                    prefijo="cartas-de-porte"
                    onUpload={(key) => setCartaPorteS3Key(key)}
                    label="Subir PDF"
                    s3Key={cartaPorteS3Key || undefined}
                    required
                  />
                </div>
              </div>
            </div>
          )}

          {modo === "editar" && (viaje?.nroCartaPorte || viaje?.cartaPorteS3Key) && (
            <div className="border-t pt-3 space-y-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Carta de Porte</p>
              <p className="text-sm">Nro: <span className="font-medium">{viaje.nroCartaPorte ?? "-"}</span></p>
              {viaje.cartaPorteS3Key && (
                <UploadPDF
                  prefijo="cartas-de-porte"
                  onUpload={() => {}}
                  s3Key={viaje.cartaPorteS3Key}
                  disabled
                />
              )}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <span title={tooltipDeshabilitado}>
              <button
                type="submit"
                disabled={cargando || !puedeGuardar}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {cargando ? "Guardando..." : modo === "nuevo" ? "Crear viaje" : "Guardar cambios"}
              </button>
            </span>
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
  autoOpenModal = false,
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
  const [buscarCarta, setBuscarCarta] = useState("")
  const [filtroCupo, setFiltroCupo] = useState<"todos" | "con_cupo" | "sin_cupo">("todos")
  const [modalAbierto, setModalAbierto] = useState(autoOpenModal)
  const [viajeEditando, setViajeEditando] = useState<ViajeAPI | undefined>(undefined)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [viajeCambiandoEmpresa, setViajeCambiandoEmpresa] = useState<ViajeAPI | null>(null)
  const [guardandoCambioEmpresa, setGuardandoCambioEmpresa] = useState(false)
  const [errorCambioEmpresa, setErrorCambioEmpresa] = useState<string | null>(null)

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

  // Filtrar viajes según la vista y búsqueda por carta de porte
  const viajesFiltrados = viajes.filter((v) => {
    if (vista === "pend_liquidar") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR" && !v.esCamionPropio
    if (vista === "pend_facturar") return v.estadoFactura === "PENDIENTE_FACTURAR"
    if (vista === "pend_ambos") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR" && v.estadoFactura === "PENDIENTE_FACTURAR" && !v.esCamionPropio
    return true
  }).filter((v) => {
    if (!buscarCarta.trim()) return true
    return v.nroCartaPorte?.toLowerCase().includes(buscarCarta.toLowerCase())
  }).filter((v) => {
    if (filtroCupo === "con_cupo") return v.tieneCupo === true
    if (filtroCupo === "sin_cupo") return !v.tieneCupo
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

  async function handleGuardarCambioEmpresa(data: Record<string, unknown>) {
    if (!viajeCambiandoEmpresa) return
    setGuardandoCambioEmpresa(true)
    setErrorCambioEmpresa(null)
    try {
      const res = await fetch(`/api/viajes/${viajeCambiandoEmpresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorCambioEmpresa(err.error ?? "Error al guardar")
        return
      }
      setViajeCambiandoEmpresa(null)
      cargarViajes()
    } finally {
      setGuardandoCambioEmpresa(false)
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
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Carta de porte</label>
            <input
              type="text"
              value={buscarCarta}
              onChange={(e) => setBuscarCarta(e.target.value)}
              placeholder="Buscar por nro..."
              className="h-9 rounded-md border bg-background px-2 text-sm w-44"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-muted-foreground">Cupo</label>
            <div className="flex rounded-md border overflow-hidden h-9">
              {(["todos", "con_cupo", "sin_cupo"] as const).map((val) => (
                <button
                  key={val}
                  type="button"
                  onClick={() => setFiltroCupo(val)}
                  className={`px-3 text-xs font-medium border-r last:border-r-0 ${filtroCupo === val ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
                >
                  {val === "todos" ? "Todos" : val === "con_cupo" ? "Con cupo" : "Sin cupo"}
                </button>
              ))}
            </div>
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
                      <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Kilos</th>
                      <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Ton</th>
                      {esInterno && <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Tarifa operativa inicial</th>}
                      {esInterno && <th className="px-3 py-2 text-right font-medium hidden md:table-cell">Referencia</th>}
                      <th className="px-3 py-2 text-left font-medium">Carta de Porte</th>
                      <th className="px-3 py-2 text-left font-medium">Workflow</th>
                      {esInterno && <th className="px-3 py-2 text-center font-medium">Acc.</th>}
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesFiltrados.map((v) => {
                      const toneladas = v.kilos != null ? calcularToneladas(v.kilos) : null
                      const tarifaOperativa = v.tarifaEmpresa ?? null
                      const total = v.kilos != null && tarifaOperativa != null
                        ? calcularTotalViaje(v.kilos, tarifaOperativa)
                        : null
                      return (
                        <tr key={v.id} className="hover:bg-muted/30">
                          <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                          <td className="px-3 py-2">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5">
                                <p className="font-medium">{v.empresa.razonSocial}</p>
                                {(() => {
                                  try {
                                    const h = JSON.parse(v.historialCambios ?? "[]")
                                    return h.length > 0 ? (
                                      <span
                                        className="inline-flex items-center rounded-full px-1.5 py-0.5 text-xs font-medium bg-amber-100 text-amber-700 cursor-pointer"
                                        title="Este viaje tuvo cambios de empresa. Abrí 'Cambiar empresa' para ver el historial."
                                      >
                                        Mod.
                                      </span>
                                    ) : null
                                  } catch { return null }
                                })()}</div>
                              <p className="text-xs text-muted-foreground">
                                {v.esCamionPropio ? "🏠 Camión propio" : v.fletero?.razonSocial ?? "-"}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Remito {v.remito ?? "-"} · Cupo {v.tieneCupo ? (v.cupo ?? "-") : "—"}
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
                          <td className="px-3 py-2 text-right hidden md:table-cell">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                          <td className="px-3 py-2 text-right hidden md:table-cell">{toneladas?.toLocaleString("es-AR") ?? "-"}</td>
                          {esInterno && <td className="px-3 py-2 text-right hidden md:table-cell">{tarifaOperativa != null ? formatearMoneda(tarifaOperativa) : "-"}</td>}
                          {esInterno && <td className="px-3 py-2 text-right font-medium hidden md:table-cell">{total != null ? formatearMoneda(total) : "-"}</td>}
                          <td className="px-3 py-2">
                            {v.nroCartaPorte ? (
                              <CartaPorteCell nro={v.nroCartaPorte} s3Key={v.cartaPorteS3Key ?? undefined} />
                            ) : (
                              <span className="text-muted-foreground text-xs">-</span>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <div className="space-y-1">
                              <div className="flex flex-wrap gap-1.5">
                                <CircuitBadge etiqueta="Fletero" estado={v.estadoLiquidacion} />
                                <CircuitBadge etiqueta="Empresa" estado={v.estadoFactura} />
                                {v.estadoFactura === "PENDIENTE_FACTURAR" && v.enLiquidaciones != null && (
                                  viajeEsFacturable(v as { estadoFactura: string; enLiquidaciones: Array<{ liquidacion: { estado: string; cae: string | null; arcaEstado: string | null } }> })
                                    ? (
                                      <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                                        LP con CAE
                                      </span>
                                    ) : (
                                      <span
                                        className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-800"
                                        title={razonNoFacturable(v as { estadoFactura: string; enLiquidaciones: Array<{ liquidacion: { estado: string; cae: string | null; arcaEstado: string | null } }> })}
                                      >
                                        Sin CAE ARCA
                                      </span>
                                    )
                                )}
                              </div>
                              <p className="text-xs text-muted-foreground">
                                {describirCircuitoViaje(v.estadoLiquidacion, v.estadoFactura)}
                              </p>
                            </div>
                          </td>
                          {esInterno && (
                            <td className="px-3 py-2 text-center">
                              <div className="flex flex-col gap-1 items-center">
                                <button
                                  onClick={() => { setViajeEditando(v); setErrorModal(null); setModalAbierto(true) }}
                                  className="text-xs text-primary hover:underline"
                                >
                                  Editar
                                </button>
                                {v.estadoFactura !== "FACTURADA" && (
                                  <button
                                    onClick={() => { setErrorCambioEmpresa(null); setViajeCambiandoEmpresa(v) }}
                                    className="text-xs text-muted-foreground hover:text-foreground hover:underline whitespace-nowrap"
                                  >
                                    Cambiar empresa
                                  </button>
                                )}
                              </div>
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

      {/* Modal cambiar empresa */}
      {viajeCambiandoEmpresa && esInterno && (
        <ModalCambiarEmpresa
          viaje={viajeCambiandoEmpresa}
          empresas={empresas}
          onGuardar={handleGuardarCambioEmpresa}
          onCerrar={() => setViajeCambiandoEmpresa(null)}
          cargando={guardandoCambioEmpresa}
          error={errorCambioEmpresa}
        />
      )}
    </div>
  )
}
