"use client"

/**
 * Propósito: Componente cliente de la página de liquidaciones.
 * Selector de fletero → viajes pendientes (editables inline) + preview y confirmación.
 * También muestra liquidaciones emitidas con detalle y cambio de estado.
 */

import { useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; comisionDefault?: number }

type ViajeParaLiquidar = {
  id: string
  fechaViaje: string
  empresaId: string
  empresa: { razonSocial: string }
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaBase: number
  estadoFactura: string
  // editados localmente
  kilosEdit?: number
  tarifaEdit?: number
  fechaEdit?: string
  remitoEdit?: string
  cupoEdit?: string
  mercaderiaEdit?: string
  procedenciaEdit?: string
  origenEdit?: string
  destinoEdit?: string
  provinciaDestinoEdit?: string
}

type ViajeEnLiquidacion = {
  id: string
  fechaViaje: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaFletero: number
  subtotal: number
}

type Liquidacion = {
  id: string
  grabadaEn: string
  comisionPct: number
  ivaPct: number
  subtotalBruto: number
  comisionMonto: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  fletero: { razonSocial: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { monto: number }[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type LiquidacionesClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    PAGADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {estado}
    </span>
  )
}

// ─── Modal detalle liquidación ────────────────────────────────────────────────

/**
 * ModalDetalleLiquidacion: props -> JSX.Element
 *
 * Dado una liquidación, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una liquidación y cambiar su estado.
 *
 * Ejemplos:
 * <ModalDetalleLiquidacion liq={liq} onCambiarEstado={fn} onCerrar={fn} />
 */
function ModalDetalleLiquidacion({
  liq,
  onCambiarEstado,
  onCerrar,
  cargando,
}: {
  liq: Liquidacion
  onCambiarEstado: (estado: string) => void
  onCerrar: () => void
  cargando: boolean
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Liquidación — {liq.fletero.razonSocial}</h2>
            <p className="text-sm text-muted-foreground">{formatearFecha(new Date(liq.grabadaEn))} · <EstadoBadge estado={liq.estado} /></p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Tabla de viajes */}
        <div className="overflow-x-auto rounded border mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Remito</th>
                <th className="px-3 py-2 text-left">Mercadería</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Destino</th>
                <th className="px-3 py-2 text-right">Kilos</th>
                <th className="px-3 py-2 text-right">Ton</th>
                <th className="px-3 py-2 text-right">Tarifa/ton</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {liq.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
                  <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos != null ? calcularToneladas(v.kilos) : "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaFletero)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between"><span>Total viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
          <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>- {formatearMoneda(liq.comisionMonto)}</span></div>
          <div className="flex justify-between font-medium"><span>Subtotal neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
          <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>+ {formatearMoneda(liq.ivaMonto)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL FINAL:</span><span>{formatearMoneda(liq.total)}</span></div>
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Descargar PDF
          </button>
          <div className="flex gap-2">
            {liq.estado === "BORRADOR" && (
              <button
                onClick={() => onCambiarEstado("EMITIDA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Marcar como emitida en ARCA
              </button>
            )}
            {liq.estado === "EMITIDA" && (
              <button
                onClick={() => onCambiarEstado("PAGADA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Registrar pago
              </button>
            )}
            {(liq.estado === "BORRADOR" || liq.estado === "EMITIDA") && (
              <button
                onClick={() => onCambiarEstado("ANULADA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Anular
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * LiquidacionesClient: LiquidacionesClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI completa de liquidaciones:
 * selector de fletero, tabla editable de viajes pendientes, preview de liquidación,
 * y sección de liquidaciones emitidas con modales de detalle.
 * Existe para gestionar el proceso de liquidación ARCA desde el panel.
 *
 * Ejemplos:
 * // Rol interno, sin fletero → muestra instrucción de selección
 * <LiquidacionesClient rol="OPERADOR_TRANSMAGG" fleteros={[...]} fleteroIdPropio={null} />
 * // Rol FLETERO → carga automáticamente sus viajes y liquidaciones
 * <LiquidacionesClient rol="FLETERO" fleteros={[]} fleteroIdPropio="f1" />
 * // Con fletero seleccionado → tabla de viajes + lista de liquidaciones
 * <LiquidacionesClient rol="ADMIN_TRANSMAGG" fleteros={[...]} fleteroIdPropio={null} />
 */
export function LiquidacionesClient({ rol, fleteros, fleteroIdPropio }: LiquidacionesClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)

  const cargarDatos = useCallback(async () => {
    if (!fleteroId) return
    setCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      if (res.ok) {
        const data = await res.json()
        // Inicializar edits locales con los valores del viaje
        const viajesConEdit = (data.viajesPendientes ?? []).map((v: ViajeParaLiquidar) => ({
          ...v,
          kilosEdit: v.kilos ?? undefined,
          tarifaEdit: v.tarifaBase,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          cupoEdit: v.cupo ?? "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: v.provinciaOrigen ?? "",
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: v.provinciaDestino ?? "",
        }))
        setViajesPendientes(viajesConEdit)
        setLiquidaciones(data.liquidaciones ?? [])
        // Setear comision default del fletero si aplica
        if (esInterno) {
          const fletero = fleteros.find((f) => f.id === fleteroId)
          if (fletero?.comisionDefault != null) setComisionPct(fletero.comisionDefault)
        }
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, esInterno, fleteros])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function toggleTodos() {
    if (seleccionados.size === viajesPendientes.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajesPendientes.map((v) => v.id)))
    }
  }

  function actualizarViaje(id: string, campo: keyof ViajeParaLiquidar, valor: unknown) {
    setViajesPendientes((prev) =>
      prev.map((v) => v.id === id ? { ...v, [campo]: valor } : v)
    )
  }

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  // Calcular preview
  const viajesParaCalc = viajesSeleccionados.map((v) => ({
    kilos: v.kilosEdit ?? v.kilos ?? 0,
    tarifaFletero: v.tarifaEdit ?? v.tarifaBase,
  }))
  const preview = viajesParaCalc.length > 0
    ? calcularLiquidacion(viajesParaCalc, comisionPct, ivaPct)
    : null

  async function confirmarLiquidacion() {
    if (!fleteroId || viajesSeleccionados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        fleteroId,
        comisionPct,
        ivaPct,
        viajes: viajesSeleccionados.map((v) => ({
          viajeId: v.id,
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: v.cupoEdit || null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaFletero: v.tarifaEdit ?? v.tarifaBase,
        })),
      }
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorGen(err.error ?? "Error al generar liquidación")
        return
      }
      setEnPreview(false)
      setSeleccionados(new Set())
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  async function cambiarEstadoLiquidacion(id: string, estado: string) {
    setCambioEstadoCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setLiquidacionDetalle(null)
        cargarDatos()
      }
    } finally {
      setCambioEstadoCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Liquidaciones</h2>
        <p className="text-muted-foreground">
          {rol === "FLETERO" ? "Tus liquidaciones de viajes" : "Líquido Producto ARCA"}
        </p>
      </div>

      {/* Selector de Fletero */}
      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[250px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select
              value={fleteroId}
              onChange={(e) => { setFleteroId(e.target.value); setSeleccionados(new Set()); setEnPreview(false) }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Seleccioná un fletero...</option>
              {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
            </select>
          </div>
        </div>
      )}

      {!fleteroId && esInterno && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Seleccioná un Fletero para ver sus viajes y liquidaciones</p>
        </div>
      )}

      {fleteroId && (
        <>
          {/* SECCIÓN A: Viajes pendientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Viajes pendientes de liquidación</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                  {viajesPendientes.length}
                </span>
              </div>
              {seleccionados.size > 0 && !enPreview && (
                <button
                  onClick={() => setEnPreview(true)}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Generar liquidación con {seleccionados.size} seleccionado(s)
                </button>
              )}
            </div>

            {cargando ? (
              <div className="text-center py-6 text-muted-foreground">Cargando...</div>
            ) : viajesPendientes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de liquidación.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={seleccionados.size === viajesPendientes.length}
                          onChange={toggleTodos}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Remito</th>
                      <th className="px-3 py-2 text-left">Cupo</th>
                      <th className="px-3 py-2 text-left">Mercadería</th>
                      <th className="px-3 py-2 text-left">Origen</th>
                      <th className="px-3 py-2 text-left">Destino</th>
                      <th className="px-3 py-2 text-right">Kilos</th>
                      <th className="px-3 py-2 text-right">Ton</th>
                      <th className="px-3 py-2 text-right">Tarifa/ton</th>
                      <th className="px-3 py-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesPendientes.map((v) => {
                      const kilos = v.kilosEdit ?? v.kilos ?? 0
                      const tarifa = v.tarifaEdit ?? v.tarifaBase
                      const ton = kilos > 0 ? calcularToneladas(kilos) : null
                      const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                      return (
                        <tr key={v.id} className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                          </td>
                          <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                          <td className="px-3 py-2">{v.remito ?? "-"}</td>
                          <td className="px-3 py-2">{v.cupo ?? "-"}</td>
                          <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                          <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                          <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              value={v.kilosEdit ?? v.kilos ?? ""}
                              onChange={(e) => actualizarViaje(v.id, "kilosEdit", parseFloat(e.target.value) || undefined)}
                              className="w-24 h-7 text-right rounded border bg-background px-2 text-xs"
                              min="0"
                              step="1"
                            />
                          </td>
                          <td className="px-3 py-2 text-right text-muted-foreground">
                            {ton?.toLocaleString("es-AR") ?? "-"}
                          </td>
                          <td className="px-3 py-2 text-right">
                            <input
                              type="number"
                              value={v.tarifaEdit ?? v.tarifaBase}
                              onChange={(e) => actualizarViaje(v.id, "tarifaEdit", parseFloat(e.target.value) || v.tarifaBase)}
                              className="w-28 h-7 text-right rounded border bg-background px-2 text-xs"
                              min="0"
                              step="0.01"
                            />
                          </td>
                          <td className="px-3 py-2 text-right font-medium">
                            {total != null ? formatearMoneda(total) : "-"}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* PREVIEW de liquidación */}
          {enPreview && preview && (
            <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
              <h3 className="font-semibold">Preview de liquidación</h3>
              {errorGen && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{errorGen}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Comisión %</label>
                  <input
                    type="number"
                    value={comisionPct}
                    onChange={(e) => setComisionPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="h-8 w-28 rounded border bg-background px-2 text-sm"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
                  <input
                    type="number"
                    value={ivaPct}
                    onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="h-8 w-28 rounded border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between"><span>Total viajes ({viajesSeleccionados.length}):</span><span>{formatearMoneda(preview.subtotalBruto)}</span></div>
                <div className="flex justify-between"><span>Comisión ({comisionPct}%):</span><span>- {formatearMoneda(preview.comisionMonto)}</span></div>
                <div className="flex justify-between font-medium"><span>Subtotal neto:</span><span>{formatearMoneda(preview.neto)}</span></div>
                <div className="flex justify-between"><span>IVA ({ivaPct}%):</span><span>+ {formatearMoneda(preview.ivaMonto)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL FINAL:</span><span>{formatearMoneda(preview.totalFinal)}</span></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEnPreview(false)} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
                  Volver
                </button>
                <button
                  onClick={confirmarLiquidacion}
                  disabled={generando}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {generando ? "Generando..." : "Confirmar y generar"}
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN B: Liquidaciones emitidas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Liquidaciones</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {liquidaciones.length}
              </span>
            </div>
            {liquidaciones.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Sin liquidaciones registradas.</div>
            ) : (
              <div className="space-y-2">
                {liquidaciones.map((liq) => (
                  <div key={liq.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{formatearFecha(new Date(liq.grabadaEn))}</span>
                        <EstadoBadge estado={liq.estado} />
                      </div>
                      <p className="text-xs text-muted-foreground">{liq.viajes.length} viaje(s)</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="font-bold">{formatearMoneda(liq.total)}</p>
                      <button
                        onClick={() => setLiquidacionDetalle(liq)}
                        className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
                      >
                        Ver detalle
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLiquidacion
          liq={liquidacionDetalle}
          onCambiarEstado={(estado) => cambiarEstadoLiquidacion(liquidacionDetalle.id, estado)}
          onCerrar={() => setLiquidacionDetalle(null)}
          cargando={cambioEstadoCargando}
        />
      )}
    </div>
  )
}
