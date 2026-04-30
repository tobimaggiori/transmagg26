"use client"

/**
 * Modal para emitir NC/ND sobre una factura a empresa.
 * Extraído de consultar-facturas-client.tsx para reutilización
 * en la página de detalle NC/ND.
 */

import { useState, useEffect, useMemo } from "react"
import { formatearMoneda } from "@/lib/utils"
import { sumarImportes, restarImportes, calcularNetoMasIva } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { hoyLocalYmd } from "@/lib/date-local"

// ─── Tipos ─────────────────────────────────────────────────────────────────────

export type FacturaParaModal = {
  id: string
  tipoCbte: number
  modalidadMiPymes?: string | null
  ptoVenta: number | null
  nroComprobante: string | null
  ivaPct: number
  total: number
  empresa: { razonSocial: string }
  totalPagado?: number
  notasCreditoDebito?: Array<{ tipo: string; montoTotal: number }>
}

function formatNroComprobante(ptoVenta: number | null, nroComprobante: string | number | null): string {
  if (!nroComprobante) return "—"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const nro = String(nroComprobante).padStart(8, "0")
  return `${pv}-${nro}`
}

function labelTipoCbte(tipoCbte: number, modalidad?: string | null): string {
  if (tipoCbte === 1) return "Fact. A"
  if (tipoCbte === 6) return "Fact. B"
  if (tipoCbte === 201) return modalidad ? `MiPyme ${modalidad}` : "MiPyme"
  if (tipoCbte === 3) return "NC A"
  if (tipoCbte === 8) return "NC B"
  if (tipoCbte === 2) return "ND A"
  if (tipoCbte === 7) return "ND B"
  return `Cbte ${tipoCbte}`
}

// ─── Componente ────────────────────────────────────────────────────────────────

type ItemNota = { concepto: string; subtotal: string }

export function ModalEmitirNotaEmpresa({
  factura,
  onClose,
  onEmitida,
  tipoForzado,
}: {
  factura: FacturaParaModal
  onClose: () => void
  onEmitida: () => void
  tipoForzado?: "NC" | "ND"
}) {
  const totalPagado = factura.totalPagado ?? 0
  const notasNC = (factura.notasCreditoDebito ?? []).filter((n) => n.tipo === "NC_EMITIDA")
  const notasND = (factura.notasCreditoDebito ?? []).filter((n) => n.tipo === "ND_EMITIDA")
  const ajusteNC = sumarImportes(notasNC.map((n) => n.montoTotal))
  const ajusteND = sumarImportes(notasND.map((n) => n.montoTotal))
  const netoVigente = Math.max(0, restarImportes(sumarImportes([factura.total, ajusteND]), ajusteNC))
  const saldoPendiente = Math.max(0, restarImportes(netoVigente, totalPagado))

  const tipoInicial = tipoForzado ?? (saldoPendiente > 0 ? "NC" : "ND")

  const [tipoNota, setTipoNota] = useState<"NC" | "ND">(tipoInicial)

  // Mensaje de impacto: cómo afecta la NC/ND al saldo de la factura.
  function mensajeImpacto(): string {
    if (tipoNota === "NC") {
      return saldoPendiente > 0
        ? "La NC reducirá el saldo pendiente de cobro de la factura."
        : "La factura está completamente cobrada — la NC generará un saldo a favor de la empresa."
    }
    return saldoPendiente > 0
      ? "La ND aumentará el saldo pendiente de cobro de la factura."
      : "La factura está completamente cobrada — la ND volverá a generar saldo pendiente de cobro."
  }
  const [fechaEmision, setFechaEmision] = useState(hoyLocalYmd())
  const [items, setItems] = useState<ItemNota[]>([{ concepto: "", subtotal: "" }])
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ id?: string; cae?: string; nro?: number; ptoVenta?: number } | null>(null)

  type ViajeFactura = { viajeId: string; procedencia: string; destino: string; kilos: number; subtotal: number }
  const [viajesFactura, setViajesFactura] = useState<ViajeFactura[]>([])
  const [viajesSeleccionados, setViajesSeleccionados] = useState<Set<string>>(new Set())
  const [cargandoViajes, setCargandoViajes] = useState(true)

  useEffect(() => {
    fetch(`/api/facturas/${factura.id}`)
      .then((r) => r.ok ? r.json() : null)
      .then((data) => {
        if (data?.viajes) {
          setViajesFactura(data.viajes.map((v: { viajeId: string; viaje?: { procedencia?: string; destino?: string }; kilos?: number; subtotal?: number }) => ({
            viajeId: v.viajeId,
            procedencia: v.viaje?.procedencia ?? "",
            destino: v.viaje?.destino ?? "",
            kilos: v.kilos ?? 0,
            subtotal: v.subtotal ?? 0,
          })))
        }
      })
      .catch(() => {})
      .finally(() => setCargandoViajes(false))
  }, [factura.id])

  function toggleViaje(viajeId: string) {
    setViajesSeleccionados((prev) => {
      const next = new Set(prev)
      if (next.has(viajeId)) next.delete(viajeId)
      else next.add(viajeId)
      return next
    })
  }

  function toggleTodosViajes() {
    if (viajesSeleccionados.size === viajesFactura.length) {
      setViajesSeleccionados(new Set())
    } else {
      setViajesSeleccionados(new Set(viajesFactura.map((v) => v.viajeId)))
    }
  }

  const preview = useMemo(() => {
    const subtotales = items.map((i) => parseFloat(i.subtotal) || 0).filter((s) => s > 0)
    if (subtotales.length === 0) return null
    const neto = sumarImportes(subtotales)
    const result = calcularNetoMasIva(neto, factura.ivaPct)
    return { neto: result.neto, iva: result.iva, total: result.total }
  }, [items, factura.ivaPct])

  function agregarItem() {
    setItems([...items, { concepto: "", subtotal: "" }])
  }

  function eliminarItem(idx: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function actualizarItem(idx: number, campo: "concepto" | "subtotal", valor: string) {
    const nuevos = [...items]
    nuevos[idx] = { ...nuevos[idx], [campo]: valor }
    setItems(nuevos)
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

      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: factura.id,
          tipoNota,
          fechaEmision,
          items: itemsValidos,
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
        id: data.documento?.id,
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

  const labelTipo = tipoNota === "NC" ? "Nota de Crédito" : "Nota de Débito"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Emitir {labelTipo}</h2>
            <p className="text-sm text-muted-foreground">
              Sobre Factura {labelTipoCbte(factura.tipoCbte, factura.modalidadMiPymes)}{" "}
              {formatNroComprobante(factura.ptoVenta, factura.nroComprobante)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Info factura */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
          <span className="text-muted-foreground">Empresa</span>
          <span className="font-medium">{factura.empresa.razonSocial}</span>
          <span className="text-muted-foreground">Total factura</span>
          <span className="font-medium">{formatearMoneda(factura.total)}</span>
          <span className="text-muted-foreground">Total pagado</span>
          <span>{formatearMoneda(totalPagado)}</span>
          <span className="text-muted-foreground">Saldo pendiente</span>
          <span className="font-semibold">{formatearMoneda(saldoPendiente)}</span>
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
            <div className="flex gap-2 pt-1">
              {exito.id && (
                <a
                  href={`/comprobantes/visor?tipo=nota-cd&id=${exito.id}&titulo=${encodeURIComponent(`${labelTipo} ${exito.ptoVenta && exito.nro ? String(exito.ptoVenta).padStart(4, "0") + "-" + String(exito.nro).padStart(8, "0") : ""}`)}`}
                  className="inline-flex items-center justify-center rounded-lg bg-primary text-primary-foreground px-3 h-8 text-sm font-medium hover:bg-primary/80 transition-colors"
                >
                  Ver PDF
                </a>
              )}
              <Button size="sm" variant="outline" onClick={onEmitida}>Cerrar</Button>
            </div>
          </div>
        ) : (
          <>
            {/* Tipo de nota */}
            {!tipoForzado && (
              <div>
                <Label>Tipo de nota</Label>
                <div className="flex gap-4 mt-1">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipoNota" value="NC" checked={tipoNota === "NC"} onChange={() => setTipoNota("NC")} className="accent-primary" />
                    Nota de Crédito <span className="text-xs text-muted-foreground">(reduce deuda)</span>
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <input type="radio" name="tipoNota" value="ND" checked={tipoNota === "ND"} onChange={() => setTipoNota("ND")} className="accent-primary" />
                    Nota de Débito <span className="text-xs text-muted-foreground">(suma deuda)</span>
                  </label>
                </div>
              </div>
            )}

            {/* Impacto sobre el saldo de la factura */}
            <p className="text-xs text-muted-foreground">{mensajeImpacto()}</p>

            {/* Fecha emisión */}
            <div>
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                max={hoyLocalYmd()}
                min={hoyLocalYmd(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))}
                className="w-48"
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Ítems</Label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Input value={item.concepto} onChange={(e) => actualizarItem(idx, "concepto", e.target.value)} placeholder="Concepto" className="flex-1" />
                  <Input type="number" value={item.subtotal} onChange={(e) => actualizarItem(idx, "subtotal", e.target.value)} placeholder="Subtotal" className="w-36 text-right" min="0.01" step="0.01" />
                  {items.length > 1 && (
                    <button onClick={() => eliminarItem(idx)} className="h-9 px-2 text-red-500 hover:text-red-700 text-lg leading-none" title="Eliminar ítem">&times;</button>
                  )}
                </div>
              ))}
              <button onClick={agregarItem} className="text-xs text-primary hover:underline font-medium">+ Agregar ítem</button>
            </div>

            {/* Viajes a liberar para refacturar */}
            {tipoNota === "NC" && viajesFactura.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label>Liberar viajes para refacturar <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                  <button onClick={toggleTodosViajes} className="text-xs text-primary hover:underline font-medium">
                    {viajesSeleccionados.size === viajesFactura.length ? "Deseleccionar todos" : "Seleccionar todos"}
                  </button>
                </div>
                <div className="rounded-lg border max-h-40 overflow-y-auto">
                  {cargandoViajes ? (
                    <p className="text-xs text-muted-foreground p-3">Cargando viajes...</p>
                  ) : (
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
                        {viajesFactura.map((v) => (
                          <tr key={v.viajeId} className={`cursor-pointer hover:bg-muted/40 ${viajesSeleccionados.has(v.viajeId) ? "bg-primary/5" : ""}`} onClick={() => toggleViaje(v.viajeId)}>
                            <td className="p-1.5 text-center"><input type="checkbox" checked={viajesSeleccionados.has(v.viajeId)} onChange={() => toggleViaje(v.viajeId)} className="accent-primary" /></td>
                            <td className="p-1.5">{v.procedencia}</td>
                            <td className="p-1.5">{v.destino}</td>
                            <td className="p-1.5 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                            <td className="p-1.5 text-right">{formatearMoneda(v.subtotal)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>
                {viajesSeleccionados.size > 0 && (
                  <p className="text-xs text-muted-foreground">
                    {viajesSeleccionados.size} viaje{viajesSeleccionados.size > 1 ? "s" : ""} seleccionado{viajesSeleccionados.size > 1 ? "s" : ""} para liberar
                  </p>
                )}
              </div>
            )}

            {/* Preview */}
            {preview && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between"><span>Neto</span><span>{formatearMoneda(preview.neto)}</span></div>
                <div className="flex justify-between"><span>IVA ({factura.ivaPct}%)</span><span>+ {formatearMoneda(preview.iva)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-1"><span>Total</span><span>{formatearMoneda(preview.total)}</span></div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={generando}>Cancelar</Button>
              <Button onClick={emitir} disabled={generando || !preview}>
                {generando ? "Emitiendo..." : `Emitir ${labelTipo}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
