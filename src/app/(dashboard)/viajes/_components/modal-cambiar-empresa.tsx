"use client"

import { useState } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { parsearImporte } from "@/lib/money"
import type { ViajeAPI, Empresa } from "./types"

type EntradaHistorial = {
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  motivo: string
  operadorId: string
}

export function ModalCambiarEmpresa({
  viaje,
  empresas,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  empresas: Empresa[]
  onGuardar: (data: Record<string, unknown>) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [nuevaEmpresaId, setNuevaEmpresaId] = useState("")
  const [nuevaTarifa, setNuevaTarifa] = useState(viaje.tarifaEmpresa?.toString() ?? "")
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const empresaActual = empresas.find((e) => e.id === viaje.empresaId)
  const empresaNueva = empresas.find((e) => e.id === nuevaEmpresaId)
  const mismaEmpresa = nuevaEmpresaId === viaje.empresaId
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = nuevaEmpresaId && !mismaEmpresa && motivoValido && !cargando

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!puedeConfirmar) return
    const payload: Record<string, unknown> = {
      empresaId: nuevaEmpresaId,
      motivoCambioEmpresa: motivo.trim(),
    }
    const tarifaNum = parsearImporte(nuevaTarifa)
    if (tarifaNum > 0 && tarifaNum !== viaje.tarifaEmpresa) {
      payload.tarifa = tarifaNum
    }
    onGuardar(payload)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-lg w-full max-w-lg space-y-5 p-6">
        {/* Encabezado */}
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Cambiar empresa del viaje</h2>
            <p className="text-sm text-muted-foreground mt-0.5">
              {formatearFecha(new Date(viaje.fechaViaje))} — {viaje.provinciaOrigen ?? viaje.procedencia ?? "-"} → {viaje.provinciaDestino ?? viaje.destino ?? "-"}
              {viaje.mercaderia ? ` — ${viaje.mercaderia}` : ""}
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground rounded-md p-1" aria-label="Cerrar">✕</button>
        </div>

        {viaje.estadoFactura === "FACTURADA" ? (
          <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            Este viaje ya fue facturado. No se puede cambiar la empresa.
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Empresa actual</p>
                <p className="font-medium">{empresaActual?.razonSocial ?? "-"}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Tarifa actual</p>
                <p className="font-medium">{viaje.tarifaEmpresa != null ? formatearMoneda(viaje.tarifaEmpresa) : "-"}</p>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva empresa <span className="text-destructive">*</span></label>
              <select
                value={nuevaEmpresaId}
                onChange={(e) => setNuevaEmpresaId(e.target.value)}
                required
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
              >
                <option value="">Seleccioná una empresa...</option>
                {empresas.map((e) => (
                  <option key={e.id} value={e.id}>{e.razonSocial}</option>
                ))}
              </select>
              {mismaEmpresa && nuevaEmpresaId && (
                <p className="text-xs text-amber-600">La empresa nueva es igual a la actual.</p>
              )}
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Nueva tarifa operativa</label>
              <input
                type="number"
                value={nuevaTarifa}
                onChange={(e) => setNuevaTarifa(e.target.value)}
                min="0"
                step="0.01"
                className="w-full h-9 rounded-md border bg-background px-2 text-sm"
                placeholder="Dejar igual si no cambia"
              />
              <p className="text-xs text-muted-foreground">Modificar solo si fue acordada con la nueva empresa.</p>
            </div>

            <div className="space-y-1">
              <label className="text-sm font-medium">Motivo del cambio <span className="text-destructive">*</span></label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-2 py-1.5 text-sm resize-none"
                placeholder="Mínimo 10 caracteres. Este motivo queda registrado en el historial del viaje."
                required
              />
              {motivo.length > 0 && !motivoValido && (
                <p className="text-xs text-destructive">El motivo debe tener al menos 10 caracteres.</p>
              )}
            </div>

            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Preview del cambio */}
            {empresaNueva && !mismaEmpresa && (
              <div className="rounded-md border bg-muted/30 px-3 py-2 text-sm">
                <span className="font-medium">{empresaActual?.razonSocial}</span>
                {" → "}
                <span className="font-medium text-primary">{empresaNueva.razonSocial}</span>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-1">
              <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-muted">
                Cancelar
              </button>
              <button
                type="submit"
                disabled={!puedeConfirmar}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {cargando ? "Guardando…" : "Confirmar cambio"}
              </button>
            </div>
          </form>
        )}

        {/* Historial colapsable */}
        {historial.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {mostrarHistorial ? "▲ Ocultar historial" : `▼ Historial de cambios (${historial.length})`}
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial.map((e, i) => (
                  <div key={i} className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-0.5">
                    <p className="text-muted-foreground">{formatearFecha(new Date(e.fecha))}</p>
                    <p>
                      <span className="font-medium">{e.valorAnterior}</span>
                      {" → "}
                      <span className="font-medium">{e.valorNuevo}</span>
                    </p>
                    <p className="text-muted-foreground italic">&ldquo;{e.motivo}&rdquo;</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
