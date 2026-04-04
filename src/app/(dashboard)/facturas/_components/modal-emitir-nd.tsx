"use client"

import { useState } from "react"
import { formatearMoneda } from "@/lib/utils"
import { calcularTotalesNotaCD } from "@/lib/nota-cd-utils"

/**
 * ModalEmitirND: props -> JSX.Element
 *
 * Dado el id de la factura y una función de cierre/recarga, renderiza un formulario
 * para emitir una Nota de Débito (ND_EMITIDA) con selector de subtipo, inputs de
 * montoNeto e ivaPct, descripción obligatoria, motivoDetalle opcional y preview de totales.
 * Al confirmar envía POST /api/notas-credito-debito y llama onExito.
 * Existe para que el operador emita ND (diferencias, costos adicionales, ajustes, etc.)
 * sin abandonar la vista de la factura.
 *
 * Ejemplos:
 * <ModalEmitirND facturaId="f1" onExito={fn} onClose={fn} />
 * // => formulario de ND con subtipo DIFERENCIA_TARIFA por defecto
 */
export function ModalEmitirND({
  facturaId,
  onExito,
  onClose,
}: {
  facturaId: string
  onExito: () => void
  onClose: () => void
}) {
  const [subtipo, setSubtipo] = useState("DIFERENCIA_TARIFA")
  const [montoNeto, setMontoNeto] = useState(0)
  const [ivaPct, setIvaPct] = useState(21)
  const [descripcion, setDescripcion] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totales = calcularTotalesNotaCD(montoNeto, ivaPct)

  async function emitir() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }
    if (montoNeto <= 0) { setError("El monto neto debe ser mayor a 0"); return }
    setEnviando(true)
    setError(null)
    try {
      const body = {
        tipo: "ND_EMITIDA",
        subtipo,
        facturaId,
        montoNeto,
        ivaPct,
        descripcion,
        motivoDetalle: motivoDetalle || undefined,
      }
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al emitir ND")
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
          <h2 className="text-lg font-semibold text-orange-700">Emitir Nota de Débito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subtipo *</label>
            <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)} className="w-full h-9 rounded border bg-white px-2 text-sm">
              <option value="DIFERENCIA_TARIFA">Diferencia de tarifa</option>
              <option value="COSTO_ADICIONAL">Costo adicional</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="PENALIDAD">Penalidad</option>
              <option value="CORRECCION_ADMINISTRATIVA">Corrección administrativa</option>
            </select>
          </div>
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
              placeholder="Descripción de la ND"
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
          <div className="bg-orange-50 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Neto:</span><span>{formatearMoneda(totales.montoNeto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">IVA ({ivaPct}%):</span><span>{formatearMoneda(totales.montoIva)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total ND:</span><span>{formatearMoneda(totales.montoTotal)}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button
            onClick={emitir}
            disabled={enviando}
            className="rounded-md bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {enviando ? "Emitiendo..." : "Emitir Nota de Débito"}
          </button>
        </div>
      </div>
    </div>
  )
}
