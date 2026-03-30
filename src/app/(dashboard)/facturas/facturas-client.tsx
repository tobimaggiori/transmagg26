"use client"

/**
 * Propósito: Componente cliente de la página de facturas emitidas.
 * Selector de empresa → viajes pendientes (editables inline) + preview y confirmación.
 * También muestra facturas emitidas con detalle y cambio de estado.
 */

import { useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Empresa = { id: string; razonSocial: string }

type ViajeParaFacturar = {
  id: string
  fechaViaje: string
  fleteroId: string
  empresaId: string
  empresa: { razonSocial: string }
  fletero: { razonSocial: string }
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaBase: number
  estadoLiquidacion: string
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
}

type ViajeEnFactura = {
  id: string
  fechaViaje: string
  remito: string | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaEmpresa: number
  subtotal: number
}

type Factura = {
  id: string
  emitidaEn: string
  tipoCbte: string
  ivaPct: number
  nroComprobante: string | null
  neto: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  empresa: { razonSocial: string }
  viajes: ViajeEnFactura[]
  pagos: { monto: number }[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type FacturasClientProps = {
  rol: Rol
  empresas: Empresa[]
  empresaIdPropia: string | null
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    COBRADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {estado}
    </span>
  )
}

// ─── Modal detalle factura ────────────────────────────────────────────────────

/**
 * ModalDetalleFactura: props -> JSX.Element
 *
 * Dado una factura, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una factura y cambiar su estado.
 *
 * Ejemplos:
 * <ModalDetalleFactura factura={fact} onCambiarEstado={fn} onCerrar={fn} />
 */
function ModalDetalleFactura({
  factura,
  onCambiarEstado,
  onCerrar,
  cargando,
}: {
  factura: Factura
  onCambiarEstado: (estado: string, nroComprobante?: string) => void
  onCerrar: () => void
  cargando: boolean
}) {
  const [nroComprobante, setNroComprobante] = useState(factura.nroComprobante ?? "")
  const pagado = factura.pagos.reduce((acc, p) => acc + p.monto, 0)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Factura — {factura.empresa.razonSocial}</h2>
            <p className="text-sm text-muted-foreground">
              {formatearFecha(new Date(factura.emitidaEn))} · Tipo {factura.tipoCbte}
              {factura.nroComprobante ? ` · #${factura.nroComprobante}` : ""} · <EstadoBadge estado={factura.estado} />
            </p>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Tabla de viajes */}
        <div className="overflow-x-auto rounded border mb-4">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="px-3 py-2 text-left">Fecha</th>
                <th className="px-3 py-2 text-left">Remito</th>
                <th className="px-3 py-2 text-left">Mercadería</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Destino</th>
                <th className="px-3 py-2 text-right">Kilos</th>
                <th className="px-3 py-2 text-right">Ton</th>
                <th className="px-3 py-2 text-right">Tarifa/ton</th>
                <th className="px-3 py-2 text-right">Subtotal</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {factura.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
                  <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos != null ? calcularToneladas(v.kilos) : "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaEmpresa)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between font-medium"><span>Neto:</span><span>{formatearMoneda(factura.neto)}</span></div>
          <div className="flex justify-between"><span>IVA ({factura.ivaPct ?? 21}%):</span><span>+ {formatearMoneda(factura.ivaMonto)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL:</span><span>{formatearMoneda(factura.total)}</span></div>
          {pagado > 0 && (
            <div className="flex justify-between text-green-700"><span>Pagado:</span><span>{formatearMoneda(pagado)}</span></div>
          )}
        </div>

        {/* Nro comprobante (solo al emitir) */}
        {factura.estado === "BORRADOR" && (
          <div className="mb-4">
            <label className="text-xs font-medium text-muted-foreground block mb-1">Nro. Comprobante (opcional)</label>
            <input
              type="text"
              value={nroComprobante}
              onChange={(e) => setNroComprobante(e.target.value)}
              placeholder="0001-00000001"
              className="h-8 rounded border bg-background px-2 text-sm w-48"
            />
          </div>
        )}

        {/* Acciones */}
        <div className="flex justify-between items-center">
          <button
            onClick={() => window.print()}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Descargar PDF
          </button>
          <div className="flex gap-2">
            {factura.estado === "BORRADOR" && (
              <button
                onClick={() => onCambiarEstado("EMITIDA", nroComprobante || undefined)}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Marcar como emitida en ARCA
              </button>
            )}
            {factura.estado === "EMITIDA" && (
              <button
                onClick={() => onCambiarEstado("COBRADA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-green-600 text-white text-sm font-medium hover:bg-green-700 disabled:opacity-50"
              >
                Registrar cobro
              </button>
            )}
            {(factura.estado === "BORRADOR" || factura.estado === "EMITIDA") && (
              <button
                onClick={() => onCambiarEstado("ANULADA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
              >
                Anular
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
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
export function FacturasClient({ rol, empresas, empresaIdPropia }: FacturasClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [empresaId, setEmpresaId] = useState<string>(empresaIdPropia ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaFacturar[]>([])
  const [facturas, setFacturas] = useState<Factura[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [tipoCbte, setTipoCbte] = useState<string>("A")
  const [ivaPct, setIvaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [facturaDetalle, setFacturaDetalle] = useState<Factura | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)

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
          tarifaEmpresaEdit: v.tarifaBase,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          cupoEdit: v.cupo ?? "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: v.provinciaOrigen ?? "",
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: v.provinciaDestino ?? "",
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
    tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaBase,
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
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: v.cupoEdit || null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaEmpresa: v.tarifaEmpresaEdit ?? v.tarifaBase,
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
        <h2 className="text-2xl font-bold tracking-tight">Facturas emitidas</h2>
        <p className="text-muted-foreground">
          {esInterno ? "Facturación a empresas clientes" : "Facturas de tu empresa"}
        </p>
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
                    <thead className="bg-muted/50">
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
                        <th className="px-3 py-2 text-right">Tarifa/ton</th>
                        <th className="px-3 py-2 text-right">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {viajesPendientes.map((v) => {
                        const kilos = v.kilosEdit ?? v.kilos ?? 0
                        const tarifa = v.tarifaEmpresaEdit ?? v.tarifaBase
                        const ton = kilos > 0 ? calcularToneladas(kilos) : null
                        const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                        return (
                          <tr key={v.id} className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                            <td className="px-3 py-2 text-center">
                              <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                            </td>
                            <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                            <td className="px-3 py-2">{v.fletero.razonSocial}</td>
                            <td className="px-3 py-2">{v.remito ?? "-"}</td>
                            <td className="px-3 py-2">{v.cupo ?? "-"}</td>
                            <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                            <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                            <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
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
                                value={v.tarifaEmpresaEdit ?? v.tarifaBase}
                                onChange={(e) => actualizarViaje(v.id, "tarifaEmpresaEdit", parseFloat(e.target.value) || v.tarifaBase)}
                                className="w-28 h-7 text-right rounded border bg-background px-2 text-xs"
                                min="0"
                                step="0.01"
                              />
                            </td>
                            <td className="px-3 py-2 text-right font-medium">
                              {total != null ? formatearMoneda(total) : "-"}
                            </td>
                          </tr>
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
              {errorGen && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{errorGen}</div>}
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <label className="text-xs font-medium text-muted-foreground block mb-1">Tipo de comprobante</label>
                  <select
                    value={tipoCbte}
                    onChange={(e) => setTipoCbte(e.target.value)}
                    className="h-8 rounded border bg-background px-2 text-sm"
                  >
                    <option value="A">A</option>
                    <option value="B">B</option>
                    <option value="C">C</option>
                    <option value="M">M</option>
                    <option value="X">X</option>
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
                <div className="flex justify-between font-medium"><span>Neto ({viajesSeleccionados.length} viaje(s)):</span><span>{formatearMoneda(preview.neto)}</span></div>
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
                  const pagado = fact.pagos.reduce((acc, p) => acc + p.monto, 0)
                  const estadoPago = fact.estado === "COBRADA" || pagado >= fact.total ? "COBRADA" : "PENDIENTE"
                  return (
                    <div key={fact.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium">{formatearFecha(new Date(fact.emitidaEn))}</span>
                          <EstadoBadge estado={fact.estado} />
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${estadoPago === "COBRADA" ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}`}>
                            {estadoPago === "COBRADA" ? "Cobrada" : "Pendiente cobro"}
                          </span>
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
          onCerrar={() => setFacturaDetalle(null)}
          cargando={cambioEstadoCargando}
        />
      )}
    </div>
  )
}
