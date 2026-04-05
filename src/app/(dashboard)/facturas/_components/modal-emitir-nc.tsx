"use client"

import { useState } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularTotalesNotaCD } from "@/lib/nota-cd-utils"
import type { ViajeEnFactura } from "./types"

/**
 * ModalEmitirNC: props -> JSX.Element
 *
 * Dado el id de la factura, sus viajes y una función de cierre/recarga,
 * renderiza un formulario para emitir una Nota de Crédito (NC_EMITIDA).
 * Permite seleccionar subtipo: ANULACION_TOTAL (monto automático desde factura),
 * ANULACION_PARCIAL (con selección de viajes mediante checkboxes) y
 * CORRECCION_IMPORTE (con input manual de montoNeto).
 * Para todos los subtipos muestra el preview de totales (neto, IVA, total).
 * Al confirmar envía POST /api/notas-credito-debito y llama onExito.
 * Existe para que el operador emita NC sin abandonar la vista de la factura.
 *
 * Ejemplos:
 * <ModalEmitirNC facturaId="f1" totalFactura={1210} viajes={[...]} onExito={fn} onClose={fn} />
 * // => formulario de NC con subtipo ANULACION_TOTAL por defecto
 */
export function ModalEmitirNC({
  facturaId,
  totalFactura,
  netoFactura,
  viajes,
  onExito,
  onClose,
}: {
  facturaId: string
  totalFactura: number
  netoFactura: number
  viajes: ViajeEnFactura[]
  onExito: () => void
  onClose: () => void
}) {
  const [subtipo, setSubtipo] = useState("ANULACION_TOTAL")
  const [montoNeto, setMontoNeto] = useState(netoFactura)
  const [ivaPct, setIvaPct] = useState(21)
  const [descripcion, setDescripcion] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [viajesSeleccionados, setViajesSeleccionados] = useState<Set<string>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoNetoReal = subtipo === "ANULACION_TOTAL" ? netoFactura : montoNeto
  const totales = calcularTotalesNotaCD(montoNetoReal, ivaPct)

  function toggleViaje(id: string) {
    setViajesSeleccionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  async function emitir() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }
    if (subtipo === "ANULACION_PARCIAL" && viajesSeleccionados.size === 0) {
      setError("Seleccioná al menos un viaje para anulación parcial"); return
    }
    setEnviando(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        tipo: "NC_EMITIDA",
        subtipo,
        facturaId,
        montoNeto: montoNetoReal,
        ivaPct,
        descripcion,
        motivoDetalle: motivoDetalle || undefined,
        viajesIds: subtipo === "ANULACION_PARCIAL" ? Array.from(viajesSeleccionados) : undefined,
        emisionArca: true,
        idempotencyKey: crypto.randomUUID(),
      }
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al emitir NC")
        return
      }
      onExito()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-700">Emitir Nota de Crédito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subtipo *</label>
            <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)} className="w-full h-9 rounded border bg-white px-2 text-sm">
              <option value="ANULACION_TOTAL">Anulación total</option>
              <option value="ANULACION_PARCIAL">Anulación parcial</option>
              <option value="CORRECCION_IMPORTE">Corrección de importe</option>
            </select>
          </div>

          {subtipo === "ANULACION_PARCIAL" && viajes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Viajes a anular *</label>
              <div className="border rounded divide-y max-h-40 overflow-y-auto">
                {viajes.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={viajesSeleccionados.has(v.id)}
                      onChange={() => toggleViaje(v.id)}
                    />
                    <span>{formatearFecha(new Date(v.fechaViaje))} — {v.mercaderia ?? "viaje"} — {formatearMoneda(v.subtotal)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {subtipo === "CORRECCION_IMPORTE" && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Monto neto *</label>
              <input
                type="number"
                value={montoNeto}
                onChange={(e) => setMontoNeto(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                className="w-full h-9 rounded border bg-white px-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">IVA %</label>
            <input
              type="number"
              value={ivaPct}
              onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-24 h-9 rounded border bg-white px-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Descripción *</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full h-9 rounded border bg-white px-2 text-sm"
              placeholder="Descripción de la NC"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Motivo / detalle (opcional)</label>
            <textarea
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              rows={2}
              className="w-full rounded border bg-white px-2 py-1.5 text-sm"
              placeholder="Detalle adicional..."
            />
          </div>

          {/* Preview totales */}
          <div className="bg-blue-50 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Neto:</span><span>{formatearMoneda(totales.montoNeto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">IVA ({ivaPct}%):</span><span>{formatearMoneda(totales.montoIva)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total NC:</span><span>{formatearMoneda(totales.montoTotal)}</span></div>
            <p className="text-xs text-gray-500">Factura original: {formatearMoneda(totalFactura)}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button
            onClick={emitir}
            disabled={enviando}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? "Emitiendo..." : "Emitir Nota de Crédito"}
          </button>
        </div>
      </div>
    </div>
  )
}
