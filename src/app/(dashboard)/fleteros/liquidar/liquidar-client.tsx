"use client"

/**
 * Propósito: Componente de creación de Líquido Producto.
 * Selector de fletero → viajes pendientes con checkboxes → preview fullscreen → confirmar.
 */

import { useState, useCallback, useEffect } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { labelCondicionIva, formatearNroComprobante } from "@/lib/liquidacion-utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; comisionDefault?: number }
type Camion = { id: string; patenteChasis: string; fleteroId: string }
type Chofer = { id: string; nombre: string; apellido: string }

type FleteroInfo = {
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion?: string | null
  nroProximoComprobante: number
}

type ViajeParaLiquidar = {
  id: string
  fechaViaje: string
  empresaId: string
  empresa: { razonSocial: string }
  camionId: string
  camion: { patenteChasis: string }
  choferId: string
  chofer: { nombre: string; apellido: string }
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaFletero: number
  estadoFactura: string
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
  camionIdEdit?: string
  choferIdEdit?: string
}

type LiquidarClientProps = {
  rol: Rol
  fleteros: Fletero[]
  camiones: Camion[]
  choferes: Chofer[]
  fleteroIdPropio: string | null
}

// ─── Modal editar viaje ───────────────────────────────────────────────────────

function ModalEditarViaje({
  viaje,
  camiones,
  choferes,
  fleteroId,
  onGuardar,
  onCerrar,
}: {
  viaje: ViajeParaLiquidar
  camiones: Camion[]
  choferes: Chofer[]
  fleteroId: string
  onGuardar: (v: ViajeParaLiquidar) => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<ViajeParaLiquidar>({ ...viaje })
  const camionesDelFletero = camiones.filter((c) => c.fleteroId === fleteroId)

  function set(campo: keyof ViajeParaLiquidar, valor: unknown) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Editar viaje</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha viaje</label>
            <input type="date" value={form.fechaEdit ?? form.fechaViaje.slice(0, 10)} onChange={(e) => set("fechaEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Remito</label>
            <input type="text" value={form.remitoEdit ?? ""} onChange={(e) => set("remitoEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Cupo</label>
            <input type="text" value={form.cupoEdit ?? ""} onChange={(e) => set("cupoEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mercadería</label>
            <input type="text" value={form.mercaderiaEdit ?? ""} onChange={(e) => set("mercaderiaEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Procedencia</label>
            <input type="text" value={form.procedenciaEdit ?? ""} onChange={(e) => set("procedenciaEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prov. Origen</label>
            <input type="text" value={form.origenEdit ?? ""} onChange={(e) => set("origenEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Destino</label>
            <input type="text" value={form.destinoEdit ?? ""} onChange={(e) => set("destinoEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prov. Destino</label>
            <select value={form.provinciaDestinoEdit ?? ""} onChange={(e) => set("provinciaDestinoEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm">
              <option value="">— Seleccionar —</option>
              {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Kilos</label>
            <input type="number" value={form.kilosEdit ?? form.kilos ?? ""} onChange={(e) => set("kilosEdit", parseFloat(e.target.value) || undefined)} min="0" step="1" className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tarifa al fletero / ton</label>
            <input type="number" value={form.tarifaEdit ?? form.tarifaFletero} onChange={(e) => set("tarifaEdit", parseFloat(e.target.value) || form.tarifaFletero)} min="0" step="0.01" className="h-9 w-full rounded border bg-background px-2 text-sm" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Camión</label>
            <select value={form.camionIdEdit ?? form.camionId} onChange={(e) => set("camionIdEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm">
              {camionesDelFletero.map((c) => <option key={c.id} value={c.id}>{c.patenteChasis}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chofer</label>
            <select value={form.choferIdEdit ?? form.choferId} onChange={(e) => set("choferIdEdit", e.target.value)} className="h-9 w-full rounded border bg-background px-2 text-sm">
              {choferes.map((c) => <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>)}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
          <button onClick={() => { onGuardar(form); onCerrar() }} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Guardar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal preview liquidación (fullscreen) ───────────────────────────────────

function ModalPreviewLiquidacion({
  fletero,
  viajesIniciales,
  comisionPctInicial,
  ivaPctInicial,
  generando,
  error,
  onCancelar,
  onConfirmar,
}: {
  fletero: FleteroInfo
  viajesIniciales: ViajeParaLiquidar[]
  comisionPctInicial: number
  ivaPctInicial: number
  generando: boolean
  error: string | null
  onCancelar: () => void
  onConfirmar: (viajes: ViajeParaLiquidar[], comisionPct: number, ivaPct: number) => void
}) {
  const [viajes, setViajes] = useState<ViajeParaLiquidar[]>(viajesIniciales)
  const [comisionPct, setComisionPct] = useState(comisionPctInicial)
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)

  function actualizarCelda(id: string, campo: keyof ViajeParaLiquidar, valor: unknown) {
    setViajes((prev) => prev.map((v) => v.id === id ? { ...v, [campo]: valor } : v))
  }

  const viajesParaCalc = viajes.map((v) => ({
    kilos: v.kilosEdit ?? v.kilos ?? 0,
    tarifaFletero: v.tarifaEdit ?? v.tarifaFletero,
  }))
  const preview = calcularLiquidacion(viajesParaCalc, comisionPct, ivaPct)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h2 className="text-lg font-semibold">Liquidar {viajes.length} viaje(s) seleccionado(s)</h2>
        <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        <div className="mb-4 rounded-md border bg-muted/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">Liquidación a</p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div><span className="text-muted-foreground">Razón Social: </span><span className="font-medium">{fletero.razonSocial}</span></div>
            <div><span className="text-muted-foreground">CUIT: </span><span className="font-medium">{fletero.cuit}</span></div>
            <div><span className="text-muted-foreground">Condición IVA: </span><span className="font-medium">{labelCondicionIva(fletero.condicionIva)}</span></div>
            <div><span className="text-muted-foreground">Dirección: </span><span className="font-medium">{fletero.direccion ?? "—"}</span></div>
            <div><span className="text-muted-foreground">Nº Líquido Producto: </span><span className="font-mono font-bold text-base">{formatearNroComprobante(fletero.nroProximoComprobante)}</span></div>
          </div>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Remito</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Cupo</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Mercadería</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Procedencia</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Origen</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Destino</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Destino</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Kilos</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Tarifa</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Ton</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viajes.map((v) => {
                const kilos = v.kilosEdit ?? v.kilos ?? 0
                const tarifa = v.tarifaEdit ?? v.tarifaFletero
                const ton = kilos > 0 ? calcularToneladas(kilos) : null
                const importe = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                return (
                  <tr key={v.id} className="hover:bg-muted/20">
                    <td className="px-1 py-1"><input type="date" value={v.fechaEdit ?? v.fechaViaje.slice(0, 10)} onChange={(e) => actualizarCelda(v.id, "fechaEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.remitoEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "remitoEdit", e.target.value)} className="h-7 w-24 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.cupoEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "cupoEdit", e.target.value)} className="h-7 w-20 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.mercaderiaEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "mercaderiaEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.procedenciaEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "procedenciaEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.origenEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "origenEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="text" value={v.destinoEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "destinoEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><select value={v.provinciaDestinoEdit ?? ""} onChange={(e) => actualizarCelda(v.id, "provinciaDestinoEdit", e.target.value)} className="h-7 w-28 rounded border bg-background px-1 text-xs"><option value="">—</option>{PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}</select></td>
                    <td className="px-1 py-1"><input type="number" value={v.kilosEdit ?? v.kilos ?? ""} onChange={(e) => actualizarCelda(v.id, "kilosEdit", parseFloat(e.target.value) || undefined)} min="0" step="1" className="h-7 w-24 text-right rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-1 py-1"><input type="number" value={v.tarifaEdit ?? v.tarifaFletero} onChange={(e) => actualizarCelda(v.id, "tarifaEdit", parseFloat(e.target.value) || v.tarifaFletero)} min="0" step="0.01" className="h-7 w-28 text-right rounded border bg-background px-1 text-xs" /></td>
                    <td className="px-2 py-1 text-right text-muted-foreground text-xs">{ton?.toLocaleString("es-AR") ?? "-"}</td>
                    <td className="px-2 py-1 text-right font-medium text-xs">{importe != null ? formatearMoneda(importe) : "-"}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="border-t px-6 py-4 shrink-0 bg-background">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Comisión %</label>
              <input type="number" value={comisionPct} onChange={(e) => setComisionPct(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" className="h-8 w-24 rounded border bg-background px-2 text-sm" />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
              <input type="number" value={ivaPct} onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)} min="0" max="100" step="0.01" className="h-8 w-24 rounded border bg-background px-2 text-sm" />
            </div>
          </div>
          <div className="flex-1 text-sm space-y-0.5">
            <div className="flex justify-end gap-8"><span className="text-muted-foreground">Bruto ({viajes.length} viajes):</span><span className="w-36 text-right">{formatearMoneda(preview.subtotalBruto)}</span></div>
            <div className="flex justify-end gap-8"><span className="text-muted-foreground">Comisión ({comisionPct}%):</span><span className="w-36 text-right">- {formatearMoneda(preview.comisionMonto)}</span></div>
            <div className="flex justify-end gap-8 font-medium"><span>Neto:</span><span className="w-36 text-right">{formatearMoneda(preview.neto)}</span></div>
            <div className="flex justify-end gap-8"><span className="text-muted-foreground">IVA ({ivaPct}%):</span><span className="w-36 text-right">+ {formatearMoneda(preview.ivaMonto)}</span></div>
            <div className="flex justify-end gap-8 font-bold text-base border-t pt-1"><span>TOTAL FINAL:</span><span className="w-36 text-right">{formatearMoneda(preview.totalFinal)}</span></div>
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={onCancelar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
            <button onClick={() => onConfirmar(viajes, comisionPct, ivaPct)} disabled={generando} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
              {generando ? "Generando..." : "Confirmar y generar liquidación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * LiquidarClient: LiquidarClientProps -> JSX.Element
 *
 * Dado los datos del servidor, renderiza la UI de creación de Líquido Producto:
 * selector de fletero, tabla de viajes pendientes con checkboxes, edición inline
 * y preview fullscreen antes de confirmar.
 * Al emitir exitosamente muestra banner con link a "Consultar Liq. Prod.".
 * Existe para la página /fleteros/liquidar.
 *
 * Ejemplos:
 * <LiquidarClient rol="OPERADOR_TRANSMAGG" fleteros={[...]} camiones={[...]} choferes={[...]} fleteroIdPropio={null} />
 */
export function LiquidarClient({ rol, fleteros, camiones, choferes, fleteroIdPropio }: LiquidarClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [viajeEditando, setViajeEditando] = useState<ViajeParaLiquidar | null>(null)
  const [fleteroInfo, setFleteroInfo] = useState<FleteroInfo | null>(null)
  const [exitoLiquidacion, setExitoLiquidacion] = useState(false)

  const cargarDatos = useCallback(async () => {
    if (!fleteroId) return
    setCargando(true)
    setExitoLiquidacion(false)
    try {
      const res = await fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      if (res.ok) {
        const data = await res.json() as {
          viajesPendientes: ViajeParaLiquidar[]
          fletero: { cuit: string; condicionIva: string; direccion?: string | null } | null
          nroProximoComprobante: number
        }
        const viajesConEdit = (data.viajesPendientes ?? []).map((v) => ({
          ...v,
          kilosEdit: v.kilos ?? undefined,
          tarifaEdit: v.tarifaFletero,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          cupoEdit: v.cupo ?? "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: v.provinciaOrigen ?? "",
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: v.provinciaDestino ?? "",
          camionIdEdit: v.camionId,
          choferIdEdit: v.choferId,
        }))
        setViajesPendientes(viajesConEdit)
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

  useEffect(() => { cargarDatos() }, [cargarDatos])

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function toggleTodos() {
    if (seleccionados.size === viajesPendientes.length) setSeleccionados(new Set())
    else setSeleccionados(new Set(viajesPendientes.map((v) => v.id)))
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
          cupo: v.cupoEdit || null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaFletero: v.tarifaEdit ?? v.tarifaFletero,
        })),
      }
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json() as { error?: string }
        setErrorGen(err.error ?? "Error al generar liquidación")
        return
      }
      setEnPreview(false)
      setSeleccionados(new Set())
      setExitoLiquidacion(true)
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Líquido Producto</h2>
        <p className="text-muted-foreground">Creación de liquidación al fletero</p>
      </div>


      {exitoLiquidacion && (
        <div className="flex items-center justify-between rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">
          <span>✓ Liquidación generada exitosamente.</span>
          <Link href="/fleteros/liquidaciones" className="font-medium underline hover:text-green-900">
            Ver en Consultar Liq. Prod. →
          </Link>
        </div>
      )}

      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[250px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select
              value={fleteroId}
              onChange={(e) => { setFleteroId(e.target.value); setSeleccionados(new Set()); setEnPreview(false); setExitoLiquidacion(false) }}
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
          <p className="text-lg">Seleccioná un Fletero para ver sus viajes pendientes de liquidación</p>
        </div>
      )}

      {fleteroId && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Viajes pendientes de liquidación</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                {viajesPendientes.length}
              </span>
            </div>
            {seleccionados.size > 0 && (
              <button
                onClick={() => setEnPreview(true)}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
              >
                Liquidar seleccionados ({seleccionados.size})
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
                <thead className="bg-slate-50">
                  <tr>
                    <th className="px-3 py-2">
                      <input type="checkbox" checked={seleccionados.size === viajesPendientes.length} onChange={toggleTodos} />
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
                        <td className="px-3 py-2">{v.cupoEdit || v.cupo || "-"}</td>
                        <td className="px-3 py-2">{v.mercaderiaEdit || v.mercaderia || "-"}</td>
                        <td className="px-3 py-2">{v.origenEdit || v.provinciaOrigen || v.procedencia || "-"}</td>
                        <td className="px-3 py-2">{v.provinciaDestinoEdit || v.destinoEdit || v.provinciaDestino || v.destino || "-"}</td>
                        <td className="px-3 py-2 text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "-"}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{ton?.toLocaleString("es-AR") ?? "-"}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(tarifa)}</td>
                        <td className="px-3 py-2 text-right font-medium">{total != null ? formatearMoneda(total) : "-"}</td>
                        <td className="px-3 py-2">
                          <button onClick={() => setViajeEditando(v)} className="h-7 px-2 rounded border text-xs font-medium hover:bg-accent">Editar</button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

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
