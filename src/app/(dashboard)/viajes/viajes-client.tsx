"use client"

/**
 * Propósito: Componente cliente de la página de viajes.
 * Maneja selección de fletero/empresa, carga de viajes via API, tabs y modales de ABM.
 * SEGURIDAD: tarifa/tarifaEmpresa nunca se muestra a roles externos.
 *
 * Los modales de nuevo/editar viaje y de cambiar empresa están extraídos en
 * _components/ para mantener este archivo enfocado en orquestación y tabla.
 */

import { useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje } from "@/lib/viajes"
import { describirCircuitoViaje, resumirWorkflowViajes } from "@/lib/viaje-ui"
import { WorkflowSummaryCard } from "@/components/workflow/workflow-summary-card"
import { CircuitBadge } from "@/components/workflow/circuit-badge"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import { ModalViaje } from "./_components/modal-viaje"
import { ModalCambiarEmpresa } from "./_components/modal-cambiar-empresa"
import type { ViajeAPI, ViajesClientProps } from "./_components/types"

// ─── Constantes ──────────────────────────────────────────────────────────────

type Vista = "todos" | "pend_liquidar" | "pend_facturar" | "pend_ambos" | "ajust_liquidacion" | "ajust_factura"

const VISTAS: { id: Vista; label: string }[] = [
  { id: "todos", label: "Todos" },
  { id: "pend_liquidar", label: "Pend. liquidar" },
  { id: "pend_facturar", label: "Pend. facturar" },
  { id: "pend_ambos", label: "Pend. ambos" },
  { id: "ajust_liquidacion", label: "Ajust. liquidacion" },
  { id: "ajust_factura", label: "Ajust. factura" },
]

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

// ─── Componente principal ─────────────────────────────────────────────────────

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

  // Estado principal
  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? initialFleteroId ?? "")
  const [empresaId, setEmpresaId] = useState<string>(empresaIdPropio ?? initialEmpresaId ?? "")
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargando, setCargando] = useState(false)

  // Filtros
  const [vista, setVista] = useState<Vista>("todos")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [buscarCarta, setBuscarCarta] = useState("")
  const [filtroCupo, setFiltroCupo] = useState<"todos" | "con_cupo" | "sin_cupo">("todos")

  // Modales
  const [modalAbierto, setModalAbierto] = useState(autoOpenModal)
  const [viajeEditando, setViajeEditando] = useState<ViajeAPI | undefined>(undefined)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [viajeCambiandoEmpresa, setViajeCambiandoEmpresa] = useState<ViajeAPI | null>(null)
  const [guardandoCambioEmpresa, setGuardandoCambioEmpresa] = useState(false)
  const [errorCambioEmpresa, setErrorCambioEmpresa] = useState<string | null>(null)

  const tieneSeleccion = Boolean(fleteroId || empresaId)

  // ── Fetch ──────────────────────────────────────────────────────────────────

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

  // ── Filtrado local ─────────────────────────────────────────────────────────

  const viajesFiltrados = viajes.filter((v) => {
    if (vista === "pend_liquidar") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR" && !v.esCamionPropio
    if (vista === "pend_facturar") return v.estadoFactura === "PENDIENTE_FACTURAR"
    if (vista === "pend_ambos") return v.estadoLiquidacion === "PENDIENTE_LIQUIDAR" && v.estadoFactura === "PENDIENTE_FACTURAR" && !v.esCamionPropio
    if (vista === "ajust_liquidacion") return v.estadoLiquidacion === "LIQUIDADO_AJUSTADO_PARCIAL"
    if (vista === "ajust_factura") return v.estadoFactura === "FACTURADO_AJUSTADO_PARCIAL"
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

  // ── Handlers de modales ────────────────────────────────────────────────────

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

  // ── Render ─────────────────────────────────────────────────────────────────

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

      {/* Tabs + Tabla */}
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
                              <span className="text-muted-foreground text-xs">N/A</span>
                            )}
                          </td>
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
