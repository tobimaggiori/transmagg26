"use client"

import { useState, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import type { ImpactoItem } from "./types"

export function ModalAnularPagoFletero({
  pagoId,
  pagoMonto,
  pagoTipo,
  pagoFecha,
  onConfirmar,
  onCerrar,
}: {
  pagoId: string
  pagoMonto: number
  pagoTipo: string
  pagoFecha: string
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [justificacion, setJustificacion] = useState("")
  const [impactos, setImpactos] = useState<ImpactoItem[]>([])
  const [cargandoPreview, setCargandoPreview] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargandoPreview(true)
    fetch(`/api/pagos-fletero/${pagoId}/impacto-modificacion`)
      .then((r) => r.json())
      .then((data) => setImpactos(data.impactos ?? []))
      .catch(() => setImpactos([]))
      .finally(() => setCargandoPreview(false))
  }, [pagoId])

  async function confirmar() {
    if (justificacion.trim().length < 10) {
      setError("La justificación debe tener al menos 10 caracteres")
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/pagos-fletero/${pagoId}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificacion }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al anular el pago")
        return
      }
      onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-red-600">
            Anular pago de {formatearMoneda(pagoMonto)} — {pagoTipo.replace(/_/g, " ")} — {formatearFecha(new Date(pagoFecha))}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Justificación (obligatoria)</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            rows={3}
            placeholder="Mínimo 10 caracteres..."
            className="w-full rounded border bg-background px-3 py-2 text-sm resize-none"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Registros afectados</p>
          {cargandoPreview ? (
            <p className="text-sm text-muted-foreground">Calculando impacto...</p>
          ) : impactos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin impacto adicional detectado.</p>
          ) : (
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Estado actual</th>
                    <th className="px-3 py-2 text-left">Nuevo estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {impactos.map((imp, i) => (
                    <tr key={i} className={imp.tipo.startsWith("CC") ? "bg-blue-50/50" : ""}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{imp.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{imp.detalle}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{imp.estadoActual}</td>
                      <td className="px-3 py-2 font-medium">{imp.nuevoEstado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCerrar}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || justificacion.trim().length < 10}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? "Anulando..." : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </div>
  )
}
