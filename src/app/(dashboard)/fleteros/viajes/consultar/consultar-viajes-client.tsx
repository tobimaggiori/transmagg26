"use client"

/**
 * Propósito: Tabla de viajes con filtros combobox, paginación y panel de preview/edición.
 * Columnas simplificadas: Fecha, Fletero, Empresa, C. de Porte, Origen, Destino, Acciones.
 * Panel lateral para ver detalle y editar campos del viaje.
 */

import { useState, useCallback, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha, cn } from "@/lib/utils"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string; comisionDefault: number }
type Empresa = { id: string; razonSocial: string; cuit: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string | null; esPropio?: boolean }

type ViajeAPI = {
  id: string
  fechaViaje: string
  fleteroId: string | null
  esCamionPropio: boolean
  empresaId: string
  camionId: string
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifa: number | null
  tarifaEmpresa: number | null
  tieneCupo: boolean
  cupo: string | null
  remito: string | null
  nroCartaPorte: string | null
  cartaPorteS3Key: string | null
  estadoLiquidacion: string
  estadoFactura: string
  historialCambios?: string | null
  toneladas?: number | null
  total?: number | null
  fletero: { razonSocial: string; cuit?: string } | null
  empresa: { razonSocial: string; cuit?: string }
  camion: { patenteChasis: string; tipoCamion?: string }
  chofer: { nombre: string; apellido: string }
  enLiquidaciones?: Array<{
    liquidacion: {
      id: string
      estado: string
      cae: string | null
      arcaEstado: string | null
      nroComprobante: number | null
      ptoVenta: number | null
      pdfS3Key: string | null
    } | null
  }>
  enFacturas?: Array<{
    factura: {
      id: string
      nroComprobante: string | null
      pdfS3Key: string | null
      estado: string
      tipoCbte: string
    } | null
  }>
}

const PER_PAGE = 20

type EstadoFiltro = "" | "PENDIENTE_LIQUIDAR" | "LIQUIDADO" | "PENDIENTE_FACTURAR" | "FACTURADO"

// ─── Combobox genérico ──────────────────────────────────────────────────────

function ComboboxEntidad<T extends { id: string; razonSocial: string; cuit: string }>({
  items,
  value,
  onChange,
  placeholder,
  placeholderTodos,
}: {
  items: T[]
  value: string
  onChange: (v: string) => void
  placeholder: string
  placeholderTodos: string
}) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  const filtrados = useMemo(() => {
    if (!busqueda) return items
    const q = busqueda.toLowerCase()
    const qDigits = busqueda.replace(/\D/g, "")
    return items.filter(
      (f) => f.razonSocial.toLowerCase().includes(q) || (qDigits && f.cuit.replace(/\D/g, "").includes(qDigits))
    )
  }, [items, busqueda])

  const seleccionado = items.find((f) => f.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-2 text-sm">
        <span className="truncate">{seleccionado ? seleccionado.razonSocial : placeholderTodos}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder={placeholder} value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandEmpty>Sin resultados.</CommandEmpty>
            <CommandGroup>
              <CommandItem onSelect={() => { onChange(""); setOpen(false); setBusqueda("") }}>
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                {placeholderTodos}
              </CommandItem>
              {filtrados.map((f) => (
                <CommandItem
                  key={f.id}
                  value={f.id}
                  onSelect={() => { onChange(f.id); setOpen(false); setBusqueda("") }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value === f.id ? "opacity-100" : "opacity-0")} />
                  <div>
                    <p className="font-medium">{f.razonSocial}</p>
                    <p className="text-xs text-muted-foreground">CUIT: {f.cuit}</p>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  )
}

// ─── Panel de Detalle / Edición ─────────────────────────────────────────────

type ViajeDetalle = ViajeAPI

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
}

function formDesdeViaje(v: ViajeDetalle): FormViaje {
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
    tarifa: v.tarifaEmpresa != null ? String(v.tarifaEmpresa) : "",
  }
}

function hayCambios(form: FormViaje, original: ViajeDetalle): boolean {
  const o = formDesdeViaje(original)
  return (Object.keys(form) as (keyof FormViaje)[]).some((k) => String(form[k]) !== String(o[k]))
}

function PanelDetalle({
  viaje,
  fleteros,
  onGuardar,
  onCerrar,
  onCambiarEmpresa,
  onCambiarFletero,
  onEliminar,
}: {
  viaje: ViajeDetalle
  fleteros: Fletero[]
  onGuardar: () => void
  onCerrar: () => void
  onCambiarEmpresa: () => void
  onCambiarFletero: () => void
  onEliminar: () => void
}) {
  const [form, setForm] = useState<FormViaje>(formDesdeViaje(viaje))
  const [guardando, setGuardando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState(false)

  useEffect(() => {
    setForm(formDesdeViaje(viaje))
    setError(null)
    setExito(false)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viaje.id])

  const tieneLP = viaje.estadoLiquidacion === "LIQUIDADO"
  const tieneFactura = viaje.estadoFactura === "FACTURADO"
  const cambios = hayCambios(form, viaje)

  // Cálculos del resumen
  const kilos = parseFloat(form.kilos) || 0
  const tarifa = parseFloat(form.tarifa) || 0
  const subtotal = kilos * tarifa
  // Buscar comisión del fletero
  const fletero = fleteros.find((f) => f.id === viaje.fleteroId)
  const comisionPct = fletero?.comisionDefault ?? 0
  const comisionMonto = subtotal * (comisionPct / 100)
  const totalNeto = subtotal - comisionMonto
  const iva = totalNeto * 0.21
  const totalFletero = totalNeto + iva
  const totalEmpresa = subtotal

  function setField<K extends keyof FormViaje>(key: K, value: FormViaje[K]) {
    setForm((prev) => ({ ...prev, [key]: value }))
    setExito(false)
  }

  async function handleGuardar() {
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
      if (form.tarifa !== original.tarifa) body.tarifa = form.tarifa ? parseFloat(form.tarifa) : undefined

      if (Object.keys(body).length === 0) return

      const res = await fetch(`/api/viajes/${viaje.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      const json = await res.json()
      if (!res.ok) { setError(json.error ?? "Error al guardar"); return }
      setExito(true)
      onGuardar()
    } catch {
      setError("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  const inputCls = "w-full rounded-md border bg-background px-3 py-1.5 text-sm"
  const labelCls = "text-xs font-medium text-muted-foreground"
  const disabledCls = "opacity-50 cursor-not-allowed"

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-end bg-black/30" onClick={onCerrar}>
      <div
        className="h-full w-full max-w-xl bg-background border-l shadow-xl overflow-y-auto animate-in slide-in-from-right"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="sticky top-0 z-10 bg-background border-b px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">Detalle del viaje</h2>
            <p className="text-xs text-muted-foreground">
              {formatearFecha(new Date(viaje.fechaViaje))} · {viaje.fletero?.razonSocial ?? "Camión propio"} → {viaje.empresa.razonSocial}
            </p>
          </div>
          <button type="button" onClick={onCerrar} className="rounded-md p-1 hover:bg-accent">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="px-6 py-4 space-y-5">
          {/* Badges de estado */}
          <div className="flex flex-wrap gap-2">
            {tieneLP && (
              <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                LP emitido — algunos campos no editables
              </span>
            )}
            {tieneFactura && (
              <span className="inline-flex items-center rounded-full border border-orange-300 bg-orange-50 px-3 py-1 text-xs font-medium text-orange-700">
                Factura emitida — algunos campos no editables
              </span>
            )}
          </div>

          {/* Info no editable */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className={labelCls}>Fletero</p>
              <p className="text-sm font-medium">{viaje.fletero?.razonSocial ?? "Camión propio"}</p>
              {!tieneLP && viaje.estadoLiquidacion !== "LIQUIDADO" && (
                <button type="button" onClick={onCambiarFletero} className="text-xs text-primary hover:underline mt-0.5">
                  Cambiar fletero
                </button>
              )}
            </div>
            <div>
              <p className={labelCls}>Empresa</p>
              <p className="text-sm font-medium">{viaje.empresa.razonSocial}</p>
              {!tieneFactura && viaje.estadoFactura !== "FACTURADO" && (
                <button type="button" onClick={onCambiarEmpresa} className="text-xs text-primary hover:underline mt-0.5">
                  Cambiar empresa
                </button>
              )}
            </div>
            <div>
              <p className={labelCls}>Camión</p>
              <p className="text-sm">{viaje.camion.patenteChasis}</p>
            </div>
            <div>
              <p className={labelCls}>Chofer</p>
              <p className="text-sm">{viaje.chofer.nombre} {viaje.chofer.apellido}</p>
            </div>
          </div>

          <hr />

          {/* Campos editables */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Fecha</label>
              <input
                type="date"
                value={form.fechaViaje}
                onChange={(e) => setField("fechaViaje", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Remito / Carta de Porte</label>
              <input
                type="text"
                value={form.remito}
                onChange={(e) => setField("remito", e.target.value)}
                className={inputCls}
                placeholder="Nro remito"
              />
            </div>
            <div>
              <label className={labelCls}>Cupo</label>
              <div className="flex items-center gap-2 mt-1">
                <button
                  type="button"
                  onClick={() => setField("tieneCupo", !form.tieneCupo)}
                  className={cn(
                    "relative inline-flex h-5 w-9 items-center rounded-full transition-colors",
                    form.tieneCupo ? "bg-primary" : "bg-muted"
                  )}
                >
                  <span className={cn(
                    "inline-block h-4 w-4 transform rounded-full bg-white transition-transform",
                    form.tieneCupo ? "translate-x-4" : "translate-x-0.5"
                  )} />
                </button>
                <span className="text-sm">{form.tieneCupo ? "Sí" : "No"}</span>
              </div>
            </div>
            {form.tieneCupo && (
              <div>
                <label className={labelCls}>Nro Cupo</label>
                <input
                  type="text"
                  value={form.cupo}
                  onChange={(e) => setField("cupo", e.target.value)}
                  className={inputCls}
                />
              </div>
            )}
            <div className="col-span-2">
              <label className={labelCls}>Mercadería</label>
              <input
                type="text"
                value={form.mercaderia}
                onChange={(e) => setField("mercaderia", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Ciudad Origen</label>
              <input
                type="text"
                value={form.procedencia}
                onChange={(e) => setField("procedencia", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Provincia Origen</label>
              <select
                value={form.provinciaOrigen}
                onChange={(e) => setField("provinciaOrigen", e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Ciudad Destino</label>
              <input
                type="text"
                value={form.destino}
                onChange={(e) => setField("destino", e.target.value)}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Provincia Destino</label>
              <select
                value={form.provinciaDestino}
                onChange={(e) => setField("provinciaDestino", e.target.value)}
                className={inputCls}
              >
                <option value="">—</option>
                {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
              </select>
            </div>
            <div>
              <label className={labelCls}>Kilos</label>
              <input
                type="number"
                value={form.kilos}
                onChange={(e) => setField("kilos", e.target.value)}
                className={cn(inputCls, tieneLP && disabledCls)}
                disabled={tieneLP}
              />
            </div>
            <div>
              <label className={labelCls}>Tarifa ($)</label>
              <input
                type="number"
                step="0.01"
                value={form.tarifa}
                onChange={(e) => setField("tarifa", e.target.value)}
                className={cn(inputCls, tieneFactura && disabledCls)}
                disabled={tieneFactura}
              />
              {tieneLP && (
                <p className="text-xs text-amber-600 mt-1">
                  ⚠ El LP ya fue emitido. Este cambio solo impactará en la factura a la empresa. La tarifa del fletero ({formatearMoneda(viaje.tarifa ?? 0)}) no se modifica.
                </p>
              )}
            </div>
          </div>

          <hr />

          {/* Resumen de cálculo */}
          <div className="rounded-lg border bg-muted/30 p-4 space-y-2 text-sm font-mono">
            <p className="font-semibold text-xs uppercase tracking-wide text-muted-foreground mb-2">Resumen del viaje</p>
            <div className="flex justify-between">
              <span>Subtotal (kilos x tarifa):</span>
              <span>{formatearMoneda(subtotal)}</span>
            </div>
            {viaje.fleteroId && comisionPct > 0 && (
              <>
                <div className="flex justify-between text-muted-foreground">
                  <span>Comisión ({comisionPct}%):</span>
                  <span>-{formatearMoneda(comisionMonto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Total neto:</span>
                  <span>{formatearMoneda(totalNeto)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>IVA (21%):</span>
                  <span>{formatearMoneda(iva)}</span>
                </div>
                <hr />
                <div className="flex justify-between font-bold">
                  <span>TOTAL FLETERO:</span>
                  <span>{formatearMoneda(totalFletero)}</span>
                </div>
              </>
            )}
            <hr />
            <div className="flex justify-between font-bold">
              <span>TOTAL EMPRESA:</span>
              <span>{formatearMoneda(totalEmpresa)}</span>
            </div>
            <p className="text-xs text-muted-foreground">(kilos x tarifa)</p>
          </div>

          {/* Errores y éxito */}
          {error && <p className="text-sm text-destructive">{error}</p>}
          {exito && <p className="text-sm text-green-600">Guardado correctamente.</p>}

          {/* Acciones */}
          <div className="flex items-center gap-2">
            {cambios && (
              <button
                type="button"
                onClick={handleGuardar}
                disabled={guardando}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
              >
                {guardando ? "Guardando…" : "Guardar cambios"}
              </button>
            )}
            {(viaje.enLiquidaciones?.length ?? 0) === 0 && (viaje.enFacturas?.length ?? 0) === 0 && (
              <button
                type="button"
                onClick={onEliminar}
                className="h-9 px-4 rounded-md border border-destructive/30 text-destructive text-sm font-medium hover:bg-destructive/10"
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

// ─── Modal Cambiar Empresa ────────────────────────────────────────────────────

type EntradaHistorial = {
  fecha: string
  campo: string
  valorAnterior: string
  valorNuevo: string
  motivo: string
}

function ModalCambiarEmpresa({
  viaje,
  empresas,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  empresas: Empresa[]
  onGuardar: (data: { empresaId: string; tarifa?: number; motivoCambioEmpresa: string }) => void
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

  const mismaEmpresa = nuevaEmpresaId === viaje.empresaId
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = nuevaEmpresaId && !mismaEmpresa && motivoValido

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar empresa del viaje</h2>
          <button type="button" onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <p className="text-sm text-muted-foreground">
          Empresa actual: <span className="font-medium text-foreground">{viaje.empresa.razonSocial}</span>
        </p>

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!puedeConfirmar) return
            onGuardar({
              empresaId: nuevaEmpresaId,
              tarifa: nuevaTarifa ? Number(nuevaTarifa) : undefined,
              motivoCambioEmpresa: motivo.trim(),
            })
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Nueva empresa</label>
            <select
              value={nuevaEmpresaId}
              onChange={(e) => setNuevaEmpresaId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">— Seleccioná una empresa —</option>
              {empresas.map((emp) => (
                <option key={emp.id} value={emp.id}>{emp.razonSocial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Nueva tarifa operativa ($)</label>
            <input
              type="number"
              min="0"
              step="0.01"
              value={nuevaTarifa}
              onChange={(e) => setNuevaTarifa(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              placeholder="Dejar vacío para mantener la actual"
            />
          </div>

          <div>
            <label className="text-sm font-medium">Motivo del cambio <span className="text-muted-foreground">(mín. 10 caracteres)</span></label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              placeholder="Ej: Cliente reasignado por acuerdo comercial..."
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{motivo.trim().length}/10 mín.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeConfirmar || cargando}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              {cargando ? "Guardando…" : "Confirmar cambio"}
            </button>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {mostrarHistorial ? "Ocultar historial" : `Historial de cambios (${historial.length})`}
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial.map((e, i) => (
                  <div key={i} className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-0.5">
                    <p className="text-muted-foreground">{formatearFecha(new Date(e.fecha))}</p>
                    <p><span className="font-medium">{e.valorAnterior}</span>{" → "}<span className="font-medium">{e.valorNuevo}</span></p>
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

// ─── Modal Cambiar Fletero ────────────────────────────────────────────────────

function ModalCambiarFletero({
  viaje,
  fleteros,
  camiones,
  onGuardar,
  onCerrar,
  cargando,
  error,
}: {
  viaje: ViajeAPI
  fleteros: Fletero[]
  camiones: Camion[]
  onGuardar: (data: { fleteroId: string | null; camionId?: string; motivoCambioFletero: string }) => void
  onCerrar: () => void
  cargando: boolean
  error: string | null
}) {
  const [nuevoFleteroId, setNuevoFleteroId] = useState(viaje.fleteroId ?? "")
  const [nuevoCamionId, setNuevoCamionId] = useState(viaje.camionId ?? "")
  const [motivo, setMotivo] = useState("")
  const [mostrarHistorial, setMostrarHistorial] = useState(false)

  const historial: EntradaHistorial[] = (() => {
    try { return JSON.parse(viaje.historialCambios ?? "[]") } catch { return [] }
  })()

  const camionesDisponibles = camiones.filter((c) =>
    nuevoFleteroId ? c.fleteroId === nuevoFleteroId : c.esPropio
  )
  const mismoFletero = nuevoFleteroId === (viaje.fleteroId ?? "")
  const motivoValido = motivo.trim().length >= 10
  const puedeConfirmar = !mismoFletero && motivoValido

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-lg p-6 space-y-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold">Cambiar fletero del viaje</h2>
          <button type="button" onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-lg">✕</button>
        </div>

        <p className="text-sm text-muted-foreground">
          Fletero actual: <span className="font-medium text-foreground">{viaje.fletero?.razonSocial ?? "(propio)"}</span>
        </p>

        {viaje.estadoLiquidacion === "LIQUIDADO" && (
          <p className="text-sm text-destructive">Este viaje ya fue liquidado. No se puede cambiar el fletero.</p>
        )}

        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!puedeConfirmar) return
            onGuardar({
              fleteroId: nuevoFleteroId || null,
              camionId: nuevoCamionId || undefined,
              motivoCambioFletero: motivo.trim(),
            })
          }}
          className="space-y-3"
        >
          <div>
            <label className="text-sm font-medium">Nuevo fletero</label>
            <select
              value={nuevoFleteroId}
              onChange={(e) => { setNuevoFleteroId(e.target.value); setNuevoCamionId("") }}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            >
              <option value="">— (Camión propio Transmagg) —</option>
              {fleteros.map((f) => (
                <option key={f.id} value={f.id}>{f.razonSocial}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Camión</label>
            <select
              value={nuevoCamionId}
              onChange={(e) => setNuevoCamionId(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            >
              <option value="">— Mantener camión actual —</option>
              {camionesDisponibles.map((c) => (
                <option key={c.id} value={c.id}>{c.patenteChasis}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium">Motivo del cambio <span className="text-muted-foreground">(mín. 10 caracteres)</span></label>
            <textarea
              value={motivo}
              onChange={(e) => setMotivo(e.target.value)}
              rows={3}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm resize-none"
              placeholder="Ej: Fletero original no disponible..."
              disabled={viaje.estadoLiquidacion === "LIQUIDADO"}
            />
            <p className="text-xs text-muted-foreground text-right mt-0.5">{motivo.trim().length}/10 mín.</p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <div className="flex justify-end gap-2">
            <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              type="submit"
              disabled={!puedeConfirmar || cargando || viaje.estadoLiquidacion === "LIQUIDADO"}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-40"
            >
              {cargando ? "Guardando…" : "Confirmar cambio"}
            </button>
          </div>
        </form>

        {historial.length > 0 && (
          <div className="border-t pt-3">
            <button
              type="button"
              onClick={() => setMostrarHistorial((v) => !v)}
              className="text-xs text-muted-foreground hover:text-foreground font-medium"
            >
              {mostrarHistorial ? "Ocultar historial" : `Historial de cambios (${historial.length})`}
            </button>
            {mostrarHistorial && (
              <div className="mt-2 space-y-2">
                {historial.map((e, i) => (
                  <div key={i} className="rounded-md border bg-muted/20 px-3 py-2 text-xs space-y-0.5">
                    <p className="text-muted-foreground">{formatearFecha(new Date(e.fecha))}</p>
                    <p><span className="font-medium">{e.valorAnterior}</span>{" → "}<span className="font-medium">{e.valorNuevo}</span></p>
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

// ─── Modal Eliminar Viaje ─────────────────────────────────────────────────────

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
  const tieneLP = (viaje.enLiquidaciones?.length ?? 0) > 0
  const tieneFactura = (viaje.enFacturas?.length ?? 0) > 0

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl border shadow-lg w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold text-destructive">Eliminar viaje</h2>

        <p className="text-sm">
          ¿Eliminar el viaje del <span className="font-medium">{formatearFecha(new Date(viaje.fechaViaje))}</span>?
          {viaje.fletero && <> Fletero: <span className="font-medium">{viaje.fletero.razonSocial}</span>.</>}
        </p>

        {(tieneLP || tieneFactura) && (
          <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
            Este viaje tiene {tieneLP ? "liquidaciones" : ""}{tieneLP && tieneFactura ? " y " : ""}{tieneFactura ? "facturas" : ""} asociadas y no puede eliminarse.
          </div>
        )}

        {error && <p className="text-sm text-destructive">{error}</p>}

        <div className="flex justify-end gap-2">
          <button type="button" onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            type="button"
            onClick={onEliminar}
            disabled={cargando || tieneLP || tieneFactura}
            className="h-9 px-4 rounded-md bg-destructive text-destructive-foreground text-sm font-medium hover:bg-destructive/90 disabled:opacity-40"
          >
            {cargando ? "Eliminando…" : "Eliminar"}
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
}: {
  rol: Rol
  fleteros: Fletero[]
  empresas: Empresa[]
  camiones: Camion[]
}) {
  // PDF Viewer
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  // Filtros
  const [filtroFleteroId, setFiltroFleteroId] = useState("")
  const [filtroEmpresaId, setFiltroEmpresaId] = useState("")
  const [filtroEstadoLiq, setFiltroEstadoLiq] = useState<EstadoFiltro>("")
  const [filtroEstadoFact, setFiltroEstadoFact] = useState<EstadoFiltro>("")
  const [filtroDesde, setFiltroDesde] = useState("")
  const [filtroHasta, setFiltroHasta] = useState("")

  // Datos
  const [viajes, setViajes] = useState<ViajeAPI[]>([])
  const [cargandoViajes, setCargandoViajes] = useState(false)
  const [errorCarga, setErrorCarga] = useState<string | null>(null)

  // Paginación
  const [pagina, setPagina] = useState(1)

  // Panel de detalle
  const [viajeDetalle, setViajeDetalle] = useState<ViajeAPI | null>(null)

  // Modales
  const [viajeCambioEmpresa, setViajeCambioEmpresa] = useState<ViajeAPI | null>(null)
  const [viajeCambioFletero, setViajeCambioFletero] = useState<ViajeAPI | null>(null)
  const [viajeEliminar, setViajeEliminar] = useState<ViajeAPI | null>(null)
  const [guardando, setGuardando] = useState(false)
  const [errorModal, setErrorModal] = useState<string | null>(null)

  const cargar = useCallback(async () => {
    setCargandoViajes(true)
    setErrorCarga(null)
    try {
      const params = new URLSearchParams()
      if (filtroFleteroId) params.set("fleteroId", filtroFleteroId)
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroEstadoLiq) params.set("estadoLiquidacion", filtroEstadoLiq)
      if (filtroEstadoFact) params.set("estadoFactura", filtroEstadoFact)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
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
  }, [filtroFleteroId, filtroEmpresaId, filtroEstadoLiq, filtroEstadoFact, filtroDesde, filtroHasta])

  useEffect(() => { void cargar() }, [cargar])

  // Paginación
  const totalPaginas = Math.max(1, Math.ceil(viajes.length / PER_PAGE))
  const viajesPagina = viajes.slice((pagina - 1) * PER_PAGE, pagina * PER_PAGE)

  // ── Acción: cambiar empresa ───────────────────────────────────────────────
  async function handleCambiarEmpresa(data: { empresaId: string; tarifa?: number; motivoCambioEmpresa: string }) {
    if (!viajeCambioEmpresa) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeCambioEmpresa.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setErrorModal(json.error ?? "Error al guardar"); return }
      setViajeCambioEmpresa(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  // ── Acción: cambiar fletero ───────────────────────────────────────────────
  async function handleCambiarFletero(data: { fleteroId: string | null; camionId?: string; motivoCambioFletero: string }) {
    if (!viajeCambioFletero) return
    setGuardando(true)
    setErrorModal(null)
    try {
      const res = await fetch(`/api/viajes/${viajeCambioFletero.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })
      const json = await res.json()
      if (!res.ok) { setErrorModal(json.error ?? "Error al guardar"); return }
      setViajeCambioFletero(null)
      await cargar()
    } catch {
      setErrorModal("Error de red")
    } finally {
      setGuardando(false)
    }
  }

  // ── Acción: eliminar ──────────────────────────────────────────────────────
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

  const inputCls = "mt-1 w-full rounded-md border bg-background px-2 py-1.5 text-sm"

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold tracking-tight">Consultar Viajes</h1>
        <span className="text-sm text-muted-foreground">{viajes.length} viaje(s)</span>
      </div>

      {/* Filtros */}
      <div className="rounded-lg border bg-card p-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6">
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Fletero</label>
          <div className="mt-1">
            <ComboboxEntidad
              items={fleteros}
              value={filtroFleteroId}
              onChange={setFiltroFleteroId}
              placeholder="Buscar por razón social o CUIT..."
              placeholderTodos="Todos"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Empresa</label>
          <div className="mt-1">
            <ComboboxEntidad
              items={empresas}
              value={filtroEmpresaId}
              onChange={setFiltroEmpresaId}
              placeholder="Buscar por razón social o CUIT..."
              placeholderTodos="Todas"
            />
          </div>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado LP</label>
          <select
            value={filtroEstadoLiq}
            onChange={(e) => setFiltroEstadoLiq(e.target.value as EstadoFiltro)}
            className={inputCls}
          >
            <option value="">Todos</option>
            <option value="PENDIENTE_LIQUIDAR">Sin liquidar</option>
            <option value="LIQUIDADO">Liquidado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Estado Factura</label>
          <select
            value={filtroEstadoFact}
            onChange={(e) => setFiltroEstadoFact(e.target.value as EstadoFiltro)}
            className={inputCls}
          >
            <option value="">Todas</option>
            <option value="PENDIENTE_FACTURAR">Sin facturar</option>
            <option value="FACTURADO">Facturado</option>
          </select>
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Desde</label>
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className={inputCls}
          />
        </div>

        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Hasta</label>
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className={inputCls}
          />
        </div>
      </div>

      {errorCarga && (
        <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">{errorCarga}</div>
      )}

      {/* Tabla simplificada */}
      <div className="rounded-lg border overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b">
            <tr>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fecha</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Fletero</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Empresa</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">C. de Porte</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Origen</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground hidden md:table-cell">Destino</th>
              <th className="px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-muted-foreground">Estado</th>
              <th className="px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wide text-muted-foreground"></th>
            </tr>
          </thead>
          <tbody>
            {cargandoViajes ? (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Cargando...</td></tr>
            ) : viajesPagina.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-sm text-muted-foreground">Sin viajes para los filtros seleccionados.</td></tr>
            ) : viajesPagina.map((v) => (
              <tr
                key={v.id}
                className={cn(
                  "border-b last:border-0 hover:bg-muted/30 transition-colors cursor-pointer",
                  viajeDetalle?.id === v.id && "bg-muted/40"
                )}
                onClick={() => setViajeDetalle(v)}
              >
                <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate">
                  {v.fletero?.razonSocial ?? <span className="text-muted-foreground italic">Propio</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap max-w-[140px] truncate hidden md:table-cell">
                  {v.empresa.razonSocial}
                </td>
                <td className="px-3 py-2 whitespace-nowrap">
                  {v.nroCartaPorte ? (
                    v.cartaPorteS3Key
                      ? <button
                          type="button"
                          className="text-xs text-primary hover:underline whitespace-nowrap"
                          onClick={(e) => {
                            e.stopPropagation()
                            abrirPDF({
                              s3Key: v.cartaPorteS3Key!,
                              titulo: `Carta de Porte — ${v.nroCartaPorte}`,
                            })
                          }}
                        >
                          {v.nroCartaPorte}
                        </button>
                      : <span className="text-xs">{v.nroCartaPorte}</span>
                  ) : <span className="text-muted-foreground text-xs">N/A</span>}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs hidden md:table-cell">{v.procedencia ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap text-xs hidden md:table-cell">{v.destino ?? "—"}</td>
                <td className="px-3 py-2 whitespace-nowrap">
                  <div className="flex gap-1">
                    {v.estadoLiquidacion === "LIQUIDADO"
                      ? <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">LP</span>
                      : <span className="inline-flex items-center rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800">Sin LP</span>}
                    {v.estadoFactura === "FACTURADO"
                      ? <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">Fact.</span>
                      : <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">Sin fact.</span>}
                  </div>
                </td>
                <td className="px-3 py-2 text-right">
                  <button
                    type="button"
                    onClick={(e) => { e.stopPropagation(); setViajeDetalle(v) }}
                    className="text-xs px-2 py-1 rounded border hover:bg-accent transition-colors"
                  >
                    Ver detalle
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Paginación */}
      {totalPaginas > 1 && (
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">
            Página {pagina} de {totalPaginas} · {viajes.length} viaje(s)
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setPagina((p) => Math.max(1, p - 1))}
              disabled={pagina === 1}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-40"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => setPagina((p) => Math.min(totalPaginas, p + 1))}
              disabled={pagina === totalPaginas}
              className="h-8 px-3 rounded-md border text-sm font-medium hover:bg-accent disabled:opacity-40"
            >
              Siguiente
            </button>
          </div>
        </div>
      )}

      {/* Panel de detalle */}
      {viajeDetalle && (
        <PanelDetalle
          viaje={viajeDetalle}
          fleteros={fleteros}
          onGuardar={async () => {
            await cargar()
            // Refresh the detail panel with updated data
            const res = await fetch(`/api/viajes/${viajeDetalle.id}`)
            if (res.ok) {
              const updated = await res.json()
              setViajeDetalle(updated as ViajeAPI)
            }
          }}
          onCerrar={() => setViajeDetalle(null)}
          onCambiarEmpresa={() => { setViajeCambioEmpresa(viajeDetalle); setErrorModal(null) }}
          onCambiarFletero={() => { setViajeCambioFletero(viajeDetalle); setErrorModal(null) }}
          onEliminar={() => { setViajeEliminar(viajeDetalle); setErrorModal(null) }}
        />
      )}

      {/* Modales */}
      {viajeCambioEmpresa && (
        <ModalCambiarEmpresa
          viaje={viajeCambioEmpresa}
          empresas={empresas}
          onGuardar={handleCambiarEmpresa}
          onCerrar={() => setViajeCambioEmpresa(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}

      {viajeCambioFletero && (
        <ModalCambiarFletero
          viaje={viajeCambioFletero}
          fleteros={fleteros}
          camiones={camiones}
          onGuardar={handleCambiarFletero}
          onCerrar={() => setViajeCambioFletero(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}

      {viajeEliminar && (
        <ModalEliminar
          viaje={viajeEliminar}
          onEliminar={handleEliminar}
          onCerrar={() => setViajeEliminar(null)}
          cargando={guardando}
          error={errorModal}
        />
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
