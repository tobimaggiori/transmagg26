"use client"

/**
 * Preview de Factura a Empresa antes de emitirla en ARCA.
 *
 * Análogo a ModalPreviewLiquidacion: simula la estética y estructura del PDF
 * que se generará en pdf-factura.ts. Viajes agrupados por cupo, columnas
 * idénticas al PDF, información de cupo/remitos/CTGs/CPEs debajo de cada fila.
 *
 * Read-only para los campos del viaje; IVA, método de pago y fecha de emisión
 * siguen editables en el footer.
 */

import { useState, useMemo } from "react"
import { formatearMoneda } from "@/lib/utils"
import { calcularFactura, calcularTotalViaje } from "@/lib/viajes"
import { labelCondicionIva } from "@/lib/liquidacion-utils"
import { agruparViajesPorCupo, formatearRemitosCupo } from "@/lib/viaje-cupo-util"
import { hoyLocalYmd } from "@/lib/date-local"
import { TipoCbteBadge } from "../facturar-client"

export type EmpresaInfo = {
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion?: string | null
}

export type ViajeParaFacturaPreview = {
  id: string
  fechaViaje: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number
  tarifa: number
  nroCtg: string | null
  cpe: string | null
}

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

export function ModalPreviewFactura({
  empresa,
  viajes,
  tipoCbte,
  modalidadMiPymes,
  ivaPctInicial,
  metodoPagoInicial,
  fechaEmisionDefault,
  generando,
  error,
  onCancelar,
  onConfirmar,
}: {
  empresa: EmpresaInfo
  viajes: ViajeParaFacturaPreview[]
  tipoCbte: number
  modalidadMiPymes?: string | null
  ivaPctInicial: number
  metodoPagoInicial: string
  fechaEmisionDefault?: string
  generando: boolean
  error: string | null
  onCancelar: () => void
  onConfirmar: (ivaPct: number, metodoPago: string, fechaEmision: string) => void
}) {
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)
  const [metodoPago, setMetodoPago] = useState(metodoPagoInicial)
  const [fechaEmision, setFechaEmision] = useState(() => fechaEmisionDefault ?? hoyLocalYmd())

  // Pre-computar subtotales y agrupar por cupo (misma lógica que pdf-factura.ts).
  const grupos = useMemo(() => {
    const agrupables = viajes.map((v) => ({
      fechaViaje: new Date(v.fechaViaje),
      remito: v.remito,
      cupo: v.cupo,
      mercaderia: v.mercaderia,
      procedencia: v.procedencia,
      provinciaOrigen: v.provinciaOrigen,
      destino: v.destino,
      provinciaDestino: v.provinciaDestino,
      kilos: v.kilos > 0 ? v.kilos : null,
      tarifa: Number(v.tarifa),
      subtotal: v.kilos > 0 ? calcularTotalViaje(v.kilos, Number(v.tarifa)) : 0,
      nroCtg: v.nroCtg,
      cpe: v.cpe ?? null,
    }))
    return agruparViajesPorCupo(agrupables)
  }, [viajes])

  const preview = calcularFactura(
    viajes.map((v) => ({ kilos: v.kilos, tarifaEmpresa: v.tarifa })),
    ivaPct,
  )

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0" style={{ borderColor: "#c8d1dc" }}>
        <div>
          <h2 className="text-lg font-semibold" style={{ color: "#1e3a5f" }}>
            Factura a Empresa
          </h2>
          <p className="text-xs text-muted-foreground">
            Previsualización — {grupos.length} renglón{grupos.length === 1 ? "" : "es"}
            {grupos.length !== viajes.length && ` (${viajes.length} viajes, agrupados por cupo)`}
          </p>
        </div>
        <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>

      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Box empresa */}
        <div
          className="mb-4 rounded-lg border px-5 py-4"
          style={{ backgroundColor: "#edf1f7", borderColor: "#c8d1dc" }}
        >
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="font-semibold">Empresa: </span>
              <span className="font-semibold uppercase">{empresa.razonSocial}</span>
              <span className="text-muted-foreground">  |  CUIT: {empresa.cuit}</span>
            </div>
            <div>
              <span className="font-semibold">Condición IVA: </span>
              <span>{labelCondicionIva(empresa.condicionIva)}</span>
            </div>
            <div>
              <span className="font-semibold">Dirección: </span>
              <span>{empresa.direccion ?? "—"}</span>
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
                <th className="px-3 py-2.5 text-left font-semibold">Fecha</th>
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
              <span>Neto ({viajes.length} viaje{viajes.length === 1 ? "" : "s"}):</span>
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
              <span>{formatearMoneda(preview.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 shrink-0 bg-background" style={{ borderColor: "#c8d1dc" }}>
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-4 flex-wrap">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de comprobante</label>
              <div className="flex items-center gap-2 h-8">
                <TipoCbteBadge tipoCbte={tipoCbte} modalidad={modalidadMiPymes ?? undefined} />
                <span className="text-xs text-muted-foreground">(código ARCA: {tipoCbte})</span>
              </div>
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
              onClick={() => onConfirmar(ivaPct, metodoPago, fechaEmision)}
              disabled={generando}
              className="h-9 px-4 rounded-md text-sm font-medium text-white hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: "#1e3a5f" }}
            >
              {generando ? "Generando..." : "Confirmar y emitir factura"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
