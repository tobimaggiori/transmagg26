"use client"

/**
 * ConsultarViajesClient — Tabla de viajes con filtros, paginación y modal de detalle/edición.
 *
 * Reglas:
 * - No se muestran viajes hasta que se seleccione al menos un fletero o una empresa.
 * - Columnas FLETERO / EMPRESA se ocultan si ya están filtradas.
 * - Modal centrado con detalle, facturación, liquidación y edición inline condicional.
 */

import { useState, useCallback, useEffect, useRef } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearMoneda } from "@/lib/utils"
import { formatearFecha } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault: number }
type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }
type Chofer = { id: string; nombre: string; apellido: string; email: string }

type ViajeAPI = {
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
  fletero: { razonSocial: string } | null
  empresa: { razonSocial: string } | null
  camion: { patenteChasis: string; tipoCamion: string | null } | null
  chofer: { nombre: string; apellido: string } | null
  enLiquidaciones: Array<{
    tarifaFletero: number; kilos: number | null; subtotal: number
    liquidacion: {
      id: string; estado: string; nroComprobante: number | null; ptoVenta: number | null
      comisionPct: number | null; ivaPct: number | null; pdfS3Key: string | null
      pagos?: Array<{ ordenPago: { id: string; nro: number; pdfS3Key: string | null } | null }>
    } | null
  }>
  enFacturas: Array<{
    tarifaEmpresa: number; kilos: number | null; subtotal: number
    factura: {
      id: string; nroComprobante: string | null; ptoVenta?: number | null
      estado: string; tipoCbte: number | null; ivaPct: number | null; pdfS3Key: string | null
      recibo?: { id: string; nro: number; ptoVenta: number; pdfS3Key: string | null } | null
    } | null
  }>
}

const PER_PAGE = 30

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatNroComprobante(ptoVenta: number | null, nroComprobante: number | string | null): string {
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const nro = String(nroComprobante ?? 0).padStart(8, "0")
  return `${pv}-${nro}`
}

function formatKilos(kilos: number | null): string {
  if (kilos == null) return "—"
  return kilos.toLocaleString("es-AR")
}

// ─── Form types ──────────────────────────────────────────────────────────────

type FormViaje = {
  fechaViaje: string
  remito: string
  tieneCupo: boolean
  cupo: string
  mercaderia: string
  procedencia: string
  provinciaOrigen: string
  destino: string
  provinciaDestino: string
  kilos: string
  tarifa: string
  tarifaEmpresa: string
  empresaId: string
  fleteroId: string
  camionId: string
  choferId: string
}

function formDesdeViaje(v: ViajeAPI): FormViaje {
  return {
    fechaViaje: v.fechaViaje.slice(0, 10),
    remito: v.remito ?? "",
    tieneCupo: v.tieneCupo,
    cupo: v.cupo ?? "",
    mercaderia: v.mercaderia ?? "",
    procedencia: v.procedencia ?? "",
    provinciaOrigen: v.provinciaOrigen ?? "",
    destino: v.destino ?? "",
    provinciaDestino: v.provinciaDestino ?? "",
    kilos: v.kilos != null ? String(v.kilos) : "",
    tarifa: String(v.tarifa ?? ""),
    tarifaEmpresa: String(v.tarifaEmpresa ?? ""),
    empresaId: v.empresaId,
    fleteroId: v.fleteroId ?? "",
    camionId: v.camionId,
    choferId: v.choferId ?? "",
  }
}

function hayCambios(form: FormViaje, original: ViajeAPI): boolean {
  const o = formDesdeViaje(original)
  return (Object.keys(form) as (keyof FormViaje)[]).some((k) => String(form[k]) !== String(o[k]))
}

type EntradaHistorial = {
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  motivo: string
}

// ─── Inline editable field helpers ───────────────────────────────────────────

function EditableField({
  label,
  value,
  canEdit,
  editing,
  onToggleEdit,
  children,
  editLabel,
}: {
  label: string
  value: React.ReactNode
  canEdit: boolean
  editing: boolean
  onToggleEdit: () => void
  children: React.ReactNode
  editLabel?: string
}) {
  return (
    <div className="space-y-1">
      <span className="text-xs font-medium text-muted-foreground">{label}</span>
      {editing ? (
        <div>{children}</div>
      ) : (
        <>
          <div className="text-sm font-medium">{value}</div>
          {canEdit && (
            <button
              type="button"
              onClick={onToggleEdit}
              className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
            >
              {editLabel ?? "Modificar"}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function InlineInput({
  value,
  onChange,
  onConfirm,
  onCancel,
  type,
  step,
  placeholder,
}: {
  value: string
  onChange: (v: string) => void
  onConfirm: () => void
  onCancel: () => void
  type?: string
  step?: string
  placeholder?: string
}) {
  return (
    <div className="flex items-center gap-1.5">
      <input
        type={type ?? "text"}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="flex-1 rounded-md border bg-background px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        autoFocus
      />
      <button type="button" onClick={onConfirm} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">
        &#10003;
      </button>
      <button type="button" onClick={onCancel} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">
        &#10005;
      </button>
    </div>
  )
}

// ─── Modal Detalle ───────────────────────────────────────────────────────────

function ModalDetalle({
  viaje,
  empresas,
  fleteros,
  camiones,
  choferes,
  onGuardar,
  onCerrar,
  onEliminar,
}: {
  viaje: ViajeAPI
  empresas: Empresa[]
  fleteros: Fletero[]
  camiones: Camion[]
  choferes: Chofer[]
  onGuardar: () => void
  onCerrar: () => void
  onEliminar: () => void
}) {
  const [form, setForm] = useState<FormViaje>(formDesdeViaje(viaje))
  const [editingFields, setEditingFields] = useState<Set<string>>(new Set())
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [subiendoCPE, setSubiendoCPE] = useState(false)
  const cpeInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setForm(formDesdeViaje(viaje))
    setError(null)
    setExito(false)
    setMotivo("")
    setEditingFields(new Set())
    setMostrarHistorial(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaje.id])

  const tieneLP = viaje.estadoLiquidacion === "LIQUIDADO"
  const tieneFactura = viaje.estadoFactura === "FACTURADO"
  const liquidadoYFacturado = tieneLP && tieneFactura
  const cambios = hayCambios(form, viaje)

  const empresaCambio = form.empresaId !== viaje.empresaId
  const fleteroCambio = form.fleteroId !== (viaje.fleteroId ?? "")
  const requiereMotivo = empresaCambio || fleteroCambio
  const motivoValido = !requiereMotivo || motivo.trim().length >= 10

  // Edit rules:
  // - Not liquidated → all editable
  // - Liquidated + not invoiced → empresa, kilos, tarifaEmpresa
  // - Liquidated + invoiced → nothing
  const puedeEditarTodo = !tieneLP
  const puedeEditarParcial = tieneLP && !tieneFactura

  const editable: Record<string, boolean> = {
    fleteroId: puedeEditarTodo,
    empresaId: puedeEditarTodo || puedeEditarParcial,
    choferId: puedeEditarTodo,
    camionId: puedeEditarTodo,
    fechaViaje: puedeEditarTodo,
    remito: puedeEditarTodo,
    tieneCupo: puedeEditarTodo,
    cupo: puedeEditarTodo,
    mercaderia: puedeEditarTodo,
    procedencia: puedeEditarTodo,
    provinciaOrigen: puedeEditarTodo,
    destino: puedeEditarTodo,
    provinciaDestino: puedeEditarTodo,
    kilos: puedeEditarTodo || puedeEditarParcial,
    tarifa: puedeEditarTodo,
    tarifaEmpresa: puedeEditarTodo || puedeEditarParcial,
  }

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const camionesDisponibles = camiones.filter((c) =>
    form.fleteroId ? c.fleteroId === form.fleteroId : c.esPropio
  )

  function setField<K extends keyof FormViaje>(key: K, value: FormViaje[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setExito(false)
  }

  function isEditing(field: string) { return editingFields.has(field) }
  function toggleEdit(field: string) {
    setEditingFields((prev) => {
      const next = new Set(prev)
      if (next.has(field)) next.delete(field)
      else next.add(field)
      return next
    })
  }
  function closeEdit(field: string) {
    setEditingFields((prev) => { const next = new Set(prev); next.delete(field); return next })
  }
  function cancelEdit(field: string) {
    // Revert field to original value
    const original = formDesdeViaje(viaje)
    setField(field as keyof FormViaje, original[field as keyof FormViaje])
    closeEdit(field)
  }

  // SearchCombobox items
  const fleteroItems: SearchComboboxItem[] = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const choferItems: SearchComboboxItem[] = choferes.map((c) => ({ id: c.id, label: `${c.nombre} ${c.apellido}`, sublabel: c.email }))

  // Display helpers
  const fleteroDisplay = form.fleteroId
    ? fleteros.find((f) => f.id === form.fleteroId)
    : null
  const empresaDisplay = form.empresaId
    ? empresas.find((e) => e.id === form.empresaId)
    : null
  const choferDisplay = form.choferId
    ? choferes.find((c) => c.id === form.choferId)
    : null
  const camionDisplay = form.camionId
    ? camiones.find((c) => c.id === form.camionId)
    : null

  async function handleGuardar() {
    if (!motivoValido) return
    setGuardando(true)
    setError(null)
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
      if (empresaCambio) {
        body.empresaId = form.empresaId
        body.motivoCambioEmpresa = motivo.trim()
      }
      if (fleteroCambio) {
        body.fleteroId = form.fleteroId || null
        body.motivoCambioFletero = motivo.trim()
      }
      if (form.camionId !== original.camionId) body.camionId = form.camionId
      if (form.choferId !== original.choferId) body.choferId = form.choferId

      if (Object.keys(body).length === 0) return

      const res = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al guardar"); return }
      setExito(true)
      setMotivo("")
      setEditingFields(new Set())
      onGuardar()
    } catch {
      setError("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  async function handleCPEUpload(file: File) {
    setSubiendoCPE(true)
    setError(null)
    try {
      // 1. Upload to R2
      const formData = new FormData()
      formData.append("file", file)
      formData.append("prefijo", "cartas-porte")
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: formData })
      if (!uploadRes.ok) { setError("Error al subir el PDF"); return }
      const { key } = await uploadRes.json()

      // 2. PATCH viaje with new key
      const patchRes = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ cartaPorteS3Key: key }),
      })
      if (!patchRes.ok) { setError("Error al actualizar el viaje"); return }
      onGuardar()
    } catch {
      setError("Error de red al subir CPE")
    } finally {
      setSubiendoCPE(false)
    }
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

  // ── Badge helper ──
  function Badge({ si, label }: { si: boolean; label: string }) {
    return (
      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
        si ? "bg-green-100 text-green-800" : "bg-amber-100 text-amber-800"
      }`}>
        {label}: {si ? "Sí" : "No"}
      </span>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 p-4" onClick={onCerrar}>
      <div
        className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* ── Header ── */}
        <div className="sticky top-0 z-10 bg-white border-b px-6 py-4 flex items-center justify-between rounded-t-2xl">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold">Detalle del viaje</h2>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm text-gray-500">{formatearFecha(new Date(viaje.fechaViaje))}</span>
              <Badge si={tieneLP} label="Liquidado" />
              <Badge si={tieneFactura} label="Facturado" />
            </div>
          </div>
          <button type="button" onClick={onCerrar} className="rounded-md p-1.5 hover:bg-gray-100 text-xl leading-none">
            &times;
          </button>
        </div>

        <div className="px-6 py-5">
          {liquidadoYFacturado && (
            <div className="rounded-md border border-amber-300 bg-amber-50 px-4 py-3 text-sm text-amber-800 mb-5">
              Este viaje está liquidado y facturado. No se puede editar.
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-0">
            {/* ────── Columna izquierda — Datos del viaje ────── */}
            <div className="space-y-4">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Datos del viaje</h3>

              {/* Fletero */}
              <EditableField
                label="Fletero"
                value={
                  <div>
                    <p>{fleteroDisplay?.razonSocial ?? (form.fleteroId ? "—" : "Camión propio")}</p>
                    {fleteroDisplay && <p className="text-xs text-gray-500">CUIT: {fleteroDisplay.cuit}</p>}
                  </div>
                }
                canEdit={editable.fleteroId}
                editing={isEditing("fleteroId")}
                onToggleEdit={() => toggleEdit("fleteroId")}
                editLabel="Cambiar fletero"
              >
                <SearchCombobox
                  items={[{ id: "", label: "Camión propio" }, ...fleteroItems]}
                  value={form.fleteroId}
                  onChange={(id) => { setField("fleteroId", id); setField("camionId", ""); closeEdit("fleteroId") }}
                  placeholder="Buscar fletero..."
                />
              </EditableField>

              {/* Empresa */}
              <EditableField
                label="Empresa"
                value={
                  <div>
                    <p>{empresaDisplay?.razonSocial ?? "—"}</p>
                    {empresaDisplay && <p className="text-xs text-gray-500">CUIT: {empresaDisplay.cuit}</p>}
                  </div>
                }
                canEdit={editable.empresaId}
                editing={isEditing("empresaId")}
                onToggleEdit={() => toggleEdit("empresaId")}
                editLabel="Cambiar empresa"
              >
                <SearchCombobox
                  items={empresaItems}
                  value={form.empresaId}
                  onChange={(id) => { setField("empresaId", id); closeEdit("empresaId") }}
                  placeholder="Buscar empresa..."
                />
              </EditableField>

              {/* Chofer */}
              <EditableField
                label="Chofer"
                value={choferDisplay ? `${choferDisplay.nombre} ${choferDisplay.apellido}` : (viaje.chofer ? `${viaje.chofer.nombre} ${viaje.chofer.apellido}` : "—")}
                canEdit={editable.choferId}
                editing={isEditing("choferId")}
                onToggleEdit={() => toggleEdit("choferId")}
                editLabel="Cambiar chofer"
              >
                <SearchCombobox
                  items={choferItems}
                  value={form.choferId}
                  onChange={(id) => { setField("choferId", id); closeEdit("choferId") }}
                  placeholder="Buscar chofer..."
                />
              </EditableField>

              {/* Camión */}
              <EditableField
                label="Camión"
                value={camionDisplay?.patenteChasis ?? "—"}
                canEdit={editable.camionId}
                editing={isEditing("camionId")}
                onToggleEdit={() => toggleEdit("camionId")}
                editLabel="Cambiar camión"
              >
                <div className="flex items-center gap-1.5">
                  <select
                    value={form.camionId}
                    onChange={(e) => setField("camionId", e.target.value)}
                    className="flex-1 rounded-md border bg-background px-2 py-1 text-sm"
                    autoFocus
                  >
                    <option value="">-- Seleccionar --</option>
                    {camionesDisponibles.map((c) => (
                      <option key={c.id} value={c.id}>{c.patenteChasis}</option>
                    ))}
                  </select>
                  <button type="button" onClick={() => closeEdit("camionId")} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">
                    &#10003;
                  </button>
                  <button type="button" onClick={() => cancelEdit("camionId")} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">
                    &#10005;
                  </button>
                </div>
              </EditableField>

              {/* Fecha */}
              <EditableField
                label="Fecha"
                value={formatearFecha(new Date(viaje.fechaViaje))}
                canEdit={editable.fechaViaje}
                editing={isEditing("fechaViaje")}
                onToggleEdit={() => toggleEdit("fechaViaje")}
              >
                <InlineInput
                  type="date"
                  value={form.fechaViaje}
                  onChange={(v) => setField("fechaViaje", v)}
                  onConfirm={() => closeEdit("fechaViaje")}
                  onCancel={() => cancelEdit("fechaViaje")}
                />
              </EditableField>

              {/* Remito */}
              <EditableField
                label="Remito"
                value={viaje.remito || "—"}
                canEdit={editable.remito}
                editing={isEditing("remito")}
                onToggleEdit={() => toggleEdit("remito")}
              >
                <InlineInput
                  value={form.remito}
                  onChange={(v) => setField("remito", v)}
                  onConfirm={() => closeEdit("remito")}
                  onCancel={() => cancelEdit("remito")}
                  placeholder="Nro remito"
                />
              </EditableField>

              {/* Cupo */}
              <EditableField
                label="Cupo"
                value={viaje.tieneCupo ? (viaje.cupo || "Sí") : "No"}
                canEdit={editable.tieneCupo}
                editing={isEditing("cupo")}
                onToggleEdit={() => toggleEdit("cupo")}
              >
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setField("tieneCupo", !form.tieneCupo)}
                      className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                        form.tieneCupo ? "bg-blue-600" : "bg-gray-300"
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        form.tieneCupo ? "translate-x-4" : "translate-x-0.5"
                      }`} />
                    </button>
                    <span className="text-sm">{form.tieneCupo ? "Sí" : "No"}</span>
                  </div>
                  {form.tieneCupo && (
                    <input
                      type="text"
                      value={form.cupo}
                      onChange={(e) => setField("cupo", e.target.value)}
                      className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                      placeholder="Nro cupo"
                    />
                  )}
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => closeEdit("cupo")} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">
                      &#10003;
                    </button>
                    <button type="button" onClick={() => cancelEdit("cupo")} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">
                      &#10005;
                    </button>
                  </div>
                </div>
              </EditableField>

              {/* Mercadería */}
              <EditableField
                label="Mercadería"
                value={viaje.mercaderia || "—"}
                canEdit={editable.mercaderia}
                editing={isEditing("mercaderia")}
                onToggleEdit={() => toggleEdit("mercaderia")}
              >
                <InlineInput
                  value={form.mercaderia}
                  onChange={(v) => setField("mercaderia", v)}
                  onConfirm={() => closeEdit("mercaderia")}
                  onCancel={() => cancelEdit("mercaderia")}
                />
              </EditableField>

              {/* Origen */}
              <EditableField
                label="Origen"
                value={`${viaje.procedencia || "—"}${viaje.provinciaOrigen ? `, ${viaje.provinciaOrigen}` : ""}`}
                canEdit={editable.procedencia}
                editing={isEditing("origen")}
                onToggleEdit={() => toggleEdit("origen")}
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.procedencia}
                    onChange={(e) => setField("procedencia", e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    placeholder="Ciudad"
                    autoFocus
                  />
                  <select
                    value={form.provinciaOrigen}
                    onChange={(e) => setField("provinciaOrigen", e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="">— Provincia —</option>
                    {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => closeEdit("origen")} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">
                      &#10003;
                    </button>
                    <button type="button" onClick={() => cancelEdit("origen")} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">
                      &#10005;
                    </button>
                  </div>
                </div>
              </EditableField>

              {/* Destino */}
              <EditableField
                label="Destino"
                value={`${viaje.destino || "—"}${viaje.provinciaDestino ? `, ${viaje.provinciaDestino}` : ""}`}
                canEdit={editable.destino}
                editing={isEditing("destino")}
                onToggleEdit={() => toggleEdit("destino")}
              >
                <div className="space-y-2">
                  <input
                    type="text"
                    value={form.destino}
                    onChange={(e) => setField("destino", e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                    placeholder="Ciudad"
                    autoFocus
                  />
                  <select
                    value={form.provinciaDestino}
                    onChange={(e) => setField("provinciaDestino", e.target.value)}
                    className="w-full rounded-md border bg-background px-2 py-1 text-sm"
                  >
                    <option value="">— Provincia —</option>
                    {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => closeEdit("destino")} className="h-7 w-7 rounded-md bg-green-600 text-white text-sm hover:bg-green-700 flex items-center justify-center">
                      &#10003;
                    </button>
                    <button type="button" onClick={() => cancelEdit("destino")} className="h-7 w-7 rounded-md border text-gray-500 text-sm hover:bg-gray-100 flex items-center justify-center">
                      &#10005;
                    </button>
                  </div>
                </div>
              </EditableField>

              {/* Kilos */}
              <EditableField
                label="Kilos"
                value={formatKilos(form.kilos ? Number(form.kilos) : viaje.kilos)}
                canEdit={editable.kilos}
                editing={isEditing("kilos")}
                onToggleEdit={() => toggleEdit("kilos")}
              >
                <InlineInput
                  type="number"
                  value={form.kilos}
                  onChange={(v) => setField("kilos", v)}
                  onConfirm={() => closeEdit("kilos")}
                  onCancel={() => cancelEdit("kilos")}
                />
              </EditableField>

              {/* Tarifa Fletero */}
              <EditableField
                label="Tarifa Fletero"
                value={formatearMoneda(form.tarifa ? Number(form.tarifa) : viaje.tarifa)}
                canEdit={editable.tarifa}
                editing={isEditing("tarifa")}
                onToggleEdit={() => toggleEdit("tarifa")}
              >
                <InlineInput
                  type="number"
                  step="0.01"
                  value={form.tarifa}
                  onChange={(v) => setField("tarifa", v)}
                  onConfirm={() => closeEdit("tarifa")}
                  onCancel={() => cancelEdit("tarifa")}
                />
              </EditableField>

              {/* Tarifa Empresa */}
              <EditableField
                label="Tarifa Empresa"
                value={formatearMoneda(form.tarifaEmpresa ? Number(form.tarifaEmpresa) : viaje.tarifaEmpresa)}
                canEdit={editable.tarifaEmpresa}
                editing={isEditing("tarifaEmpresa")}
                onToggleEdit={() => toggleEdit("tarifaEmpresa")}
              >
                <InlineInput
                  type="number"
                  step="0.01"
                  value={form.tarifaEmpresa}
                  onChange={(v) => setField("tarifaEmpresa", v)}
                  onConfirm={() => closeEdit("tarifaEmpresa")}
                  onCancel={() => cancelEdit("tarifaEmpresa")}
                />
              </EditableField>

              {/* CPE */}
              <div className="space-y-1">
                <span className="text-xs font-medium text-muted-foreground">CPE / Carta de Porte</span>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="text-sm font-medium">{viaje.tieneCpe ? (viaje.nroCartaPorte ?? "Sí") : "No"}</span>
                  {viaje.cartaPorteS3Key && (
                    <button
                      type="button"
                      onClick={handleVerCPE}
                      className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                    >
                      VER CPE
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => cpeInputRef.current?.click()}
                    disabled={subiendoCPE}
                    className="text-xs text-blue-600 hover:text-blue-800 hover:underline disabled:opacity-50"
                  >
                    {subiendoCPE ? "Subiendo..." : "Cambiar PDF"}
                  </button>
                  <input
                    ref={cpeInputRef}
                    type="file"
                    accept=".pdf"
                    className="hidden"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleCPEUpload(file)
                      e.target.value = ""
                    }}
                  />
                </div>
              </div>
            </div>

            {/* ────── Columna derecha — Estado documental ────── */}
            <div className="space-y-4 mt-4 md:mt-0">
              <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-500">Estado documental</h3>

              {/* Bloque Facturación */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Facturación</h4>
                {viaje.estadoFactura === "PENDIENTE_FACTURAR" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Facturado:</span>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">No</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Aún no facturado</p>
                  </div>
                ) : (() => {
                  const vef = viaje.enFacturas?.[0]
                  const factura = vef?.factura
                  if (!factura) return null
                  const nroFact = formatNroComprobante(factura.ptoVenta ?? null, factura.nroComprobante)
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Facturado:</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Nro: <span className="font-mono font-medium">{nroFact}</span></span>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/facturas/${factura.id}/pdf`, "_blank")}
                          className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          VER FACTURA
                        </button>
                      </div>
                      <hr className="border-gray-100" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Cobrado:</span>
                        {factura.recibo ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">No</span>
                        )}
                      </div>
                      {factura.recibo ? (
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            Recibo: <span className="font-mono font-medium">
                              {formatNroComprobante(factura.recibo.ptoVenta, factura.recibo.nro)}
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => window.open(`/api/recibos-cobranza/${factura.recibo!.id}/pdf`, "_blank")}
                            className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                          >
                            VER RECIBO
                          </button>
                        </div>
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Aún no cobrado</p>
                      )}
                    </div>
                  )
                })()}
              </div>

              {/* Bloque Liquidación */}
              <div className="rounded-lg border p-4 space-y-3">
                <h4 className="text-sm font-semibold">Liquidación</h4>
                {viaje.estadoLiquidacion === "PENDIENTE_LIQUIDAR" ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Liquidado:</span>
                      <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">No</span>
                    </div>
                    <p className="text-xs text-muted-foreground italic">Aún no liquidado</p>
                  </div>
                ) : (() => {
                  const vel = viaje.enLiquidaciones?.[0]
                  const liq = vel?.liquidacion
                  if (!liq) return null
                  const nroLP = formatNroComprobante(liq.ptoVenta, liq.nroComprobante)
                  const pagosConOP = (liq.pagos ?? []).filter((p) => p.ordenPago != null)
                  return (
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Liquidado:</span>
                        <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">LP: <span className="font-mono font-medium">{nroLP}</span></span>
                        <button
                          type="button"
                          onClick={() => window.open(`/api/liquidaciones/${liq.id}/pdf`, "_blank")}
                          className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                        >
                          VER LIQ. PROD.
                        </button>
                      </div>
                      <hr className="border-gray-100" />
                      <div className="flex items-center gap-2">
                        <span className="text-sm">Pagado:</span>
                        {pagosConOP.length > 0 ? (
                          <span className="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">Sí</span>
                        ) : (
                          <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">No</span>
                        )}
                      </div>
                      {pagosConOP.length > 0 ? (
                        pagosConOP.map((pago, i) => (
                          <div key={i} className="flex items-center gap-2">
                            <span className="text-sm">
                              OP: <span className="font-mono font-medium">#{pago.ordenPago!.nro}</span>
                            </span>
                            <button
                              type="button"
                              onClick={() => window.open(`/api/ordenes-pago/${pago.ordenPago!.id}/pdf`, "_blank")}
                              className="text-xs px-2 py-0.5 rounded bg-blue-600 text-white hover:bg-blue-700"
                            >
                              VER ORDEN
                            </button>
                          </div>
                        ))
                      ) : (
                        <p className="text-xs text-muted-foreground italic">Aún no pagado</p>
                      )}
                    </div>
                  )
                })()}
              </div>
            </div>
          </div>

          {/* ── Motivo (required when changing empresa/fletero) ── */}
          {requiereMotivo && (
            <div className="mt-5 border-t pt-4">
              <label className="text-xs font-medium text-muted-foreground">
                Motivo del cambio <span className="text-muted-foreground">(mín. 10 caracteres)</span>
              </label>
              <textarea
                value={motivo}
                onChange={(e) => setMotivo(e.target.value)}
                rows={3}
                className="w-full rounded-md border bg-background px-3 py-1.5 text-sm resize-none mt-1"
                placeholder="Ej: Reasignación por acuerdo comercial..."
              />
              <p className="text-xs text-muted-foreground text-right mt-0.5">{motivo.trim().length}/10 mín.</p>
            </div>
          )}

          {/* ── Error / Success ── */}
          {error && <p className="text-sm text-red-600 mt-3">{error}</p>}
          {exito && <p className="text-sm text-green-600 mt-3">Guardado correctamente.</p>}

          {/* ── Historial ── */}
          {historial.length > 0 && (
            <div className="border-t pt-4 mt-4">
              <button
                type="button"
                onClick={() => setMostrarHistorial((v) => !v)}
                className="text-xs text-gray-500 hover:text-gray-800 font-medium"
              >
                {mostrarHistorial ? "Ocultar historial" : `Historial de cambios (${historial.length})`}
              </button>
              {mostrarHistorial && (
                <div className="mt-2 space-y-2">
                  {historial.map((e, i) => (
                    <div key={i} className="rounded-md border bg-gray-50 px-3 py-2 text-xs space-y-0.5">
                      <p className="text-gray-500">{formatearFecha(new Date(e.fecha))}</p>
                      <p><span className="font-medium">{e.valorAnterior}</span>{" -> "}<span className="font-medium">{e.valorNuevo}</span></p>
                      <p className="text-gray-500 italic">&ldquo;{e.motivo}&rdquo;</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* ── Footer ── */}
          <div className="flex items-center gap-2 mt-5 border-t pt-4">
            {cambios && motivoValido && (
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-40"
              >
                {guardando ? "Guardando..." : "Guardar cambios"}
              </button>
            )}
            {viaje.enLiquidaciones.length === 0 && viaje.enFacturas.length === 0 && (
              <button
                type="button"
                onClick={onEliminar}
                className="h-9 px-4 rounded-md border border-red-300 text-red-600 text-sm font-medium hover:bg-red-50"
              >
                Eliminar viaje
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Eliminar ───────────────────────────────────────────────────────────

function ModalEliminar({
  viaje,
  onEliminar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  onEliminar: () => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-red-600">Eliminar viaje</h2>
        <p className="text-sm">
          ¿Estás seguro de que querés eliminar este viaje? Esta acción no se puede deshacer.
        </p>
        <p className="text-sm text-gray-500">
          Viaje del <span className="font-medium">{formatearFecha(new Date(viaje.fechaViaje))}</span>
          {viaje.fletero && <> — Fletero: <span className="font-medium">{viaje.fletero.razonSocial}</span></>}
        </p>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-gray-100">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onEliminar}
            disabled={cargando}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-40"
          >
            {cargando ? "Eliminando..." : "Eliminar"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarViajesClient({
  fleteros,
  empresas,
  camiones,
  choferes,
}: {
  rol: string
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
}) {
  // ── Filtros ──
  const [filtroFleteroId, setFiltroFleteroId] = useState("")
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroRemito, setFiltroRemito] = useState("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")
  const [filtroFacturado, setFiltroFacturado] = useState<"" | "FACTURADO" | "PENDIENTE_FACTURAR">("")
  const [filtroLiquidado, setFiltroLiquidado] = useState<"" | "LIQUIDADO" | "PENDIENTE_LIQUIDAR">("")
  const [filtroNroLP, setFiltroNroLP] = useState("")
  const [filtroNroFactura, setFiltroNroFactura] = useState("")

  // ── Data ──
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // ── Pagination ──
  const [pagina, setPagina] = useState(1)

  // ── Detail modal ──
  const [viajeDetalle, setViajeDetalle] = useState<ViajeAPI | null>(null)
  const [cargandoDetalle, setCargandoDetalle] = useState(false)

  // ── Delete modal ──
  const [viajeEliminar, setViajeEliminar] = useState<ViajeAPI | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const hayFiltroEntidad = filtroFleteroId !== "" || filtroEmpresaId !== ""

  // SearchCombobox items
  const fleteroItems: SearchComboboxItem[] = fleteros.map((f) => ({
    id: f.id,
    label: f.razonSocial,
    sublabel: f.cuit,
  }))

  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({
    id: e.id,
    label: e.razonSocial,
    sublabel: e.cuit,
  }))

  // Context header text
  const fleteroSeleccionado = fleteros.find((f) => f.id === filtroFleteroId)
  const empresaSeleccionada = empresas.find((e) => e.id === filtroEmpresaId)

  function getContextHeader(): string | null {
    if (fleteroSeleccionado && empresaSeleccionada) {
      return `Viajes realizados por ${fleteroSeleccionado.razonSocial} para ${empresaSeleccionada.razonSocial}`
    }
    if (fleteroSeleccionado) {
      return `Viajes realizados por ${fleteroSeleccionado.razonSocial} (CUIT: ${fleteroSeleccionado.cuit})`
    }
    if (empresaSeleccionada) {
      return `Viajes realizados para ${empresaSeleccionada.razonSocial} (CUIT: ${empresaSeleccionada.cuit})`
    }
    return null
  }

  // ── Fetch viajes ──
  const cargar = useCallback(async () => {
    if (!hayFiltroEntidad) {
      setViajes([])
      return
    }
    setCargandoViajes(true)
    setErrorCarga(null)
    try {
      const params = new URLSearchParams()
      if (filtroFleteroId) params.set("fleteroId", filtroFleteroId)
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroLiquidado) params.set("estadoLiquidacion", filtroLiquidado)
      if (filtroFacturado) params.set("estadoFactura", filtroFacturado)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      if (filtroRemito) params.set("remito", filtroRemito)
      if (filtroNroLP) params.set("nroLP", filtroNroLP)
      if (filtroNroFactura) params.set("nroFactura", filtroNroFactura)
      const res = await fetch(`/api/viajes?${params.toString()}`)
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? "Error al cargar viajes")
      setViajes(data as ViajeAPI[])
      setPagina(1)
    } catch (e) {
      setErrorCarga(e instanceof Error ? e.message : "Error desconocido")
    } finally {
      setCargandoViajes(false)
    }
  }, [hayFiltroEntidad, filtroFleteroId, filtroEmpresaId, filtroLiquidado, filtroFacturado, filtroDesde, filtroHasta, filtroRemito, filtroNroLP, filtroNroFactura])

  useEffect(() => { void cargar() }, [cargar])

  // ── Pagination ──
  const totalPaginas = Math.max(1, Math.ceil(viajes.length / PER_PAGE))
  const viajesPagina = viajes.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  // ── Open detail modal (fetch full viaje) ──
  async function abrirDetalle(viajeId: string) {
    setCargandoDetalle(true)
    try {
      const res = await fetch(`/api/viajes/${viajeId}`)
      if (!res.ok) throw new Error("Error al cargar detalle")
      const data = await res.json()
      setViajeDetalle(data as ViajeAPI)
    } catch {
      const v = viajes.find((x) => x.id === viajeId)
      if (v) setViajeDetalle(v)
    } finally {
      setCargandoDetalle(false)
    }
  }

  // ── Delete action ──
  async function handleEliminar() {
    if (!viajeEliminar) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeEliminar.id}`, { method: "DELETE" })
      if (!res.ok) {
        const json = await res.json()
        setErrorModal(json.error ?? "Error al eliminar")
        return
      }
      setViajeEliminar(null)
      setViajeDetalle(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  // Column visibility
  const showFleteroCol = !filtroFleteroId
  const showEmpresaCol = !filtroEmpresaId

  const thCls = "px-4 py-2 text-left text-xs font-semibold uppercase tracking-wide text-gray-500"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consultar Viajes</h1>
        {hayFiltroEntidad && (
          <span className="text-sm text-gray-500">{viajes.length} viaje(s)</span>
        )}
      </div>

      {/* ── Filtros ── */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
          {/* Fletero */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fletero</label>
            <div className="mt-1">
              <SearchCombobox
                items={fleteroItems}
                value={filtroFleteroId}
                onChange={setFiltroFleteroId}
                placeholder="Buscar fletero..."
              />
            </div>
          </div>

          {/* Empresa */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Empresa</label>
            <div className="mt-1">
              <SearchCombobox
                items={empresaItems}
                value={filtroEmpresaId}
                onChange={setFiltroEmpresaId}
                placeholder="Buscar empresa..."
              />
            </div>
          </div>

          {/* Nro Remito */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro Remito</label>
            <input
              type="text"
              value={filtroRemito}
              onChange={(e) => setFiltroRemito(e.target.value)}
              placeholder="Nro remito"
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Desde */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Desde</label>
            <input
              type="date"
              value={filtroDesde}
              onChange={(e) => setFiltroDesde(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Fecha Hasta */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Fecha Hasta</label>
            <input
              type="date"
              value={filtroHasta}
              onChange={(e) => setFiltroHasta(e.target.value)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Facturado */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Facturado</label>
            <select
              value={filtroFacturado}
              onChange={(e) => setFiltroFacturado(e.target.value as typeof filtroFacturado)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="FACTURADO">Sí</option>
              <option value="PENDIENTE_FACTURAR">No</option>
            </select>
          </div>

          {/* Liquidado */}
          <div>
            <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Liquidado</label>
            <select
              value={filtroLiquidado}
              onChange={(e) => setFiltroLiquidado(e.target.value as typeof filtroLiquidado)}
              className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos</option>
              <option value="LIQUIDADO">Sí</option>
              <option value="PENDIENTE_LIQUIDAR">No</option>
            </select>
          </div>

          {/* Conditional: Nro LP (when liquidado=Si) */}
          {filtroLiquidado === "LIQUIDADO" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro LP</label>
              <input
                type="number"
                value={filtroNroLP}
                onChange={(e) => setFiltroNroLP(e.target.value)}
                placeholder="Nro LP"
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}

          {/* Conditional: Nro Factura (when facturado=Si) */}
          {filtroFacturado === "FACTURADO" && (
            <div>
              <label className="text-xs font-medium text-gray-500 uppercase tracking-wide">Nro Factura</label>
              <input
                type="text"
                value={filtroNroFactura}
                onChange={(e) => setFiltroNroFactura(e.target.value)}
                placeholder="Nro factura"
                className="mt-1 w-full h-9 rounded-md border bg-background px-3 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          )}
        </div>
      </div>

      {/* ── No-entity message ── */}
      {!hayFiltroEntidad && (
        <div className="bg-white rounded-lg shadow px-6 py-8 text-center text-sm text-gray-500">
          Seleccioná al menos un fletero o una empresa para consultar viajes.
        </div>
      )}

      {/* ── Context header ── */}
      {hayFiltroEntidad && getContextHeader() && (
        <p className="text-sm font-medium text-gray-700">{getContextHeader()}</p>
      )}

      {/* ── Error ── */}
      {errorCarga && (
        <div className="rounded-md border border-red-300 bg-red-50 p-3 text-sm text-red-700">{errorCarga}</div>
      )}

      {/* ── Table ── */}
      {hayFiltroEntidad && (
        <div className="bg-white rounded-lg shadow overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className={thCls}>Fecha</th>
                <th className={thCls}>Remito</th>
                {showFleteroCol && <th className={thCls}>Fletero</th>}
                {showEmpresaCol && <th className={thCls}>Empresa</th>}
                <th className={thCls}>Mercadería</th>
                <th className={thCls}>Origen</th>
                <th className={thCls}>Destino</th>
                <th className={`${thCls} text-right`}>Kilos</th>
                <th className={`${thCls} text-right`}>Tarifa</th>
                <th className={`${thCls} text-center`}>+</th>
              </tr>
            </thead>
            <tbody>
              {cargandoViajes ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-gray-500">Cargando...</td>
                </tr>
              ) : viajesPagina.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-8 text-center text-sm text-gray-500">
                    Sin viajes para los filtros seleccionados.
                  </td>
                </tr>
              ) : (
                viajesPagina.map((v) => (
                  <tr
                    key={v.id}
                    className={`border-b last:border-0 hover:bg-gray-100 transition-colors ${
                      viajeDetalle?.id === v.id ? "bg-blue-50" : ""
                    }`}
                  >
                    {/* FECHA */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {formatearFecha(new Date(v.fechaViaje))}
                    </td>

                    {/* REMITO */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      {v.remito || "—"}
                    </td>

                    {/* FLETERO */}
                    {showFleteroCol && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        {v.fletero ? (
                          <div>
                            <p className="text-xs text-gray-500">{fleteros.find((f) => f.id === v.fleteroId)?.cuit ?? ""}</p>
                            <p className="text-sm">{v.fletero.razonSocial}</p>
                          </div>
                        ) : (
                          <span className="text-gray-400 italic text-xs">Propio</span>
                        )}
                      </td>
                    )}

                    {/* EMPRESA */}
                    {showEmpresaCol && (
                      <td className="px-4 py-2 whitespace-nowrap">
                        {v.empresa ? (
                          <div>
                            <p className="text-xs text-gray-500">{empresas.find((e) => e.id === v.empresaId)?.cuit ?? ""}</p>
                            <p className="text-sm">{v.empresa.razonSocial}</p>
                          </div>
                        ) : "—"}
                      </td>
                    )}

                    {/* MERCADERÍA */}
                    <td className="px-4 py-2 whitespace-nowrap text-sm max-w-[120px] truncate">
                      {v.mercaderia || "—"}
                    </td>

                    {/* ORIGEN */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>
                        <p className="text-sm">{v.procedencia || "—"}</p>
                        {v.provinciaOrigen && <p className="text-xs text-gray-500">{v.provinciaOrigen}</p>}
                      </div>
                    </td>

                    {/* DESTINO */}
                    <td className="px-4 py-2 whitespace-nowrap">
                      <div>
                        <p className="text-sm">{v.destino || "—"}</p>
                        {v.provinciaDestino && <p className="text-xs text-gray-500">{v.provinciaDestino}</p>}
                      </div>
                    </td>

                    {/* KILOS */}
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm">
                      {formatKilos(v.kilos)}
                    </td>

                    {/* TARIFA (fletero) */}
                    <td className="px-4 py-2 whitespace-nowrap text-right text-sm font-medium">
                      {formatearMoneda(v.tarifa)}
                    </td>

                    {/* + BUTTON */}
                    <td className="px-4 py-2 text-center">
                      <button
                        type="button"
                        onClick={() => abrirDetalle(v.id)}
                        className="inline-flex items-center justify-center h-7 w-7 rounded-md border hover:bg-gray-100 text-sm font-medium transition-colors"
                      >
                        +
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ── Pagination ── */}
      {hayFiltroEntidad && totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-gray-500">
            Página {pagina} de {totalPaginas} — {viajes.length} viaje(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-gray-100 disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-gray-100 disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* ── Loading detail overlay ── */}
      {cargandoDetalle && !viajeDetalle && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/20">
          <div className="bg-white rounded-lg shadow-lg px-6 py-4 text-sm text-gray-600">
            Cargando detalle...
          </div>
        </div>
      )}

      {/* ── Detail modal ── */}
      {viajeDetalle && (
        <ModalDetalle
          viaje={viajeDetalle}
          empresas={empresas}
          fleteros={fleteros}
          camiones={camiones}
          choferes={choferes}
          onGuardar={async () => {
            await cargar()
            try {
              const res = await fetch(`/api/viajes/${viajeDetalle.id}`)
              if (res.ok) {
                const updated = await res.json()
                setViajeDetalle(updated as ViajeAPI)
              }
            } catch { /* keep current */ }
          }}
          onCerrar={() => setViajeDetalle(null)}
          onEliminar={() => { setViajeEliminar(viajeDetalle); setErrorModal(null) }}
        />
      )}

      {/* ── Delete modal ── */}
      {viajeEliminar && (
        <ModalEliminar
          viaje={viajeEliminar}
          onEliminar={handleEliminar}
          onCerrar={() => setViajeEliminar(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}
    </div>
  )
}
