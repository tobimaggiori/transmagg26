"use client"

/**
 * ModalDetalleViaje — Modal compartido de detalle/edición de viaje.
 * Extraído de consultar-viajes-client para reutilizar en liquidar y consultar.
 */

import { useState, useEffect, useRef } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { UploadPDF } from "@/components/upload-pdf"

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }
export type Empresa = { id: string; razonSocial: string; cuit: string }
export type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }
export type Chofer = { id: string; nombre: string; apellido: string; email?: string }

export type ViajeDetalleAPI = {
  id: string
  fechaViaje: string
  remito: string | null
  tieneCupo: boolean
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifa: number
  tarifaEmpresa: number
  comisionPct: number | null
  toneladas: number
  total: number
  tieneCpe: boolean
  nroCartaPorte: string | null
  cartaPorteS3Key: string | null
  estadoLiquidacion: string
  estadoFactura: string
  esCamionPropio: boolean
  historialCambios: string | null
  fleteroId: string | null
  empresaId: string
  camionId: string
  choferId: string
  fletero: { razonSocial: string; cuit?: string } | null
  empresa: { razonSocial: string; cuit?: string } | null
  camion: { patenteChasis: string; tipoCamion: string | null } | null
  chofer: { nombre: string; apellido: string } | null
  enLiquidaciones: Array<{
    tarifaFletero: number; kilos: number | null; subtotal: number
    liquidacion: {
      id: string; estado: string; nroComprobante: number | null; ptoVenta: number | null
      comisionPct: number | null; ivaPct: number | null; pdfS3Key: string | null; grabadaEn: string
      pagos?: Array<{ ordenPago: { id: string; nro: number; anio: number; pdfS3Key: string | null; fecha: string } | null }>
    } | null
  }>
  enFacturas: Array<{
    tarifaEmpresa: number; kilos: number | null; subtotal: number
    factura: {
      id: string; nroComprobante: string | null; ptoVenta?: number | null
      estado: string; tipoCbte: number | null; ivaPct: number | null; pdfS3Key: string | null; emitidaEn: string
      recibo?: { id: string; nro: number; ptoVenta: number; pdfS3Key: string | null; fecha: string } | null
    } | null
  }>
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function formatNroComprobante(ptoVenta: number | null, nroComprobante: number | string | null): string {
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const nro = String(nroComprobante ?? 0).padStart(8, "0")
  return `${pv}-${nro}`
}

function formatKilos(kilos: number | null): string {
  if (kilos == null) return "—"
  return kilos.toLocaleString("es-AR")
}

function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, "")
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}

type FormViaje = {
  fechaViaje: string; remito: string; tieneCupo: boolean; cupo: string
  mercaderia: string; procedencia: string; provinciaOrigen: string
  destino: string; provinciaDestino: string; kilos: string
  tarifa: string; tarifaEmpresa: string; comisionPct: string
  empresaId: string; fleteroId: string; camionId: string; choferId: string
}

function formDesdeViaje(v: ViajeDetalleAPI): FormViaje {
  return {
    fechaViaje: v.fechaViaje.slice(0, 10),
    remito: v.remito ?? "", tieneCupo: v.tieneCupo, cupo: v.cupo ?? "",
    mercaderia: v.mercaderia ?? "", procedencia: v.procedencia ?? "",
    provinciaOrigen: v.provinciaOrigen ?? "", destino: v.destino ?? "",
    provinciaDestino: v.provinciaDestino ?? "", kilos: v.kilos != null ? String(v.kilos) : "",
    tarifa: String(v.tarifa ?? ""), tarifaEmpresa: String(v.tarifaEmpresa ?? ""),
    comisionPct: v.comisionPct != null ? String(v.comisionPct) : "",
    empresaId: v.empresaId, fleteroId: v.fleteroId ?? "",
    camionId: v.camionId, choferId: v.choferId ?? "",
  }
}

function hayCambios(form: FormViaje, original: ViajeDetalleAPI): boolean {
  const o = formDesdeViaje(original)
  return (Object.keys(form) as (keyof FormViaje)[]).some((k) => String(form[k]) !== String(o[k]))
}

type EntradaHistorial = { fecha: string; campo: string; valorAnterior: string; valorNuevo: string; motivo: string }

// ─── Sub-components ─────────────────────────────────────────────────────────

function EditableField({
  label, value, canEdit, editing, onToggleEdit, children, editLabel,
}: {
  label: string; value: React.ReactNode; canEdit: boolean; editing: boolean
  onToggleEdit: () => void; children: React.ReactNode; editLabel?: string
}) {
  return (
    <div>
      <span className="text-sm font-medium text-foreground">{label}</span>
      {editing ? (
        <div>{children}</div>
      ) : (
        <>
          <div className="text-sm font-medium">{value}</div>
          {canEdit && (
            <button type="button" onClick={onToggleEdit} className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline">
              {editLabel ?? "Modificar"}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function InlineInput({
  value, onChange, onConfirm, onCancel, type, step, placeholder,
}: {
  value: string; onChange: (v: string) => void; onConfirm: () => void; onCancel: () => void
  type?: string; step?: string; placeholder?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input type={type ?? "text"} step={step} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
        className="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" autoFocus />
      <button type="button" onClick={onConfirm} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">&#10003;</button>
      <button type="button" onClick={onCancel} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">&#10005;</button>
    </div>
  )
}

function ModalConfirmarSalida({ onSalir, onVolver }: { onSalir: () => void; onVolver: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 p-4">
      <div className="bg-white rounded-xl border shadow-lg w-full max-w-sm p-6 space-y-4">
        <p className="text-sm font-medium">Tenés cambios sin guardar.</p>
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onSalir} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-gray-100">
            Salir sin modificar el viaje
          </button>
          <button type="button" onClick={onVolver} className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700">
            Volver atrás
          </button>
        </div>
      </div>
    </div>
  )
}

function Badge({ si, label }: { si: boolean; label: string }) {
  return <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${si ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"}`}>{label}: {si ? "Sí" : "No"}</span>
}

async function abrirPDFUrl(endpoint: string) {
  try {
    const res = await fetch(endpoint)
    const data = await res.json()
    if (data.url) window.open(data.url, "_blank")
  } catch { /* ignore */ }
}

// ─── ModalDetalleViaje ──────────────────────────────────────────────────────

export function ModalDetalleViaje({
  viaje, empresas, fleteros, camiones, choferes, onGuardar, onCerrar, onEliminar,
}: {
  viaje: ViajeDetalleAPI; empresas: Empresa[]; fleteros: Fletero[]; camiones: Camion[]; choferes: Chofer[]
  onGuardar: () => void; onCerrar: () => void; onEliminar?: () => void
}) {
  const [form, setForm] = useState<FormViaje>(formDesdeViaje(viaje))
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [subiendoCPE, setSubiendoCPE] = useState(false)
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false)
  const [agregandoCPE, setAgregandoCPE] = useState(false)
  const [nuevoCPENro, setNuevoCPENro] = useState("")
  const [nuevoCPEKey, setNuevoCPEKey] = useState("")
  const cpeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(formDesdeViaje(viaje))
    setError(null)
    setMotivo("")
    setEditingFields(new Set())
    setMostrarHistorial(false)
    setAgregandoCPE(false)
    setNuevoCPENro("")
    setNuevoCPEKey("")
  }, [viaje.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const tieneLP = viaje.estadoLiquidacion === "LIQUIDADO"
  const tieneFactura = viaje.estadoFactura === "FACTURADO"
  const cambios = hayCambios(form, viaje)

  // Lookup de cupo: si este viaje comparte cupo con otros viajes pendientes
  // de facturar de la misma empresa, los campos lockeados no se pueden
  // editar individualmente — solo en bloque desde el sub-modal.
  type ViajeHermano = { id: string; fechaViaje: string; remito: string | null; nroCartaPorte: string | null; kilos: number | null }
  const [hermanos, setHermanos] = useState<ViajeHermano[]>([])
  const [bulkEditOpen, setBulkEditOpen] = useState(false)

  useEffect(() => {
    if (!viaje.tieneCupo || !viaje.cupo || viaje.estadoFactura !== "PENDIENTE_FACTURAR") {
      setHermanos([])
      return
    }
    let cancelado = false
    fetch(`/api/empresas/${viaje.empresaId}/viajes-cupo?cupo=${encodeURIComponent(viaje.cupo)}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelado || !data || !data.existe) { setHermanos([]); return }
        // Filtrar el viaje actual del array de hermanos (puede ser fuente o resto)
        const todos: ViajeHermano[] = [data.fuente, ...(data.hermanos ?? [])]
        setHermanos(todos.filter((v) => v.id !== viaje.id))
      })
      .catch(() => { if (!cancelado) setHermanos([]) })
    return () => { cancelado = true }
  }, [viaje.id, viaje.tieneCupo, viaje.cupo, viaje.empresaId, viaje.estadoFactura])

  const cupoBloqueado = hermanos.length > 0

  const empresaCambio = form.empresaId !== viaje.empresaId
  const fleteroCambio = form.fleteroId !== (viaje.fleteroId ?? "")
  const requiereMotivo = empresaCambio || fleteroCambio
  const motivoValido = !requiereMotivo || motivo.trim().length >= 10

  const puedeEditarTodo = !tieneLP
  const puedeEditarParcial = tieneLP && !tieneFactura

  // Si el viaje comparte cupo con otros pendientes, los campos lockeados solo
  // pueden editarse en bloque desde el sub-modal (no individualmente).
  const editable: Record<string, boolean> = {
    fleteroId: puedeEditarTodo && !cupoBloqueado,
    empresaId: (puedeEditarTodo || puedeEditarParcial) && !cupoBloqueado,
    choferId: puedeEditarTodo && !cupoBloqueado,
    camionId: puedeEditarTodo && !cupoBloqueado,
    fechaViaje: puedeEditarTodo,
    remito: puedeEditarTodo,
    tieneCupo: puedeEditarTodo && !cupoBloqueado,
    cupo: puedeEditarTodo && !cupoBloqueado,
    mercaderia: puedeEditarTodo && !cupoBloqueado,
    procedencia: puedeEditarTodo && !cupoBloqueado,
    provinciaOrigen: puedeEditarTodo && !cupoBloqueado,
    destino: puedeEditarTodo && !cupoBloqueado,
    provinciaDestino: puedeEditarTodo && !cupoBloqueado,
    kilos: puedeEditarTodo || puedeEditarParcial,
    tarifa: puedeEditarTodo && !cupoBloqueado,
    tarifaEmpresa: (puedeEditarTodo || puedeEditarParcial) && !cupoBloqueado,
    comisionPct: puedeEditarTodo && !cupoBloqueado,
  }

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const camionesDisponibles = camiones.filter((c) => form.fleteroId ? c.fleteroId === form.fleteroId : c.esPropio)

  function setField<K extends keyof FormViaje>(key: K, value: FormViaje[K]) { setForm((prev) => ({ ...prev, [key]: value })) }
  function isEditing(field: string) { return editingFields.has(field) }
  function toggleEdit(field: string) { setEditingFields((prev) => { const n = new Set(prev); if (n.has(field)) n.delete(field); else n.add(field); return n }) }
  function closeEdit(field: string) { setEditingFields((prev) => { const n = new Set(prev); n.delete(field); return n }) }
  function cancelEdit(field: string) { const o = formDesdeViaje(viaje); setField(field as keyof FormViaje, o[field as keyof FormViaje]); closeEdit(field) }

  const fleteroItems: SearchComboboxItem[] = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const choferItems: SearchComboboxItem[] = choferes.map((c) => ({ id: c.id, label: `${c.nombre} ${c.apellido}`, sublabel: c.email }))

  const fleteroDisplay = form.fleteroId ? fleteros.find((f) => f.id === form.fleteroId) : null
  const empresaDisplay = form.empresaId ? empresas.find((e) => e.id === form.empresaId) : null
  const choferDisplay = form.choferId ? choferes.find((c) => c.id === form.choferId) : null
  const camionDisplay = form.camionId ? camiones.find((c) => c.id === form.camionId) : null

  function handleIntentoCerrar() {
    if (cambios) { setMostrarConfirmarSalida(true) } else { onCerrar() }
  }

  async function handleGuardar() {
    if (!motivoValido) return
    setGuardando(true); setError(null)
    try {
      const body: Record<string, unknown> = {}
      const original = formDesdeViaje(viaje)
      if (form.fechaViaje !== original.fechaViaje) body.fechaViaje = form.fechaViaje
      if (form.remito !== original.remito) body.remito = form.remito || null
      if (form.tieneCupo !== original.tieneCupo) body.tieneCupo = form.tieneCupo
      if (form.cupo !== original.cupo) body.cupo = form.cupo || null
      if (form.mercaderia !== original.mercaderia) body.mercaderia = form.mercaderia || null
      if (form.procedencia !== original.procedencia) body.procedencia = form.procedencia || null
      if (form.provinciaOrigen !== original.provinciaOrigen) body.provinciaOrigen = form.provinciaOrigen || null
      if (form.destino !== original.destino) body.destino = form.destino || null
      if (form.provinciaDestino !== original.provinciaDestino) body.provinciaDestino = form.provinciaDestino || null
      if (form.kilos !== original.kilos) body.kilos = form.kilos ? parseFloat(form.kilos) : null
      if (form.tarifa !== original.tarifa) body.tarifa = form.tarifa ? Number(form.tarifa) : undefined
      if (form.tarifaEmpresa !== original.tarifaEmpresa) body.tarifaEmpresa = form.tarifaEmpresa ? Number(form.tarifaEmpresa) : undefined
      if (form.comisionPct !== original.comisionPct) body.comisionPct = form.comisionPct ? Number(form.comisionPct) : null
      if (empresaCambio) { body.empresaId = form.empresaId; body.motivoCambioEmpresa = motivo.trim() }
      if (fleteroCambio) { body.fleteroId = form.fleteroId || null; body.motivoCambioFletero = motivo.trim() }
      if (form.camionId !== original.camionId) body.camionId = form.camionId
      if (form.choferId !== original.choferId) body.choferId = form.choferId
      if (Object.keys(body).length === 0) return
      const res = await fetch(`/api/viajes/${viaje.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al guardar"); return }
      setMotivo(""); setEditingFields(new Set()); onGuardar()
    } catch { setError("Error de red") } finally { setGuardando(false) }
  }

  async function handleCPEUpload(file: File) {
    setSubiendoCPE(true); setError(null)
    try {
      const fd = new FormData(); fd.append("file", file); fd.append("prefijo", "cartas-porte")
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: fd })
      if (!uploadRes.ok) { setError("Error al subir el PDF"); return }
      const { key } = await uploadRes.json()
      const patchRes = await fetch(`/api/viajes/${viaje.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ cartaPorteS3Key: key }) })
      if (!patchRes.ok) { setError("Error al actualizar el viaje"); return }
      onGuardar()
    } catch { setError("Error de red al subir CPE") } finally { setSubiendoCPE(false) }
  }

  async function handleAgregarCPE() {
    if (!nuevoCPENro.trim() || !nuevoCPEKey) return
    setError(null)
    try {
      const res = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tieneCpe: true, nroCartaPorte: nuevoCPENro.trim(), cartaPorteS3Key: nuevoCPEKey }),
      })
      if (!res.ok) { const j = await res.json(); setError(j.error ?? "Error"); return }
      setAgregandoCPE(false); onGuardar()
    } catch { setError("Error de red") }
  }

  async function handleVerCPE() {
    if (!viaje.cartaPorteS3Key) return
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(viaje.cartaPorteS3Key)}`)
      if (!res.ok) return
      const { url } = await res.json()
      window.open(url, "_blank")
    } catch { /* ignore */ }
  }

  const secCls = "rounded-xl border border-border bg-card"
  const secHeaderCls = "px-4 py-2.5 border-b border-border flex items-center gap-2"
  const secTitleCls = "text-sm font-semibold text-foreground"
  const secBodyCls = "px-4 py-3"
  const dataCls = "text-sm text-foreground font-medium"
  const labelSmCls = "text-xs text-muted-foreground"
  const pdfBtnCls = "text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"
  const linkCls = "text-xs text-primary hover:text-primary/80 hover:underline font-medium"

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4" onClick={handleIntentoCerrar}>
        <div className="bg-background rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col" onClick={(e) => e.stopPropagation()}>
          {/* Header */}
          <div className="sticky top-0 z-10 bg-card border-b border-border px-6 py-4 flex items-center justify-between rounded-t-2xl shrink-0">
            <div>
              <h2 className="text-xl font-bold text-foreground">Detalle del viaje</h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm text-muted-foreground">{formatearFecha(new Date(viaje.fechaViaje))}</span>
                <Badge si={tieneLP} label="Liquidado" />
                <Badge si={tieneFactura} label="Facturado" />
                {viaje.esCamionPropio && <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-info-soft text-info">Camión propio</span>}
              </div>
            </div>
            <button type="button" onClick={handleIntentoCerrar} className="rounded-lg p-2 hover:bg-accent text-muted-foreground hover:text-foreground transition-colors text-xl leading-none">&times;</button>
          </div>

          {/* Banner cupo bloqueado */}
          {cupoBloqueado && (
            <div className="bg-amber-50 border-b border-amber-200 px-6 py-3 flex items-center justify-between gap-4 flex-wrap">
              <div className="text-sm text-amber-900">
                Este viaje comparte el cupo <strong>{viaje.cupo}</strong> con{" "}
                <strong>{hermanos.length} {hermanos.length === 1 ? "viaje pendiente" : "viajes pendientes"}</strong> de facturar.
                Solo se pueden modificar kilos, fecha, remito y carta de porte.
              </div>
              <button
                type="button"
                onClick={() => setBulkEditOpen(true)}
                className="text-sm font-medium text-amber-900 underline whitespace-nowrap"
              >
                Editar campos compartidos →
              </button>
            </div>
          )}

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4">

            {/* Participantes */}
            <div className={secCls}>
              <div className={secHeaderCls}><h3 className={secTitleCls}>Participantes</h3></div>
              <div className={secBodyCls}>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-x-4 gap-y-3">
                  <EditableField label="Fletero" editLabel="Cambiar" canEdit={editable.fleteroId} editing={isEditing("fleteroId")} onToggleEdit={() => toggleEdit("fleteroId")}
                    value={<div><p className={dataCls}>{fleteroDisplay?.razonSocial ?? (form.fleteroId ? "—" : "Camión propio")}</p>{fleteroDisplay && <p className={labelSmCls}>CUIT: {formatCuit(fleteroDisplay.cuit)}</p>}</div>}>
                    <SearchCombobox items={[{ id: "", label: "Camión propio" }, ...fleteroItems]} value={form.fleteroId}
                      onChange={(id) => { setField("fleteroId", id); setField("camionId", ""); closeEdit("fleteroId") }} placeholder="Buscar fletero..." />
                  </EditableField>
                  <EditableField label="Empresa" editLabel="Cambiar" canEdit={editable.empresaId} editing={isEditing("empresaId")} onToggleEdit={() => toggleEdit("empresaId")}
                    value={<div><p className={dataCls}>{empresaDisplay?.razonSocial ?? "—"}</p>{empresaDisplay && <p className={labelSmCls}>CUIT: {formatCuit(empresaDisplay.cuit)}</p>}</div>}>
                    <SearchCombobox items={empresaItems} value={form.empresaId}
                      onChange={(id) => { setField("empresaId", id); closeEdit("empresaId") }} placeholder="Buscar empresa..." />
                  </EditableField>
                  <EditableField label="Chofer" editLabel="Cambiar" canEdit={editable.choferId} editing={isEditing("choferId")} onToggleEdit={() => toggleEdit("choferId")}
                    value={<span className={dataCls}>{choferDisplay ? `${choferDisplay.nombre} ${choferDisplay.apellido}` : (viaje.chofer ? `${viaje.chofer.nombre} ${viaje.chofer.apellido}` : "—")}</span>}>
                    <SearchCombobox items={choferItems} value={form.choferId} onChange={(id) => { setField("choferId", id); closeEdit("choferId") }} placeholder="Buscar chofer..." />
                  </EditableField>
                  <EditableField label="Camión" editLabel="Cambiar" canEdit={editable.camionId} editing={isEditing("camionId")} onToggleEdit={() => toggleEdit("camionId")}
                    value={<span className={dataCls}>{camionDisplay?.patenteChasis ?? "—"}</span>}>
                    <div className="flex items-center gap-1.5">
                      <select value={form.camionId} onChange={(e) => setField("camionId", e.target.value)} className="flex-1 rounded-md border bg-background px-2 py-1 text-sm" autoFocus>
                        <option value="">-- Seleccionar --</option>
                        {camionesDisponibles.map((c) => <option key={c.id} value={c.id}>{c.patenteChasis}</option>)}
                      </select>
                      <button type="button" onClick={() => closeEdit("camionId")} className="h-7 w-7 rounded-md bg-success text-white text-sm hover:bg-success/90 flex items-center justify-center">&#10003;</button>
                      <button type="button" onClick={() => cancelEdit("camionId")} className="h-7 w-7 rounded-md border text-muted-foreground text-sm hover:bg-accent flex items-center justify-center">&#10005;</button>
                    </div>
                  </EditableField>
                </div>
                {!viaje.esCamionPropio && (
                  <div className="mt-2">
                    <EditableField label="Comisión %" canEdit={editable.comisionPct} editing={isEditing("comisionPct")} onToggleEdit={() => toggleEdit("comisionPct")}
                      value={<span className={dataCls}>{form.comisionPct ? `${form.comisionPct}%` : (viaje.comisionPct != null ? `${viaje.comisionPct}%` : "—")}</span>}>
                      <InlineInput type="number" step="0.01" value={form.comisionPct} onChange={(v) => setField("comisionPct", v)} onConfirm={() => closeEdit("comisionPct")} onCancel={() => cancelEdit("comisionPct")} />
                    </EditableField>
                  </div>
                )}
              </div>
            </div>

            {/* Recorrido + Operación */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={secCls}>
                <div className={secHeaderCls}><h3 className={secTitleCls}>Recorrido</h3></div>
                <div className={secBodyCls}>
                  <div className="grid grid-cols-2 gap-4">
                    <EditableField label="Origen" canEdit={editable.procedencia} editing={isEditing("origen")} onToggleEdit={() => toggleEdit("origen")}
                      value={<div><p className={dataCls}>{viaje.procedencia || "—"}</p>{viaje.provinciaOrigen && <p className={labelSmCls}>{viaje.provinciaOrigen}</p>}</div>}>
                      <div className="space-y-2">
                        <input type="text" value={form.procedencia} onChange={(e) => setField("procedencia", e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm" placeholder="Ciudad" autoFocus />
                        <select value={form.provinciaOrigen} onChange={(e) => setField("provinciaOrigen", e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
                          <option value="">— Provincia —</option>
                          {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => closeEdit("origen")} className="h-7 w-7 rounded-md bg-success text-white text-sm hover:bg-success/90 flex items-center justify-center">&#10003;</button>
                          <button type="button" onClick={() => cancelEdit("origen")} className="h-7 w-7 rounded-md border text-muted-foreground text-sm hover:bg-accent flex items-center justify-center">&#10005;</button>
                        </div>
                      </div>
                    </EditableField>
                    <EditableField label="Destino" canEdit={editable.destino} editing={isEditing("destino")} onToggleEdit={() => toggleEdit("destino")}
                      value={<div><p className={dataCls}>{viaje.destino || "—"}</p>{viaje.provinciaDestino && <p className={labelSmCls}>{viaje.provinciaDestino}</p>}</div>}>
                      <div className="space-y-2">
                        <input type="text" value={form.destino} onChange={(e) => setField("destino", e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm" placeholder="Ciudad" autoFocus />
                        <select value={form.provinciaDestino} onChange={(e) => setField("provinciaDestino", e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm">
                          <option value="">— Provincia —</option>
                          {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => closeEdit("destino")} className="h-7 w-7 rounded-md bg-success text-white text-sm hover:bg-success/90 flex items-center justify-center">&#10003;</button>
                          <button type="button" onClick={() => cancelEdit("destino")} className="h-7 w-7 rounded-md border text-muted-foreground text-sm hover:bg-accent flex items-center justify-center">&#10005;</button>
                        </div>
                      </div>
                    </EditableField>
                  </div>
                </div>
              </div>

              <div className={secCls}>
                <div className={secHeaderCls}><h3 className={secTitleCls}>Operación</h3></div>
                <div className={secBodyCls}>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3">
                    <EditableField label="Fecha" canEdit={editable.fechaViaje} editing={isEditing("fechaViaje")} onToggleEdit={() => toggleEdit("fechaViaje")}
                      value={<span className={dataCls}>{formatearFecha(new Date(viaje.fechaViaje))}</span>}>
                      <InlineInput type="date" value={form.fechaViaje} onChange={(v) => setField("fechaViaje", v)} onConfirm={() => closeEdit("fechaViaje")} onCancel={() => cancelEdit("fechaViaje")} />
                    </EditableField>
                    <EditableField label="Mercadería" canEdit={editable.mercaderia} editing={isEditing("mercaderia")} onToggleEdit={() => toggleEdit("mercaderia")}
                      value={<span className={dataCls}>{viaje.mercaderia || "—"}</span>}>
                      <InlineInput value={form.mercaderia} onChange={(v) => setField("mercaderia", v)} onConfirm={() => closeEdit("mercaderia")} onCancel={() => cancelEdit("mercaderia")} />
                    </EditableField>
                    <EditableField label="Remito" canEdit={editable.remito} editing={isEditing("remito")} onToggleEdit={() => toggleEdit("remito")}
                      value={<span className={dataCls}>{viaje.remito || "—"}</span>}>
                      <InlineInput value={form.remito} onChange={(v) => setField("remito", v)} onConfirm={() => closeEdit("remito")} onCancel={() => cancelEdit("remito")} placeholder="Nro remito" />
                    </EditableField>
                    <EditableField label="Kilos" canEdit={editable.kilos} editing={isEditing("kilos")} onToggleEdit={() => toggleEdit("kilos")}
                      value={<span className={dataCls}>{formatKilos(form.kilos ? Number(form.kilos) : viaje.kilos)}</span>}>
                      <InlineInput type="number" value={form.kilos} onChange={(v) => setField("kilos", v)} onConfirm={() => closeEdit("kilos")} onCancel={() => cancelEdit("kilos")} />
                    </EditableField>
                    <EditableField label="Tarifa Fletero" canEdit={editable.tarifa} editing={isEditing("tarifa")} onToggleEdit={() => toggleEdit("tarifa")}
                      value={<span className={dataCls}>{formatearMoneda(form.tarifa ? Number(form.tarifa) : viaje.tarifa)}</span>}>
                      <InlineInput type="number" step="0.01" value={form.tarifa} onChange={(v) => setField("tarifa", v)} onConfirm={() => closeEdit("tarifa")} onCancel={() => cancelEdit("tarifa")} />
                    </EditableField>
                    <EditableField label="Tarifa Empresa" canEdit={editable.tarifaEmpresa} editing={isEditing("tarifaEmpresa")} onToggleEdit={() => toggleEdit("tarifaEmpresa")}
                      value={<span className={dataCls}>{formatearMoneda(form.tarifaEmpresa ? Number(form.tarifaEmpresa) : viaje.tarifaEmpresa)}</span>}>
                      <InlineInput type="number" step="0.01" value={form.tarifaEmpresa} onChange={(v) => setField("tarifaEmpresa", v)} onConfirm={() => closeEdit("tarifaEmpresa")} onCancel={() => cancelEdit("tarifaEmpresa")} />
                    </EditableField>
                  </div>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3 mt-3">
                    <EditableField label="Cupo" canEdit={editable.tieneCupo} editing={isEditing("cupo")} onToggleEdit={() => toggleEdit("cupo")}
                      editLabel={viaje.tieneCupo ? "Modificar" : "Agregar cupo"}
                      value={<span className={dataCls}>{viaje.tieneCupo ? (viaje.cupo || "Sí") : "No"}</span>}>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <button type="button" onClick={() => setField("tieneCupo", !form.tieneCupo)}
                            className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${form.tieneCupo ? "bg-primary" : "bg-muted"}`}>
                            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${form.tieneCupo ? "translate-x-4" : "translate-x-0.5"}`} />
                          </button>
                          <span className="text-sm">{form.tieneCupo ? "Sí" : "No"}</span>
                        </div>
                        {form.tieneCupo && <input type="text" value={form.cupo} onChange={(e) => setField("cupo", e.target.value)} className="w-full rounded-md border bg-background px-2 py-1 text-sm" placeholder="Nro cupo" />}
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => closeEdit("cupo")} className="h-7 w-7 rounded-md bg-success text-white text-sm hover:bg-success/90 flex items-center justify-center">&#10003;</button>
                          <button type="button" onClick={() => cancelEdit("cupo")} className="h-7 w-7 rounded-md border text-muted-foreground text-sm hover:bg-accent flex items-center justify-center">&#10005;</button>
                        </div>
                      </div>
                    </EditableField>

                    {/* CPE */}
                    <div>
                      <span className="text-sm font-medium text-foreground">CPE / Carta de Porte</span>
                      {viaje.tieneCpe && viaje.nroCartaPorte ? (
                        <div className="mt-0.5">
                          <p className={dataCls}>{viaje.nroCartaPorte}</p>
                          <div className="flex items-center gap-2 mt-1 flex-wrap">
                            {viaje.cartaPorteS3Key && <button type="button" onClick={handleVerCPE} className={pdfBtnCls}>VER CPE</button>}
                            <button type="button" onClick={() => cpeInputRef.current?.click()} disabled={subiendoCPE} className={`${linkCls} disabled:opacity-50`}>
                              {subiendoCPE ? "Subiendo..." : "Cambiar PDF"}
                            </button>
                            <input ref={cpeInputRef} type="file" accept=".pdf" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleCPEUpload(f); e.target.value = "" }} />
                          </div>
                        </div>
                      ) : agregandoCPE ? (
                        <div className="space-y-2 mt-1">
                          <input type="text" value={nuevoCPENro} onChange={(e) => setNuevoCPENro(e.target.value)} placeholder="Nro carta de porte" className="w-full rounded-md border bg-background px-2 py-1 text-sm" />
                          <UploadPDF prefijo="cartas-de-porte" onUpload={(key) => setNuevoCPEKey(key)} label="Subir PDF" s3Key={nuevoCPEKey || undefined} />
                          <div className="flex gap-1.5">
                            <button type="button" onClick={handleAgregarCPE} disabled={!nuevoCPENro.trim() || !nuevoCPEKey} className="text-xs px-2.5 py-1 rounded-md bg-success text-white hover:bg-success/90 disabled:opacity-40 font-medium">Guardar CPE</button>
                            <button type="button" onClick={() => setAgregandoCPE(false)} className="text-xs px-2.5 py-1 rounded-md border hover:bg-accent font-medium">Cancelar</button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-0.5">
                          <p className={dataCls}>No</p>
                          <button type="button" onClick={() => setAgregandoCPE(true)} className={linkCls}>Agregar CPE</button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Comprobantes */}
            <div className={secCls}>
              <div className={secHeaderCls}><h3 className={secTitleCls}>Comprobantes</h3></div>
              <div className={secBodyCls}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="rounded-lg border border-border bg-accent/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Facturación</h4>
                      <Badge si={tieneFactura} label="Facturado" />
                    </div>
                    {viaje.estadoFactura === "PENDIENTE_FACTURAR" ? (
                      <p className="text-sm text-muted-foreground italic">Aún no facturado</p>
                    ) : (() => {
                      const factura = viaje.enFacturas?.[0]?.factura
                      if (!factura) return null
                      const nroFact = formatNroComprobante(factura.ptoVenta ?? null, factura.nroComprobante)
                      return (
                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={labelSmCls}>Factura</p>
                              <p className="font-mono font-semibold">{nroFact}</p>
                              <p className={labelSmCls}>{formatearFecha(new Date(factura.emitidaEn))}</p>
                            </div>
                            <button type="button" onClick={() => abrirPDFUrl(`/api/facturas/${factura.id}/pdf`)} className={pdfBtnCls}>VER FACTURA</button>
                          </div>
                          <hr className="border-border" />
                          {factura.recibo ? (
                            <div className="flex items-center justify-between">
                              <div>
                                <p className={labelSmCls}>Recibo</p>
                                <p className="font-mono font-semibold">{formatNroComprobante(factura.recibo.ptoVenta, factura.recibo.nro)}</p>
                                <p className={labelSmCls}>{formatearFecha(new Date(factura.recibo.fecha))}</p>
                              </div>
                              <button type="button" onClick={() => abrirPDFUrl(`/api/recibos-cobranza/${factura.recibo!.id}/pdf`)} className={pdfBtnCls}>VER RECIBO</button>
                            </div>
                          ) : <p className="text-sm text-muted-foreground italic">Aún no cobrado</p>}
                        </div>
                      )
                    })()}
                  </div>

                  <div className="rounded-lg border border-border bg-accent/30 p-3.5 space-y-2">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold text-foreground">Liquidación</h4>
                      <Badge si={tieneLP} label="Liquidado" />
                    </div>
                    {viaje.estadoLiquidacion === "PENDIENTE_LIQUIDAR" ? (
                      <p className="text-sm text-muted-foreground italic">Aún no liquidado</p>
                    ) : (() => {
                      const liq = viaje.enLiquidaciones?.[0]?.liquidacion
                      if (!liq) return null
                      const nroLP = formatNroComprobante(liq.ptoVenta, liq.nroComprobante)
                      const pagosConOP = (liq.pagos ?? []).filter((p) => p.ordenPago != null)
                      return (
                        <div className="space-y-2.5 text-sm">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className={labelSmCls}>Líquido Producto</p>
                              <p className="font-mono font-semibold">{nroLP}</p>
                              <p className={labelSmCls}>{formatearFecha(new Date(liq.grabadaEn))}</p>
                            </div>
                            <button type="button" onClick={() => abrirPDFUrl(`/api/liquidaciones/${liq.id}/pdf`)} className={pdfBtnCls}>VER LP</button>
                          </div>
                          <hr className="border-border" />
                          {pagosConOP.length > 0 ? pagosConOP.map((pago, i) => (
                            <div key={i} className="flex items-center justify-between">
                              <div>
                                <p className={labelSmCls}>Orden de Pago</p>
                                <p className="font-mono font-semibold">#{pago.ordenPago!.nro}-{pago.ordenPago!.anio}</p>
                                <p className={labelSmCls}>{formatearFecha(new Date(pago.ordenPago!.fecha))}</p>
                              </div>
                              <button type="button" onClick={() => window.open(`/api/ordenes-pago/${pago.ordenPago!.id}/pdf`, "_blank")} className={pdfBtnCls}>VER ORDEN</button>
                            </div>
                          )) : <p className="text-sm text-muted-foreground italic">Aún no pagado</p>}
                        </div>
                      )
                    })()}
                  </div>
                </div>
              </div>
            </div>

            {/* Motivo del cambio */}
            {requiereMotivo && (
              <div className={secCls}>
                <div className={`${secBodyCls} space-y-2`}>
                  <label className="text-sm font-medium text-foreground">Motivo del cambio <span className="text-muted-foreground font-normal">(mín. 10 caracteres)</span></label>
                  <textarea value={motivo} onChange={(e) => setMotivo(e.target.value)} rows={2} className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none" placeholder="Ej: Reasignación por acuerdo comercial..." />
                  <p className="text-xs text-muted-foreground text-right">{motivo.trim().length}/10 mín.</p>
                </div>
              </div>
            )}

            {error && <div className="p-3 bg-error-soft text-error rounded-lg text-sm border border-error/20">{error}</div>}

            {/* Historial */}
            {historial.length > 0 && (
              <div className={secCls}>
                <div className={secBodyCls}>
                  <button type="button" onClick={() => setMostrarHistorial((v) => !v)} className="text-sm text-muted-foreground hover:text-foreground font-medium transition-colors">
                    {mostrarHistorial ? "Ocultar historial" : `Historial de cambios (${historial.length})`}
                  </button>
                  {mostrarHistorial && (
                    <div className="mt-3 space-y-2">
                      {historial.map((e, i) => (
                        <div key={i} className="rounded-lg border border-border bg-accent/30 px-3 py-2.5 text-sm space-y-0.5">
                          <p className="text-muted-foreground text-xs">{formatearFecha(new Date(e.fecha))}</p>
                          <p><span className="font-medium">{e.valorAnterior}</span>{" → "}<span className="font-medium">{e.valorNuevo}</span></p>
                          <p className="text-muted-foreground italic text-xs">&ldquo;{e.motivo}&rdquo;</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Footer sticky */}
          <div className="sticky bottom-0 bg-card border-t border-border px-6 py-3 flex items-center gap-3 rounded-b-2xl shrink-0">
            {cambios && motivoValido && (
              <button type="button" onClick={handleGuardar} disabled={guardando} className="h-9 px-4 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors">
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            {onEliminar && viaje.enLiquidaciones.length === 0 && viaje.enFacturas.length === 0 && (
              <button type="button" onClick={onEliminar} className="h-9 px-4 rounded-lg border border-error/30 text-error text-sm font-medium hover:bg-error-soft transition-colors">Eliminar viaje</button>
            )}
          </div>
        </div>
      </div>

      {mostrarConfirmarSalida && (
        <ModalConfirmarSalida onSalir={() => { setMostrarConfirmarSalida(false); onCerrar() }} onVolver={() => setMostrarConfirmarSalida(false)} />
      )}

      {bulkEditOpen && cupoBloqueado && viaje.cupo && (
        <ModalBulkEditCupo
          empresaId={viaje.empresaId}
          cupo={viaje.cupo}
          empresaNombre={viaje.empresa?.razonSocial ?? "—"}
          viajeActual={{ id: viaje.id, fechaViaje: viaje.fechaViaje, remito: viaje.remito, nroCartaPorte: viaje.nroCartaPorte, kilos: viaje.kilos }}
          hermanos={hermanos}
          fleteros={fleteros}
          empresas={empresas}
          camiones={camiones}
          choferes={choferes}
          valoresActuales={{
            mercaderia: viaje.mercaderia,
            procedencia: viaje.procedencia,
            provinciaOrigen: viaje.provinciaOrigen,
            destino: viaje.destino,
            provinciaDestino: viaje.provinciaDestino,
            tarifa: viaje.tarifa,
            comisionPct: viaje.comisionPct,
            fleteroId: viaje.fleteroId,
            camionId: viaje.camionId,
            choferId: viaje.choferId,
          }}
          onCancelar={() => setBulkEditOpen(false)}
          onAplicado={() => { setBulkEditOpen(false); onGuardar() }}
        />
      )}
    </>
  )
}

// ─── Sub-modal: edición en bloque de campos compartidos por cupo ─────────────

function ModalBulkEditCupo({
  empresaId,
  cupo,
  empresaNombre,
  viajeActual,
  hermanos,
  fleteros,
  empresas: _empresas,
  camiones,
  choferes,
  valoresActuales,
  onCancelar,
  onAplicado,
}: {
  empresaId: string
  cupo: string
  empresaNombre: string
  viajeActual: { id: string; fechaViaje: string; remito: string | null; nroCartaPorte: string | null; kilos: number | null }
  hermanos: Array<{ id: string; fechaViaje: string; remito: string | null; nroCartaPorte: string | null; kilos: number | null }>
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  valoresActuales: {
    mercaderia: string | null
    procedencia: string | null
    provinciaOrigen: string | null
    destino: string | null
    provinciaDestino: string | null
    tarifa: number
    comisionPct: number | null
    fleteroId: string | null
    camionId: string
    choferId: string
  }
  onCancelar: () => void
  onAplicado: () => void
}) {
  void _empresas
  type Campo =
    | "mercaderia" | "procedencia" | "provinciaOrigen" | "destino" | "provinciaDestino"
    | "tarifa" | "comisionPct" | "fleteroId" | "camionId" | "choferId"

  const labels: Record<Campo, string> = {
    mercaderia: "Mercadería",
    procedencia: "Procedencia (ciudad)",
    provinciaOrigen: "Provincia origen",
    destino: "Destino (ciudad)",
    provinciaDestino: "Provincia destino",
    tarifa: "Tarifa / ton",
    comisionPct: "Comisión %",
    fleteroId: "Fletero",
    camionId: "Camión",
    choferId: "Chofer",
  }

  const [campo, setCampo] = useState<Campo>("mercaderia")
  const [valor, setValor] = useState<string>("")
  const [justificacion, setJustificacion] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const todosLosViajes = [viajeActual, ...hermanos]

  function valorActualDe(c: Campo): string {
    const v = valoresActuales[c]
    if (v == null) return "—"
    return String(v)
  }

  function buildCampos(): Record<string, unknown> | null {
    if (!valor.trim() && campo !== "comisionPct" && campo !== "procedencia" && campo !== "destino") return null
    const v = valor.trim()
    switch (campo) {
      case "mercaderia": return { mercaderia: v }
      case "procedencia": return { procedencia: v || null }
      case "destino": return { destino: v || null }
      case "provinciaOrigen": return { provinciaOrigen: v }
      case "provinciaDestino": return { provinciaDestino: v }
      case "tarifa": {
        const n = parseFloat(v)
        if (!Number.isFinite(n) || n <= 0) return null
        return { tarifa: n }
      }
      case "comisionPct": {
        if (v === "") return { comisionPct: null }
        const n = parseFloat(v)
        if (!Number.isFinite(n) || n < 0 || n > 100) return null
        return { comisionPct: n }
      }
      case "fleteroId": return { fleteroId: v || null }
      case "camionId": return { camionId: v }
      case "choferId": return { choferId: v }
    }
  }

  async function aplicar() {
    setError(null)
    const campos = buildCampos()
    if (!campos) { setError("Ingresá un valor válido"); return }
    if (justificacion.trim().length < 5) { setError("La justificación debe tener al menos 5 caracteres"); return }
    setEnviando(true)
    try {
      const res = await fetch("/api/viajes/cupo-bulk", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ empresaId, cupo, justificacion: justificacion.trim(), campos }),
      })
      const data = await res.json()
      if (!res.ok) { setError(data.error ?? "Error al aplicar"); return }
      onAplicado()
    } catch {
      setError("Error de red")
    } finally {
      setEnviando(false)
    }
  }

  function renderEditor() {
    if (campo === "fleteroId") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className="w-full h-9 rounded border border-input bg-background px-2 text-sm">
          <option value="">— Camión propio —</option>
          {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
        </select>
      )
    }
    if (campo === "camionId") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className="w-full h-9 rounded border border-input bg-background px-2 text-sm">
          <option value="">Seleccionar...</option>
          {camiones.map((c) => <option key={c.id} value={c.id}>{c.patenteChasis}</option>)}
        </select>
      )
    }
    if (campo === "choferId") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className="w-full h-9 rounded border border-input bg-background px-2 text-sm">
          <option value="">Seleccionar...</option>
          {choferes.map((c) => <option key={c.id} value={c.id}>{c.nombre} {c.apellido}</option>)}
        </select>
      )
    }
    if (campo === "provinciaOrigen" || campo === "provinciaDestino") {
      return (
        <select value={valor} onChange={(e) => setValor(e.target.value)} className="w-full h-9 rounded border border-input bg-background px-2 text-sm">
          <option value="">Seleccionar...</option>
          {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      )
    }
    return (
      <input
        type={campo === "tarifa" || campo === "comisionPct" ? "number" : "text"}
        step={campo === "tarifa" || campo === "comisionPct" ? "0.01" : undefined}
        value={valor}
        onChange={(e) => setValor(e.target.value)}
        className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
      />
    )
  }

  return (
    <div className="fixed inset-0 z-[80] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col">
        <div className="px-6 py-4 border-b border-border">
          <h3 className="text-lg font-semibold">Editar campos compartidos del cupo {cupo}</h3>
          <p className="text-xs text-muted-foreground mt-0.5">Empresa: {empresaNombre} · Afectará a {todosLosViajes.length} viajes pendientes</p>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          {/* Lista de viajes afectados */}
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Viajes afectados</p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-xs">
                <thead className="bg-muted/40">
                  <tr>
                    <th className="px-2 py-1.5 text-left">Fecha</th>
                    <th className="px-2 py-1.5 text-left">Remito</th>
                    <th className="px-2 py-1.5 text-left">CDP</th>
                    <th className="px-2 py-1.5 text-right">Kilos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todosLosViajes.map((v) => (
                    <tr key={v.id}>
                      <td className="px-2 py-1.5">{formatearFecha(new Date(v.fechaViaje))}</td>
                      <td className="px-2 py-1.5 font-mono">{v.remito ?? "—"}</td>
                      <td className="px-2 py-1.5 font-mono">{v.nroCartaPorte ?? "—"}</td>
                      <td className="px-2 py-1.5 text-right">{v.kilos != null ? v.kilos.toLocaleString("es-AR") : "—"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Selector de campo */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1">Campo a modificar</label>
              <select
                value={campo}
                onChange={(e) => { setCampo(e.target.value as Campo); setValor("") }}
                className="w-full h-9 rounded border border-input bg-background px-2 text-sm"
              >
                {(Object.keys(labels) as Campo[]).map((c) => <option key={c} value={c}>{labels[c]}</option>)}
              </select>
              <p className="text-[11px] text-muted-foreground mt-1">Valor actual: <span className="font-mono">{valorActualDe(campo)}</span></p>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1">Nuevo valor</label>
              {renderEditor()}
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1">Justificación <span className="text-error">*</span></label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={2}
              className="w-full rounded border border-input bg-background px-2 py-1.5 text-sm resize-none"
              placeholder="Por qué se modifica este campo en todos los viajes"
            />
          </div>

          {error && <p className="text-xs text-error">{error}</p>}
        </div>

        <div className="px-6 py-3 border-t border-border flex justify-end gap-2">
          <button type="button" onClick={onCancelar} disabled={enviando} className="h-9 px-4 rounded border text-sm hover:bg-accent disabled:opacity-50">Cancelar</button>
          <button type="button" onClick={aplicar} disabled={enviando} className="h-9 px-4 rounded bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50">
            {enviando ? "Aplicando..." : "Aplicar a todos"}
          </button>
        </div>
      </div>
    </div>
  )
}
