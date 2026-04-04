"use client"

import { useState } from "react"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { ProvinciaArgentina } from "@/lib/provincias"
import type { ViajeParaLiquidar, Camion, Chofer } from "./types"

export function ModalEditarViaje({
  viaje,
  camiones,
  choferes,
  fleteroId,
  onGuardar,
  onCerrar,
}: {
  viaje: ViajeParaLiquidar
  camiones: Camion[]
  choferes: Chofer[]
  fleteroId: string
  onGuardar: (v: ViajeParaLiquidar) => void
  onCerrar: () => void
}) {
  const [form, setForm] = useState<ViajeParaLiquidar>({ ...viaje })
  const camionesDelFletero = camiones.filter((c) => c.fleteroId === fleteroId)

  function set(campo: keyof ViajeParaLiquidar, valor: unknown) {
    setForm((prev) => ({ ...prev, [campo]: valor }))
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Editar viaje</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Fecha viaje</label>
            <input
              type="date"
              value={form.fechaEdit ?? form.fechaViaje.slice(0, 10)}
              onChange={(e) => set("fechaEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Remito</label>
            <input
              type="text"
              value={form.remitoEdit ?? ""}
              onChange={(e) => set("remitoEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">¿Lleva cupo?</label>
            <div className="flex rounded-md border overflow-hidden h-9">
              <button
                type="button"
                onClick={() => { set("tieneCupoEdit", false); set("cupoEdit", "") }}
                className={`flex-1 text-xs font-medium border-r ${!(form.tieneCupoEdit ?? form.tieneCupo) ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                No
              </button>
              <button
                type="button"
                onClick={() => set("tieneCupoEdit", true)}
                className={`flex-1 text-xs font-medium ${(form.tieneCupoEdit ?? form.tieneCupo) ? "bg-primary text-primary-foreground" : "bg-background hover:bg-muted"}`}
              >
                Sí
              </button>
            </div>
            {(form.tieneCupoEdit ?? form.tieneCupo) && (
              <input
                type="text"
                value={form.cupoEdit ?? ""}
                onChange={(e) => set("cupoEdit", e.target.value)}
                placeholder="Nro. de cupo"
                className="h-9 w-full rounded border bg-background px-2 text-sm mt-2"
              />
            )}
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Mercadería</label>
            <input
              type="text"
              value={form.mercaderiaEdit ?? ""}
              onChange={(e) => set("mercaderiaEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Procedencia</label>
            <input
              type="text"
              value={form.procedenciaEdit ?? ""}
              onChange={(e) => set("procedenciaEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prov. Origen</label>
            <select
              value={form.origenEdit ?? form.provinciaOrigen ?? ""}
              onChange={(e) => set("origenEdit", e.target.value as ProvinciaArgentina)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            >
              <option value="">Seleccionar provincia...</option>
              {PROVINCIAS_ARGENTINA.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Destino</label>
            <input
              type="text"
              value={form.destinoEdit ?? ""}
              onChange={(e) => set("destinoEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Prov. Destino</label>
            <select
              value={form.provinciaDestinoEdit ?? form.provinciaDestino ?? ""}
              onChange={(e) => set("provinciaDestinoEdit", e.target.value as ProvinciaArgentina)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            >
              <option value="">Seleccionar provincia...</option>
              {PROVINCIAS_ARGENTINA.map((p) => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Kilos</label>
            <input
              type="number"
              value={form.kilosEdit ?? form.kilos ?? ""}
              onChange={(e) => set("kilosEdit", parseFloat(e.target.value) || undefined)}
              min="0"
              step="1"
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Tarifa al fletero / ton</label>
            <input
              type="number"
              value={form.tarifaEdit ?? form.tarifaFletero}
              onChange={(e) => set("tarifaEdit", parseFloat(e.target.value) || form.tarifaFletero)}
              min="0"
              step="0.01"
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Camión</label>
            <select
              value={form.camionIdEdit ?? form.camionId}
              onChange={(e) => set("camionIdEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            >
              {camionesDelFletero.map((c) => (
                <option key={c.id} value={c.id}>{c.patenteChasis}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-muted-foreground">Chofer</label>
            <select
              value={form.choferIdEdit ?? form.choferId}
              onChange={(e) => set("choferIdEdit", e.target.value)}
              className="h-9 w-full rounded border bg-background px-2 text-sm"
            >
              {choferes.map((c) => (
                <option key={c.id} value={c.id}>{c.apellido}, {c.nombre}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="flex justify-end gap-2 mt-6">
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={() => { onGuardar(form); onCerrar() }}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
          >
            Guardar
          </button>
        </div>
      </div>
    </div>
  )
}
