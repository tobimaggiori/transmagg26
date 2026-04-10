"use client"

/**
 * Propósito: Componente de consulta de Líquidos Producto.
 * Filtros por fletero, estado y período → tabla con columnas exactas.
 * Modal de detalle de viajes solo lectura.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularNetoMasIva, sumarImportes } from "@/lib/money"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Rol } from "@/types"
import { hoyLocalYmd } from "@/lib/date-local"

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

function resolverEstadoLP(liq: Liquidacion): "EMITIDO" | "PAGADO" {
  const tienePagoConfirmado = liq.pagos.some((p) => !p.anulado && p.ordenPago)
  return tienePagoConfirmado ? "PAGADO" : "EMITIDO"
}

// ─── Combobox Fletero ────────────────────────────────────────────────────────

function ComboboxFletero({ fleteros, value, onChange }: { fleteros: Fletero[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  const filtrados = useMemo(() => {
    if (!busqueda) return fleteros
    const q = busqueda.toLowerCase()
    const qDigits = busqueda.replace(/\D/g, "")
    return fleteros.filter(
      (f) => f.razonSocial.toLowerCase().includes(q) || (qDigits && f.cuit.replace(/\D/g, "").includes(qDigits))
    )
  }, [fleteros, busqueda])

  const seleccionado = fleteros.find((f) => f.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-2 text-sm"
      >
        <span className="truncate">{seleccionado ? seleccionado.razonSocial : "Todos los fleteros"}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por razón social o CUIT..." value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandEmpty>No se encontraron fleteros.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange(""); setOpen(false); setBusqueda("") }}>
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Todos los fleteros
              </CommandItem>
              {filtrados.map((f) => (
                <CommandItem key={f.id} value={f.id} onSelect={() => { onChange(f.id); setOpen(false); setBusqueda("") }}>
                  <Check className={cn("mr-2 h-4 w-4", value === f.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="font-medium">{f.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">CUIT: {formatCuit(f.cuit)}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Modal detalle LP ────────────────────────────────────────────────────────

function ModalDetalleLP({
  liq, onCerrar, onAbrirPDF,
}: {
  liq: Liquidacion; onCerrar: () => void
  onAbrirPDF: (params: { s3Key: string; titulo: string }) => void
}) {
  const nroLP = liq.nroComprobante
    ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
    : "Sin nro"

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
                    <td className="px-3 py-2">
                      {v.viaje?.nroCartaPorte ? (
                        v.viaje.cartaPorteS3Key ? (
                          <button type="button" onClick={() => onAbrirPDF({ s3Key: v.viaje!.cartaPorteS3Key!, titulo: `Carta de Porte — ${v.viaje!.nroCartaPorte}` })} className="text-primary hover:underline font-medium">
                            {v.viaje.nroCartaPorte}
                          </button>
                        ) : v.viaje.nroCartaPorte
                      ) : <span className="text-muted-foreground">N/A</span>}
                    </td>
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

// ─── Tabla ────────────────────────────────────────────────────────────────────

function TablaLiquidaciones({
  liquidaciones, fleteros, mostrarFletero, onAbrirPDF, onVerDetalle, onReintentarArca, autorizandoArcaId, onEmitirNota,
}: {
  liquidaciones: Liquidacion[]; fleteros: Fletero[]; mostrarFletero: boolean
  onAbrirPDF: (params: { url: string; titulo: string } | { fetchUrl: string; titulo: string }) => void
  onVerDetalle: (liq: Liquidacion) => void
  onReintentarArca?: (id: string) => void
  autorizandoArcaId?: string | null
  onEmitirNota?: (liq: Liquidacion) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="uppercase text-xs font-semibold">
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Nro</th>
            {mostrarFletero && <th className="px-3 py-2 text-left">Fletero</th>}
            <th className="px-3 py-2 text-left">OP Nro</th>
            {onEmitirNota && <th className="px-3 py-2 text-center">NC/ND</th>}
            <th className="px-3 py-2 text-center">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {liquidaciones.map((liq) => {
            const nroLP = liq.nroComprobante
              ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
              : null
            const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago
            const fletero = fleteros.find((f) => f.id === liq.fleteroId)
            const cuit = liq.fletero.cuit ?? fletero?.cuit ?? ""
            return (
              <tr key={liq.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(liq.grabadaEn))}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {nroLP ? (
                    <button type="button" onClick={() => onAbrirPDF({ fetchUrl: `/api/liquidaciones/${liq.id}/pdf`, titulo: `LP ${nroLP} — ${liq.fletero.razonSocial}` })} className="text-primary hover:underline font-medium">
                      {nroLP}
                    </button>
                  ) : <span className="text-muted-foreground">Sin nro</span>}
                </td>
                {mostrarFletero && (
                  <td className="px-3 py-2">
                    <p className="font-medium">{liq.fletero.razonSocial}</p>
                    {cuit && <p className="text-xs text-muted-foreground">{formatCuit(cuit)}</p>}
                  </td>
                )}
                <td className="px-3 py-2 font-mono text-xs">
                  {op ? (
                    <button type="button" onClick={() => onAbrirPDF({ url: `/api/ordenes-pago/${op.id}/pdf`, titulo: `OP Nro ${op.nro}-${op.anio}` })} className="text-primary hover:underline font-medium">
                      {op.nro}-{op.anio}
                    </button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </td>
                {onEmitirNota && (
                  <td className="px-3 py-2 text-center">
                    {liq.arcaEstado === "AUTORIZADA" && (
                      <button type="button" onClick={() => onEmitirNota(liq)} className="h-7 px-3 rounded border text-xs font-medium hover:bg-accent text-primary">Emitir</button>
                    )}
                  </td>
                )}
                <td className="px-3 py-2 text-center">
                  <button type="button" onClick={() => onVerDetalle(liq)} className="h-7 px-3 rounded border text-xs font-medium hover:bg-accent">Ver</button>
                  {onReintentarArca && (liq.arcaEstado === "PENDIENTE" || liq.arcaEstado === "RECHAZADA") && (
                    <span className="inline-flex items-center gap-1 ml-1">
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${liq.arcaEstado === "PENDIENTE" ? "bg-amber-100 text-amber-700" : "bg-red-100 text-red-700"}`}>
                        {liq.arcaEstado === "PENDIENTE" ? "Pendiente ARCA" : "Rechazada"}
                      </span>
                      <button
                        onClick={(e) => { e.stopPropagation(); onReintentarArca(liq.id) }}
                        disabled={autorizandoArcaId === liq.id}
                        className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-amber-500 text-white hover:bg-amber-600 disabled:opacity-50"
                        title="Reintentar autorización ARCA"
                      >
                        {autorizandoArcaId === liq.id ? "..." : "↻"}
                      </button>
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Modal emitir NC/ND sobre LP ─────────────────────────────────────────────

type ItemNota = { concepto: string; subtotal: string }

function ModalEmitirNotaLP({
  liq, onClose, onEmitida,
}: {
  liq: Liquidacion; onClose: () => void; onEmitida: () => void
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
    const neto = sumarImportes(subtotales)
    const result = calcularNetoMasIva(neto, ivaPct)

    return { neto: result.neto, iva: result.iva, total: result.total }
  }, [items, ivaPct])

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

  const nroLP = liq.nroComprobante
    ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
    : "Sin nro"
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
            {/* Tipo de nota */}
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

            {/* Incluir comisión */}
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={incluirComision}
                onChange={(e) => setIncluirComision(e.target.checked)}
                className="accent-primary"
              />
              <span>Incluir comisión en el ajuste</span>
              <span className="text-xs text-muted-foreground">
                ({incluirComision ? `se desglosa con ${liq.comisionPct}% de comisión` : "100% del ajuste va al fletero"})
              </span>
            </label>

            {/* Fecha */}
            <div>
              <label className="text-sm font-medium">Fecha de emisión</label>
              <input
                type="date" value={fechaEmision} onChange={(e) => setFechaEmision(e.target.value)}
                max={hoyLocalYmd()} min={hoyLocalYmd(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))}
                className="h-9 w-48 rounded-md border bg-background px-2 text-sm ml-2"
              />
            </div>

            {/* Items */}
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

            {/* Viajes a liberar */}
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

            {/* Preview */}
            {preview && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(preview.neto)}</span></div>
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

const hoy = new Date()
const hace30 = new Date(hoy)
hace30.setDate(hace30.getDate() - 30)

export function ConsultarLPClient({ rol, fleteros, fleteroIdPropio }: ConsultarLPClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [liquidacionNota, setLiquidacionNota] = useState<Liquidacion | null>(null)
  const [autorizandoArcaId, setAutorizandoArcaId] = useState<string | null>(null)

  // Filtros con defaults
  const [filtroEstado, setFiltroEstado] = useState<string>("EMITIDO")
  const [filtroDesde, setFiltroDesde] = useState<string>(hoyLocalYmd(hace30))
  const [filtroHasta, setFiltroHasta] = useState<string>(hoyLocalYmd(hoy))
  const [filtroNroLP, setFiltroNroLP] = useState<string>("")

  const fleteroSeleccionado = fleteros.find((f) => f.id === fleteroId)
  const mostrarFletero = !fleteroId

  const cargarDatos = useCallback(async () => {
    const idAUsar = fleteroId || fleteroIdPropio
    setCargando(true)
    try {
      const params = new URLSearchParams()
      if (idAUsar) params.set("fleteroId", idAUsar)
      const res = await fetch(`/api/liquidaciones?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLiquidaciones(data.liquidaciones ?? [])
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, fleteroIdPropio])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  async function reintentarArcaLP(liqId: string) {
    setAutorizandoArcaId(liqId)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/liquidaciones/${liqId}/autorizar-arca`, { method: "POST", signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) cargarDatos()
    } catch { clearTimeout(timeoutId) }
    finally { setAutorizandoArcaId(null) }
  }

  const liquidacionesFiltradas = liquidaciones.filter((liq) => {
    if (filtroEstado) {
      const estadoSem = resolverEstadoLP(liq)
      if (estadoSem !== filtroEstado) return false
    }
    if (filtroDesde) {
      const fecha = new Date(liq.grabadaEn)
      if (fecha < new Date(filtroDesde)) return false
    }
    if (filtroHasta) {
      const fecha = new Date(liq.grabadaEn)
      const hasta = new Date(filtroHasta)
      hasta.setHours(23, 59, 59)
      if (fecha > hasta) return false
    }
    if (filtroNroLP && liq.nroComprobante) {
      const nroFormateado = `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
      if (!nroFormateado.includes(filtroNroLP)) return false
    } else if (filtroNroLP && !liq.nroComprobante) {
      return false
    }
    return true
  })

  const labelCls = "text-xs font-medium text-gray-800"

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultar Liq. Prod.</h2>
        <p className="text-muted-foreground">
          {rol === "FLETERO" ? "Tus liquidaciones de viajes" : "Historial de Líquidos Producto emitidos"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
        {esInterno && (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className={labelCls}>Fletero</label>
            <ComboboxFletero fleteros={fleteros} value={fleteroId} onChange={setFleteroId} />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className={labelCls}>Nro LP</label>
          <input
            type="text"
            value={filtroNroLP}
            onChange={(e) => setFiltroNroLP(e.target.value)}
            placeholder="Ej: 0001-00000010"
            className="h-9 rounded-md border bg-background px-2 text-sm text-gray-900"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[140px]">
          <label className={labelCls}>Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm text-gray-900"
          >
            <option value="">Todos</option>
            <option value="EMITIDO">Emitido</option>
            <option value="PAGADO">Pagado</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Desde</label>
          <input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm text-gray-900" />
        </div>
        <div className="flex flex-col gap-1">
          <label className={labelCls}>Hasta</label>
          <input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} className="h-9 rounded-md border bg-background px-2 text-sm text-gray-900" />
        </div>
        {(filtroEstado || filtroDesde || filtroHasta || filtroNroLP) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroEstado(""); setFiltroDesde(""); setFiltroHasta(""); setFiltroNroLP("") }}
              className="h-9 px-3 rounded-md border text-sm font-medium hover:bg-accent text-muted-foreground"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Encabezado contextual */}
      {fleteroSeleccionado && (
        <p className="text-sm font-medium text-gray-700">
          Historial de Líquidos Productos emitidos a {fleteroSeleccionado.razonSocial} (CUIT: {formatCuit(fleteroSeleccionado.cuit)})
        </p>
      )}

      {/* Tabla */}
      {cargando ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : liquidacionesFiltradas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Sin liquidaciones para los filtros seleccionados.</div>
      ) : (
        <TablaLiquidaciones
          liquidaciones={liquidacionesFiltradas}
          fleteros={fleteros}
          mostrarFletero={mostrarFletero}
          onAbrirPDF={(params) => abrirPDF(params)}
          onVerDetalle={(liq) => setLiquidacionDetalle(liq)}
          onReintentarArca={reintentarArcaLP}
          autorizandoArcaId={autorizandoArcaId}
          onEmitirNota={esInterno ? (liq) => setLiquidacionNota(liq) : undefined}
        />
      )}

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLP liq={liquidacionDetalle} onCerrar={() => setLiquidacionDetalle(null)} onAbrirPDF={(params) => abrirPDF(params)} />
      )}

      {/* Modal emitir NC/ND */}
      {liquidacionNota && (
        <ModalEmitirNotaLP
          liq={liquidacionNota}
          onClose={() => setLiquidacionNota(null)}
          onEmitida={() => { setLiquidacionNota(null); cargarDatos() }}
        />
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
