"use client"

/**
 * Propósito: Componente cliente para creación de facturas a empresas (/empresas/facturar).
 * Muestra selector de empresa, tabla de viajes pendientes editables, preview y confirmación.
 */

import { Fragment, useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { viajeEsFacturable, razonNoFacturable } from "@/lib/facturacion"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ViajeParaFacturar = {
  id: string
  fechaViaje: string
  fleteroId: string
  empresaId: string
  empresa: { razonSocial: string }
  fletero: { razonSocial: string }
  camionId: string
  camion: { patenteChasis: string }
  choferId: string
  chofer: { nombre: string; apellido: string }
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaOperativaInicial: number
  estadoLiquidacion: string
  estadoFactura: string
  enLiquidaciones: Array<{
    liquidacion: { estado: string; cae: string | null; arcaEstado: string | null }
  }>
  // editados localmente
  kilosEdit?: number
  tarifaEmpresaEdit?: number
  fechaEdit?: string
  remitoEdit?: string
  cupoEdit?: string
  mercaderiaEdit?: string
  procedenciaEdit?: string
  origenEdit?: string
  destinoEdit?: string
  provinciaDestinoEdit?: string
  camionIdEdit?: string
  choferIdEdit?: string
}

// ─── Props ────────────────────────────────────────────────────────────────────

type FacturarEmpresaClientProps = {
  empresas: Array<{ id: string; razonSocial: string; condicionIva: string }>
  camiones: Array<{ id: string; patenteChasis: string; fleteroId: string }>
  choferes: Array<{ id: string; nombre: string; apellido: string; fleteroId: string | null }>
}

// ─── TipoCbteBadge ───────────────────────────────────────────────────────────

export function TipoCbteBadge({ tipoCbte, modalidad }: { tipoCbte: number; modalidad?: string }) {
  if (tipoCbte === 1)
    return <span className="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">Fact. A</span>
  if (tipoCbte === 201)
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-violet-100 px-2.5 py-0.5 text-xs font-medium text-violet-800">
        MiPyme{modalidad ? ` · ${modalidad}` : ""}
      </span>
    )
  if (tipoCbte === 6)
    return <span className="inline-flex items-center rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-700">Fact. B</span>
  return <span className="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-700">Cbte {tipoCbte}</span>
}

/**
 * FacturarEmpresaClient: FacturarEmpresaClientProps -> JSX.Element
 *
 * Dado el listado de empresas, camiones y choferes, renderiza el flujo de creación
 * de facturas: selector de empresa con SearchCombobox, tabla editable de viajes
 * pendientes de facturación, preview con cálculo de neto/IVA/total, y confirmación.
 * Después de crear una factura muestra un mensaje de éxito con opción de crear otra.
 * Existe como página dedicada a la creación de facturas bajo /empresas/facturar,
 * sin mezclar con el historial de facturas.
 *
 * Ejemplos:
 * // Sin empresa seleccionada → instrucción de selección
 * <FacturarEmpresaClient empresas={[...]} camiones={[...]} choferes={[...]} />
 * // Con empresa → tabla de viajes pendientes + preview al seleccionar
 * <FacturarEmpresaClient empresas={[{id:"e1",razonSocial:"ACME"}]} camiones={[...]} choferes={[...]} />
 */
export function FacturarEmpresaClient({ empresas, camiones, choferes }: FacturarEmpresaClientProps) {
  const [empresaId, setEmpresaId] = useState<string>("")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaFacturar[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [tipoCbteNum, setTipoCbteNum] = useState<number | null>(null)
  const [modalidadMiPymes, setModalidadMiPymes] = useState<"SCA" | "ADC" | null>(null)
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [exitoMsg, setExitoMsg] = useState<string | null>(null)

  const cargarDatos = useCallback(async () => {
    if (!empresaId) return
    setCargando(true)
    try {
      const res = await fetch(`/api/facturas?empresaId=${empresaId}`)
      if (res.ok) {
        const data = await res.json()
        const viajesConEdit = (data.viajesPendientes ?? []).map((v: ViajeParaFacturar) => ({
          ...v,
          kilosEdit: v.kilos ?? undefined,
          tarifaEmpresaEdit: v.tarifaOperativaInicial,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          cupoEdit: v.cupo ?? "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: v.provinciaOrigen ?? "",
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: v.provinciaDestino ?? "",
          camionIdEdit: v.camionId,
          choferIdEdit: v.choferId,
        }))
        setViajesPendientes(viajesConEdit)
      }
    } finally {
      setCargando(false)
    }
  }, [empresaId])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  function toggleSeleccion(id: string) {
    setSeleccionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  function toggleTodos() {
    if (seleccionados.size === viajesFacturables.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajesFacturables.map((v) => v.id)))
    }
  }

  function actualizarViaje(id: string, campo: keyof ViajeParaFacturar, valor: unknown) {
    setViajesPendientes((prev) =>
      prev.map((v) => v.id === id ? { ...v, [campo]: valor } : v)
    )
  }

  const viajesFacturables = viajesPendientes.filter((v) => viajeEsFacturable(v))
  const viajesBloqueados = viajesPendientes.filter((v) => !viajeEsFacturable(v))
  const viajesSeleccionados = viajesFacturables.filter((v) => seleccionados.has(v.id))

  const viajesParaCalc = viajesSeleccionados.map((v) => ({
    kilos: v.kilosEdit ?? v.kilos ?? 0,
    tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaOperativaInicial,
  }))
  const preview = viajesParaCalc.length > 0
    ? calcularFactura(viajesParaCalc, ivaPct)
    : null

  async function confirmarFactura() {
    if (!empresaId || viajesSeleccionados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        empresaId,
        tipoCbte: tipoCbteNum,
        modalidadMiPymes: modalidadMiPymes ?? undefined,
        ivaPct,
        viajes: viajesSeleccionados.map((v) => ({
          viajeId: v.id,
          camionId: v.camionIdEdit ?? v.camionId,
          choferId: v.choferIdEdit ?? v.choferId,
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: v.cupoEdit || null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaOperativaInicial,
        })),
      }
      const res = await fetch("/api/facturas", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorGen(err.error ?? "Error al generar factura")
        return
      }
      setEnPreview(false)
      setSeleccionados(new Set())
      setExitoMsg("Factura creada exitosamente.")
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  function resetearFormulario() {
    setExitoMsg(null)
    setEnPreview(false)
    setSeleccionados(new Set())
    setTipoCbteNum(null)
    setModalidadMiPymes(null)
    setIvaPct(21)
    setErrorGen(null)
  }

  const empresaSeleccionada = empresas.find((e) => e.id === empresaId)
  const esRI = empresaSeleccionada?.condicionIva === "RESPONSABLE_INSCRIPTO"

  // Derivar tipoCbte automático para no-RI
  const tipoCbteEfectivo = esRI ? tipoCbteNum : 6

  // Validación: puede avanzar a preview solo si tiene tipo de comprobante seleccionado
  const tipoCbteValido =
    !empresaId ||
    (!esRI && tipoCbteEfectivo === 6) ||
    (esRI && tipoCbteNum !== null && (tipoCbteNum !== 201 || modalidadMiPymes !== null))

  const empresasItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial }))

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Facturar a Empresa</h1>
        <p className="text-muted-foreground">
          Seleccioná una empresa para ver sus viajes pendientes de facturación.
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <WorkflowNote
          titulo="Datos guardados"
          descripcion="La factura guarda la tarifa a la empresa y los datos logísticos usados para ese comprobante."
        />
        <WorkflowNote
          titulo="Edición previa"
          descripcion="Antes de facturar podés corregir kilos, fecha y tarifa comercial a la empresa sin tocar facturas anteriores."
        />
        <WorkflowNote
          titulo="Independencia"
          descripcion="Un viaje puede estar facturado a la empresa aunque todavía no haya sido liquidado al fletero."
        />
      </div>

      {/* Selector de Empresa + Tipo Comprobante */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
        <div className="flex flex-col gap-1 min-w-[300px]">
          <label className="text-xs font-medium text-muted-foreground">Empresa</label>
          <SearchCombobox
            items={empresasItems}
            value={empresaId}
            onChange={(id) => {
              setEmpresaId(id)
              setSeleccionados(new Set())
              setEnPreview(false)
              setExitoMsg(null)
              setTipoCbteNum(null)
              setModalidadMiPymes(null)
            }}
            placeholder="Seleccioná una empresa..."
          />
        </div>

        {/* Tipo de comprobante — aparece al seleccionar empresa */}
        {empresaId && (
          <div className="flex flex-col gap-2">
            <label className="text-xs font-medium text-muted-foreground">Tipo de comprobante</label>
            {esRI ? (
              /* RI: selector manual */
              <div className="space-y-2">
                <div className="flex gap-4">
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="tipoCbte"
                      value="1"
                      checked={tipoCbteNum === 1}
                      onChange={() => { setTipoCbteNum(1); setModalidadMiPymes(null) }}
                      className="accent-primary"
                    />
                    Factura A <span className="text-xs text-muted-foreground">(cód. 1)</span>
                  </label>
                  <label className="flex items-center gap-2 cursor-pointer text-sm">
                    <input
                      type="radio"
                      name="tipoCbte"
                      value="201"
                      checked={tipoCbteNum === 201}
                      onChange={() => setTipoCbteNum(201)}
                      className="accent-primary"
                    />
                    Factura A MiPyme <span className="text-xs text-muted-foreground">(cód. 201)</span>
                  </label>
                </div>
                {tipoCbteNum === 201 && (
                  <div className="flex gap-4 pl-1 border-l-2 border-primary/30">
                    <label className="text-xs font-medium text-muted-foreground mr-1 self-center">Modalidad:</label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="modalidadMiPymes"
                        value="SCA"
                        checked={modalidadMiPymes === "SCA"}
                        onChange={() => setModalidadMiPymes("SCA")}
                        className="accent-primary"
                      />
                      SCA <span className="text-xs text-muted-foreground">— Circulación Abierta</span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer text-sm">
                      <input
                        type="radio"
                        name="modalidadMiPymes"
                        value="ADC"
                        checked={modalidadMiPymes === "ADC"}
                        onChange={() => setModalidadMiPymes("ADC")}
                        className="accent-primary"
                      />
                      ADC <span className="text-xs text-muted-foreground">— Depósito Colectivo</span>
                    </label>
                  </div>
                )}
                {!tipoCbteValido && empresaId && (
                  <p className="text-xs text-amber-600">
                    {tipoCbteNum === null
                      ? "Seleccioná el tipo de comprobante para continuar."
                      : "Seleccioná la modalidad MiPyme para continuar."}
                  </p>
                )}
              </div>
            ) : (
              /* No-RI: automático */
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium">Factura B</span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">automático</span>
                <span className="text-xs text-muted-foreground">
                  ({empresaSeleccionada?.condicionIva?.replace(/_/g, " ").toLowerCase()})
                </span>
              </div>
            )}
          </div>
        )}
      </div>

      {!empresaId && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Seleccioná una empresa para ver sus viajes pendientes</p>
        </div>
      )}

      {/* Mensaje de éxito */}
      {exitoMsg && (
        <div className="p-4 bg-green-50 border border-green-200 rounded-lg flex items-center justify-between">
          <p className="text-green-800 font-medium">{exitoMsg}</p>
          <button
            onClick={resetearFormulario}
            className="h-9 px-4 rounded-md bg-green-700 text-white text-sm font-medium hover:bg-green-800"
          >
            ¿Crear otra?
          </button>
        </div>
      )}

      {empresaId && !exitoMsg && (
        <>
          {/* Viajes pendientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Viajes listos para facturar</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                  {viajesFacturables.length}
                </span>
                {viajesBloqueados.length > 0 && (
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-red-100 text-red-800">
                    {viajesBloqueados.length} bloqueado(s)
                  </span>
                )}
              </div>
              {seleccionados.size > 0 && !enPreview && (
                <button
                  onClick={() => setEnPreview(true)}
                  disabled={!tipoCbteValido}
                  title={!tipoCbteValido ? "Seleccioná el tipo de comprobante primero" : undefined}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Generar factura con {seleccionados.size} seleccionado(s)
                </button>
              )}
            </div>

            {cargando ? (
              <div className="text-center py-6 text-muted-foreground">Cargando...</div>
            ) : viajesFacturables.length === 0 && viajesBloqueados.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de facturación.</div>
            ) : viajesFacturables.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Todos los viajes pendientes están bloqueados por falta de CAE en ARCA.</div>
            ) : (
              <div className="overflow-x-auto rounded-lg border">
                <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                      <th className="px-3 py-2">
                        <input
                          type="checkbox"
                          checked={seleccionados.size === viajesFacturables.length && viajesFacturables.length > 0}
                          onChange={toggleTodos}
                        />
                      </th>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Fletero</th>
                      <th className="px-3 py-2 text-left">Remito</th>
                      <th className="px-3 py-2 text-left">Cupo</th>
                      <th className="px-3 py-2 text-left">Mercadería</th>
                      <th className="px-3 py-2 text-left">Origen</th>
                      <th className="px-3 py-2 text-left">Destino</th>
                      <th className="px-3 py-2 text-right">Kilos</th>
                      <th className="px-3 py-2 text-right">Ton</th>
                      <th className="px-3 py-2 text-right">Tarifa a la empresa / ton</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesFacturables.map((v) => {
                      const kilos = v.kilosEdit ?? v.kilos ?? 0
                      const tarifa = v.tarifaEmpresaEdit ?? v.tarifaOperativaInicial
                      const ton = kilos > 0 ? calcularToneladas(kilos) : null
                      const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                      const camionesDelFletero = camiones.filter((camion) => camion.fleteroId === v.fleteroId)
                      return (
                        <Fragment key={v.id}>
                          <tr className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                            </td>
                            <td className="px-3 py-2">{formatearFecha(v.fechaEdit ?? new Date(v.fechaViaje))}</td>
                            <td className="px-3 py-2">{v.fletero.razonSocial}</td>
                            <td className="px-3 py-2">{v.remitoEdit ?? v.remito ?? "-"}</td>
                            <td className="px-3 py-2">{v.cupoEdit ?? v.cupo ?? "-"}</td>
                            <td className="px-3 py-2">{v.mercaderiaEdit ?? v.mercaderia ?? "-"}</td>
                            <td className="px-3 py-2">{v.origenEdit ?? v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                            <td className="px-3 py-2">{v.provinciaDestinoEdit ?? v.destinoEdit ?? v.provinciaDestino ?? v.destino ?? "-"}</td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={v.kilosEdit ?? v.kilos ?? ""}
                                onChange={(e) => actualizarViaje(v.id, "kilosEdit", parseFloat(e.target.value) || undefined)}
                                className="w-24 h-7 text-right rounded border bg-background px-2 text-xs"
                                min="0"
                                step="1"
                              />
                            </td>
                            <td className="px-3 py-2 text-right text-muted-foreground">
                              {ton?.toLocaleString("es-AR") ?? "-"}
                            </td>
                            <td className="px-3 py-2 text-right">
                              <input
                                type="number"
                                value={v.tarifaEmpresaEdit ?? v.tarifaOperativaInicial}
                                onChange={(e) => actualizarViaje(v.id, "tarifaEmpresaEdit", parseFloat(e.target.value) || v.tarifaOperativaInicial)}
                                className="w-28 h-7 text-right rounded border bg-background px-2 text-xs"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {total != null ? formatearMoneda(total) : "-"}
                            </td>
                          </tr>
                          <tr className={seleccionados.has(v.id) ? "bg-blue-50/50" : "bg-muted/20"}>
                            <td />
                            <td colSpan={11} className="px-3 pb-3">
                              <div className="grid gap-3 md:grid-cols-4">
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Fecha viaje</label>
                                  <input type="date" value={v.fechaEdit ?? v.fechaViaje.slice(0, 10)} onChange={(e) => actualizarViaje(v.id, "fechaEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Camión</label>
                                  <select value={v.camionIdEdit ?? v.camionId} onChange={(e) => actualizarViaje(v.id, "camionIdEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
                                    {camionesDelFletero.map((camion) => (
                                      <option key={camion.id} value={camion.id}>{camion.patenteChasis}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Chofer</label>
                                  <select value={v.choferIdEdit ?? v.choferId} onChange={(e) => actualizarViaje(v.id, "choferIdEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
                                    {choferes.map((chofer) => (
                                      <option key={chofer.id} value={chofer.id}>{chofer.apellido}, {chofer.nombre}</option>
                                    ))}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Procedencia</label>
                                  <input type="text" value={v.procedenciaEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "procedenciaEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Provincia origen</label>
                                  <input type="text" value={v.origenEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "origenEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Destino</label>
                                  <input type="text" value={v.destinoEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "destinoEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Provincia destino</label>
                                  <select value={v.provinciaDestinoEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "provinciaDestinoEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs">
                                    <option value="">— Seleccionar —</option>
                                    {PROVINCIAS_ARGENTINA.map((p) => <option key={p} value={p}>{p}</option>)}
                                  </select>
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Mercadería</label>
                                  <input type="text" value={v.mercaderiaEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "mercaderiaEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Remito</label>
                                  <input type="text" value={v.remitoEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "remitoEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div>
                                  <label className="mb-1 block text-[11px] font-medium text-muted-foreground">Cupo</label>
                                  <input type="text" value={v.cupoEdit ?? ""} onChange={(e) => actualizarViaje(v.id, "cupoEdit", e.target.value)} className="h-8 w-full rounded border bg-background px-2 text-xs" />
                                </div>
                                <div className="md:col-span-2 rounded border bg-background px-3 py-2 text-xs text-muted-foreground">
                                  Camión actual: {v.camion.patenteChasis} · Chofer actual: {v.chofer.apellido}, {v.chofer.nombre}
                                </div>
                              </div>
                            </td>
                          </tr>
                        </Fragment>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Viajes bloqueados */}
          {viajesBloqueados.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-base font-semibold text-red-700">Viajes bloqueados (sin CAE en ARCA)</h3>
              <div className="overflow-x-auto rounded-lg border border-red-200">
                <table className="w-full text-sm">
                  <thead className="bg-red-50">
                    <tr>
                      <th className="px-3 py-2 text-left">Fecha</th>
                      <th className="px-3 py-2 text-left">Fletero</th>
                      <th className="px-3 py-2 text-left">Remito</th>
                      <th className="px-3 py-2 text-left">Motivo del bloqueo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesBloqueados.map((v) => (
                      <tr key={v.id} className="bg-red-50/40">
                        <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                        <td className="px-3 py-2">{v.fletero.razonSocial}</td>
                        <td className="px-3 py-2">{v.remito ?? "-"}</td>
                        <td className="px-3 py-2 text-red-700 font-medium">{razonNoFacturable(v)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Preview de factura */}
          {enPreview && preview && (
            <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
              <h3 className="font-semibold">Preview de factura</h3>
              <p className="text-sm text-muted-foreground">
                Esta vista previa refleja la tarifa comercial que va a quedar guardada para la empresa en la factura.
              </p>
              {errorGen && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{errorGen}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de comprobante</label>
                  <div className="flex items-center gap-2 h-8">
                    <TipoCbteBadge tipoCbte={tipoCbteEfectivo ?? 1} modalidad={modalidadMiPymes ?? undefined} />
                    <span className="text-xs text-muted-foreground">(código ARCA: {tipoCbteEfectivo})</span>
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
                  <input
                    type="number"
                    value={ivaPct}
                    onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.01"
                    className="h-8 w-28 rounded border bg-background px-2 text-sm"
                  />
                </div>
              </div>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between font-medium">
                  <span>Neto a guardar ({viajesSeleccionados.length} viaje(s)):</span>
                  <span>{formatearMoneda(preview.neto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({ivaPct}%):</span>
                  <span>+ {formatearMoneda(preview.ivaMonto)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-2">
                  <span>TOTAL:</span>
                  <span>{formatearMoneda(preview.total)}</span>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEnPreview(false)} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
                  Volver
                </button>
                <button
                  onClick={confirmarFactura}
                  disabled={generando || !tipoCbteValido}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {generando ? "Generando..." : "Confirmar y generar"}
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
