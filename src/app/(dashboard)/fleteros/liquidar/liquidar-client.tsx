"use client"

/**
 * Propósito: Componente de creación de Líquido Producto.
 * Selector de fletero → viajes pendientes con checkboxes → preview fullscreen → confirmar.
 * Los datos de viaje son solo de visualización — se editan desde Consultar Viajes.
 */

import { useState, useCallback, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { labelCondicionIva, formatearNroComprobante } from "@/lib/liquidacion-utils"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }

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
  tarifa: number
  estadoFactura: string
  nroCartaPorte: string | null
}

type LiquidarClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
}

// ─── Modal preview liquidación (fullscreen) ───────────────────────────────────

function ModalPreviewLiquidacion({
  fletero,
  viajes,
  comisionPctInicial,
  ivaPctInicial,
  generando,
  error,
  onCancelar,
  onConfirmar,
}: {
  fletero: FleteroInfo
  viajes: ViajeParaLiquidar[]
  comisionPctInicial: number
  ivaPctInicial: number
  generando: boolean
  error: string | null
  onCancelar: () => void
  onConfirmar: (viajes: ViajeParaLiquidar[], comisionPct: number, ivaPct: number) => void
}) {
  const [comisionPct, setComisionPct] = useState(comisionPctInicial)
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)

  const viajesParaCalc = viajes.map((v) => ({
    kilos: v.kilos ?? 0,
    tarifaFletero: v.tarifa,
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
              <tr className="uppercase text-xs">
                <th className="px-2 py-2 text-left whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Carta de Porte</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Remito</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Cupo</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Mercadería</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Ciudad Origen</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Origen</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Ciudad Destino</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Destino</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Kilos</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Tarifa</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viajes.map((v, i) => {
                const kilos = v.kilos ?? 0
                const tarifa = v.tarifa
                const importe = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                return (
                  <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-2 py-1.5 text-xs whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                    <td className="px-2 py-1.5 text-xs">{v.nroCartaPorte ?? "N/A"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.remito ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.cupo ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.mercaderia ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.procedencia ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.provinciaOrigen ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.destino ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs">{v.provinciaDestino ?? "—"}</td>
                    <td className="px-2 py-1.5 text-xs text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "—"}</td>
                    <td className="px-2 py-1.5 text-xs text-right">{formatearMoneda(tarifa)}</td>
                    <td className="px-2 py-1.5 text-xs text-right font-medium">{importe != null ? formatearMoneda(importe) : "—"}</td>
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

export function LiquidarClient({ rol, fleteros, fleteroIdPropio }: LiquidarClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  const searchParams = useSearchParams()
  const fleteroIdParam = searchParams.get("fleteroId")

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdParam ?? fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [fleteroInfo, setFleteroInfo] = useState<FleteroInfo | null>(null)
  const [exitoLiquidacion, setExitoLiquidacion] = useState<{ nroLP: string; id: string } | null>(null)
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const cargarDatos = useCallback(async () => {
    setCargando(true)
    setExitoLiquidacion(null)
    try {
      const url = fleteroId ? `/api/liquidaciones?fleteroId=${fleteroId}` : "/api/liquidaciones"
      const res = await fetch(url)
      if (res.ok) {
        const data = await res.json() as {
          viajesPendientes: ViajeParaLiquidar[]
          fletero: { cuit: string; condicionIva: string; direccion?: string | null } | null
          nroProximoComprobante: number
        }
        setViajesPendientes(data.viajesPendientes ?? [])
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

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  async function confirmarLiquidacion(viajesConfirmados: ViajeParaLiquidar[], comision: number, iva: number) {
    if (!fleteroId || viajesConfirmados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        fleteroId,
        comisionPct: comision,
        ivaPct: iva,
        viajes: viajesConfirmados.map((v) => ({
          viajeId: v.id,
          camionId: v.camionId,
          choferId: v.choferId,
          fechaViaje: v.fechaViaje.slice(0, 10),
          remito: v.remito,
          cupo: v.cupo,
          mercaderia: v.mercaderia,
          procedencia: v.procedencia,
          provinciaOrigen: v.provinciaOrigen,
          destino: v.destino,
          provinciaDestino: v.provinciaDestino,
          kilos: v.kilos ?? 0,
          tarifaFletero: v.tarifa,
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
      const liqCreada = await res.json() as { id: string; nroComprobante?: number; ptoVenta?: number }
      const nroLP = liqCreada.nroComprobante
        ? `${String(liqCreada.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liqCreada.nroComprobante)}`
        : "LP"
      setEnPreview(false)
      setSeleccionados(new Set())
      setExitoLiquidacion({ nroLP, id: liqCreada.id })
      cargarDatos()
      abrirPDF({
        fetchUrl: `/api/liquidaciones/${liqCreada.id}/pdf`,
        titulo: `LP ${nroLP} — ${fleteroInfo?.razonSocial ?? ""}`,
        onEnviarMail: async (email: string) => {
          const r = await fetch(`/api/liquidaciones/${liqCreada.id}/enviar-email`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ emailDestino: email }),
          })
          if (!r.ok) {
            const err = await r.json()
            throw new Error(err.error ?? "Error al enviar email")
          }
        },
      })
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
        <div className="rounded-lg border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 space-y-2">
          <p className="font-medium">✓ Líquido Producto {exitoLiquidacion.nroLP} emitido exitosamente.</p>
          <p className="text-xs text-green-700">(Cuando se conecte ARCA, aquí aparecerá el CAE asignado)</p>
          <div className="flex flex-wrap gap-2 pt-1">
            <button
              type="button"
              onClick={() => abrirPDF({
                fetchUrl: `/api/liquidaciones/${exitoLiquidacion.id}/pdf`,
                titulo: `LP ${exitoLiquidacion.nroLP}`,
                onEnviarMail: async (email: string) => {
                  const r = await fetch(`/api/liquidaciones/${exitoLiquidacion.id}/enviar-email`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ emailDestino: email }),
                  })
                  if (!r.ok) { const err = await r.json(); throw new Error(err.error ?? "Error") }
                },
              })}
              className="h-8 px-3 rounded-md bg-green-700 text-white text-xs font-medium hover:bg-green-800"
            >
              Ver PDF
            </button>
            <button
              type="button"
              onClick={() => {
                abrirPDF({ fetchUrl: `/api/liquidaciones/${exitoLiquidacion.id}/pdf`, titulo: `LP ${exitoLiquidacion.nroLP}` })
                setTimeout(() => window.print(), 1000)
              }}
              className="h-8 px-3 rounded-md border border-green-300 text-green-800 text-xs font-medium hover:bg-green-100"
            >
              Imprimir PDF
            </button>
            <Link href="/fleteros/liquidaciones" className="h-8 px-3 rounded-md border border-green-300 text-green-800 text-xs font-medium hover:bg-green-100 inline-flex items-center">
              Ver en Consultar LP →
            </Link>
          </div>
        </div>
      )}

      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[300px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero (dejar vacío para ver todos)</label>
            <SearchCombobox
              items={fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))}
              value={fleteroId}
              onChange={(id) => { setFleteroId(id); setSeleccionados(new Set()); setEnPreview(false); setExitoLiquidacion(null) }}
              placeholder="Buscar por razón social o CUIT..."
            />
          </div>
        </div>
      )}

      {(fleteroId || esInterno) && (
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
                    <th className="px-3 py-2 text-left">Carta de Porte</th>
                    <th className="px-3 py-2 text-left">Remito</th>
                    <th className="px-3 py-2 text-left">Cupo</th>
                    <th className="px-3 py-2 text-left">Mercadería</th>
                    <th className="px-3 py-2 text-left">Origen</th>
                    <th className="px-3 py-2 text-left">Destino</th>
                    <th className="px-3 py-2 text-right">Kilos</th>
                    <th className="px-3 py-2 text-right">Ton</th>
                    <th className="px-3 py-2 text-right">Tarifa / ton</th>
                    <th className="px-3 py-2 text-right">Importe</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {viajesPendientes.map((v) => {
                    const kilos = v.kilos ?? 0
                    const tarifa = v.tarifa
                    const ton = kilos > 0 ? calcularToneladas(kilos) : null
                    const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                    return (
                      <tr key={v.id} className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                        <td className="px-3 py-2 text-center">
                          <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                        </td>
                        <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                        <td className="px-3 py-2">{v.nroCartaPorte ?? "N/A"}</td>
                        <td className="px-3 py-2">{v.remito ?? "—"}</td>
                        <td className="px-3 py-2">{v.cupo ?? "—"}</td>
                        <td className="px-3 py-2">{v.mercaderia ?? "—"}</td>
                        <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "—"}</td>
                        <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "—"}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">{ton?.toLocaleString("es-AR") ?? "—"}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(tarifa)}</td>
                        <td className="px-3 py-2 text-right font-medium">{total != null ? formatearMoneda(total) : "—"}</td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {enPreview && (
        <ModalPreviewLiquidacion
          fletero={fleteroInfo ?? { razonSocial: "", cuit: "", condicionIva: "", nroProximoComprobante: 1 }}
          viajes={viajesSeleccionados}
          comisionPctInicial={comisionPct}
          ivaPctInicial={ivaPct}
          generando={generando}
          error={errorGen}
          onCancelar={() => { setEnPreview(false); setErrorGen(null) }}
          onConfirmar={confirmarLiquidacion}
        />
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
