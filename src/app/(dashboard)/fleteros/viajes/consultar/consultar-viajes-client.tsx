"use client"

/**
 * ConsultarViajesClient — Tabla de viajes con filtros, paginación y modal de detalle/edición.
 *
 * Reglas:
 * - No se muestran viajes hasta que se seleccione al menos un fletero o una empresa.
 * - Columnas FLETERO / EMPRESA se ocultan si ya están filtradas.
 * - Modal centrado con detalle, comprobantes y edición inline condicional.
 */

import { useState, useCallback, useEffect } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { ModalDetalleViaje } from "../_components/modal-detalle-viaje"
import type { ViajeDetalleAPI } from "../_components/modal-detalle-viaje"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault: number }
type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }
type Chofer = { id: string; nombre: string; apellido: string; email: string }

const PER_PAGE = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatKilos(kilos: number | null): string {
  if (kilos == null) return "—"
  return kilos.toLocaleString("es-AR")
}


type ViajeAPI = ViajeDetalleAPI

// ─── Modal Eliminar ───────────────────────────────────────────────────────────

function ModalEliminar({ viaje, onEliminar, onCerrar, cargando, error }: {
  viaje: ViajeAPI; onEliminar: () => void; onCerrar: () => void; cargando: boolean; error: string | null
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Eliminar viaje</h2>
        <p className="text-sm">¿Estás seguro de que querés eliminar este viaje? Esta acción no se puede deshacer.</p>
        <p className="text-sm text-gray-500">
          Viaje del <span className="font-medium">{formatearFecha(new Date(viaje.fechaViaje))}</span>
          {viaje.fletero && <> — Fletero: <span className="font-medium">{viaje.fletero.razonSocial}</span></>}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-gray-100">Cancelar</button>
          <button type="button" onClick={onEliminar} disabled={cargando} className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40">
            {cargando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarViajesClient({
  fleteros, empresas, camiones, choferes,
}: { rol: string; fleteros: Fletero[]; empresas: Empresa[]; camiones: Camion[]; choferes: Chofer[] }) {
  const [filtroFleteroId, setFiltroFleteroId] = useState("")
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroRemito, setFiltroRemito] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")
  const [filtroFacturado, setFiltroFacturado] = useState<"" | "FACTURADO" | "PENDIENTE_FACTURAR">("")
  const [filtroLiquidado, setFiltroLiquidado] = useState<"" | "LIQUIDADO" | "PENDIENTE_LIQUIDAR">("")
  const [filtroNroLP, setFiltroNroLP] = useState("")
  const [filtroNroFactura, setFiltroNroFactura] = useState("")
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [viajeDetalle, setViajeDetalle] = useState<ViajeAPI | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [viajeEliminar, setViajeEliminar] = useState<ViajeAPI | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [toastExito, setToastExito] = useState(false)

  const hayFiltroEntidad = filtroFleteroId !== "" || filtroEmpresaId !== ""
  const fleteroItems: SearchComboboxItem[] = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const fleteroSeleccionado = fleteros.find((f) => f.id === filtroFleteroId)
  const empresaSeleccionada = empresas.find((e) => e.id === filtroEmpresaId)

  function getContextHeader(): string | null {
    if (fleteroSeleccionado && empresaSeleccionada) return `Viajes realizados por ${fleteroSeleccionado.razonSocial} para ${empresaSeleccionada.razonSocial}`
    if (fleteroSeleccionado) return `Viajes realizados por ${fleteroSeleccionado.razonSocial} (CUIT: ${fleteroSeleccionado.cuit})`
    if (empresaSeleccionada) return `Viajes realizados para ${empresaSeleccionada.razonSocial} (CUIT: ${empresaSeleccionada.cuit})`
    return null
  }

  const cargar = useCallback(async () => {
    if (!hayFiltroEntidad) { setViajes([]); return }
    setCargandoViajes(true); setErrorCarga(null)
    try {
      const params = new URLSearchParams()
      if (filtroFleteroId) params.set("fleteroId", filtroFleteroId)
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroLiquidado) params.set("estadoLiquidacion", filtroLiquidado)
      if (filtroFacturado) params.set("estadoFactura", filtroFacturado)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      if (filtroRemito) params.set("remito", filtroRemito)
      if (filtroNroLP) params.set("nroLP", filtroNroLP)
      if (filtroNroFactura) params.set("nroFactura", filtroNroFactura)
      const res = await fetch(`/api/viajes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cargar viajes")
      setViajes(data as ViajeAPI[]); setPagina(1)
    } catch (e) { setErrorCarga(e instanceof Error ? e.message : "Error desconocido") }
    finally { setCargandoViajes(false) }
  }, [hayFiltroEntidad, filtroFleteroId, filtroEmpresaId, filtroLiquidado, filtroFacturado, filtroDesde, filtroHasta, filtroRemito, filtroNroLP, filtroNroFactura])

  useEffect(() => { void cargar() }, [cargar])

  const totalPaginas = Math.max(1, Math.ceil(viajes.length / PER_PAGE))
  const viajesPagina = viajes.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  async function abrirDetalle(viajeId: string) {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/viajes/${viajeId}`)
      if (!res.ok) throw new Error("Error al cargar detalle")
      setViajeDetalle(await res.json() as ViajeAPI)
    } catch { const v = viajes.find((x) => x.id === viajeId); if (v) setViajeDetalle(v) }
    finally { setCargandoDetalle(false) }
  }

  async function handleEliminar() {
    if (!viajeEliminar) return
    setGuardando(true); setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeEliminar.id}`, { method: "DELETE" })
      if (!res.ok) { const json = await res.json(); setErrorModal(json.error ?? "Error al eliminar"); return }
      setViajeEliminar(null); setViajeDetalle(null); await cargar()
    } catch { setErrorModal("Error de red") } finally { setGuardando(false) }
  }

  function handleGuardarExitoso() {
    setViajeDetalle(null)
    setToastExito(true)
    setTimeout(() => setToastExito(false), 3500)
    void cargar()
  }

  const showFleteroCol = !filtroFleteroId
  const showEmpresaCol = !filtroEmpresaId
  const thCls = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"

  return (
    <div className="space-y-4">
      {/* Toast */}
      {toastExito && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          Se ha modificado el viaje
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consultar Viajes</h1>
        {hayFiltroEntidad && <span className="text-sm text-gray-500">{viajes.length} viaje(s)</span>}
      </div>

      {/* Filtros */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fletero</label>
            <div className="mt-1"><SearchCombobox items={fleteroItems} value={filtroFleteroId} onChange={setFiltroFleteroId} placeholder="Buscar fletero..." /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</label>
            <div className="mt-1"><SearchCombobox items={empresaItems} value={filtroEmpresaId} onChange={setFiltroEmpresaId} placeholder="Buscar empresa..." /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro Remito</label>
            <input type="text" value={filtroRemito} onChange={(e) => setFiltroRemito(e.target.value)} placeholder="Nro remito"
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Facturado</label>
            <select value={filtroFacturado} onChange={(e) => setFiltroFacturado(e.target.value as typeof filtroFacturado)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option><option value="FACTURADO">Sí</option><option value="PENDIENTE_FACTURAR">No</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Liquidado</label>
            <select value={filtroLiquidado} onChange={(e) => setFiltroLiquidado(e.target.value as typeof filtroLiquidado)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Todos</option><option value="LIQUIDADO">Sí</option><option value="PENDIENTE_LIQUIDAR">No</option>
            </select>
          </div>
          {filtroLiquidado === "LIQUIDADO" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro LP</label>
              <input type="number" value={filtroNroLP} onChange={(e) => setFiltroNroLP(e.target.value)} placeholder="Nro LP"
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
          {filtroFacturado === "FACTURADO" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro Factura</label>
              <input type="text" value={filtroNroFactura} onChange={(e) => setFiltroNroFactura(e.target.value)} placeholder="Nro factura"
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          )}
        </div>
      </div>

      {!hayFiltroEntidad && (
        <div className="bg-white rounded-lg shadow px-6 py-8 text-center text-sm text-gray-500">Seleccioná al menos un fletero o una empresa para consultar viajes.</div>
      )}
      {hayFiltroEntidad && getContextHeader() && <p className="text-sm font-medium text-gray-700">{getContextHeader()}</p>}
      {errorCarga && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorCarga}</div>}

      {/* Table */}
      {hayFiltroEntidad && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={thCls}>Fecha</th>
                <th className={thCls}>Remito</th>
                {showFleteroCol && <th className={thCls}>Fletero</th>}
                {showEmpresaCol && <th className={thCls}>Empresa</th>}
                <th className={thCls}>Mercadería</th>
                <th className={thCls}>Origen</th>
                <th className={thCls}>Destino</th>
                <th className={`${thCls} text-right`}>Kilos</th>
                <th className={`${thCls} text-right`}>Tarifa</th>
                <th className={`${thCls} text-center`}>+</th>
              </tr>
            </thead>
            <tbody>
              {cargandoViajes ? (
                <tr><td colSpan={10} className="py-8 text-center text-sm text-gray-500">Cargando...</td></tr>
              ) : viajesPagina.length === 0 ? (
                <tr><td colSpan={10} className="py-8 text-center text-sm text-gray-500">Sin viajes para los filtros seleccionados.</td></tr>
              ) : viajesPagina.map((v) => (
                <tr key={v.id} className={`border-b last:border-0 hover:bg-gray-100 transition-colors ${viajeDetalle?.id === v.id ? "bg-blue-50" : ""}`}>
                  <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-4 py-2 whitespace-nowrap">{v.remito || "—"}</td>
                  {showFleteroCol && <td className="px-4 py-2 whitespace-nowrap">{v.fletero ? (<div><p className="text-xs text-gray-500">{fleteros.find((f) => f.id === v.fleteroId)?.cuit ?? ""}</p><p className="text-sm">{v.fletero.razonSocial}</p></div>) : <span className="text-gray-400 italic text-xs">Propio</span>}</td>}
                  {showEmpresaCol && <td className="px-4 py-2 whitespace-nowrap">{v.empresa ? (<div><p className="text-xs text-gray-500">{empresas.find((e) => e.id === v.empresaId)?.cuit ?? ""}</p><p className="text-sm">{v.empresa.razonSocial}</p></div>) : "—"}</td>}
                  <td className="px-4 py-2 whitespace-nowrap text-sm max-w-[120px] truncate">{v.mercaderia || "—"}</td>
                  <td className="px-4 py-2 whitespace-nowrap"><div><p className="text-sm">{v.procedencia || "—"}</p>{v.provinciaOrigen && <p className="text-xs text-gray-500">{v.provinciaOrigen}</p>}</div></td>
                  <td className="px-4 py-2 whitespace-nowrap"><div><p className="text-sm">{v.destino || "—"}</p>{v.provinciaDestino && <p className="text-xs text-gray-500">{v.provinciaDestino}</p>}</div></td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm">{formatKilos(v.kilos)}</td>
                  <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">{formatearMoneda(v.tarifa)}</td>
                  <td className="px-4 py-2 text-center">
                    <button type="button" onClick={() => abrirDetalle(v.id)} className="inline-flex items-center justify-center h-7 w-7 rounded-md border hover:bg-gray-100 text-sm font-medium transition-colors">+</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {hayFiltroEntidad && totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">Página {pagina} de {totalPaginas} — {viajes.length} viaje(s)</span>
          <div className="flex gap-2">
            <button type="button" onClick={() => setPagina((p) => Math.max(1, p - 1))} disabled={pagina === 1} className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-gray-100 disabled:opacity-40">Anterior</button>
            <button type="button" onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))} disabled={pagina === totalPaginas} className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-gray-100 disabled:opacity-40">Siguiente</button>
          </div>
        </div>
      )}

      {cargandoDetalle && !viajeDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4 text-sm text-gray-600">Cargando detalle...</div>
        </div>
      )}

      {viajeDetalle && (
        <ModalDetalleViaje viaje={viajeDetalle} empresas={empresas} fleteros={fleteros} camiones={camiones} choferes={choferes}
          onGuardar={handleGuardarExitoso}
          onCerrar={() => setViajeDetalle(null)}
          onEliminar={() => { setViajeEliminar(viajeDetalle); setErrorModal(null) }}
        />
      )}

      {viajeEliminar && (
        <ModalEliminar viaje={viajeEliminar} onEliminar={handleEliminar} onCerrar={() => setViajeEliminar(null)} cargando={guardando} error={errorModal} />
      )}
    </div>
  )
}
