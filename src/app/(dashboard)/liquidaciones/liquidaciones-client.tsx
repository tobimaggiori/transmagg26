"use client"

/**
 * Propósito: Componente cliente de la página de liquidaciones.
 * Selector de fletero → viajes pendientes (editables vía modal) + preview fullscreen y confirmación.
 * También muestra liquidaciones emitidas con detalle y cambio de estado.
 */

import { useState, useCallback, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { ProvinciaArgentina } from "@/lib/provincias"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { liquidacionesDisponibles } from "@/lib/arca/catalogo"
import { WorkflowNote } from "@/components/workflow/workflow-note"

import type {
  FleteroInfo,
  ViajeParaLiquidar,
  Liquidacion,
  LiquidacionesClientProps,
  CuentaBancaria,
} from "./_components/types"

import { ModalDetalleLiquidacion } from "./_components/modal-detalle-liquidacion"
import { ModalAnularPagoFletero } from "./_components/modal-anular-pago-fletero"
import { ModalEditarPagoFletero } from "./_components/modal-editar-pago-fletero"
import { ModalEditarViaje } from "./_components/modal-editar-viaje"
import { ModalPreviewLiquidacion } from "./_components/modal-preview-liquidacion"

// Re-export types for any external consumers
export type { LiquidacionesClientProps } from "./_components/types"

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    EMITIDA: "bg-blue-100 text-blue-800",
    PARCIALMENTE_PAGADA: "bg-amber-100 text-amber-800",
    PAGADA: "bg-green-100 text-green-800",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_PAGADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * LiquidacionesClient: LiquidacionesClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI completa de liquidaciones:
 * selector de fletero, tabla de viajes pendientes, modales de edición y preview,
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

type LiquidacionesClientPropsExt = LiquidacionesClientProps & {
  cuentasBancarias: CuentaBancaria[]
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function LiquidacionesClient({ rol, fleteros, camiones, choferes, fleteroIdPropio, cuentasBancarias: _cb, comprobantesHabilitados = [], titulo = "Liquidaciones" }: LiquidacionesClientPropsExt) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)
  const [viajeEditando, setViajeEditando] = useState<ViajeParaLiquidar | null>(null)
  const [fleteroInfo, setFleteroInfo] = useState<FleteroInfo | null>(null)
  const [anulando, setAnulando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string } | null>(null)
  const [editando, setEditando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string; liquidacionId: string; fleteroId: string } | null>(null)

  /**
   * cargarDatos: () -> Promise<void>
   *
   * Sin parámetros (usa el estado fleteroId del closure), carga los viajes pendientes,
   * liquidaciones, datos del fletero y el próximo número de comprobante desde la API.
   * Esta función existe para sincronizar el estado local del panel con la base de datos
   * cada vez que se selecciona un fletero o se confirma una liquidación.
   *
   * Ejemplos:
   * // Con fleteroId vacío → no hace nada
   * cargarDatos() // no ejecuta fetch
   * // Con fleteroId válido → actualiza viajesPendientes, liquidaciones, fleteroInfo
   * cargarDatos() // setViajesPendientes([...]), setLiquidaciones([...]), setFleteroInfo({...})
   */
  const cargarDatos = useCallback(async () => {
    if (!fleteroId) return
    setCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      if (res.ok) {
        const data = await res.json()
        const viajesConEdit = (data.viajesPendientes ?? []).map((v: ViajeParaLiquidar) => ({
          ...v,
          kilosEdit: v.kilos ?? undefined,
          tarifaEdit: v.tarifaFletero,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          tieneCupoEdit: v.tieneCupo ?? false,
          cupoEdit: v.tieneCupo ? (v.cupo ?? "") : "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaOrigen ?? "")
            ? v.provinciaOrigen as ProvinciaArgentina
            : undefined,
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaDestino ?? "")
            ? v.provinciaDestino as ProvinciaArgentina
            : undefined,
          camionIdEdit: v.camionId,
          choferIdEdit: v.choferId,
        }))
        setViajesPendientes(viajesConEdit)
        setLiquidaciones(data.liquidaciones ?? [])
        const fleteroEncontrado = fleteros.find((f) => f.id === fleteroId)
        if (fleteroEncontrado) {
          if (esInterno && fleteroEncontrado.comisionDefault != null) setComisionPct(fleteroEncontrado.comisionDefault)
          setFleteroInfo({
            razonSocial: fleteroEncontrado.razonSocial,
            cuit: data.fletero?.cuit ?? "",
            condicionIva: data.fletero?.condicionIva ?? "",
            direccion: data.fletero?.direccion ?? null,
            nroProximoComprobante: data.nroProximoComprobante ?? 1,
          })
        }
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, esInterno, fleteros])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  // Verificar si el LP para este fletero está habilitado en config ARCA
  const lpHabilitado = useMemo(
    () => fleteroInfo
      ? liquidacionesDisponibles(fleteroInfo.condicionIva, comprobantesHabilitados).length > 0
      : true, // no bloquear hasta tener info del fletero
    [fleteroInfo, comprobantesHabilitados]
  )

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

  function guardarViajeEditado(v: ViajeParaLiquidar) {
    setViajesPendientes((prev) => prev.map((vp) => vp.id === v.id ? v : vp))
  }

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  async function confirmarLiquidacion(viajesEditados: ViajeParaLiquidar[], comision: number, iva: number) {
    if (!fleteroId || viajesEditados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        fleteroId,
        comisionPct: comision,
        ivaPct: iva,
        viajes: viajesEditados.map((v) => ({
          viajeId: v.id,
          camionId: v.camionIdEdit ?? v.camionId,
          choferId: v.choferIdEdit ?? v.choferId,
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: (v.tieneCupoEdit ?? v.tieneCupo) ? (v.cupoEdit || null) : null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaFletero: v.tarifaEdit ?? v.tarifaFletero,
        })),
        emisionArca: true,
        idempotencyKey: crypto.randomUUID(),
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
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
        <p className="text-muted-foreground">
          {rol === "FLETERO" ? "Tus liquidaciones de viajes" : "Circuito de liquidación al fletero"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <WorkflowNote
          titulo="Datos guardados"
          descripcion="La liquidación guarda los datos del viaje y la tarifa al fletero tal como están en ese momento."
        />
        <WorkflowNote
          titulo="Edición previa"
          descripcion="Antes de generar el líquido producto podés ajustar kilos, fecha y tarifa específica del fletero."
        />
        <WorkflowNote
          titulo="Independencia"
          descripcion="Un viaje puede estar liquidado al fletero y seguir pendiente de facturar a la empresa."
        />
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
              {seleccionados.size > 0 && (
                lpHabilitado ? (
                  <button
                    onClick={() => setEnPreview(true)}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                  >
                    Liquidar seleccionados ({seleccionados.size})
                  </button>
                ) : (
                  <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-md px-3 py-2">
                    LP no habilitado en configuración ARCA para esta condición fiscal.
                  </span>
                )
              )}
            </div>

            {cargando ? (
              <div className="text-center py-6 text-muted-foreground">Cargando...</div>
            ) : viajesPendientes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de liquidación.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
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
                      <th className="px-3 py-2 text-right">Tarifa / ton</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesPendientes.map((v) => {
                      const kilos = v.kilosEdit ?? v.kilos ?? 0
                      const tarifa = v.tarifaEdit ?? v.tarifaFletero
                      const ton = kilos > 0 ? calcularToneladas(kilos) : null
                      const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                      return (
                        <tr key={v.id} className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                          </td>
                          <td className="px-3 py-2">{formatearFecha(v.fechaEdit ?? new Date(v.fechaViaje))}</td>
                          <td className="px-3 py-2">{v.remitoEdit || v.remito || "-"}</td>
                          <td className="px-3 py-2">{(v.tieneCupoEdit ?? v.tieneCupo) ? (v.cupoEdit || v.cupo || "-") : "—"}</td>
                          <td className="px-3 py-2">{v.mercaderiaEdit || v.mercaderia || "-"}</td>
                          <td className="px-3 py-2">{v.origenEdit || v.provinciaOrigen || v.procedencia || "-"}</td>
                          <td className="px-3 py-2">{v.provinciaDestinoEdit || v.destinoEdit || v.provinciaDestino || v.destino || "-"}</td>
                          <td className="px-3 py-2 text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "-"}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{ton?.toLocaleString("es-AR") ?? "-"}</td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(tarifa)}</td>
                          <td className="px-3 py-2 text-right font-medium">{total != null ? formatearMoneda(total) : "-"}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setViajeEditando(v)}
                              className="h-7 px-2 rounded border text-xs font-medium hover:bg-accent"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

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
                {liquidaciones.map((liq) => {
                  const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago ?? null
                  return (
                    <div key={liq.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatearFecha(new Date(liq.grabadaEn))}</span>
                          <EstadoBadge estado={liq.estado} />
                          {op && (
                            <button
                              onClick={(e) => { e.stopPropagation(); window.open(`/api/ordenes-pago/${op.id}/pdf`, "_blank") }}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-800 hover:bg-violet-200"
                            >
                              OP {op.nro.toLocaleString("es-AR")}
                            </button>
                          )}
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
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal detalle liquidación emitida */}
      {liquidacionDetalle && (
        <ModalDetalleLiquidacion
          liq={liquidacionDetalle}
          onCambiarEstado={(estado) => cambiarEstadoLiquidacion(liquidacionDetalle.id, estado)}
          onAnularPago={(pagoId) => {
            const pago = liquidacionDetalle.pagos.find((p) => p.id === pagoId)
            if (pago) setAnulando({ pagoId, pagoMonto: pago.monto, pagoTipo: pago.tipoPago, pagoFecha: pago.fechaPago })
          }}
          onEditarPago={(pagoId) => {
            const pago = liquidacionDetalle.pagos.find((p) => p.id === pagoId)
            if (pago) setEditando({ pagoId, pagoMonto: pago.monto, pagoTipo: pago.tipoPago, pagoFecha: pago.fechaPago, liquidacionId: liquidacionDetalle.id, fleteroId: liquidacionDetalle.fleteroId })
          }}
          onCerrar={() => setLiquidacionDetalle(null)}
          cargando={cambioEstadoCargando}
        />
      )}

      {/* Modal anular pago fletero */}
      {anulando && (
        <ModalAnularPagoFletero
          pagoId={anulando.pagoId}
          pagoMonto={anulando.pagoMonto}
          pagoTipo={anulando.pagoTipo}
          pagoFecha={anulando.pagoFecha}
          onConfirmar={() => {
            setAnulando(null)
            setLiquidacionDetalle(null)
            cargarDatos()
          }}
          onCerrar={() => setAnulando(null)}
        />
      )}

      {/* Modal editar pago fletero */}
      {editando && (
        <ModalEditarPagoFletero
          pagoId={editando.pagoId}
          pagoMonto={editando.pagoMonto}
          pagoTipo={editando.pagoTipo}
          pagoFecha={editando.pagoFecha}
          liquidacionId={editando.liquidacionId}
          fleteroId={editando.fleteroId}
          onConfirmar={() => {
            setEditando(null)
            setLiquidacionDetalle(null)
            cargarDatos()
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {/* Modal editar viaje */}
      {viajeEditando && (
        <ModalEditarViaje
          viaje={viajeEditando}
          camiones={camiones}
          choferes={choferes}
          fleteroId={fleteroId}
          onGuardar={guardarViajeEditado}
          onCerrar={() => setViajeEditando(null)}
        />
      )}

      {/* Modal preview / confirmar liquidación */}
      {enPreview && (
        <ModalPreviewLiquidacion
          fletero={fleteroInfo ?? { razonSocial: "", cuit: "", condicionIva: "", nroProximoComprobante: 1 }}
          viajesIniciales={viajesSeleccionados}
          comisionPctInicial={comisionPct}
          ivaPctInicial={ivaPct}
          generando={generando}
          error={errorGen}
          onCancelar={() => { setEnPreview(false); setErrorGen(null) }}
          onConfirmar={confirmarLiquidacion}
        />
      )}
    </div>
  )
}
