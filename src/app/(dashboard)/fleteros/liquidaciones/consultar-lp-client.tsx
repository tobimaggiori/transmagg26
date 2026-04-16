"use client"

/**
 * Propósito: Componente cliente para consultar el historial de Líquidos Producto emitidos.
 * Filtros por fletero, nro comprobante, fechas. Tabla con totales.
 * Análogo a consultar-facturas-client.tsx.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes, calcularNetoMasIva } from "@/lib/money"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { hoyLocalYmd } from "@/lib/date-local"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string }

type ViajeEnLiquidacion = {
  id: string
  viajeId: string
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
  viaje?: { nroCartaPorte: string | null; cartaPorteS3Key: string | null }
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
  nroComprobante: number | null
  ptoVenta: number | null
  cae: string | null
  arcaEstado: string | null
  fleteroId: string
  fletero: { razonSocial: string; cuit?: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago: { id: string; nro: number; anio: number; fecha: string; pdfS3Key?: string | null } | null }[]
}

type ConsultarLPClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, "")
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}

function formatNroLP(ptoVenta: number | null, nroComprobante: number | null): string {
  if (!nroComprobante) return "—"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(nroComprobante)}`
}

function primerDiaMesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`
}

function calcularSaldoLP(liq: Liquidacion): number {
  const totalPagado = sumarImportes(liq.pagos.filter((p) => !p.anulado).map((p) => p.monto))
  return Math.max(0, restarImportes(liq.total, totalPagado))
}

// ─── Modal detalle LP ────────────────────────────────────────────────────────

function ModalDetalleLP({
  liq, onCerrar,
}: {
  liq: Liquidacion; onCerrar: () => void
}) {
  const nroLP = formatNroLP(liq.ptoVenta, liq.nroComprobante)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">
            LP Nro: {nroLP} | Fletero: {liq.fletero.razonSocial.toUpperCase()} | Fecha: {formatearFecha(new Date(liq.grabadaEn))}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <div className="px-6 py-4">
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b font-semibold uppercase text-xs bg-slate-50">
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Carta de Porte</th>
                  <th className="px-3 py-2 text-left">Remito</th>
                  <th className="px-3 py-2 text-left">Cupo</th>
                  <th className="px-3 py-2 text-left">Mercadería</th>
                  <th className="px-3 py-2 text-left">Ciudad Origen</th>
                  <th className="px-3 py-2 text-left">Prov. Origen</th>
                  <th className="px-3 py-2 text-left">Ciudad Destino</th>
                  <th className="px-3 py-2 text-left">Prov. Destino</th>
                  <th className="px-3 py-2 text-right">Kilos</th>
                  <th className="px-3 py-2 text-right">Tarifa</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {liq.viajes.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                    <td className="px-3 py-2">{v.viaje?.nroCartaPorte ?? <span className="text-muted-foreground">N/A</span>}</td>
                    <td className="px-3 py-2">{v.remito ?? "—"}</td>
                    <td className="px-3 py-2">{v.cupo ?? "—"}</td>
                    <td className="px-3 py-2">{v.mercaderia ?? "—"}</td>
                    <td className="px-3 py-2">{v.procedencia ?? "—"}</td>
                    <td className="px-3 py-2">{v.provinciaOrigen ?? "—"}</td>
                    <td className="px-3 py-2">{v.destino ?? "—"}</td>
                    <td className="px-3 py-2">{v.provinciaDestino ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaFletero)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 space-y-1 text-sm max-w-md ml-auto">
            <div className="flex justify-between"><span>Total Viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
            <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>-{formatearMoneda(liq.comisionMonto)}</span></div>
            <div className="flex justify-between font-medium"><span>Total neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
            <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>{formatearMoneda(liq.ivaMonto)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL:</span><span>{formatearMoneda(liq.total)}</span></div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end">
          <button onClick={onCerrar} className="h-9 px-6 rounded-md border text-sm font-medium hover:bg-accent">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal emitir NC/ND sobre LP ─────────────────────────────────────────────

type ItemNota = { concepto: string; subtotal: string }

function ModalEmitirNotaLP({
  liq, onClose, onEmitida, faltantes,
}: {
  liq: Liquidacion; onClose: () => void; onEmitida: () => void
  faltantes?: Array<{ viajeId: string; montoTotal: number; descripcion: string | null; empresa: string }>
}) {
  const [tipoNota, setTipoNota] = useState<"NC" | "ND">("NC")
  const [incluirComision, setIncluirComision] = useState(true)
  const [fechaEmision, setFechaEmision] = useState(hoyLocalYmd())
  const [items, setItems] = useState<ItemNota[]>([{ concepto: "", subtotal: "" }])
  const [viajesSeleccionados, setViajesSeleccionados] = useState<Set<string>>(new Set())
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ cae?: string; nro?: number; ptoVenta?: number } | null>(null)

  const ivaPct = liq.ivaPct ?? 21

  const preview = useMemo(() => {
    const subtotales = items.map((i) => parseFloat(i.subtotal) || 0).filter((s) => s > 0)
    if (subtotales.length === 0) return null
    const bruto = sumarImportes(subtotales)
    const comisionPct = liq.comisionPct ?? 0

    if (incluirComision && comisionPct > 0) {
      const comisionMonto = Math.round(bruto * comisionPct / 100 * 100) / 100
      const neto = Math.round((bruto - comisionMonto) * 100) / 100
      const iva = Math.round(neto * ivaPct / 100 * 100) / 100
      const total = Math.round((neto + iva) * 100) / 100
      return { bruto, comisionMonto, neto, iva, total, conComision: true }
    }

    const result = calcularNetoMasIva(bruto, ivaPct)
    return { bruto, comisionMonto: 0, neto: result.neto, iva: result.iva, total: result.total, conComision: false }
  }, [items, ivaPct, incluirComision, liq.comisionPct])

  function toggleViaje(viajeId: string) {
    setViajesSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(viajeId)) next.delete(viajeId)
      else next.add(viajeId)
      return next
    })
  }

  function toggleTodosViajes() {
    if (viajesSeleccionados.size === liq.viajes.length) {
      setViajesSeleccionados(new Set())
    } else {
      setViajesSeleccionados(new Set(liq.viajes.map((v) => v.viajeId)))
    }
  }

  async function emitir() {
    setError(null)
    setGenerando(true)
    try {
      const itemsValidos = items
        .filter((i) => i.concepto.trim() && parseFloat(i.subtotal) > 0)
        .map((i) => ({ concepto: i.concepto.trim(), subtotal: parseFloat(i.subtotal) }))

      if (itemsValidos.length === 0) {
        setError("Ingresá al menos un ítem con concepto y subtotal")
        return
      }

      const montoNeto = sumarImportes(itemsValidos.map((i) => i.subtotal))
      const descripcion = itemsValidos.map((i) => i.concepto).join("; ")

      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tipo: tipoNota === "NC" ? "NC_EMITIDA" : "ND_EMITIDA",
          subtipo: "CORRECCION_IMPORTE",
          liquidacionId: liq.id,
          montoNeto,
          ivaPct,
          descripcion,
          fechaEmision,
          incluirComision,
          viajesIds: viajesSeleccionados.size > 0 ? Array.from(viajesSeleccionados) : undefined,
          idempotencyKey: (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al emitir la nota")
        return
      }

      const data = await res.json()
      setExito({
        cae: data.arca?.cae,
        nro: data.arca?.nroComprobante,
        ptoVenta: data.arca?.ptoVenta,
      })
    } catch {
      setError("Error de red al emitir")
    } finally {
      setGenerando(false)
    }
  }

  const nroLP = formatNroLP(liq.ptoVenta, liq.nroComprobante)
  const labelTipo = tipoNota === "NC" ? "Nota de Crédito" : "Nota de Débito"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Emitir {labelTipo} sobre LP</h2>
            <p className="text-sm text-muted-foreground">LP {nroLP} — {liq.fletero.razonSocial}</p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {faltantes && faltantes.length > 0 && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm">
            <p className="font-semibold text-amber-800 mb-1">Faltantes pendientes de descontar</p>
            {faltantes.map((f, i) => (
              <p key={i} className="text-amber-700 text-xs">
                {f.empresa}: {f.descripcion ?? "Faltante de mercadería"} — {formatearMoneda(f.montoTotal)}
              </p>
            ))}
          </div>
        )}

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
          <span className="text-muted-foreground">Fletero</span>
          <span className="font-medium">{liq.fletero.razonSocial}</span>
          <span className="text-muted-foreground">Total LP</span>
          <span className="font-medium">{formatearMoneda(liq.total)}</span>
          <span className="text-muted-foreground">Viajes</span>
          <span>{liq.viajes.length}</span>
        </div>

        {exito ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="font-semibold text-green-800">{labelTipo} emitida exitosamente</p>
            {exito.cae && <p className="text-sm text-green-700">CAE: {exito.cae}</p>}
            {exito.nro && exito.ptoVenta && (
              <p className="text-sm text-green-700">
                Nro: {String(exito.ptoVenta).padStart(4, "0")}-{String(exito.nro).padStart(8, "0")}
              </p>
            )}
            <button onClick={onEmitida} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">Cerrar</button>
          </div>
        ) : (
          <>
            <div>
              <label className="text-sm font-medium">Tipo de nota</label>
              <div className="flex gap-4 mt-1">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="tipoNotaLP" value="NC" checked={tipoNota === "NC"} onChange={() => setTipoNota("NC")} className="accent-primary" />
                  Nota de Crédito <span className="text-xs text-muted-foreground">(reduce deuda)</span>
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <input type="radio" name="tipoNotaLP" value="ND" checked={tipoNota === "ND"} onChange={() => setTipoNota("ND")} className="accent-primary" />
                  Nota de Débito <span className="text-xs text-muted-foreground">(suma deuda)</span>
                </label>
              </div>
            </div>

            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input type="checkbox" checked={incluirComision} onChange={(e) => setIncluirComision(e.target.checked)} className="accent-primary" />
              <span>Incluir comisión en el ajuste</span>
              <span className="text-xs text-muted-foreground">
                ({incluirComision ? `se desglosa con ${liq.comisionPct}% de comisión` : "100% del ajuste va al fletero"})
              </span>
            </label>

            <div>
              <label className="text-sm font-medium">Fecha de emisión</label>
              <input
                type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                max={hoyLocalYmd()} min={hoyLocalYmd(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))}
                className="h-9 w-48 rounded-md border bg-background px-2 text-sm ml-2"
              />
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Ítems</label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <input
                    value={item.concepto} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], concepto: e.target.value }; setItems(n) }}
                    placeholder="Concepto" className="flex-1 h-9 rounded-md border bg-background px-2 text-sm"
                  />
                  <input
                    type="number" value={item.subtotal} onChange={(e) => { const n = [...items]; n[idx] = { ...n[idx], subtotal: e.target.value }; setItems(n) }}
                    placeholder="Subtotal" className="w-36 h-9 rounded-md border bg-background px-2 text-sm text-right" min="0.01" step="0.01"
                  />
                  {items.length > 1 && (
                    <button onClick={() => setItems(items.filter((_, i) => i !== idx))} className="h-9 px-2 text-red-500 hover:text-red-700 text-lg">&times;</button>
                  )}
                </div>
              ))}
              <button onClick={() => setItems([...items, { concepto: "", subtotal: "" }])} className="text-xs text-primary hover:underline font-medium">+ Agregar ítem</button>
            </div>

            {tipoNota === "NC" && liq.viajes.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Liberar viajes para reliquidar <span className="text-muted-foreground font-normal">(opcional)</span></label>
                  <button onClick={toggleTodosViajes} className="text-xs text-primary hover:underline font-medium">
                    {viajesSeleccionados.size === liq.viajes.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="rounded-lg border max-h-40 overflow-y-auto">
                  <table className="w-full text-xs">
                    <thead className="bg-muted/60 sticky top-0">
                      <tr>
                        <th className="p-1.5 w-8"></th>
                        <th className="p-1.5 text-left">Origen</th>
                        <th className="p-1.5 text-left">Destino</th>
                        <th className="p-1.5 text-right">Kg</th>
                        <th className="p-1.5 text-right">Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {liq.viajes.map((v) => (
                        <tr key={v.viajeId} className={`cursor-pointer hover:bg-muted/40 ${viajesSeleccionados.has(v.viajeId) ? "bg-primary/5" : ""}`} onClick={() => toggleViaje(v.viajeId)}>
                          <td className="p-1.5 text-center"><input type="checkbox" checked={viajesSeleccionados.has(v.viajeId)} onChange={() => toggleViaje(v.viajeId)} className="accent-primary" /></td>
                          <td className="p-1.5">{v.procedencia ?? "—"}</td>
                          <td className="p-1.5">{v.destino ?? "—"}</td>
                          <td className="p-1.5 text-right">{v.kilos?.toLocaleString("es-AR") ?? "—"}</td>
                          <td className="p-1.5 text-right">{formatearMoneda(v.subtotal)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {viajesSeleccionados.size > 0 && (
                  <p className="text-xs text-muted-foreground">{viajesSeleccionados.size} viaje{viajesSeleccionados.size > 1 ? "s" : ""} seleccionado{viajesSeleccionados.size > 1 ? "s" : ""}</p>
                )}
              </div>
            )}

            {preview && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                {preview.conComision ? (
                  <>
                    <div className="flex justify-between"><span>Subtotal viajes</span><span>{formatearMoneda(preview.bruto)}</span></div>
                    <div className="flex justify-between text-muted-foreground"><span>Comisión ({liq.comisionPct}%)</span><span>- {formatearMoneda(preview.comisionMonto)}</span></div>
                    <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(preview.neto)}</span></div>
                  </>
                ) : (
                  <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(preview.neto)}</span></div>
                )}
                <div className="flex justify-between"><span>IVA ({ivaPct}%)</span><span>+ {formatearMoneda(preview.iva)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatearMoneda(preview.total)}</span></div>
              </div>
            )}

            {error && <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>}

            <div className="flex justify-end gap-2">
              <button onClick={onClose} disabled={generando} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
              <button onClick={emitir} disabled={generando || !preview} className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
                {generando ? "Emitiendo..." : `Emitir ${labelTipo}`}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarLPClient({ rol, fleteros, fleteroIdPropio }: ConsultarLPClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [filtroFleteroId, setFiltroFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [filtroNroLP, setFiltroNroLP] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>(primerDiaMesActual())
  const [filtroHasta, setFiltroHasta] = useState<string>(hoyLocalYmd())
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [faltantesPorLiq, setFaltantesPorLiq] = useState<Record<string, Array<{ viajeId: string; montoTotal: number; descripcion: string | null; empresa: string }>>>({})
  const [loading, setLoading] = useState(false)
  const [autorizandoArcaId, setAutorizandoArcaId] = useState<string | null>(null)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [liquidacionNota, setLiquidacionNota] = useState<Liquidacion | null>(null)

  const fleteroSeleccionado = fleteros.find((f) => f.id === filtroFleteroId)
  const mostrarColumnaFletero = !filtroFleteroId

  const handleBuscar = useCallback(async () => {
    const idAUsar = filtroFleteroId || fleteroIdPropio
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (idAUsar) params.set("fleteroId", idAUsar)
      const res = await fetch(`/api/liquidaciones?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLiquidaciones(data.liquidaciones ?? [])
        setFaltantesPorLiq(data.faltantesPorLiq ?? {})
      }
    } finally {
      setLoading(false)
    }
  }, [filtroFleteroId, fleteroIdPropio])

  useEffect(() => {
    void handleBuscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reintentarArca(liqId: string) {
    setAutorizandoArcaId(liqId)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/liquidaciones/${liqId}/autorizar-arca`, { method: "POST", signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) handleBuscar()
    } catch { clearTimeout(timeoutId) }
    finally { setAutorizandoArcaId(null) }
  }

  // Filtrado client-side (la API ya filtra por fletero)
  const liquidacionesFiltradas = liquidaciones.filter((liq) => {
    if (filtroDesde && new Date(liq.grabadaEn) < new Date(filtroDesde)) return false
    if (filtroHasta) {
      const hasta = new Date(filtroHasta)
      hasta.setHours(23, 59, 59)
      if (new Date(liq.grabadaEn) > hasta) return false
    }
    if (filtroNroLP && liq.nroComprobante) {
      const nroFormateado = formatNroLP(liq.ptoVenta, liq.nroComprobante)
      if (!nroFormateado.includes(filtroNroLP)) return false
    } else if (filtroNroLP && !liq.nroComprobante) {
      return false
    }
    return true
  })

  const fleterosItems = [
    { id: "", label: "Todos los fleteros" },
    ...fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: formatCuit(f.cuit) })),
  ]

  // Columnas: Fecha, Nº Comprobante, [Fletero], Total, Saldo, OP, NC/ND
  const colCount = mostrarColumnaFletero ? 7 : 6

  return (
    <div className="space-y-5">
      <h1 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Consultar Líquidos Producto</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            {esInterno && (
              <div className="lg:col-span-2">
                <Label>Fletero</Label>
                <SearchCombobox
                  items={fleterosItems}
                  value={filtroFleteroId}
                  onChange={(v) => { setFiltroFleteroId(v); }}
                  placeholder="Todos los fleteros"
                />
              </div>
            )}
            <div>
              <Label>Nº Comprobante</Label>
              <Input
                value={filtroNroLP}
                onChange={(e) => setFiltroNroLP(e.target.value)}
                placeholder="0001-00000001"
              />
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            </div>
            <div className="flex items-end">
              <Button onClick={() => void handleBuscar()} disabled={loading} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encabezado contextual */}
      {fleteroSeleccionado && (
        <p className="text-[15px] font-medium text-foreground">
          Historial de Líquidos Producto emitidos a {fleteroSeleccionado.razonSocial} — {formatCuit(fleteroSeleccionado.cuit)}
        </p>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Nº Comprobante</th>
                  {mostrarColumnaFletero && <th className="px-3 py-3 text-left">Fletero</th>}
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right">Saldo</th>
                  <th className="px-3 py-3 text-left">OP</th>
                  <th className="px-3 py-3 text-center">NC/ND</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Buscando...</td>
                  </tr>
                ) : liquidacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Sin resultados</td>
                  </tr>
                ) : (
                  liquidacionesFiltradas.map((liq) => {
                    const nroLP = formatNroLP(liq.ptoVenta, liq.nroComprobante)
                    const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago
                    const saldo = calcularSaldoLP(liq)
                    return (
                      <tr key={liq.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setLiquidacionDetalle(liq)}>
                        <td className="px-3 py-2">{formatearFecha(liq.grabadaEn)}</td>
                        <td className="px-3 py-2 font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                          {liq.arcaEstado === "AUTORIZADA" && liq.nroComprobante ? (
                            <Link
                              href={`/comprobantes/visor?tipo=liquidacion&id=${liq.id}&titulo=${encodeURIComponent(
                                `LP ${nroLP} — ${liq.fletero.razonSocial}`
                              )}`}
                              className="text-primary hover:underline"
                            >
                              {nroLP}
                            </Link>
                          ) : (
                            <span>
                              {nroLP}
                              {(liq.arcaEstado === "PENDIENTE" || liq.arcaEstado === "RECHAZADA") && (
                                <span className="inline-flex items-center gap-1 ml-2">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${liq.arcaEstado === "PENDIENTE" ? "bg-warning-soft text-warning" : "bg-error-soft text-error"}`}>
                                    {liq.arcaEstado === "PENDIENTE" ? "Pend. ARCA" : "Rechazada"}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); reintentarArca(liq.id) }}
                                    disabled={autorizandoArcaId === liq.id}
                                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning text-warning-foreground hover:bg-warning/80 disabled:opacity-50"
                                    title="Reintentar autorización ARCA"
                                  >
                                    {autorizandoArcaId === liq.id ? "..." : "↻"}
                                  </button>
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        {mostrarColumnaFletero && <td className="px-3 py-2 max-w-[160px] truncate">{liq.fletero.razonSocial}</td>}
                        <td className="px-3 py-2 text-right font-semibold">{formatearMoneda(liq.total)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {saldo > 0 ? formatearMoneda(saldo) : <span className="text-success">Saldada</span>}
                        </td>
                        <td className="px-3 py-2 font-mono text-sm">
                          {op ? `${op.nro}-${op.anio}` : ""}
                        </td>
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          {faltantesPorLiq[liq.id] && (
                            <span className="inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium bg-warning-soft text-warning mr-1" title={faltantesPorLiq[liq.id].map((f) => `${f.empresa}: ${f.descripcion ?? "Faltante"}`).join("; ")}>
                              Faltante
                            </span>
                          )}
                          {esInterno && liq.arcaEstado === "AUTORIZADA" && (
                            <button type="button" onClick={() => setLiquidacionNota(liq)} className="text-xs text-primary hover:text-primary/80 hover:underline font-medium">
                              Emitir
                            </button>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {liquidacionesFiltradas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={mostrarColumnaFletero ? 3 : 2} className="px-3 py-3 text-right text-sm">Totales ({liquidacionesFiltradas.length})</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(liquidacionesFiltradas.map(l => l.total)))}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{formatearMoneda(sumarImportes(liquidacionesFiltradas.map(l => calcularSaldoLP(l))))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLP liq={liquidacionDetalle} onCerrar={() => setLiquidacionDetalle(null)} />
      )}

      {/* Modal emitir NC/ND */}
      {liquidacionNota && (
        <ModalEmitirNotaLP
          liq={liquidacionNota}
          onClose={() => setLiquidacionNota(null)}
          onEmitida={() => { setLiquidacionNota(null); handleBuscar() }}
          faltantes={faltantesPorLiq[liquidacionNota.id]}
        />
      )}
    </div>
  )
}
