"use client"

/**
 * Preview del Líquido Producto antes de emitirlo en ARCA.
 *
 * Simula la estética y la estructura del PDF que se generará:
 * - Cabecera del fletero en box celeste (como pdf-liquidacion.ts)
 * - Tabla con las mismas columnas del PDF: Fecha · Producto · Origen · Destino · Kilos · Tarifa · SubTotal
 * - Viajes agrupados por cupo (usa agruparViajesPorCupo, igual que el PDF)
 * - Debajo de cada fila: línea con Cupo / Remito(s) / CTG(s) / CPE(s) cuando aplican
 * - Totales alineados a la derecha
 *
 * Es read-only: los campos del viaje ya no se editan acá — toda edición sucede
 * en la pantalla de selección.
 */

import { useState, useMemo } from "react"
import { formatearMoneda } from "@/lib/utils"
import { calcularLiquidacion, calcularTotalViaje } from "@/lib/viajes"
import { labelCondicionIva } from "@/lib/liquidacion-utils"
import { agruparViajesPorCupo, formatearRemitosCupo } from "@/lib/viaje-cupo-util"
import type { FleteroInfo, ViajeParaLiquidar } from "./types"
import { hoyLocalYmd } from "@/lib/date-local"

function fmtFechaCorta(d: Date | string): string {
  const dt = d instanceof Date ? d : new Date(d)
  const dd = String(dt.getDate()).padStart(2, "0")
  const mm = String(dt.getMonth() + 1).padStart(2, "0")
  const aa = String(dt.getFullYear()).slice(-2)
  return `${dd}/${mm}/${aa}`
}

function fmtKilos(n: number | null): string {
  if (n == null) return "—"
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

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
  const viajes = viajesIniciales
  const [comisionPct, setComisionPct] = useState(comisionPctInicial)
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)
  const [metodoPago, setMetodoPago] = useState("Cheque")
  const [fechaEmision, setFechaEmision] = useState(() => fechaEmisionDefault ?? hoyLocalYmd())

  // Resolver valores efectivos (ediciones hechas en la pantalla de selección)
  // y precomputar el subtotal por viaje (requerido por agruparViajesPorCupo).
  const viajesEfectivos = useMemo(() => viajes.map((v) => {
    const kilos = v.kilosEdit ?? v.kilos ?? 0
    const tarifa = v.tarifaEdit ?? v.tarifaFletero
    return {
      fechaViaje: new Date(v.fechaEdit ?? v.fechaViaje),
      remito: (v.remitoEdit ?? v.remito) || null,
      cupo: (v.cupoEdit ?? v.cupo) || null,
      mercaderia: (v.mercaderiaEdit ?? v.mercaderia) || null,
      procedencia: (v.procedenciaEdit ?? v.procedencia) || null,
      provinciaOrigen: (v.origenEdit ?? v.provinciaOrigen) || null,
      destino: (v.destinoEdit ?? v.destino) || null,
      provinciaDestino: (v.provinciaDestinoEdit ?? v.provinciaDestino) || null,
      kilos: kilos > 0 ? kilos : null,
      tarifa: Number(tarifa),
      subtotal: kilos > 0 ? calcularTotalViaje(kilos, Number(tarifa)) : 0,
      nroCtg: v.nroCtg ?? null,
      cpe: v.cpe ?? null,
    }
  }), [viajes])

  const grupos = useMemo(() => agruparViajesPorCupo(viajesEfectivos), [viajesEfectivos])

  const preview = calcularLiquidacion(
    viajes.map((v) => ({
      kilos: v.kilosEdit ?? v.kilos ?? 0,
      tarifaFletero: v.tarifaEdit ?? v.tarifaFletero,
    })),
    comisionPct,
    ivaPct,
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#c8d1dc" }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#1e3a5f" }}>
            Cuenta de Venta y Líquido Producto
          </h2>
          <p className="text-xs text-muted-foreground">
            Previsualización — {grupos.length} renglón{grupos.length === 1 ? "" : "es"}
            {grupos.length !== viajes.length && ` (${viajes.length} viajes, agrupados por cupo)`}
          </p>
        </div>
        <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Box fletero (igual look que el PDF) */}
        <div
          className="mb-4 rounded-lg border px-5 py-4"
          style={{ backgroundColor: "#edf1f7", borderColor: "#c8d1dc" }}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-semibold">Fletero: </span>
              <span className="font-semibold uppercase">{fletero.razonSocial}</span>
              <span className="text-muted-foreground">  |  CUIT: {fletero.cuit}</span>
            </div>
            <div>
              <span className="font-semibold">Condición IVA: </span>
              <span>{labelCondicionIva(fletero.condicionIva)}</span>
            </div>
            <div>
              <span className="font-semibold">Dirección: </span>
              <span>{fletero.direccion ?? "—"}</span>
            </div>
            <div>
              <span className="font-semibold">Método de Pago: </span>
              <span>{metodoPago}</span>
            </div>
          </div>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}

        {/* Tabla estilo PDF */}
        <div className="overflow-x-auto rounded-lg border" style={{ borderColor: "#c8d1dc" }}>
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#dce3ed" }}>
                <th className="px-3 py-2.5 text-left font-semibold" style={{ color: "#1a1a1a" }}>Fecha</th>
                <th className="px-3 py-2.5 text-left font-semibold">Producto</th>
                <th className="px-3 py-2.5 text-left font-semibold">Origen</th>
                <th className="px-3 py-2.5 text-left font-semibold">Destino</th>
                <th className="px-3 py-2.5 text-right font-semibold">Kilos</th>
                <th className="px-3 py-2.5 text-right font-semibold">Tarifa</th>
                <th className="px-3 py-2.5 text-right font-semibold">SubTotal</th>
              </tr>
            </thead>
            <tbody>
              {grupos.map((g, idx) => {
                const labelsDoc: Array<{ label: string; valor: string }> = []
                if (g.cupo) labelsDoc.push({ label: "Cupo: ", valor: g.cupo })
                if (g.remitos.length > 0) {
                  labelsDoc.push({
                    label: g.remitos.length > 1 ? "Remitos: " : "Remito: ",
                    valor: formatearRemitosCupo(g.remitos),
                  })
                }
                if (g.ctgs.length > 0) {
                  labelsDoc.push({
                    label: g.ctgs.length > 1 ? "CTGs: " : "CTG: ",
                    valor: g.ctgs.join(", "),
                  })
                }
                if (g.cpes.length > 0) {
                  labelsDoc.push({
                    label: g.cpes.length > 1 ? "CPEs: " : "CPE: ",
                    valor: g.cpes.join(", "),
                  })
                }

                return (
                  <tr key={idx} className="border-t" style={{ borderColor: "#c8d1dc" }}>
                    <td className="px-3 py-2 align-top whitespace-nowrap">{fmtFechaCorta(g.fechaViaje)}</td>
                    <td className="px-3 py-2 align-top">
                      <p>{g.mercaderia ?? "—"}</p>
                      {labelsDoc.length > 0 && (
                        <p className="text-xs mt-1 text-muted-foreground">
                          {labelsDoc.map((p, i) => (
                            <span key={i}>
                              <span className="font-semibold">{p.label}</span>
                              <span>{p.valor}</span>
                              {i < labelsDoc.length - 1 && <span>   </span>}
                            </span>
                          ))}
                        </p>
                      )}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <p>{g.procedencia ?? "—"}</p>
                      {g.provinciaOrigen && <p className="text-xs text-muted-foreground">{g.provinciaOrigen}</p>}
                    </td>
                    <td className="px-3 py-2 align-top">
                      <p>{g.destino ?? "—"}</p>
                      {g.provinciaDestino && <p className="text-xs text-muted-foreground">{g.provinciaDestino}</p>}
                    </td>
                    <td className="px-3 py-2 align-top text-right whitespace-nowrap">{fmtKilos(g.kilos)}</td>
                    <td className="px-3 py-2 align-top text-right whitespace-nowrap">{formatearMoneda(g.tarifa)}</td>
                    <td className="px-3 py-2 align-top text-right whitespace-nowrap font-semibold">{formatearMoneda(g.subtotal)}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        {/* Totales estilo PDF */}
        <div className="mt-6 flex justify-end">
          <div className="w-80 text-sm space-y-1.5" style={{ color: "#1a1a1a" }}>
            <div className="flex justify-between">
              <span>Total Viajes:</span>
              <span>{formatearMoneda(preview.subtotalBruto)}</span>
            </div>
            <div className="flex justify-between">
              <span>Comisión ({comisionPct}%):</span>
              <span>- {formatearMoneda(preview.comisionMonto)}</span>
            </div>
            <div className="border-t pt-1.5 flex justify-between" style={{ borderColor: "#c8d1dc" }}>
              <span>Subtotal:</span>
              <span>{formatearMoneda(preview.neto)}</span>
            </div>
            <div className="flex justify-between">
              <span>IVA {ivaPct}%:</span>
              <span>+ {formatearMoneda(preview.ivaMonto)}</span>
            </div>
            <div
              className="border-t pt-2 flex justify-between font-bold text-base"
              style={{ borderColor: "#c8d1dc", color: "#1e3a5f" }}
            >
              <span>TOTAL:</span>
              <span>{formatearMoneda(preview.totalFinal)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 shrink-0 bg-background" style={{ borderColor: "#c8d1dc" }}>
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
          <div className="flex-1" />
          <div className="flex gap-2 items-end">
            <button onClick={onCancelar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => onConfirmar(viajes, comisionPct, ivaPct, metodoPago, fechaEmision)}
              disabled={generando}
              className="h-9 px-4 rounded-md text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              {generando ? "Generando..." : "Confirmar y generar liquidación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
