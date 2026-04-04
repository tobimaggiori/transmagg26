"use client"

/**
 * Formulario multi-paso para crear una liquidación de fletero.
 * Paso 1: Seleccionar fletero y comisión.
 * Paso 2: Seleccionar viajes PENDIENTES del fletero y asignar tarifa fletero a cada uno.
 * Paso 3: Resumen y confirmación.
 *
 * SEGURIDAD: tarifaFletero es NUNCA visible para empresas/choferes.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes, aplicarPorcentaje, calcularIva, parsearImporte, formatearMoneda } from "@/lib/money"

interface ViajeDisponible {
  id: string
  fleteroId: string
  fechaViaje: string | Date
  remito?: string | null
  mercaderia?: string | null
  provinciaOrigen?: string | null
  provinciaDestino?: string | null
  kilos?: number | null
  tarifaFletero: number
  empresa: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
}

interface ViajeSeleccionado {
  viajeId: string
  tarifaFletero: string
}

interface LiquidacionFormProps {
  fleteros: Array<{ id: string; razonSocial: string; comisionDefault: number }>
  viajesPendientes: ViajeDisponible[]
  onSuccess?: () => void
}

/**
 * LiquidacionForm: LiquidacionFormProps -> JSX.Element
 *
 * Dados fleteros, viajesPendientes y onSuccess, renderiza un formulario multi-paso
 * (fletero→viajes→resumen) para crear una liquidación con tarifaFletero por viaje.
 * Filtra los viajes disponibles por el fletero seleccionado en el paso 1.
 * Envía POST /api/liquidaciones y llama onSuccess al completarse exitosamente.
 * Existe para que los operadores liquiden viajes pendientes a un fletero,
 * calculando comisión, IVA y neto automáticamente.
 *
 * Ejemplos:
 * <LiquidacionForm fleteros={[{ id: "f1", razonSocial: "JP SRL", comisionDefault: 10 }]} viajesPendientes={[...]} onSuccess={() => setOpen(false)} />
 * // => paso 1: selector de fletero + comisión; paso 2: viajes de f1 con campo tarifa; paso 3: resumen
 * <LiquidacionForm fleteros={[]} viajesPendientes={[]} onSuccess={() => {}} />
 * // => formulario sin viajes disponibles en paso 2
 * // => submit exitoso → llama onSuccess y refresca la página
 */
export function LiquidacionForm({ fleteros, viajesPendientes, onSuccess }: LiquidacionFormProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [fleteroId, setFleteroId] = useState(fleteros[0]?.id ?? "")
  const [comisionPct, setComisionPct] = useState(String(fleteros[0]?.comisionDefault ?? 10))
  const [seleccionados, setSeleccionados] = useState<Record<string, ViajeSeleccionado>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fleteroSeleccionado = fleteros.find((f) => f.id === fleteroId)

  // Filtrar viajes del fletero seleccionado (servidor filtra por PENDIENTE, cliente filtra por fletero)
  const viajesDelFletero = viajesPendientes.filter((v) => v.fleteroId === fleteroId)

  // Cuando cambia el fletero, limpiar selección
  function handleFleteroChange(id: string) {
    setFleteroId(id)
    const f = fleteros.find((f) => f.id === id)
    setComisionPct(String(f?.comisionDefault ?? 10))
    setSeleccionados({})
  }

  function toggleViaje(viaje: ViajeDisponible) {
    setSeleccionados((prev) => {
      if (prev[viaje.id]) {
        const next = { ...prev }
        delete next[viaje.id]
        return next
      }
      return {
        ...prev,
        [viaje.id]: { viajeId: viaje.id, tarifaFletero: String(viaje.tarifaFletero) },
      }
    })
  }

  function actualizarTarifa(viajeId: string, tarifa: string) {
    setSeleccionados((prev) => ({
      ...prev,
      [viajeId]: { ...prev[viajeId], tarifaFletero: tarifa },
    }))
  }

  const viajesElegidos = Object.values(seleccionados)
  const subtotalBruto = sumarImportes(viajesElegidos.map(v => parsearImporte(v.tarifaFletero)))
  const comisionMonto = aplicarPorcentaje(subtotalBruto, parsearImporte(comisionPct))
  const neto = restarImportes(subtotalBruto, comisionMonto)
  const ivaMonto = calcularIva(neto, 21)
  const total = sumarImportes([neto, ivaMonto])

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fleteroId,
          comisionPct: parsearImporte(comisionPct),
          viajes: viajesElegidos.map((v) => ({
            viajeId: v.viajeId,
            tarifaFletero: parsearImporte(v.tarifaFletero),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al crear la liquidación")
        return
      }

      router.refresh()
      onSuccess?.()
    } catch {
      setError("Error de conexión. Intentá nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Indicador de pasos */}
      <div className="flex items-center gap-2 text-sm">
        {[1, 2, 3].map((p) => (
          <div key={p} className="flex items-center gap-2">
            <div
              className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-medium ${
                p === paso
                  ? "bg-primary text-primary-foreground"
                  : p < paso
                    ? "bg-primary/20 text-primary"
                    : "bg-muted text-muted-foreground"
              }`}
            >
              {p}
            </div>
            {p < 3 && <div className="h-px w-8 bg-border" />}
          </div>
        ))}
        <span className="ml-2 text-muted-foreground">
          {paso === 1 ? "Datos del fletero" : paso === 2 ? "Seleccionar viajes" : "Confirmar"}
        </span>
      </div>

      {/* PASO 1: Fletero y comisión */}
      {paso === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="fleteroId">Fletero *</Label>
            <Select
              id="fleteroId"
              value={fleteroId}
              onChange={(e) => handleFleteroChange(e.target.value)}
              required
            >
              {fleteros.map((f) => (
                <option key={f.id} value={f.id}>{f.razonSocial}</option>
              ))}
            </Select>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="comisionPct">Comisión % *</Label>
            <Input
              id="comisionPct"
              type="number"
              min="0"
              max="100"
              step="0.01"
              value={comisionPct}
              onChange={(e) => setComisionPct(e.target.value)}
              required
            />
            <p className="text-xs text-muted-foreground">
              Comisión por defecto del fletero: {fleteroSeleccionado?.comisionDefault ?? 0}%
            </p>
          </div>
        </div>
      )}

      {/* PASO 2: Seleccionar viajes pendientes */}
      {paso === 2 && (
        <div className="space-y-3">
          {viajesDelFletero.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay viajes PENDIENTES para este fletero.
              Cargá viajes primero desde la sección &quot;Viajes&quot;.
            </div>
          ) : (
            viajesDelFletero.map((viaje) => {
              const sel = seleccionados[viaje.id]
              return (
                <div
                  key={viaje.id}
                  className={`rounded-lg border p-3 cursor-pointer transition-colors ${
                    sel ? "border-primary bg-primary/5" : "hover:border-muted-foreground/40"
                  }`}
                  onClick={() => toggleViaje(viaje)}
                >
                  <div className="flex items-start gap-3">
                    <input
                      type="checkbox"
                      checked={!!sel}
                      onChange={() => toggleViaje(viaje)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-1 h-4 w-4 accent-primary"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 text-sm font-medium">
                        <span>{viaje.empresa.razonSocial}</span>
                        <span className="text-muted-foreground">·</span>
                        <span>{formatearFecha(viaje.fechaViaje instanceof Date ? viaje.fechaViaje : new Date(viaje.fechaViaje))}</span>
                        {viaje.remito && <span className="text-muted-foreground">{viaje.remito}</span>}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {viaje.camion.patenteChasis} · {viaje.chofer.nombre} {viaje.chofer.apellido}
                        {viaje.mercaderia && ` · ${viaje.mercaderia}`}
                        {viaje.kilos && ` · ${viaje.kilos.toLocaleString("es-AR")} kg`}
                        {viaje.provinciaOrigen && viaje.provinciaDestino && ` · ${viaje.provinciaOrigen} → ${viaje.provinciaDestino}`}
                      </p>
                    </div>
                    <div className="text-right text-xs text-muted-foreground shrink-0">
                      base: {formatearMoneda(viaje.tarifaFletero)}
                    </div>
                  </div>

                  {sel && (
                    <div
                      className="mt-2 ml-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Label className="text-xs text-primary font-medium">Tarifa fletero ($) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sel.tarifaFletero}
                        onChange={(e) => actualizarTarifa(viaje.id, e.target.value)}
                        className="mt-1 h-8 text-sm border-primary/40 focus:border-primary"
                        required
                      />
                    </div>
                  )}
                </div>
              )
            })
          )}

          {viajesElegidos.length > 0 && (
            <p className="text-sm text-muted-foreground text-right">
              {viajesElegidos.length} viaje{viajesElegidos.length !== 1 ? "s" : ""} seleccionado{viajesElegidos.length !== 1 ? "s" : ""}
              · Subtotal: {formatearMoneda(subtotalBruto)}
            </p>
          )}
        </div>
      )}

      {/* PASO 3: Resumen */}
      {paso === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium">Resumen de la liquidación</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Fletero:</span>
                <span className="font-medium">{fleteroSeleccionado?.razonSocial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Viajes:</span>
                <span className="font-medium">{viajesElegidos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal bruto:</span>
                <span className="font-medium">{formatearMoneda(subtotalBruto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Comisión ({comisionPct}%):</span>
                <span className="font-medium text-destructive">- {formatearMoneda(comisionMonto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Neto:</span>
                <span className="font-medium">{formatearMoneda(neto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA sobre comisión (21%):</span>
                <span className="font-medium">{formatearMoneda(ivaMonto)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total a pagar al fletero:</span>
                <span className="text-lg">{formatearMoneda(total)}</span>
              </div>
            </div>
          </div>

          <FormError message={error} />
        </div>
      )}

      {/* Navegación */}
      <div className="flex justify-between pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={() => paso > 1 ? setPaso(paso - 1) : onSuccess?.()}
          disabled={loading}
        >
          {paso > 1 ? <><ChevronLeft className="h-4 w-4" /> Anterior</> : "Cancelar"}
        </Button>

        {paso < 3 ? (
          <Button
            type="button"
            onClick={() => setPaso(paso + 1)}
            disabled={
              (paso === 1 && !fleteroId) ||
              (paso === 2 && (viajesElegidos.length === 0 || viajesElegidos.some((v) => !v.tarifaFletero || parsearImporte(v.tarifaFletero) <= 0)))
            }
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear liquidación"}
          </Button>
        )}
      </div>
    </div>
  )
}
