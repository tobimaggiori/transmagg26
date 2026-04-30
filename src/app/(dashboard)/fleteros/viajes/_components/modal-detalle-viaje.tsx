"use client"

/**
 * ModalDetalleViaje — Modal compartido de detalle/edición de viaje.
 * Extraído de consultar-viajes-client para reutilizar en liquidar y consultar.
 */

import { useState, useEffect, useRef } from "react"
import { SearchCombobox, type SearchComboboxItem } from "@/components/ui/search-combobox"
import { formatearFecha } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

// ─── Tipos ──────────────────────────────────────────────────────────────────

export type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault?: number }
export type Empresa = { id: string; razonSocial: string; cuit: string }
export type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }
export type Chofer = { id: string; nombre: string; apellido: string; email?: string | null }

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
  tieneCtg: boolean
  nroCtg: string | null
  ctgS3Key: string | null
  cpe: string | null
  remitoS3Key: string | null
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
  camion: { patenteChasis: string } | null
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

function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, "")
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}

type FormViaje = {
  fechaViaje: string; remito: string; cupo: string; nroCtg: string; cpe: string
  mercaderia: string; procedencia: string; provinciaOrigen: string
  destino: string; provinciaDestino: string; kilos: string
  tarifa: string; tarifaEmpresa: string; comisionPct: string
  empresaId: string; fleteroId: string; camionId: string; choferId: string
}

function formDesdeViaje(v: ViajeDetalleAPI): FormViaje {
  return {
    fechaViaje: v.fechaViaje.slice(0, 10),
    remito: v.remito ?? "", cupo: v.cupo ?? "", nroCtg: v.nroCtg ?? "",
    cpe: v.cpe ?? "",
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

/**
 * cellInputCls: boolean -> string
 *
 * Clase Tailwind para un input tipo "celda de Excel": se ve como texto plano,
 * con borde visible al hover y foco. Si está disabled, se muestra como valor
 * fijo (no editable).
 */
function cellInputCls(disabled: boolean): string {
  const base = "w-full rounded px-2 py-1 text-sm font-medium border bg-background"
  if (disabled) {
    return `${base} border-border/60 bg-muted/40 text-muted-foreground cursor-not-allowed`
  }
  return `${base} border-input hover:border-ring/60 focus:border-ring focus:outline-none focus:ring-2 focus:ring-ring/30`
}

/**
 * Cell: layout simple de "label + contenido" para formularios tipo hoja de cálculo.
 */
function Cell({
  label, children, hint,
}: {
  label: string; children: React.ReactNode; hint?: React.ReactNode
}) {
  return (
    <div>
      <span className="text-xs font-medium text-muted-foreground block mb-0.5">{label}</span>
      {children}
      {hint && <div className="mt-0.5">{hint}</div>}
    </div>
  )
}

/**
 * PdfAttachedCell: celda tipo input con PDF opcional adjunto.
 *
 * - Si el valor está vacío: input con placeholder "No".
 * - Si hay valor: el texto se muestra como link clickeable (abre el PDF si existe)
 *   o como input normal (si no hay PDF aún).
 * - Al lado: botón compacto "Ver" (cuando hay PDF) o "Subir" (cuando no).
 */
function PdfAttachedCell({
  label,
  value,
  pdfKey,
  disabled,
  onChange,
  onViewPdf,
  onSubirPdf,
  subiendo,
}: {
  label: string
  value: string
  pdfKey: string | null | undefined
  disabled: boolean
  onChange: (v: string) => void
  onViewPdf: () => void
  onSubirPdf: () => void
  subiendo: boolean
}) {
  const hasValue = value.trim().length > 0
  const hasPdf = !!pdfKey

  return (
    <Cell label={label}>
      <div className="flex gap-1.5 items-stretch">
        {hasValue && hasPdf ? (
          <button
            type="button"
            onClick={onViewPdf}
            className={`${cellInputCls(false)} text-left text-primary underline underline-offset-2 hover:bg-accent cursor-pointer`}
            title="Ver PDF"
          >
            {value}
          </button>
        ) : (
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
            placeholder="No"
            className={cellInputCls(disabled)}
          />
        )}
        {hasValue && !disabled && (
          hasPdf ? null : (
            <button
              type="button"
              onClick={onSubirPdf}
              disabled={subiendo}
              className="h-[30px] px-2 rounded border text-xs font-medium hover:bg-accent whitespace-nowrap disabled:opacity-50"
              title="Subir PDF"
            >
              {subiendo ? "…" : "Subir PDF"}
            </button>
          )
        )}
      </div>
    </Cell>
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
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)
  const [mostrarConfirmarSalida, setMostrarConfirmarSalida] = useState(false)
  const [subiendoPdf, setSubiendoPdf] = useState<"remito" | "ctg" | null>(null)
  const [viewingPdf, setViewingPdf] = useState<{ campo: "remito" | "ctg"; url: string } | null>(null)
  const pdfInputRef = useRef<HTMLInputElement>(null)
  const pdfTargetRef = useRef<"remito" | "ctg" | null>(null)

  useEffect(() => {
    setForm(formDesdeViaje(viaje))
    setError(null)
    setMotivo("")
    setMostrarHistorial(false)
    setViewingPdf(null)
  }, [viaje.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const tieneLP = viaje.estadoLiquidacion === "LIQUIDADO"
  const tieneFactura = viaje.estadoFactura === "FACTURADO"
  const cambios = hayCambios(form, viaje)

  // Lookup de cupo: si este viaje comparte cupo con otros viajes pendientes
  // de facturar de la misma empresa, los campos lockeados no se pueden
  // editar individualmente — solo en bloque desde el sub-modal.
  type ViajeHermano = { id: string; fechaViaje: string; remito: string | null; nroCtg: string | null; kilos: number | null }
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
    nroCtg: puedeEditarTodo,
    cpe: puedeEditarTodo,
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

  const fleteroItems: SearchComboboxItem[] = fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: f.cuit }))
  const empresaItems: SearchComboboxItem[] = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))
  const choferItems: SearchComboboxItem[] = choferes.map((c) => ({ id: c.id, label: `${c.nombre} ${c.apellido}`, sublabel: c.email ?? undefined }))

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
      // tieneCupo/tieneCtg se derivan de la presencia de texto en la celda.
      const nuevoTieneCupo = form.cupo.trim().length > 0
      if (nuevoTieneCupo !== viaje.tieneCupo) body.tieneCupo = nuevoTieneCupo
      if (form.cupo !== original.cupo) body.cupo = form.cupo || null
      const nuevoTieneCtg = form.nroCtg.trim().length > 0
      if (nuevoTieneCtg !== viaje.tieneCtg) body.tieneCtg = nuevoTieneCtg
      if (form.nroCtg !== original.nroCtg) body.nroCtg = form.nroCtg || null
      if (form.cpe !== original.cpe) body.cpe = form.cpe || null
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
      setMotivo(""); onGuardar()
    } catch { setError("Error de red") } finally { setGuardando(false) }
  }

  async function handleVerPdf(campo: "remito" | "ctg") {
    const s3Key = campo === "remito" ? viaje.remitoS3Key : viaje.ctgS3Key
    if (!s3Key) return
    try {
      const res = await fetch(`/api/storage/signed-url?key=${encodeURIComponent(s3Key)}`)
      if (!res.ok) return
      const { url } = await res.json()
      setViewingPdf({ campo, url })
    } catch { /* ignore */ }
  }

  function handleCambiarPdfClick(campo: "remito" | "ctg") {
    pdfTargetRef.current = campo
    pdfInputRef.current?.click()
  }

  async function handlePdfFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    const campo = pdfTargetRef.current
    e.target.value = ""
    if (!file || !campo) return

    setSubiendoPdf(campo); setError(null)
    try {
      const prefijo = campo === "remito" ? "remitos" : "ctg"
      const fd = new FormData(); fd.append("file", file); fd.append("prefijo", prefijo)
      const uploadRes = await fetch("/api/storage/upload", { method: "POST", body: fd })
      if (!uploadRes.ok) { setError("Error al subir el PDF"); return }
      const { key } = await uploadRes.json()

      const patchBody: Record<string, unknown> = campo === "remito"
        ? { remitoS3Key: key }
        : { ctgS3Key: key, tieneCtg: true }
      const patchRes = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patchBody),
      })
      if (!patchRes.ok) { setError("Error al actualizar el viaje"); return }
      setViewingPdf(null)
      onGuardar()
    } catch {
      setError("Error de red al subir PDF")
    } finally {
      setSubiendoPdf(null)
      pdfTargetRef.current = null
    }
  }

  const secCls = "rounded-xl border border-border bg-card"
  const secHeaderCls = "px-4 py-2.5 border-b border-border flex items-center gap-2"
  const secTitleCls = "text-sm font-semibold text-foreground"
  const secBodyCls = "px-4 py-3"
  const dataCls = "text-sm text-foreground font-medium"
  const labelSmCls = "text-xs text-muted-foreground"
  const pdfBtnCls = "text-xs px-2.5 py-1 rounded-md bg-primary text-primary-foreground hover:bg-primary/90 font-medium"

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
                Solo se pueden modificar kilos, fecha, remito y CTG.
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
                  <Cell label="Fletero" hint={fleteroDisplay && <p className={labelSmCls}>CUIT: {formatCuit(fleteroDisplay.cuit)}</p>}>
                    {editable.fleteroId ? (
                      <SearchCombobox
                        items={[{ id: "", label: "Camión propio" }, ...fleteroItems]}
                        value={form.fleteroId}
                        onChange={(id) => { setField("fleteroId", id); setField("camionId", "") }}
                        placeholder="Buscar fletero..."
                      />
                    ) : (
                      <div className={dataCls}>{fleteroDisplay?.razonSocial ?? (form.fleteroId ? "—" : "Camión propio")}</div>
                    )}
                  </Cell>
                  <Cell label="Empresa" hint={empresaDisplay && <p className={labelSmCls}>CUIT: {formatCuit(empresaDisplay.cuit)}</p>}>
                    {editable.empresaId ? (
                      <SearchCombobox
                        items={empresaItems}
                        value={form.empresaId}
                        onChange={(id) => setField("empresaId", id)}
                        placeholder="Buscar empresa..."
                      />
                    ) : (
                      <div className={dataCls}>{empresaDisplay?.razonSocial ?? "—"}</div>
                    )}
                  </Cell>
                  <Cell label="Chofer">
                    {editable.choferId ? (
                      <SearchCombobox
                        items={choferItems}
                        value={form.choferId}
                        onChange={(id) => setField("choferId", id)}
                        placeholder="Buscar chofer..."
                      />
                    ) : (
                      <div className={dataCls}>{choferDisplay ? `${choferDisplay.nombre} ${choferDisplay.apellido}` : (viaje.chofer ? `${viaje.chofer.nombre} ${viaje.chofer.apellido}` : "—")}</div>
                    )}
                  </Cell>
                  <Cell label="Camión">
                    {editable.camionId ? (
                      <select
                        value={form.camionId}
                        onChange={(e) => setField("camionId", e.target.value)}
                        className={cellInputCls(false)}
                      >
                        <option value="">-- Seleccionar --</option>
                        {camionesDisponibles.map((c) => <option key={c.id} value={c.id}>{c.patenteChasis}</option>)}
                      </select>
                    ) : (
                      <div className={dataCls}>{camionDisplay?.patenteChasis ?? "—"}</div>
                    )}
                  </Cell>
                </div>
                {!viaje.esCamionPropio && (
                  <div className="mt-2 max-w-xs">
                    <Cell label="Comisión %">
                      <input
                        type="number" step="0.01"
                        value={form.comisionPct}
                        onChange={(e) => setField("comisionPct", e.target.value)}
                        disabled={!editable.comisionPct}
                        className={cellInputCls(!editable.comisionPct)}
                      />
                    </Cell>
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
                    <Cell label="Origen">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={form.procedencia}
                          onChange={(e) => setField("procedencia", e.target.value)}
                          disabled={!editable.procedencia}
                          placeholder="Ciudad"
                          className={cellInputCls(!editable.procedencia)}
                        />
                        <select
                          value={form.provinciaOrigen}
                          onChange={(e) => setField("provinciaOrigen", e.target.value)}
                          disabled={!editable.provinciaOrigen}
                          className={cellInputCls(!editable.provinciaOrigen)}
                        >
                          <option value="">— Provincia —</option>
                          {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </Cell>
                    <Cell label="Destino">
                      <div className="space-y-1">
                        <input
                          type="text"
                          value={form.destino}
                          onChange={(e) => setField("destino", e.target.value)}
                          disabled={!editable.destino}
                          placeholder="Ciudad"
                          className={cellInputCls(!editable.destino)}
                        />
                        <select
                          value={form.provinciaDestino}
                          onChange={(e) => setField("provinciaDestino", e.target.value)}
                          disabled={!editable.provinciaDestino}
                          className={cellInputCls(!editable.provinciaDestino)}
                        >
                          <option value="">— Provincia —</option>
                          {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                        </select>
                      </div>
                    </Cell>
                  </div>
                  <div className="grid grid-cols-3 gap-x-4 gap-y-3 mt-3">
                    <Cell label="Fecha">
                      <input
                        type="date"
                        value={form.fechaViaje}
                        onChange={(e) => setField("fechaViaje", e.target.value)}
                        disabled={!editable.fechaViaje}
                        className={cellInputCls(!editable.fechaViaje)}
                      />
                    </Cell>
                    <Cell label="Mercadería">
                      <input
                        type="text"
                        value={form.mercaderia}
                        onChange={(e) => setField("mercaderia", e.target.value)}
                        disabled={!editable.mercaderia}
                        className={cellInputCls(!editable.mercaderia)}
                      />
                    </Cell>
                    <Cell label="Kilos">
                      <input
                        type="number"
                        value={form.kilos}
                        onChange={(e) => setField("kilos", e.target.value)}
                        disabled={!editable.kilos}
                        className={cellInputCls(!editable.kilos)}
                      />
                    </Cell>
                  </div>
                </div>
              </div>

              <div className={secCls}>
                <div className={secHeaderCls}><h3 className={secTitleCls}>Operación</h3></div>
                <div className={secBodyCls}>
                  <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <Cell label="Tarifa Fletero">
                      <input
                        type="number" step="0.01"
                        value={form.tarifa}
                        onChange={(e) => setField("tarifa", e.target.value)}
                        disabled={!editable.tarifa}
                        className={cellInputCls(!editable.tarifa)}
                      />
                    </Cell>
                    <Cell label="Tarifa Empresa">
                      <input
                        type="number" step="0.01"
                        value={form.tarifaEmpresa}
                        onChange={(e) => setField("tarifaEmpresa", e.target.value)}
                        disabled={!editable.tarifaEmpresa}
                        className={cellInputCls(!editable.tarifaEmpresa)}
                      />
                    </Cell>
                  </div>
                  {(() => {
                    // Un viaje lleva remito O CTG, nunca ambos. Mostramos solo
                    // la celda del tipo vigente.
                    const esCTG = !!(viaje.nroCtg || viaje.tieneCtg || form.nroCtg)
                    const colsCls = esCTG ? "grid-cols-2 md:grid-cols-3" : "grid-cols-2"
                    return (
                      <div className={`grid ${colsCls} gap-x-4 gap-y-3 mt-3`}>
                        {esCTG ? (
                          <>
                            <PdfAttachedCell
                              label="CTG"
                              value={form.nroCtg}
                              pdfKey={viaje.ctgS3Key}
                              disabled={!editable.nroCtg}
                              onChange={(v) => setField("nroCtg", v)}
                              onViewPdf={() => handleVerPdf("ctg")}
                              onSubirPdf={() => handleCambiarPdfClick("ctg")}
                              subiendo={subiendoPdf === "ctg"}
                            />
                            <Cell label="CPE">
                              <input
                                type="text"
                                value={form.cpe}
                                onChange={(e) => setField("cpe", e.target.value)}
                                disabled={!editable.cpe}
                                placeholder="No"
                                className={cellInputCls(!editable.cpe)}
                              />
                            </Cell>
                          </>
                        ) : (
                          <PdfAttachedCell
                            label="Remito"
                            value={form.remito}
                            pdfKey={viaje.remitoS3Key}
                            disabled={!editable.remito}
                            onChange={(v) => setField("remito", v)}
                            onViewPdf={() => handleVerPdf("remito")}
                            onSubirPdf={() => handleCambiarPdfClick("remito")}
                            subiendo={subiendoPdf === "remito"}
                          />
                        )}
                        <Cell label="Cupo">
                          <input
                            type="text"
                            value={form.cupo}
                            onChange={(e) => setField("cupo", e.target.value)}
                            disabled={!editable.cupo}
                            placeholder="No"
                            className={cellInputCls(!editable.cupo)}
                          />
                        </Cell>
                      </div>
                    )
                  })()}
                  <input
                    ref={pdfInputRef}
                    type="file"
                    accept=".pdf,application/pdf"
                    className="hidden"
                    onChange={handlePdfFileChange}
                  />
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

      {viewingPdf && (
        <div className="fixed inset-0 z-[60] flex flex-col bg-background">
          <div className="flex items-center justify-between px-6 py-3 border-b bg-card">
            <div className="flex items-center gap-3">
              <h3 className="text-sm font-semibold">
                {viewingPdf.campo === "remito" ? "Remito" : "CTG"} — {viewingPdf.campo === "remito" ? form.remito : form.nroCtg}
              </h3>
              <button
                type="button"
                onClick={() => handleCambiarPdfClick(viewingPdf.campo)}
                disabled={subiendoPdf !== null}
                className="h-8 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {subiendoPdf === viewingPdf.campo ? "Subiendo..." : "Cambiar PDF"}
              </button>
            </div>
            <button
              type="button"
              onClick={() => setViewingPdf(null)}
              className="h-8 px-3 rounded-md border text-sm hover:bg-accent"
            >
              Cerrar
            </button>
          </div>
          <iframe src={viewingPdf.url} className="flex-1 w-full" title="PDF viewer" />
        </div>
      )}

      {bulkEditOpen && cupoBloqueado && viaje.cupo && (
        <ModalBulkEditCupo
          empresaId={viaje.empresaId}
          cupo={viaje.cupo}
          empresaNombre={viaje.empresa?.razonSocial ?? "—"}
          viajeActual={{ id: viaje.id, fechaViaje: viaje.fechaViaje, remito: viaje.remito, nroCtg: viaje.nroCtg, kilos: viaje.kilos }}
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
  viajeActual: { id: string; fechaViaje: string; remito: string | null; nroCtg: string | null; kilos: number | null }
  hermanos: Array<{ id: string; fechaViaje: string; remito: string | null; nroCtg: string | null; kilos: number | null }>
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
                    <th className="px-2 py-1.5 text-left">CTG</th>
                    <th className="px-2 py-1.5 text-right">Kilos</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {todosLosViajes.map((v) => (
                    <tr key={v.id}>
                      <td className="px-2 py-1.5">{formatearFecha(new Date(v.fechaViaje))}</td>
                      <td className="px-2 py-1.5 font-mono">{v.remito ?? "—"}</td>
                      <td className="px-2 py-1.5 font-mono">{v.nroCtg ?? "—"}</td>
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
