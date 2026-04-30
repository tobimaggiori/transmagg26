"use client"

/**
 * ConsultarViajesJmClient — Tabla de viajes JM con filtros, paginación y modal.
 * En JM no hay fleteros ni liquidaciones/facturas: filtros más simples.
 */

import { useState, useCallback, useEffect } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { ModalDetalleViajeJm, type ViajeJmAPI } from "../_components/modal-detalle-viaje-jm"

type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string }
type Chofer = { id: string; nombre: string; apellido: string; email: string | null }

const PER_PAGE = 30

function formatKilos(kilos: number | null): string {
  if (kilos == null) return "—"
  return kilos.toLocaleString("es-AR")
}

function ModalEliminar({ viaje, onEliminar, onCerrar, cargando, error }: {
  viaje: ViajeJmAPI; onEliminar: () => void; onCerrar: () => void; cargando: boolean; error: string | null
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Eliminar viaje</h2>
        <p className="text-sm">¿Estás seguro de que querés eliminar este viaje? Esta acción no se puede deshacer.</p>
        <p className="text-sm text-gray-500">
          Viaje del <span className="font-medium">{formatearFecha(new Date(viaje.fechaViaje))}</span>
          {viaje.empresa && <> — Empresa: <span className="font-medium">{viaje.empresa.razonSocial}</span></>}
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

export function ConsultarViajesJmClient({
  empresas, camiones, choferes,
}: { empresas: Empresa[]; camiones: Camion[]; choferes: Chofer[] }) {
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroDocTipo, setFiltroDocTipo] = useState<"REMITO" | "CUPO" | "CPE" | "CTG">("REMITO")
  const [filtroDocValor, setFiltroDocValor] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")
  const [viajes, setViajes] = useState<ViajeJmAPI[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)
  const [pagina, setPagina] = useState(1)
  const [viajeDetalle, setViajeDetalle] = useState<ViajeJmAPI | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)
  const [viajeEliminar, setViajeEliminar] = useState<ViajeJmAPI | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)
  const [toastExito, setToastExito] = useState(false)

  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const empresaSeleccionada = empresas.find((e) => e.id === filtroEmpresaId)

  const cargar = useCallback(async () => {
    setCargandoViajes(true); setErrorCarga(null)
    try {
      const params = new URLSearchParams()
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      if (filtroDocValor.trim()) {
        const key = filtroDocTipo === "REMITO" ? "remito"
          : filtroDocTipo === "CUPO" ? "cupo"
          : filtroDocTipo === "CPE" ? "cpe"
          : "nroCtg"
        params.set(key, filtroDocValor.trim())
      }
      const res = await fetch(`/api/jm/viajes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cargar viajes")
      setViajes(data as ViajeJmAPI[]); setPagina(1)
    } catch (e) { setErrorCarga(e instanceof Error ? e.message : "Error desconocido") }
    finally { setCargandoViajes(false) }
  }, [filtroEmpresaId, filtroDesde, filtroHasta, filtroDocTipo, filtroDocValor])

  useEffect(() => { void cargar() }, [cargar])

  const totalPaginas = Math.max(1, Math.ceil(viajes.length / PER_PAGE))
  const viajesPagina = viajes.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  async function abrirDetalle(viajeId: string) {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/jm/viajes/${viajeId}`)
      if (!res.ok) throw new Error("Error al cargar detalle")
      setViajeDetalle(await res.json() as ViajeJmAPI)
    } catch { const v = viajes.find((x) => x.id === viajeId); if (v) setViajeDetalle(v) }
    finally { setCargandoDetalle(false) }
  }

  async function handleEliminar() {
    if (!viajeEliminar) return
    setGuardando(true); setErrorModal(null)
    try {
      const res = await fetch(`/api/jm/viajes/${viajeEliminar.id}`, { method: "DELETE" })
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

  const showEmpresaCol = !filtroEmpresaId
  const thCls = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"

  return (
    <div className="space-y-4">
      {toastExito && (
        <div className="fixed top-4 left-1/2 -translate-x-1/2 z-[80] bg-green-600 text-white px-6 py-3 rounded-lg shadow-lg text-sm font-medium animate-in fade-in slide-in-from-top-2">
          Se ha modificado el viaje
        </div>
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">Consultar Viajes</h1>
          <div className="flex items-center gap-2">
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Desde</label>
            <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide ml-2">Hasta</label>
            <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)}
              className="h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
          </div>
        </div>
        <span className="text-sm text-gray-500">{viajes.length} viaje(s)</span>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</label>
            <div className="mt-1"><SearchCombobox items={empresaItems} value={filtroEmpresaId} onChange={setFiltroEmpresaId} placeholder="Buscar empresa..." /></div>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Documento</label>
            <div className="mt-1 flex gap-2">
              <select value={filtroDocTipo} onChange={(e) => setFiltroDocTipo(e.target.value as typeof filtroDocTipo)}
                className="h-9 rounded-md border bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="REMITO">Remito</option>
                <option value="CUPO">Cupo</option>
                <option value="CPE">CPE</option>
                <option value="CTG">CTG</option>
              </select>
              <input type="text" value={filtroDocValor} onChange={(e) => setFiltroDocValor(e.target.value)} placeholder={`Nro ${filtroDocTipo.toLowerCase()}`}
                className="flex-1 min-w-0 h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500" />
            </div>
          </div>
        </div>
      </div>

      {empresaSeleccionada && <p className="text-sm font-medium text-gray-700">Viajes de {empresaSeleccionada.razonSocial} (CUIT: {empresaSeleccionada.cuit})</p>}
      {errorCarga && <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorCarga}</div>}

      <div className="bg-white rounded-lg shadow overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className={thCls}>Fecha</th>
              <th className={thCls}>Documento</th>
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
              <tr><td colSpan={9} className="py-8 text-center text-sm text-gray-500">Cargando...</td></tr>
            ) : viajesPagina.length === 0 ? (
              <tr><td colSpan={9} className="py-8 text-center text-sm text-gray-500">Sin viajes para los filtros seleccionados.</td></tr>
            ) : viajesPagina.map((v) => (
              <tr key={v.id} className={`border-b last:border-0 hover:bg-gray-100 transition-colors ${viajeDetalle?.id === v.id ? "bg-blue-50" : ""}`}>
                <td className="px-4 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                <td className="px-4 py-2 whitespace-nowrap">
                  {(() => {
                    const principal = v.remito
                      ? { tipo: "Remito", nro: v.remito }
                      : v.nroCtg
                        ? { tipo: "CTG", nro: v.nroCtg }
                        : null
                    const extras: string[] = []
                    if (v.cupo) extras.push(`Cupo: ${v.cupo}`)
                    if (v.cpe) extras.push(`CPE: ${v.cpe}`)
                    if (!principal && extras.length === 0) return "—"
                    return (
                      <div>
                        {principal && <p className="text-sm"><span className="text-gray-500">{principal.tipo}</span> {principal.nro}</p>}
                        {extras.length > 0 && <p className="text-xs text-gray-500">{extras.join(" · ")}</p>}
                      </div>
                    )
                  })()}
                </td>
                {showEmpresaCol && <td className="px-4 py-2 whitespace-nowrap">{v.empresa ? (<div><p className="text-xs text-gray-500">{empresas.find((e) => e.id === v.empresaId)?.cuit ?? ""}</p><p className="text-sm">{v.empresa.razonSocial}</p></div>) : "—"}</td>}
                <td className="px-4 py-2 whitespace-nowrap text-sm max-w-[120px] truncate">{v.mercaderia || "—"}</td>
                <td className="px-4 py-2 whitespace-nowrap"><div><p className="text-sm">{v.procedencia || "—"}</p>{v.provinciaOrigen && <p className="text-xs text-gray-500">{v.provinciaOrigen}</p>}</div></td>
                <td className="px-4 py-2 whitespace-nowrap"><div><p className="text-sm">{v.destino || "—"}</p>{v.provinciaDestino && <p className="text-xs text-gray-500">{v.provinciaDestino}</p>}</div></td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm">{formatKilos(v.kilos)}</td>
                <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">{formatearMoneda(Number(v.tarifaEmpresa))}</td>
                <td className="px-4 py-2 text-center">
                  <button type="button" onClick={() => abrirDetalle(v.id)} className="inline-flex items-center justify-center h-7 w-7 rounded-md border hover:bg-gray-100 text-sm font-medium transition-colors">+</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPaginas > 1 && (
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
        <ModalDetalleViajeJm viaje={viajeDetalle} empresas={empresas} camiones={camiones} choferes={choferes}
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
