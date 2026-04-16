"use client"

/**
 * Componente cliente para la página de detalle NC/ND de una liquidacion.
 * Panel unico: emitidas por Trans-Magg.
 * Análogo a notas-factura-client.tsx.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { labelSubtipoNotaCD, esEmitida } from "@/lib/nota-cd-utils"
import { sumarImportes, calcularNetoMasIva } from "@/lib/money"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { hoyLocalYmd } from "@/lib/date-local"

// ─── Tipos ──────────────────────────────────────────────────────────────────────

type NotaCD = {
  id: string
  tipo: string
  subtipo: string | null
  montoNeto: number
  montoIva: number
  montoTotal: number
  descripcion: string | null
  estado: string
  arcaEstado: string | null
  nroComprobante: number | null
  ptoVenta: number
  nroComprobanteExterno: string | null
  fechaComprobanteExterno: string | null
  creadoEn: string
  pdfS3Key: string | null
  incluirComision: boolean
  operador: { nombre: string; apellido: string }
  items: Array<{ concepto: string; subtotal: number }>
  viajesAfectados: Array<{ viajeId: string; kilosOriginal: number | null; subtotalOriginal: number }>
}

type LiquidacionData = {
  id: string
  nroComprobante: number | null
  ptoVenta: number | null
  comisionPct: number
  ivaPct: number
  subtotalBruto: number
  comisionMonto: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  arcaEstado: string
  grabadaEn: string
  fletero: { id: string; razonSocial: string; cuit: string }
}

// ─── Helpers ────────────────────────────────────────────────────────────────────

function formatNroLP(ptoVenta: number | null, nro: number | null): string {
  if (!nro) return "—"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(nro)}`
}

function formatNroNota(ptoVenta: number | null, nro: string | number | null): string {
  if (!nro) return "—"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function badgeColorArca(estado: string | null): string {
  if (estado === "AUTORIZADA") return "bg-green-100 text-green-800"
  if (estado === "PENDIENTE") return "bg-yellow-100 text-yellow-800"
  if (estado === "RECHAZADA") return "bg-red-100 text-red-800"
  return "bg-gray-100 text-gray-600"
}

// ─── Modal emitir NC/ND sobre LP ─────────────────────────────────────────────

type ItemNota = { concepto: string; subtotal: string }

function ModalEmitirNotaLP({
  liq, onClose, onEmitida,
}: {
  liq: LiquidacionData; onClose: () => void; onEmitida: () => void
}) {
  const [tipoNota, setTipoNota] = useState<"NC" | "ND">("NC")
  const [incluirComision, setIncluirComision] = useState(true)
  const [fechaEmision, setFechaEmision] = useState(hoyLocalYmd())
  const [items, setItems] = useState<ItemNota[]>([{ concepto: "", subtotal: "" }])
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

        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
          <span className="text-muted-foreground">Fletero</span>
          <span className="font-medium">{liq.fletero.razonSocial}</span>
          <span className="text-muted-foreground">Total LP</span>
          <span className="font-medium">{formatearMoneda(liq.total)}</span>
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

// ─── Componente ─────────────────────────────────────────────────────────────────

export function NotasLPClient({ liquidacionId }: { liquidacionId: string }) {
  const [liquidacion, setLiquidacion] = useState<LiquidacionData | null>(null)
  const [notas, setNotas] = useState<NotaCD[]>([])
  const [loading, setLoading] = useState(true)
  const [modalEmitir, setModalEmitir] = useState<boolean>(false)

  const cargar = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/liquidaciones/${liquidacionId}/notas`)
      if (res.ok) {
        const data = await res.json()
        setLiquidacion(data.liquidacion)
        setNotas(data.notas)
      }
    } finally {
      setLoading(false)
    }
  }, [liquidacionId])

  useEffect(() => { void cargar() }, [cargar])

  if (loading) {
    return <div className="p-8 text-center text-muted-foreground">Cargando...</div>
  }

  if (!liquidacion) {
    return <div className="p-8 text-center text-muted-foreground">Liquidacion no encontrada</div>
  }

  const notasEmitidas = notas.filter((n) => esEmitida(n.tipo))

  const puedeEmitir = liquidacion.arcaEstado === "AUTORIZADA" &&
    ["EMITIDA", "PAGADA"].includes(liquidacion.estado)

  return (
    <div className="space-y-5">
      {/* Volver */}
      <Link href="/fleteros/liquidaciones" className="text-sm text-primary hover:underline">
        &larr; Volver a liquidaciones
      </Link>

      {/* Header liquidacion */}
      <div>
        <h1 className="text-2xl font-bold tracking-tight">
          NC/ND — LP {formatNroLP(liquidacion.ptoVenta, liquidacion.nroComprobante)}
        </h1>
        <div className="flex flex-wrap gap-x-6 gap-y-1 mt-2 text-sm text-muted-foreground">
          <span><strong>Fletero:</strong> {liquidacion.fletero.razonSocial} — {formatearCuit(liquidacion.fletero.cuit)}</span>
          <span><strong>Total:</strong> {formatearMoneda(liquidacion.total)}</span>
          <span><strong>Fecha:</strong> {formatearFecha(liquidacion.grabadaEn)}</span>
          <span><strong>Estado:</strong> {liquidacion.estado}</span>
        </div>
      </div>

      {/* Panel NC/ND emitidas */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <h2 className="text-base font-semibold">NC/ND emitidas por Trans-Magg</h2>

          {notasEmitidas.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">Sin NC/ND emitidas</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-2 py-2 text-left">Tipo</th>
                    <th className="px-2 py-2 text-left">Nro</th>
                    <th className="px-2 py-2 text-left">Fecha</th>
                    <th className="px-2 py-2 text-right">Total</th>
                    <th className="px-2 py-2 text-center">ARCA</th>
                  </tr>
                </thead>
                <tbody>
                  {notasEmitidas.map((n) => (
                    <tr key={n.id} className="border-b hover:bg-muted/30">
                      <td className="px-2 py-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${n.tipo === "NC_EMITIDA" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                          {n.tipo === "NC_EMITIDA" ? "NC" : "ND"}
                        </span>
                        {n.subtipo && <span className="ml-1 text-muted-foreground">{labelSubtipoNotaCD(n.subtipo)}</span>}
                      </td>
                      <td className="px-2 py-1.5 font-mono">
                        {n.arcaEstado === "AUTORIZADA" ? (
                          <Link
                            href={`/comprobantes/visor?tipo=nota-cd&id=${n.id}&titulo=${encodeURIComponent(
                              `${n.tipo === "NC_EMITIDA" ? "NC" : "ND"} ${formatNroNota(n.ptoVenta, n.nroComprobante)}`
                            )}`}
                            className="text-primary hover:underline"
                          >
                            {formatNroNota(n.ptoVenta, n.nroComprobante)}
                          </Link>
                        ) : (
                          formatNroNota(n.ptoVenta, n.nroComprobante)
                        )}
                      </td>
                      <td className="px-2 py-1.5">{formatearFecha(n.creadoEn)}</td>
                      <td className="px-2 py-1.5 text-right font-medium">{formatearMoneda(n.montoTotal)}</td>
                      <td className="px-2 py-1.5 text-center">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${badgeColorArca(n.arcaEstado)}`}>
                          {n.arcaEstado ?? "—"}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {puedeEmitir && (
            <div className="flex gap-2 pt-2">
              <Button size="sm" variant="outline" onClick={() => setModalEmitir(true)}>Emitir NC/ND</Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal emisión NC/ND */}
      {modalEmitir && liquidacion && (
        <ModalEmitirNotaLP
          liq={liquidacion}
          onClose={() => setModalEmitir(false)}
          onEmitida={() => { setModalEmitir(false); void cargar() }}
        />
      )}
    </div>
  )
}
