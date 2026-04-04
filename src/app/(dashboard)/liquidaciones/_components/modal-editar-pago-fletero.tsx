"use client"

import { useState, useEffect } from "react"
import { parsearImporte } from "@/lib/money"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"

export function ModalEditarPagoFletero({
  pagoId,
  pagoMonto,
  pagoTipo,
  pagoFecha,
  liquidacionId,
  fleteroId,
  onConfirmar,
  onCerrar,
}: {
  pagoId: string
  pagoMonto: number
  pagoTipo: string
  pagoFecha: string
  liquidacionId: string
  fleteroId: string
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [nuevoMonto, setNuevoMonto] = useState(String(pagoMonto))
  const [nuevaFecha, setNuevaFecha] = useState(pagoFecha.slice(0, 10))
  const [nroCheque, setNroCheque] = useState("")
  const [nuevaLiquidacionId, setNuevaLiquidacionId] = useState("")
  const [justificacion, setJustificacion] = useState("")
  const [liquidaciones, setLiquidaciones] = useState<{ id: string; label: string }[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esCheque = pagoTipo.includes("CHEQUE")

  useEffect(() => {
    fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      .then((r) => r.json())
      .then((data) => {
        const lqs = (data.liquidaciones ?? []) as { id: string; ptoVenta: number | null; nroComprobante: number | null; estado: string }[]
        setLiquidaciones(lqs.map((l) => ({
          id: l.id,
          label: l.nroComprobante
            ? `${String(l.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(l.nroComprobante)} (${l.estado})`
            : `LP sin nro. (${l.estado})`,
        })))
      })
      .catch(() => {})
  }, [fleteroId])

  async function guardar() {
    const montoNum = parsearImporte(nuevoMonto)
    if (montoNum <= 0) {
      setError("El monto debe ser un número positivo")
      return
    }
    if (justificacion.trim().length < 10) {
      setError("La justificación debe tener al menos 10 caracteres")
      return
    }

    const body: Record<string, unknown> = { justificacion }
    if (montoNum !== pagoMonto) body.nuevoMonto = montoNum
    if (nuevaFecha !== pagoFecha.slice(0, 10)) body.fechaPago = nuevaFecha
    if (esCheque && nroCheque.trim()) body.nroCheque = nroCheque.trim()
    if (nuevaLiquidacionId && nuevaLiquidacionId !== liquidacionId) body.nuevaLiquidacionId = nuevaLiquidacionId

    if (Object.keys(body).length === 1) {
      setError("Debe modificar al menos un campo")
      return
    }

    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/pagos-fletero/${pagoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al modificar el pago")
        return
      }
      onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Modificar pago</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Monto</label>
            <input
              type="number"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha de pago</label>
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          {esCheque && (
            <div>
              <label className="text-sm font-medium mb-1 block">Nro. de cheque (nuevo)</label>
              <input
                type="text"
                value={nroCheque}
                onChange={(e) => setNroCheque(e.target.value)}
                placeholder="Opcional — solo si cambió el número"
                className="w-full rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          {liquidaciones.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Reasignar a otra LP</label>
              <select
                value={nuevaLiquidacionId}
                onChange={(e) => setNuevaLiquidacionId(e.target.value)}
                className="w-full rounded border bg-background px-3 py-2 text-sm"
              >
                <option value="">Mantener LP actual</option>
                {liquidaciones
                  .filter((l) => l.id !== liquidacionId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Justificación (obligatoria)</label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={3}
              placeholder="Mínimo 10 caracteres..."
              className="w-full rounded border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={enviando || justificacion.trim().length < 10}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}
