"use client"

/**
 * Propósito: Componente cliente de la página de facturas emitidas.
 * Selector de empresa → viajes pendientes (editables inline) + preview y confirmación.
 * También muestra facturas emitidas con detalle y cambio de estado.
 */

import { Fragment, useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { calcularToneladas, calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import { RegistrarCobroModal } from "@/components/forms/registrar-cobro-form"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import { ModalDetalleFactura } from "./_components/modal-detalle-factura"
import type { ViajeParaFacturar, Factura, FacturasClientProps } from "./_components/types"

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    PARCIALMENTE_COBRADA: "bg-amber-100 text-amber-800",
    COBRADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_COBRADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * FacturasClient: FacturasClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI completa de facturas:
 * selector de empresa, tabla editable de viajes pendientes, preview de factura,
 * y sección de facturas emitidas con modales de detalle.
 * Existe para gestionar el proceso de facturación a empresas clientes desde el panel.
 *
 * Ejemplos:
 * // Rol interno, sin empresa → muestra instrucción de selección
 * <FacturasClient rol="OPERADOR_TRANSMAGG" empresas={[...]} empresaIdPropia={null} />
 * // Rol ADMIN_EMPRESA → carga automáticamente sus viajes y facturas
 * <FacturasClient rol="ADMIN_EMPRESA" empresas={[]} empresaIdPropia="e1" />
 * // Con empresa seleccionada → tabla de viajes + lista de facturas
 * <FacturasClient rol="ADMIN_TRANSMAGG" empresas={[...]} empresaIdPropia={null} />
 */
export function FacturasClient({ rol, empresas, camiones, choferes, empresaIdPropia, cuentasBancarias }: FacturasClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [empresaId, setEmpresaId] = useState<string>(empresaIdPropia ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaFacturar[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [tipoCbte, setTipoCbte] = useState<number>(1)
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)
  const [cobrandoFactura, setCobrandoFactura] = useState<Factura | null>(null)
  const [saldoAFavorCC, setSaldoAFavorCC] = useState(0)

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
          tarifaEmpresaEdit: v.tarifaEmpresa,
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
        setFacturas(data.facturas ?? [])
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
    if (seleccionados.size === viajesPendientes.length) {
      setSeleccionados(new Set())
    } else {
      setSeleccionados(new Set(viajesPendientes.map((v) => v.id)))
    }
  }

  function actualizarViaje(id: string, campo: keyof ViajeParaFacturar, valor: unknown) {
    setViajesPendientes((prev) =>
      prev.map((v) => v.id === id ? { ...v, [campo]: valor } : v)
    )
  }

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  // Calcular preview
  const viajesParaCalc = viajesSeleccionados.map((v) => ({
    kilos: v.kilosEdit ?? v.kilos ?? 0,
    tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaEmpresa,
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
        tipoCbte,
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
          tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaEmpresa,
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
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  async function cambiarEstadoFactura(id: string, estado: string, nroComprobante?: string) {
    setCambioEstadoCargando(true)
    try {
      const body: Record<string, string> = { estado }
      if (nroComprobante) body.nroComprobante = nroComprobante
      const res = await fetch(`/api/facturas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (res.ok) {
        setFacturaDetalle(null)
        cargarDatos()
      }
    } finally {
      setCambioEstadoCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Facturación a empresas</h2>
        <p className="text-muted-foreground">
          {esInterno ? "Facturación a empresas clientes" : "Facturas de tu empresa"}
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

      {/* Selector de Empresa */}
      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[250px]">
            <label className="text-xs font-medium text-muted-foreground">Empresa</label>
            <select
              value={empresaId}
              onChange={(e) => { setEmpresaId(e.target.value); setSeleccionados(new Set()); setEnPreview(false) }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Seleccioná una empresa...</option>
              {empresas.map((e) => <option key={e.id} value={e.id}>{e.razonSocial}</option>)}
            </select>
          </div>
        </div>
      )}

      {!empresaId && esInterno && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Seleccioná una Empresa para ver sus viajes y facturas</p>
        </div>
      )}

      {empresaId && (
        <>
          {/* SECCIÓN A: Viajes pendientes (solo roles internos) */}
          {esInterno && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <h3 className="text-base font-semibold">Viajes pendientes de facturación</h3>
                  <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                    {viajesPendientes.length}
                  </span>
                </div>
                {seleccionados.size > 0 && !enPreview && (
                  <button
                    onClick={() => setEnPreview(true)}
                    className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                  >
                    Generar factura con {seleccionados.size} seleccionado(s)
                  </button>
                )}
              </div>

              {cargando ? (
                <div className="text-center py-6 text-muted-foreground">Cargando...</div>
              ) : viajesPendientes.length === 0 ? (
                <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de facturación.</div>
              ) : (
                <div className="overflow-x-auto rounded-lg border">
                  <table className="w-full text-sm">
                  <thead className="bg-slate-50">
                    <tr>
                        <th className="px-3 py-2">
                          <input
                            type="checkbox"
                            checked={seleccionados.size === viajesPendientes.length}
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
                      <th className="px-3 py-2 text-right">Importe guardado</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viajesPendientes.map((v) => {
                        const kilos = v.kilosEdit ?? v.kilos ?? 0
                        const tarifa = v.tarifaEmpresaEdit ?? v.tarifaEmpresa
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
                                value={v.tarifaEmpresaEdit ?? v.tarifaEmpresa}
                                onChange={(e) => actualizarViaje(v.id, "tarifaEmpresaEdit", parseFloat(e.target.value) || v.tarifaEmpresa)}
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
          )}

          {/* PREVIEW de factura */}
          {enPreview && preview && esInterno && (
            <div className="p-4 bg-muted/40 rounded-lg border space-y-3">
              <h3 className="font-semibold">Preview de factura</h3>
              <p className="text-sm text-muted-foreground">
                Esta vista previa refleja la tarifa comercial que va a quedar guardada para la empresa en la factura.
              </p>
              {errorGen && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{errorGen}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de comprobante</label>
                  <select
                    value={tipoCbte}
                    onChange={(e) => setTipoCbte(Number(e.target.value))}
                    className="h-8 rounded border bg-background px-2 text-sm"
                  >
                    <option value={1}>Factura A (1)</option>
                    <option value={6}>Factura B (6)</option>
                    <option value={201}>Factura A MiPyme (201)</option>
                  </select>
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
                <div className="flex justify-between font-medium"><span>Neto a guardar ({viajesSeleccionados.length} viaje(s)):</span><span>{formatearMoneda(preview.neto)}</span></div>
                <div className="flex justify-between"><span>IVA ({ivaPct}%):</span><span>+ {formatearMoneda(preview.ivaMonto)}</span></div>
                <div className="flex justify-between font-bold text-base border-t pt-2"><span>TOTAL:</span><span>{formatearMoneda(preview.total)}</span></div>
              </div>
              <div className="flex justify-end gap-2">
                <button onClick={() => setEnPreview(false)} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
                  Volver
                </button>
                <button
                  onClick={confirmarFactura}
                  disabled={generando}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
                >
                  {generando ? "Generando..." : "Confirmar y generar"}
                </button>
              </div>
            </div>
          )}

          {/* SECCIÓN B: Facturas emitidas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Facturas</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {facturas.length}
              </span>
            </div>
            {cargando && facturas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Cargando...</div>
            ) : facturas.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Sin facturas registradas.</div>
            ) : (
              <div className="space-y-2">
                {facturas.map((fact) => {
                  return (
                    <div key={fact.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{formatearFecha(new Date(fact.emitidaEn))}</span>
                          <EstadoBadge estado={fact.estado} />
                          {fact.nroComprobante && (
                            <span className="text-xs text-muted-foreground">#{fact.nroComprobante}</span>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{fact.viajes.length} viaje(s) · Tipo {fact.tipoCbte}</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold">{formatearMoneda(fact.total)}</p>
                        {esInterno && (
                          <button
                            onClick={() => setFacturaDetalle(fact)}
                            className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
                          >
                            Ver detalle
                          </button>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal detalle */}
      {facturaDetalle && (
        <ModalDetalleFactura
          factura={facturaDetalle}
          onCambiarEstado={(estado, nroComprobante) => cambiarEstadoFactura(facturaDetalle.id, estado, nroComprobante)}
          onRegistrarCobro={async () => {
            // Fetch saldo CC for this empresa
            try {
              const res = await fetch(`/api/empresas/${facturaDetalle.empresaId}/saldo-cc`)
              if (res.ok) {
                const data = await res.json()
                setSaldoAFavorCC(data.saldoAFavor ?? 0)
              }
            } catch { /* silencioso */ }
            setCobrandoFactura(facturaDetalle)
            setFacturaDetalle(null)
          }}
          onCerrar={() => setFacturaDetalle(null)}
          cargando={cambioEstadoCargando}
        />
      )}

      {/* Modal cobro */}
      {cobrandoFactura && (
        <RegistrarCobroModal
          factura={{
            id: cobrandoFactura.id,
            nroComprobante: cobrandoFactura.nroComprobante,
            tipoCbte: cobrandoFactura.tipoCbte,
            total: cobrandoFactura.total,
            pagosExistentes: sumarImportes(cobrandoFactura.pagos.map(p => p.monto)),
            empresa: { id: cobrandoFactura.empresaId, razonSocial: cobrandoFactura.empresa.razonSocial },
          }}
          cuentasBancarias={cuentasBancarias}
          saldoAFavorCC={saldoAFavorCC}
          onSuccess={() => {
            setCobrandoFactura(null)
            cargarDatos()
          }}
          onClose={() => setCobrandoFactura(null)}
        />
      )}
    </div>
  )
}
