"use client"

import { useState } from "react"
import { formatearMoneda } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { ProvinciaArgentina } from "@/lib/provincias"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { labelCondicionIva } from "@/lib/liquidacion-utils"
import type { FleteroInfo, ViajeParaLiquidar } from "./types"
import { hoyLocalYmd } from "@/lib/date-local"

export function ModalPreviewLiquidacion({
  fletero,
  viajesIniciales,
  comisionPctInicial,
  ivaPctInicial,
  generando,
  error,
  onCancelar,
  onConfirmar,
  fechaEmisionDefault,
}: {
  fletero: FleteroInfo
  viajesIniciales: ViajeParaLiquidar[]
  comisionPctInicial: number
  ivaPctInicial: number
  generando: boolean
  error: string | null
  onCancelar: () => void
  onConfirmar: (viajes: ViajeParaLiquidar[], comisionPct: number, ivaPct: number, metodoPago: string, fechaEmision: string) => void
  fechaEmisionDefault?: string
}) {
  const [viajes, setViajes] = useState<ViajeParaLiquidar[]>(viajesIniciales)
  const [comisionPct, setComisionPct] = useState(comisionPctInicial)
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)
  const [metodoPago, setMetodoPago] = useState("Cheque")
  const [fechaEmision, setFechaEmision] = useState(() => fechaEmisionDefault ?? hoyLocalYmd())

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
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h2 className="text-lg font-semibold">Liquidar {viajes.length} viaje(s) seleccionado(s)</h2>
        <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>

      {/* Tabla editable tipo excel */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Cabecera: datos del fletero */}
        <div className="mb-4 rounded-md border bg-muted/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Liquidación a
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Razón Social: </span>
              <span className="font-medium">{fletero.razonSocial}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CUIT: </span>
              <span className="font-medium">{fletero.cuit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Condición IVA: </span>
              <span className="font-medium">{labelCondicionIva(fletero.condicionIva)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dirección: </span>
              <span className="font-medium">{fletero.direccion ?? "—"}</span>
            </div>
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
                    <td className="px-1 py-1">
                      <input
                        type="date"
                        value={v.fechaEdit ?? v.fechaViaje.slice(0, 10)}
                        onChange={(e) => actualizarCelda(v.id, "fechaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.remitoEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "remitoEdit", e.target.value)}
                        className="h-7 w-24 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      {(v.tieneCupoEdit ?? v.tieneCupo) ? (
                        <input
                          type="text"
                          value={v.cupoEdit ?? ""}
                          onChange={(e) => actualizarCelda(v.id, "cupoEdit", e.target.value)}
                          className="h-7 w-20 rounded border bg-background px-1 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.mercaderiaEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "mercaderiaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.procedenciaEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "procedenciaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={v.origenEdit ?? v.provinciaOrigen ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "origenEdit", e.target.value as ProvinciaArgentina)}
                        className="h-7 w-36 rounded border bg-background px-1 text-xs"
                      >
                        <option value="">— sin provincia —</option>
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.destinoEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "destinoEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={v.provinciaDestinoEdit ?? v.provinciaDestino ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "provinciaDestinoEdit", e.target.value as ProvinciaArgentina)}
                        className="h-7 w-36 rounded border bg-background px-1 text-xs"
                      >
                        <option value="">— sin provincia —</option>
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={v.kilosEdit ?? v.kilos ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "kilosEdit", parseFloat(e.target.value) || undefined)}
                        min="0"
                        step="1"
                        className="h-7 w-24 text-right rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={v.tarifaEdit ?? v.tarifaFletero}
                        onChange={(e) => actualizarCelda(v.id, "tarifaEdit", parseFloat(e.target.value) || v.tarifaFletero)}
                        min="0"
                        step="0.01"
                        className="h-7 w-28 text-right rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1 text-right text-muted-foreground text-xs">
                      {ton?.toLocaleString("es-AR") ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-right font-medium text-xs">
                      {importe != null ? formatearMoneda(importe) : "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 shrink-0 bg-background">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Comisión %</label>
              <input
                type="number"
                value={comisionPct}
                onChange={(e) => setComisionPct(parseFloat(e.target.value) || 0)}
                min="0" max="100" step="0.01"
                className="h-8 w-24 rounded border bg-background px-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
              <input
                type="number"
                value={ivaPct}
                onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                min="0" max="100" step="0.01"
                className="h-8 w-24 rounded border bg-background px-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Método de Pago</label>
              <select
                value={metodoPago}
                onChange={(e) => setMetodoPago(e.target.value)}
                className="h-8 rounded border bg-background px-2 text-sm"
              >
                <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                <option value="Cuenta Corriente">Cuenta Corriente</option>
                <option value="Cheque">Cheque</option>
                <option value="Contado">Contado</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Fecha de emisión</label>
              <input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                max={hoyLocalYmd()}
                min={hoyLocalYmd(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))}
                className="h-8 rounded border bg-background px-2 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 text-sm space-y-0.5">
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Bruto ({viajes.length} viajes):</span>
              <span className="w-36 text-right">{formatearMoneda(preview.subtotalBruto)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Comisión ({comisionPct}%):</span>
              <span className="w-36 text-right">- {formatearMoneda(preview.comisionMonto)}</span>
            </div>
            <div className="flex justify-end gap-8 font-medium">
              <span>Neto:</span>
              <span className="w-36 text-right">{formatearMoneda(preview.neto)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">IVA ({ivaPct}%):</span>
              <span className="w-36 text-right">+ {formatearMoneda(preview.ivaMonto)}</span>
            </div>
            <div className="flex justify-end gap-8 font-bold text-base border-t pt-1">
              <span>TOTAL FINAL:</span>
              <span className="w-36 text-right">{formatearMoneda(preview.totalFinal)}</span>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={onCancelar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => onConfirmar(viajes, comisionPct, ivaPct, metodoPago, fechaEmision)}
              disabled={generando}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {generando ? "Generando..." : "Confirmar y generar liquidación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
