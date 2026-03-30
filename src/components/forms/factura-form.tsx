"use client"

/**
 * Formulario multi-paso para crear una factura emitida.
 * Paso 1: Seleccionar empresa y tipo de comprobante.
 * Paso 2: Seleccionar viajes PENDIENTES de la empresa y asignar tarifa empresa a cada uno.
 * Paso 3: Resumen y confirmación.
 *
 * SEGURIDAD: tarifaEmpresa es NUNCA visible para fleteros/choferes.
 */

import { useState } from "react"
import { useRouter } from "next/navigation"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { FormError } from "@/components/ui/form-error"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { TipoCbte } from "@/types"

interface ViajeDisponible {
  id: string
  fechaViaje: string | Date
  remito?: string | null
  mercaderia?: string | null
  provinciaOrigen?: string | null
  provinciaDestino?: string | null
  kilos?: number | null
  tarifaOperativaInicial: number
  empresaId: string
  fletero: { razonSocial: string }
  camion: { patenteChasis: string }
  chofer: { nombre: string; apellido: string }
}

interface ViajeSeleccionado {
  viajeId: string
  tarifaEmpresa: string
}

interface FacturaFormProps {
  empresas: Array<{ id: string; razonSocial: string }>
  viajesPendientes: ViajeDisponible[]
  onSuccess?: () => void
}

const ALICUOTAS_IVA = [21, 10.5, 27, 0]

/**
 * FacturaForm: FacturaFormProps -> JSX.Element
 *
 * Dadas empresas, viajesPendientes y onSuccess, renderiza un formulario multi-paso
 * (empresa→viajes→resumen) para crear una factura con tarifaEmpresa por viaje.
 * Filtra los viajes disponibles por la empresa seleccionada en el paso 1.
 * Envía POST /api/facturas y llama onSuccess al completarse exitosamente.
 * Existe para que los operadores facturen viajes pendientes a una empresa,
 * calculando IVA y total automáticamente según la alícuota seleccionada.
 *
 * Ejemplos:
 * <FacturaForm empresas={[{ id: "e1", razonSocial: "ADS SA" }]} viajesPendientes={[...]} onSuccess={() => setOpen(false)} />
 * // => paso 1: selector de empresa + tipo cbte + alícuota IVA; paso 2: viajes de e1 con campo tarifa; paso 3: resumen
 * <FacturaForm empresas={[]} viajesPendientes={[]} onSuccess={() => {}} />
 * // => formulario sin viajes disponibles en paso 2
 * // => submit exitoso → llama onSuccess y refresca la página
 */
export function FacturaForm({ empresas, viajesPendientes, onSuccess }: FacturaFormProps) {
  const router = useRouter()
  const [paso, setPaso] = useState(1)
  const [empresaId, setEmpresaId] = useState(empresas[0]?.id ?? "")
  const [tipoCbte, setTipoCbte] = useState<keyof typeof TipoCbte>("A")
  const [alicuotaIva, setAlicuotaIva] = useState(21)
  const [seleccionados, setSeleccionados] = useState<Record<string, ViajeSeleccionado>>({})
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const empresaSeleccionada = empresas.find((e) => e.id === empresaId)
  const viajesDeLaEmpresa = viajesPendientes.filter((v) => v.empresaId === empresaId)

  function handleEmpresaChange(id: string) {
    setEmpresaId(id)
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
        [viaje.id]: { viajeId: viaje.id, tarifaEmpresa: String(viaje.tarifaOperativaInicial) },
      }
    })
  }

  function actualizarTarifa(viajeId: string, tarifa: string) {
    setSeleccionados((prev) => ({
      ...prev,
      [viajeId]: { ...prev[viajeId], tarifaEmpresa: tarifa },
    }))
  }

  const viajesElegidos = Object.values(seleccionados)
  const neto = viajesElegidos.reduce((acc, v) => acc + (parseFloat(v.tarifaEmpresa) || 0), 0)
  const ivaMonto = neto * (alicuotaIva / 100)
  const total = neto + ivaMonto

  async function handleSubmit() {
    setLoading(true)
    setError(null)

    try {
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          empresaId,
          tipoCbte,
          alicuotaIva,
          viajes: viajesElegidos.map((v) => ({
            viajeId: v.viajeId,
            tarifaEmpresa: parseFloat(v.tarifaEmpresa),
          })),
        }),
      })

      const data = await res.json()
      if (!res.ok) {
        setError(data.error ?? "Error al crear la factura")
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
          {paso === 1 ? "Empresa y tipo" : paso === 2 ? "Seleccionar viajes" : "Confirmar"}
        </span>
      </div>

      {/* PASO 1 */}
      {paso === 1 && (
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="empresaId">Empresa *</Label>
            <Select id="empresaId" value={empresaId} onChange={(e) => handleEmpresaChange(e.target.value)} required>
              {empresas.map((e) => (
                <option key={e.id} value={e.id}>{e.razonSocial}</option>
              ))}
            </Select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="tipoCbte">Tipo comprobante *</Label>
              <Select id="tipoCbte" value={tipoCbte} onChange={(e) => setTipoCbte(e.target.value as keyof typeof TipoCbte)}>
                {Object.keys(TipoCbte).map((t) => (
                  <option key={t} value={t}>Factura {t}</option>
                ))}
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="alicuotaIva">Alícuota IVA %</Label>
              <Select id="alicuotaIva" value={String(alicuotaIva)} onChange={(e) => setAlicuotaIva(Number(e.target.value))}>
                {ALICUOTAS_IVA.map((a) => (
                  <option key={a} value={a}>{a}%</option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* PASO 2: Seleccionar viajes pendientes de la empresa */}
      {paso === 2 && (
        <div className="space-y-3">
          {viajesDeLaEmpresa.length === 0 ? (
            <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
              No hay viajes PENDIENTES para esta empresa.
              Cargá viajes primero desde la sección &quot;Viajes&quot;.
            </div>
          ) : (
            viajesDeLaEmpresa.map((viaje) => {
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
                        <span>{viaje.fletero.razonSocial}</span>
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
                      base: {formatearMoneda(viaje.tarifaOperativaInicial)}
                    </div>
                  </div>

                  {sel && (
                    <div
                      className="mt-2 ml-7"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Label className="text-xs text-primary font-medium">Tarifa empresa ($) *</Label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={sel.tarifaEmpresa}
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
              · Neto: {formatearMoneda(neto)}
            </p>
          )}
        </div>
      )}

      {/* PASO 3: Resumen */}
      {paso === 3 && (
        <div className="space-y-4">
          <div className="rounded-lg border p-4 space-y-3">
            <h4 className="font-medium">Resumen de la factura</h4>
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Empresa:</span>
                <span className="font-medium">{empresaSeleccionada?.razonSocial}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Tipo:</span>
                <span className="font-medium">Factura {tipoCbte}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Viajes:</span>
                <span className="font-medium">{viajesElegidos.length}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Neto:</span>
                <span className="font-medium">{formatearMoneda(neto)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">IVA ({alicuotaIva}%):</span>
                <span className="font-medium">{formatearMoneda(ivaMonto)}</span>
              </div>
              <div className="flex justify-between border-t pt-2 font-semibold">
                <span>Total:</span>
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
              (paso === 1 && !empresaId) ||
              (paso === 2 && (viajesElegidos.length === 0 || viajesElegidos.some((v) => !v.tarifaEmpresa || parseFloat(v.tarifaEmpresa) <= 0)))
            }
          >
            Siguiente <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={loading}>
            {loading ? "Creando..." : "Crear factura"}
          </Button>
        )}
      </div>
    </div>
  )
}
