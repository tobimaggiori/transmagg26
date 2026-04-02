"use client"

/**
 * Propósito: Componente cliente de la página de facturas emitidas.
 * Selector de empresa → viajes pendientes (editables inline) + preview y confirmación.
 * También muestra facturas emitidas con detalle y cambio de estado.
 */

import { Fragment, useState, useCallback, useEffect } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas, calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { calcularTotalesNotaCD, labelTipoNotaCD, labelSubtipoNotaCD } from "@/lib/nota-cd-utils"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import { RegistrarCobroModal } from "@/components/forms/registrar-cobro-form"
import type { Rol } from "@/types"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Empresa = { id: string; razonSocial: string }
type Camion = { id: string; patenteChasis: string; fleteroId: string }
type Chofer = { id: string; nombre: string; apellido: string }

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
  tarifaEmpresa: number
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
  camionIdEdit?: string
  choferIdEdit?: string
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
  tipoCbte: number
  ivaPct: number
  nroComprobante: string | null
  neto: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  empresaId: string
  empresa: { razonSocial: string }
  viajes: ViajeEnFactura[]
  pagos: { monto: number }[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type CuentaBancaria = { id: string; nombre: string; bancoOEntidad: string }

type FacturasClientProps = {
  rol: Rol
  empresas: Empresa[]
  camiones: Camion[]
  choferes: Chofer[]
  empresaIdPropia: string | null
  cuentasBancarias: CuentaBancaria[]
}

type NotaCDResumen = {
  id: string
  tipo: string
  subtipo: string | null
  montoTotal: number
  estado: string
  creadoEn: string
}

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

// ─── Modal Emitir NC ──────────────────────────────────────────────────────────

/**
 * ModalEmitirNC: props -> JSX.Element
 *
 * Dado el id de la factura, sus viajes y una función de cierre/recarga,
 * renderiza un formulario para emitir una Nota de Crédito (NC_EMITIDA).
 * Permite seleccionar subtipo: ANULACION_TOTAL (monto automático desde factura),
 * ANULACION_PARCIAL (con selección de viajes mediante checkboxes) y
 * CORRECCION_IMPORTE (con input manual de montoNeto).
 * Para todos los subtipos muestra el preview de totales (neto, IVA, total).
 * Al confirmar envía POST /api/notas-credito-debito y llama onExito.
 * Existe para que el operador emita NC sin abandonar la vista de la factura.
 *
 * Ejemplos:
 * <ModalEmitirNC facturaId="f1" totalFactura={1210} viajes={[...]} onExito={fn} onClose={fn} />
 * // => formulario de NC con subtipo ANULACION_TOTAL por defecto
 */
function ModalEmitirNC({
  facturaId,
  totalFactura,
  netoFactura,
  viajes,
  onExito,
  onClose,
}: {
  facturaId: string
  totalFactura: number
  netoFactura: number
  viajes: ViajeEnFactura[]
  onExito: () => void
  onClose: () => void
}) {
  const [subtipo, setSubtipo] = useState("ANULACION_TOTAL")
  const [montoNeto, setMontoNeto] = useState(netoFactura)
  const [ivaPct, setIvaPct] = useState(21)
  const [descripcion, setDescripcion] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [viajesSeleccionados, setViajesSeleccionados] = useState<Set<string>>(new Set())
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const montoNetoReal = subtipo === "ANULACION_TOTAL" ? netoFactura : montoNeto
  const totales = calcularTotalesNotaCD(montoNetoReal, ivaPct)

  function toggleViaje(id: string) {
    setViajesSeleccionados((prev) => {
      const s = new Set(prev)
      if (s.has(id)) s.delete(id)
      else s.add(id)
      return s
    })
  }

  async function emitir() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }
    if (subtipo === "ANULACION_PARCIAL" && viajesSeleccionados.size === 0) {
      setError("Seleccioná al menos un viaje para anulación parcial"); return
    }
    setEnviando(true)
    setError(null)
    try {
      const body: Record<string, unknown> = {
        tipo: "NC_EMITIDA",
        subtipo,
        facturaId,
        montoNeto: montoNetoReal,
        ivaPct,
        descripcion,
        motivoDetalle: motivoDetalle || undefined,
        viajesIds: subtipo === "ANULACION_PARCIAL" ? Array.from(viajesSeleccionados) : undefined,
      }
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al emitir NC")
        return
      }
      onExito()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-blue-700">Emitir Nota de Crédito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subtipo *</label>
            <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)} className="w-full h-9 rounded border bg-white px-2 text-sm">
              <option value="ANULACION_TOTAL">Anulación total</option>
              <option value="ANULACION_PARCIAL">Anulación parcial</option>
              <option value="CORRECCION_IMPORTE">Corrección de importe</option>
            </select>
          </div>

          {subtipo === "ANULACION_PARCIAL" && viajes.length > 0 && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Viajes a anular *</label>
              <div className="border rounded divide-y max-h-40 overflow-y-auto">
                {viajes.map((v) => (
                  <label key={v.id} className="flex items-center gap-2 px-3 py-2 hover:bg-gray-50 cursor-pointer text-sm">
                    <input
                      type="checkbox"
                      checked={viajesSeleccionados.has(v.id)}
                      onChange={() => toggleViaje(v.id)}
                    />
                    <span>{formatearFecha(new Date(v.fechaViaje))} — {v.mercaderia ?? "viaje"} — {formatearMoneda(v.subtotal)}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          {subtipo === "CORRECCION_IMPORTE" && (
            <div>
              <label className="text-xs font-medium text-gray-600 block mb-1">Monto neto *</label>
              <input
                type="number"
                value={montoNeto}
                onChange={(e) => setMontoNeto(parseFloat(e.target.value) || 0)}
                min="0.01"
                step="0.01"
                className="w-full h-9 rounded border bg-white px-2 text-sm"
              />
            </div>
          )}

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">IVA %</label>
            <input
              type="number"
              value={ivaPct}
              onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-24 h-9 rounded border bg-white px-2 text-sm"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Descripción *</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full h-9 rounded border bg-white px-2 text-sm"
              placeholder="Descripción de la NC"
            />
          </div>

          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Motivo / detalle (opcional)</label>
            <textarea
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              rows={2}
              className="w-full rounded border bg-white px-2 py-1.5 text-sm"
              placeholder="Detalle adicional..."
            />
          </div>

          {/* Preview totales */}
          <div className="bg-blue-50 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Neto:</span><span>{formatearMoneda(totales.montoNeto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">IVA ({ivaPct}%):</span><span>{formatearMoneda(totales.montoIva)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total NC:</span><span>{formatearMoneda(totales.montoTotal)}</span></div>
            <p className="text-xs text-gray-500">Factura original: {formatearMoneda(totalFactura)}</p>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button
            onClick={emitir}
            disabled={enviando}
            className="rounded-md bg-blue-600 text-white px-4 py-2 text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
          >
            {enviando ? "Emitiendo..." : "Emitir Nota de Crédito"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal Emitir ND ──────────────────────────────────────────────────────────

/**
 * ModalEmitirND: props -> JSX.Element
 *
 * Dado el id de la factura y una función de cierre/recarga, renderiza un formulario
 * para emitir una Nota de Débito (ND_EMITIDA) con selector de subtipo, inputs de
 * montoNeto e ivaPct, descripción obligatoria, motivoDetalle opcional y preview de totales.
 * Al confirmar envía POST /api/notas-credito-debito y llama onExito.
 * Existe para que el operador emita ND (diferencias, costos adicionales, ajustes, etc.)
 * sin abandonar la vista de la factura.
 *
 * Ejemplos:
 * <ModalEmitirND facturaId="f1" onExito={fn} onClose={fn} />
 * // => formulario de ND con subtipo DIFERENCIA_TARIFA por defecto
 */
function ModalEmitirND({
  facturaId,
  onExito,
  onClose,
}: {
  facturaId: string
  onExito: () => void
  onClose: () => void
}) {
  const [subtipo, setSubtipo] = useState("DIFERENCIA_TARIFA")
  const [montoNeto, setMontoNeto] = useState(0)
  const [ivaPct, setIvaPct] = useState(21)
  const [descripcion, setDescripcion] = useState("")
  const [motivoDetalle, setMotivoDetalle] = useState("")
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totales = calcularTotalesNotaCD(montoNeto, ivaPct)

  async function emitir() {
    if (!descripcion.trim()) { setError("La descripción es obligatoria"); return }
    if (montoNeto <= 0) { setError("El monto neto debe ser mayor a 0"); return }
    setEnviando(true)
    setError(null)
    try {
      const body = {
        tipo: "ND_EMITIDA",
        subtipo,
        facturaId,
        montoNeto,
        ivaPct,
        descripcion,
        motivoDetalle: motivoDetalle || undefined,
      }
      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al emitir ND")
        return
      }
      onExito()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4">
      <div className="relative w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-lg bg-white shadow-xl">
        <div className="flex items-center justify-between border-b px-6 py-4">
          <h2 className="text-lg font-semibold text-orange-700">Emitir Nota de Débito</h2>
          <button onClick={onClose} className="text-gray-500 hover:text-gray-800 text-xl font-bold">×</button>
        </div>
        <div className="px-6 py-4 space-y-4">
          {error && <div className="p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Subtipo *</label>
            <select value={subtipo} onChange={(e) => setSubtipo(e.target.value)} className="w-full h-9 rounded border bg-white px-2 text-sm">
              <option value="DIFERENCIA_TARIFA">Diferencia de tarifa</option>
              <option value="COSTO_ADICIONAL">Costo adicional</option>
              <option value="AJUSTE">Ajuste</option>
              <option value="PENALIDAD">Penalidad</option>
              <option value="CORRECCION_ADMINISTRATIVA">Corrección administrativa</option>
            </select>
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Monto neto *</label>
            <input
              type="number"
              value={montoNeto}
              onChange={(e) => setMontoNeto(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              className="w-full h-9 rounded border bg-white px-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">IVA %</label>
            <input
              type="number"
              value={ivaPct}
              onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
              min="0"
              max="100"
              className="w-24 h-9 rounded border bg-white px-2 text-sm"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Descripción *</label>
            <input
              type="text"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              className="w-full h-9 rounded border bg-white px-2 text-sm"
              placeholder="Descripción de la ND"
            />
          </div>
          <div>
            <label className="text-xs font-medium text-gray-600 block mb-1">Motivo / detalle (opcional)</label>
            <textarea
              value={motivoDetalle}
              onChange={(e) => setMotivoDetalle(e.target.value)}
              rows={2}
              className="w-full rounded border bg-white px-2 py-1.5 text-sm"
              placeholder="Detalle adicional..."
            />
          </div>
          {/* Preview totales */}
          <div className="bg-orange-50 rounded-md p-3 text-sm space-y-1">
            <div className="flex justify-between"><span className="text-gray-600">Neto:</span><span>{formatearMoneda(totales.montoNeto)}</span></div>
            <div className="flex justify-between"><span className="text-gray-600">IVA ({ivaPct}%):</span><span>{formatearMoneda(totales.montoIva)}</span></div>
            <div className="flex justify-between font-semibold border-t pt-1"><span>Total ND:</span><span>{formatearMoneda(totales.montoTotal)}</span></div>
          </div>
        </div>
        <div className="flex justify-end gap-3 border-t px-6 py-4">
          <button onClick={onClose} className="rounded-md border px-4 py-2 text-sm font-medium hover:bg-gray-50">Cancelar</button>
          <button
            onClick={emitir}
            disabled={enviando}
            className="rounded-md bg-orange-600 text-white px-4 py-2 text-sm font-medium hover:bg-orange-700 disabled:opacity-50"
          >
            {enviando ? "Emitiendo..." : "Emitir Nota de Débito"}
          </button>
        </div>
      </div>
    </div>
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
  onRegistrarCobro,
  onCerrar,
  cargando,
}: {
  factura: Factura
  onCambiarEstado: (estado: string, nroComprobante?: string) => void
  onRegistrarCobro: () => void
  onCerrar: () => void
  cargando: boolean
}) {
  const [nroComprobante, setNroComprobante] = useState(factura.nroComprobante ?? "")
  const [notasCD, setNotasCD] = useState<NotaCDResumen[]>([])
  const [mostrarModalNC, setMostrarModalNC] = useState(false)
  const [mostrarModalND, setMostrarModalND] = useState(false)
  const pagado = factura.pagos.reduce((acc, p) => acc + p.monto, 0)

  useEffect(() => {
    async function cargarNotasCD() {
      try {
        const res = await fetch(`/api/notas-credito-debito?facturaId=${factura.id}`)
        if (res.ok) setNotasCD(await res.json())
      } catch { /* silencioso */ }
    }
    cargarNotasCD()
  }, [factura.id])

  function handleExitoNota() {
    setMostrarModalNC(false)
    setMostrarModalND(false)
    // Recargar notas
    fetch(`/api/notas-credito-debito?facturaId=${factura.id}`)
      .then((r) => r.json())
      .then(setNotasCD)
      .catch(() => {})
  }

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
                <th className="px-3 py-2 text-right">Tarifa a la empresa / ton</th>
                <th className="px-3 py-2 text-right">Importe guardado</th>
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

        {/* Sección NC/ND */}
        <div className="mt-4 border-t pt-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-sm font-semibold text-gray-700">Notas de Crédito / Débito</h3>
            {factura.estado !== "ANULADA" && (
              <div className="flex gap-2">
                <button
                  onClick={() => setMostrarModalNC(true)}
                  className="h-7 px-3 rounded-md bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200"
                >
                  Emitir NC
                </button>
                <button
                  onClick={() => setMostrarModalND(true)}
                  className="h-7 px-3 rounded-md bg-orange-100 text-orange-700 text-xs font-medium hover:bg-orange-200"
                >
                  Emitir ND
                </button>
              </div>
            )}
          </div>
          {notasCD.length === 0 ? (
            <p className="text-xs text-muted-foreground">No hay NC/ND para esta factura.</p>
          ) : (
            <div className="overflow-x-auto rounded border text-xs">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Tipo</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Fecha</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Monto</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {notasCD.map((n) => (
                    <tr key={n.id} className="border-t">
                      <td className="px-3 py-1.5">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${n.tipo === "NC_EMITIDA" ? "bg-blue-100 text-blue-700" : "bg-orange-100 text-orange-700"}`}>
                          {labelTipoNotaCD(n.tipo)}
                        </span>
                        {n.subtipo && <span className="ml-1 text-gray-500">{labelSubtipoNotaCD(n.subtipo)}</span>}
                      </td>
                      <td className="px-3 py-1.5 text-gray-600">{formatearFecha(n.creadoEn)}</td>
                      <td className="px-3 py-1.5 text-right font-medium">{formatearMoneda(n.montoTotal)}</td>
                      <td className="px-3 py-1.5 text-gray-600">{n.estado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Acciones */}
        <div className="flex justify-between items-center mt-4">
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
            {(factura.estado === "EMITIDA" || factura.estado === "PARCIALMENTE_COBRADA") && (
              <button
                onClick={onRegistrarCobro}
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

      {/* Modales NC/ND (dentro del ModalDetalleFactura) */}
      {mostrarModalNC && (
        <ModalEmitirNC
          facturaId={factura.id}
          totalFactura={factura.total}
          netoFactura={factura.neto}
          viajes={factura.viajes}
          onExito={handleExitoNota}
          onClose={() => setMostrarModalNC(false)}
        />
      )}
      {mostrarModalND && (
        <ModalEmitirND
          facturaId={factura.id}
          onExito={handleExitoNota}
          onClose={() => setMostrarModalND(false)}
        />
      )}
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
            pagosExistentes: cobrandoFactura.pagos.reduce((s, p) => s + p.monto, 0),
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
