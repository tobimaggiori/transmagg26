"use client"

/**
 * ModalDetalleViajeJm — Detalle/edición de viaje JM.
 * Versión simplificada: sin fletero, sin liquidaciones, sin facturas.
 * Edición libre de todos los campos.
 */

import { useState, useEffect } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearFecha, formatearMoneda } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

export type Empresa = { id: string; razonSocial: string; cuit: string }
export type Camion = { id: string; patenteChasis: string }
export type Chofer = { id: string; nombre: string; apellido: string; email?: string | null }

export type ViajeJmAPI = {
  id: string
  fechaViaje: string
  empresaId: string
  camionId: string
  choferId: string
  remito: string | null
  remitoS3Key: string | null
  tieneCtg: boolean
  nroCtg: string | null
  ctgS3Key: string | null
  cpe: string | null
  tieneCupo: boolean
  cupo: string | null
  mercaderia: string
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaEmpresa: number | string
  empresa: { razonSocial: string; cuit?: string } | null
  camion: { patenteChasis: string } | null
  chofer: { nombre: string; apellido: string } | null
}

type FormViaje = {
  fechaViaje: string
  remito: string
  nroCtg: string
  cpe: string
  cupo: string
  mercaderia: string
  procedencia: string
  provinciaOrigen: string
  destino: string
  provinciaDestino: string
  kilos: string
  tarifa: string
  empresaId: string
  camionId: string
  choferId: string
}

function formDesdeViaje(v: ViajeJmAPI): FormViaje {
  return {
    fechaViaje: v.fechaViaje.slice(0, 10),
    remito: v.remito ?? "",
    nroCtg: v.nroCtg ?? "",
    cpe: v.cpe ?? "",
    cupo: v.cupo ?? "",
    mercaderia: v.mercaderia ?? "",
    procedencia: v.procedencia ?? "",
    provinciaOrigen: v.provinciaOrigen ?? "",
    destino: v.destino ?? "",
    provinciaDestino: v.provinciaDestino ?? "",
    kilos: v.kilos != null ? String(v.kilos) : "",
    tarifa: String(v.tarifaEmpresa ?? ""),
    empresaId: v.empresaId,
    camionId: v.camionId,
    choferId: v.choferId,
  }
}

function hayCambios(form: FormViaje, original: ViajeJmAPI): boolean {
  const o = formDesdeViaje(original)
  return (Object.keys(form) as (keyof FormViaje)[]).some((k) => String(form[k]) !== String(o[k]))
}

function inputCls(): string {
  return "w-full rounded px-2 py-1 text-sm border border-input bg-background hover:border-ring/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30"
}

function Cell({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground block mb-0.5">{label}</span>
      {children}
    </div>
  )
}

export function ModalDetalleViajeJm({
  viaje, empresas, camiones, choferes, onGuardar, onCerrar, onEliminar,
}: {
  viaje: ViajeJmAPI; empresas: Empresa[]; camiones: Camion[]; choferes: Chofer[]
  onGuardar: () => void; onCerrar: () => void; onEliminar?: () => void
}) {
  const [form, setForm] = useState<FormViaje>(formDesdeViaje(viaje))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setForm(formDesdeViaje(viaje))
    setError(null)
  }, [viaje.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const cambios = hayCambios(form, viaje)

  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const camionItems: SearchComboboxItem[] = camiones.map((c) => ({ id: c.id, label: c.patenteChasis }))
  const choferItems: SearchComboboxItem[] = choferes.map((c) => ({ id: c.id, label: `${c.apellido}, ${c.nombre}` }))
  const provinciaItems: SearchComboboxItem[] = PROVINCIAS_ARGENTINA.map((p) => ({ id: p, label: p }))

  async function handleGuardar() {
    setGuardando(true); setError(null)
    try {
      const kilosNum = form.kilos.trim() === "" ? null : Number(form.kilos)
      const tarifaNum = Number(form.tarifa)
      if (kilosNum != null && (!Number.isFinite(kilosNum) || kilosNum <= 0)) {
        setError("Kilos inválidos"); setGuardando(false); return
      }
      if (!Number.isFinite(tarifaNum) || tarifaNum <= 0) {
        setError("Tarifa inválida"); setGuardando(false); return
      }
      const body: Record<string, unknown> = {
        fechaViaje: form.fechaViaje,
        empresaId: form.empresaId,
        camionId: form.camionId,
        choferId: form.choferId,
        remito: form.remito.trim() || null,
        nroCtg: form.nroCtg.trim() || null,
        cpe: form.cpe.trim() || null,
        cupo: form.cupo.trim() || null,
        tieneCupo: form.cupo.trim().length > 0,
        tieneCtg: form.nroCtg.trim().length > 0,
        mercaderia: form.mercaderia.trim() || null,
        procedencia: form.procedencia.trim() || null,
        provinciaOrigen: form.provinciaOrigen || null,
        destino: form.destino.trim() || null,
        provinciaDestino: form.provinciaDestino || null,
        kilos: kilosNum,
        tarifaEmpresa: tarifaNum,
      }
      const res = await fetch(`/api/jm/viajes/${viaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const j = await res.json()
        setError(j.error ?? "Error al guardar")
        return
      }
      onGuardar()
    } catch {
      setError("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  const total = (() => {
    const k = Number(form.kilos), t = Number(form.tarifa)
    if (!Number.isFinite(k) || !Number.isFinite(t) || k <= 0 || t <= 0) return null
    return (k / 1000) * t
  })()

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl border shadow-xl w-full max-w-4xl max-h-[92vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold">Viaje del {formatearFecha(new Date(viaje.fechaViaje))}</h2>
          <button type="button" onClick={onCerrar} className="text-gray-400 hover:text-gray-700 text-2xl leading-none">×</button>
        </div>

        <div className="p-6 space-y-5">
          {/* Empresa / Camión / Chofer */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <Cell label="Empresa">
              <SearchCombobox items={empresaItems} value={form.empresaId} onChange={(v) => setForm({ ...form, empresaId: v })} placeholder="Empresa" />
            </Cell>
            <Cell label="Camión">
              <SearchCombobox items={camionItems} value={form.camionId} onChange={(v) => setForm({ ...form, camionId: v })} placeholder="Camión" />
            </Cell>
            <Cell label="Chofer">
              <SearchCombobox items={choferItems} value={form.choferId} onChange={(v) => setForm({ ...form, choferId: v })} placeholder="Chofer" />
            </Cell>
          </div>

          {/* Fecha / Documentación */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Cell label="Fecha">
              <input type="date" value={form.fechaViaje} onChange={(e) => setForm({ ...form, fechaViaje: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Cupo">
              <input type="text" value={form.cupo} onChange={(e) => setForm({ ...form, cupo: e.target.value.toUpperCase() })} style={{ textTransform: "uppercase" }} className={inputCls()} />
            </Cell>
            <Cell label="Remito">
              <input type="text" value={form.remito} onChange={(e) => setForm({ ...form, remito: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="CPE">
              <input type="text" value={form.cpe} onChange={(e) => setForm({ ...form, cpe: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="CTG">
              <input type="text" value={form.nroCtg} onChange={(e) => setForm({ ...form, nroCtg: e.target.value })} className={inputCls()} />
            </Cell>
          </div>

          {/* Origen / Destino */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Cell label="Procedencia">
              <input type="text" value={form.procedencia} onChange={(e) => setForm({ ...form, procedencia: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Provincia origen">
              <SearchCombobox items={provinciaItems} value={form.provinciaOrigen} onChange={(v) => setForm({ ...form, provinciaOrigen: v })} placeholder="Provincia" />
            </Cell>
            <Cell label="Destino">
              <input type="text" value={form.destino} onChange={(e) => setForm({ ...form, destino: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Provincia destino">
              <SearchCombobox items={provinciaItems} value={form.provinciaDestino} onChange={(v) => setForm({ ...form, provinciaDestino: v })} placeholder="Provincia" />
            </Cell>
          </div>

          {/* Mercadería / Kilos / Tarifa / Total */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <Cell label="Mercadería">
              <input type="text" value={form.mercaderia} onChange={(e) => setForm({ ...form, mercaderia: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Kilos">
              <input type="number" value={form.kilos} onChange={(e) => setForm({ ...form, kilos: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Tarifa">
              <input type="number" step="0.01" value={form.tarifa} onChange={(e) => setForm({ ...form, tarifa: e.target.value })} className={inputCls()} />
            </Cell>
            <Cell label="Total">
              <p className="text-sm font-semibold py-1">{total != null ? formatearMoneda(total) : "—"}</p>
            </Cell>
          </div>

          {error && <p className="text-sm text-red-600">{error}</p>}
        </div>

        <div className="sticky bottom-0 bg-white border-t px-6 py-3 flex items-center justify-between">
          {onEliminar ? (
            <button type="button" onClick={onEliminar} className="h-9 px-4 rounded-md border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50">Eliminar</button>
          ) : <div />}
          <div className="flex gap-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-gray-100">Cerrar</button>
            <button type="button" onClick={handleGuardar} disabled={!cambios || guardando}
              className="h-9 px-5 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40">
              {guardando ? "Guardando..." : "Guardar"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
