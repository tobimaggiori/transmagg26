"use client"

/**
 * Propósito: Componente cliente de la página de liquidaciones.
 * Selector de fletero → viajes pendientes (editables vía modal) + preview fullscreen y confirmación.
 * También muestra liquidaciones emitidas con detalle y cambio de estado.
 */

import { useState, useCallback, useEffect, Fragment } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { ProvinciaArgentina } from "@/lib/provincias"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { labelCondicionIva, formatearNroComprobante } from "@/lib/liquidacion-utils"
import { WorkflowNote } from "@/components/workflow/workflow-note"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; comisionDefault?: number }

type FleteroInfo = {
  razonSocial: string
  cuit: string
  condicionIva: string
  direccion?: string | null
  nroProximoComprobante: number
}
type Camion = { id: string; patenteChasis: string; fleteroId: string }
type Chofer = { id: string; nombre: string; apellido: string }

type ViajeParaLiquidar = {
  id: string
  fechaViaje: string
  empresaId: string
  empresa: { razonSocial: string }
  camionId: string
  camion: { patenteChasis: string }
  choferId: string
  chofer: { nombre: string; apellido: string }
  remito: string | null
  tieneCupo: boolean | null
  cupo: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaOperativaInicial: number
  estadoFactura: string
  // editados localmente
  kilosEdit?: number
  tarifaEdit?: number
  fechaEdit?: string
  remitoEdit?: string
  tieneCupoEdit?: boolean
  cupoEdit?: string
  mercaderiaEdit?: string
  procedenciaEdit?: string
  origenEdit?: ProvinciaArgentina
  destinoEdit?: string
  provinciaDestinoEdit?: ProvinciaArgentina
  camionIdEdit?: string
  choferIdEdit?: string
}

type ViajeEnLiquidacion = {
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
  tarifaFletero: number
  subtotal: number
}

type Liquidacion = {
  id: string
  grabadaEn: string
  comisionPct: number
  ivaPct: number
  subtotalBruto: number
  comisionMonto: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  nroComprobante: number | null
  ptoVenta: number | null
  fleteroId: string
  fletero: { razonSocial: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago?: { id: string; nro: number; fecha: string; pdfS3Key?: string | null } | null }[]
  gastoDescuentos?: {
    id: string
    montoDescontado: number
    gasto: {
      tipo: string
      facturaProveedor: {
        tipoCbte: string
        nroComprobante: string | null
        proveedor: { razonSocial: string }
      }
    }
  }[]
}

// ─── Props ────────────────────────────────────────────────────────────────────

type LiquidacionesClientProps = {
  rol: Rol
  fleteros: Fletero[]
  camiones: Camion[]
  choferes: Chofer[]
  fleteroIdPropio: string | null
  titulo?: string
}

// ─── Estado badge ─────────────────────────────────────────────────────────────

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    BORRADOR: "bg-yellow-100 text-yellow-800",
    EMITIDA: "bg-blue-100 text-blue-800",
    PARCIALMENTE_PAGADA: "bg-amber-100 text-amber-800",
    PAGADA: "bg-green-100 text-green-800",
    ANULADA: "bg-red-100 text-red-800",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_PAGADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-gray-100 text-gray-800"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Modal enviar Orden de Pago por email ─────────────────────────────────────

function ModalEnviarEmailOP({
  opId,
  opNro,
  emailDefault,
  onCerrar,
}: {
  opId: string
  opNro: number
  emailDefault: string
  onCerrar: () => void
}) {
  const [email, setEmail] = useState(emailDefault)
  const [enviando, setEnviando] = useState(false)
  const [resultado, setResultado] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function enviar() {
    setEnviando(true)
    setError(null)
    setResultado(null)
    try {
      const res = await fetch(`/api/ordenes-pago/${opId}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { emailDestino: email } : {}),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al enviar el email")
        return
      }
      setResultado(`Email enviado a ${email}`)
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-sm p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-base font-semibold">Enviar OP Nro {opNro.toLocaleString("es-AR")}</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        {resultado ? (
          <div className="space-y-4">
            <p className="text-sm text-green-700">{resultado}</p>
            <div className="flex justify-end">
              <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cerrar</button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-1 block">Email destino</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
            {error && <p className="text-xs text-red-600">{error}</p>}
            <div className="flex justify-end gap-2">
              <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">Cancelar</button>
              <button
                onClick={enviar}
                disabled={enviando || !email}
                className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Modal detalle liquidación ────────────────────────────────────────────────

/**
 * ModalDetalleLiquidacion: props -> JSX.Element
 *
 * Dado una liquidación, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una liquidación y cambiar su estado.
 *
 * Ejemplos:
 * <ModalDetalleLiquidacion liq={liq} onCambiarEstado={fn} onCerrar={fn} />
 */
function ModalDetalleLiquidacion({
  liq,
  emailFletero,
  onCambiarEstado,
  onAnularPago,
  onEditarPago,
  onCerrar,
  cargando,
}: {
  liq: Liquidacion
  emailFletero?: string
  onCambiarEstado: (estado: string) => void
  onAnularPago?: (pagoId: string) => void
  onEditarPago?: (pagoId: string) => void
  onCerrar: () => void
  cargando: boolean
}) {
  const [modalEmail, setModalEmail] = useState<{ opId: string; opNro: number } | null>(null)

  // Obtener la Orden de Pago del primer pago no anulado que la tenga
  const ordenPago = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago ?? null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">Liquidación — {liq.fletero.razonSocial}</h2>
            <p className="text-sm text-muted-foreground">{formatearFecha(new Date(liq.grabadaEn))} · <EstadoBadge estado={liq.estado} /></p>
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
                <th className="px-3 py-2 text-left">Cupo</th>
                <th className="px-3 py-2 text-left">Mercadería</th>
                <th className="px-3 py-2 text-left">Origen</th>
                <th className="px-3 py-2 text-left">Destino</th>
                <th className="px-3 py-2 text-right">Kilos</th>
                <th className="px-3 py-2 text-right">Ton</th>
                <th className="px-3 py-2 text-right">Tarifa al fletero / ton</th>
                <th className="px-3 py-2 text-right">Importe guardado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {liq.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
                  <td className="px-3 py-2">{v.cupo ?? "—"}</td>
                  <td className="px-3 py-2">{v.mercaderia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaOrigen ?? v.procedencia ?? "-"}</td>
                  <td className="px-3 py-2">{v.provinciaDestino ?? v.destino ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "-"}</td>
                  <td className="px-3 py-2 text-right">{v.kilos != null ? calcularToneladas(v.kilos) : "-"}</td>
                  <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaFletero)}</td>
                  <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Totales */}
        <div className="space-y-1 text-sm mb-4">
          <div className="flex justify-between"><span>Total viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
          <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>- {formatearMoneda(liq.comisionMonto)}</span></div>
          <div className="flex justify-between font-medium"><span>Subtotal neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
          <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>+ {formatearMoneda(liq.ivaMonto)}</span></div>
          <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL FINAL:</span><span>{formatearMoneda(liq.total)}</span></div>
        </div>

        {/* Pagos registrados */}
        {liq.pagos.length > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Pagos registrados</p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Fecha</th>
                    <th className="px-3 py-2 text-left">Tipo</th>
                    <th className="px-3 py-2 text-right">Monto</th>
                    <th className="px-3 py-2" />
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liq.pagos.map((p) => (
                    <Fragment key={p.id}>
                      <tr className={p.anulado ? "opacity-50 line-through" : ""}>
                        <td className="px-3 py-2">{formatearFecha(new Date(p.fechaPago))}</td>
                        <td className="px-3 py-2 capitalize">{p.tipoPago.replace(/_/g, " ").toLowerCase()}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(p.monto)}</td>
                        <td className="px-3 py-2">
                          {!p.anulado && (
                            <div className="flex gap-1 justify-end">
                              <button
                                onClick={() => onEditarPago?.(p.id)}
                                className="h-6 px-2 rounded border text-xs font-medium hover:bg-accent"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => onAnularPago?.(p.id)}
                                className="h-6 px-2 rounded border text-xs font-medium text-red-600 hover:bg-red-50"
                              >
                                Anular
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={4} className="px-3 pb-2">
                          <HistorialPagoFletero pagoId={p.id} />
                        </td>
                      </tr>
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Gastos descontados */}
        {(liq.gastoDescuentos?.length ?? 0) > 0 && (
          <div className="mb-4">
            <p className="text-sm font-medium mb-2">Gastos descontados</p>
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Proveedor</th>
                    <th className="px-3 py-2 text-left">Comprobante</th>
                    <th className="px-3 py-2 text-right">Monto descontado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {liq.gastoDescuentos!.map((d) => (
                    <tr key={d.id}>
                      <td className="px-3 py-2">{d.gasto.facturaProveedor.proveedor.razonSocial}</td>
                      <td className="px-3 py-2 text-muted-foreground">
                        {d.gasto.facturaProveedor.tipoCbte} {d.gasto.facturaProveedor.nroComprobante ?? "s/n"}
                      </td>
                      <td className="px-3 py-2 text-right text-orange-600">
                        {formatearMoneda(d.montoDescontado)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t font-semibold">
                    <td colSpan={2} className="px-3 py-2">Total gastos descontados</td>
                    <td className="px-3 py-2 text-right text-orange-600">
                      {formatearMoneda(liq.gastoDescuentos!.reduce((s, d) => s + d.montoDescontado, 0))}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}

        {/* Orden de Pago */}
        {ordenPago && (
          <div className="mb-4 pt-4 border-t">
            <p className="text-sm font-medium mb-2">
              Orden de Pago Nro {ordenPago.nro.toLocaleString("es-AR")}
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => window.open(`/api/ordenes-pago/${ordenPago.id}/pdf`, "_blank")}
                className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Ver PDF
              </button>
              <button
                onClick={() => window.open(`/api/ordenes-pago/${ordenPago.id}/pdf?print=true`, "_blank")}
                className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Imprimir
              </button>
              <button
                onClick={() => setModalEmail({ opId: ordenPago.id, opNro: ordenPago.nro })}
                className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
              >
                Enviar por email
              </button>
            </div>
          </div>
        )}

        {modalEmail && (
          <ModalEnviarEmailOP
            opId={modalEmail.opId}
            opNro={modalEmail.opNro}
            emailDefault={emailFletero ?? ""}
            onCerrar={() => setModalEmail(null)}
          />
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
            {liq.estado === "BORRADOR" && (
              <button
                onClick={() => onCambiarEstado("EMITIDA")}
                disabled={cargando}
                className="h-9 px-4 rounded-md bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50"
              >
                Marcar como emitida en ARCA
              </button>
            )}
            {(liq.estado === "BORRADOR" || liq.estado === "EMITIDA") && (
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

// ─── Modal anular pago fletero ────────────────────────────────────────────────

type ImpactoItem = {
  tipo: string
  descripcion: string
  detalle: string
  estadoActual: string
  nuevoEstado: string
}

type EntradaHistorial = {
  id: string
  tipoEvento: string
  justificacion: string
  estadoAnterior: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
}

function ModalAnularPagoFletero({
  pagoId,
  pagoMonto,
  pagoTipo,
  pagoFecha,
  onConfirmar,
  onCerrar,
}: {
  pagoId: string
  pagoMonto: number
  pagoTipo: string
  pagoFecha: string
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [justificacion, setJustificacion] = useState("")
  const [impactos, setImpactos] = useState<ImpactoItem[]>([])
  const [cargandoPreview, setCargandoPreview] = useState(true)
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setCargandoPreview(true)
    fetch(`/api/pagos-fletero/${pagoId}/impacto-modificacion`)
      .then((r) => r.json())
      .then((data) => setImpactos(data.impactos ?? []))
      .catch(() => setImpactos([]))
      .finally(() => setCargandoPreview(false))
  }, [pagoId])

  async function confirmar() {
    if (justificacion.trim().length < 10) {
      setError("La justificación debe tener al menos 10 caracteres")
      return
    }
    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/pagos-fletero/${pagoId}/anular`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ justificacion }),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al anular el pago")
        return
      }
      onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-red-600">
            Anular pago de {formatearMoneda(pagoMonto)} — {pagoTipo.replace(/_/g, " ")} — {formatearFecha(new Date(pagoFecha))}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        <div className="mb-4">
          <label className="text-sm font-medium mb-1 block">Justificación (obligatoria)</label>
          <textarea
            value={justificacion}
            onChange={(e) => setJustificacion(e.target.value)}
            rows={3}
            placeholder="Mínimo 10 caracteres..."
            className="w-full rounded border bg-background px-3 py-2 text-sm resize-none"
          />
          {error && <p className="text-xs text-red-600 mt-1">{error}</p>}
        </div>

        <div className="mb-4">
          <p className="text-sm font-medium mb-2">Registros afectados</p>
          {cargandoPreview ? (
            <p className="text-sm text-muted-foreground">Calculando impacto...</p>
          ) : impactos.length === 0 ? (
            <p className="text-sm text-muted-foreground">Sin impacto adicional detectado.</p>
          ) : (
            <div className="rounded border overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="px-3 py-2 text-left">Documento</th>
                    <th className="px-3 py-2 text-left">Estado actual</th>
                    <th className="px-3 py-2 text-left">Nuevo estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {impactos.map((imp, i) => (
                    <tr key={i} className={imp.tipo.startsWith("CC") ? "bg-blue-50/50" : ""}>
                      <td className="px-3 py-2">
                        <p className="font-medium">{imp.descripcion}</p>
                        <p className="text-xs text-muted-foreground">{imp.detalle}</p>
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{imp.estadoActual}</td>
                      <td className="px-3 py-2 font-medium">{imp.nuevoEstado}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="flex justify-end gap-2">
          <button
            onClick={onCerrar}
            className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Cancelar
          </button>
          <button
            onClick={confirmar}
            disabled={enviando || justificacion.trim().length < 10}
            className="h-9 px-4 rounded-md bg-red-600 text-white text-sm font-medium hover:bg-red-700 disabled:opacity-50"
          >
            {enviando ? "Anulando..." : "Confirmar anulación"}
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Modal editar pago fletero ────────────────────────────────────────────────

function ModalEditarPagoFletero({
  pagoId,
  pagoMonto,
  pagoTipo,
  pagoFecha,
  liquidacionId,
  fleteroId,
  onConfirmar,
  onCerrar,
}: {
  pagoId: string
  pagoMonto: number
  pagoTipo: string
  pagoFecha: string
  liquidacionId: string
  fleteroId: string
  onConfirmar: () => void
  onCerrar: () => void
}) {
  const [nuevoMonto, setNuevoMonto] = useState(String(pagoMonto))
  const [nuevaFecha, setNuevaFecha] = useState(pagoFecha.slice(0, 10))
  const [nroCheque, setNroCheque] = useState("")
  const [nuevaLiquidacionId, setNuevaLiquidacionId] = useState("")
  const [justificacion, setJustificacion] = useState("")
  const [liquidaciones, setLiquidaciones] = useState<{ id: string; label: string }[]>([])
  const [enviando, setEnviando] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const esCheque = pagoTipo.includes("CHEQUE")

  useEffect(() => {
    fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      .then((r) => r.json())
      .then((data) => {
        const lqs = (data.liquidaciones ?? []) as { id: string; ptoVenta: number | null; nroComprobante: number | null; estado: string }[]
        setLiquidaciones(lqs.map((l) => ({
          id: l.id,
          label: l.nroComprobante
            ? `${String(l.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(l.nroComprobante)} (${l.estado})`
            : `LP sin nro. (${l.estado})`,
        })))
      })
      .catch(() => {})
  }, [fleteroId])

  async function guardar() {
    const montoNum = parseFloat(nuevoMonto)
    if (isNaN(montoNum) || montoNum <= 0) {
      setError("El monto debe ser un número positivo")
      return
    }
    if (justificacion.trim().length < 10) {
      setError("La justificación debe tener al menos 10 caracteres")
      return
    }

    const body: Record<string, unknown> = { justificacion }
    if (montoNum !== pagoMonto) body.nuevoMonto = montoNum
    if (nuevaFecha !== pagoFecha.slice(0, 10)) body.fechaPago = nuevaFecha
    if (esCheque && nroCheque.trim()) body.nroCheque = nroCheque.trim()
    if (nuevaLiquidacionId && nuevaLiquidacionId !== liquidacionId) body.nuevaLiquidacionId = nuevaLiquidacionId

    if (Object.keys(body).length === 1) {
      setError("Debe modificar al menos un campo")
      return
    }

    setEnviando(true)
    setError(null)
    try {
      const res = await fetch(`/api/pagos-fletero/${pagoId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setError(err.error ?? "Error al modificar el pago")
        return
      }
      onConfirmar()
    } finally {
      setEnviando(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Modificar pago</h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Monto</label>
            <input
              type="number"
              value={nuevoMonto}
              onChange={(e) => setNuevoMonto(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium mb-1 block">Fecha de pago</label>
            <input
              type="date"
              value={nuevaFecha}
              onChange={(e) => setNuevaFecha(e.target.value)}
              className="w-full rounded border bg-background px-3 py-2 text-sm"
            />
          </div>
          {esCheque && (
            <div>
              <label className="text-sm font-medium mb-1 block">Nro. de cheque (nuevo)</label>
              <input
                type="text"
                value={nroCheque}
                onChange={(e) => setNroCheque(e.target.value)}
                placeholder="Opcional — solo si cambió el número"
                className="w-full rounded border bg-background px-3 py-2 text-sm"
              />
            </div>
          )}
          {liquidaciones.length > 1 && (
            <div>
              <label className="text-sm font-medium mb-1 block">Reasignar a otra LP</label>
              <select
                value={nuevaLiquidacionId}
                onChange={(e) => setNuevaLiquidacionId(e.target.value)}
                className="w-full rounded border bg-background px-3 py-2 text-sm"
              >
                <option value="">Mantener LP actual</option>
                {liquidaciones
                  .filter((l) => l.id !== liquidacionId)
                  .map((l) => (
                    <option key={l.id} value={l.id}>{l.label}</option>
                  ))}
              </select>
            </div>
          )}
          <div>
            <label className="text-sm font-medium mb-1 block">Justificación (obligatoria)</label>
            <textarea
              value={justificacion}
              onChange={(e) => setJustificacion(e.target.value)}
              rows={3}
              placeholder="Mínimo 10 caracteres..."
              className="w-full rounded border bg-background px-3 py-2 text-sm resize-none"
            />
          </div>
          {error && <p className="text-xs text-red-600">{error}</p>}
        </div>
        <div className="flex justify-end gap-2 mt-4">
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
            Cancelar
          </button>
          <button
            onClick={guardar}
            disabled={enviando || justificacion.trim().length < 10}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
          >
            {enviando ? "Guardando..." : "Guardar cambios"}
          </button>
        </div>
      </div>
    </div>
  )
}

function HistorialPagoFletero({ pagoId }: { pagoId: string }) {
  const [historial, setHistorial] = useState<EntradaHistorial[]>([])
  const [cargando, setCargando] = useState(false)
  const [abierto, setAbierto] = useState(false)

  function cargar() {
    if (abierto) { setAbierto(false); return }
    setCargando(true)
    fetch(`/api/pagos-fletero/${pagoId}/historial`)
      .then((r) => r.json())
      .then((data) => setHistorial(data ?? []))
      .catch(() => setHistorial([]))
      .finally(() => { setCargando(false); setAbierto(true) })
  }

  const BADGE_EVENTO: Record<string, string> = {
    CREACION: "bg-green-100 text-green-800",
    MODIFICACION: "bg-blue-100 text-blue-800",
    ANULACION: "bg-red-100 text-red-800",
  }

  return (
    <div className="mt-1">
      <button
        onClick={cargar}
        className="text-xs text-primary underline underline-offset-2"
      >
        {cargando ? "Cargando..." : abierto ? "Ocultar historial" : "Ver historial"}
      </button>
      {abierto && (
        <div className="mt-2 space-y-2 border-l-2 border-muted pl-3">
          {historial.length === 0 ? (
            <p className="text-xs text-muted-foreground">Sin historial registrado.</p>
          ) : (
            historial.map((h) => (
              <div key={h.id}>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${BADGE_EVENTO[h.tipoEvento] ?? "bg-gray-100 text-gray-800"}`}>
                    {h.tipoEvento}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatearFecha(new Date(h.creadoEn))} — {h.operador.apellido}, {h.operador.nombre}
                  </span>
                </div>
                <p className="text-xs mt-0.5 text-muted-foreground">{h.justificacion}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  )
}

// ─── Modal editar viaje ───────────────────────────────────────────────────────

function ModalEditarViaje({
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
              value={form.tarifaEdit ?? form.tarifaOperativaInicial}
              onChange={(e) => set("tarifaEdit", parseFloat(e.target.value) || form.tarifaOperativaInicial)}
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

// ─── Modal preview liquidación (fullscreen) ───────────────────────────────────

function ModalPreviewLiquidacion({
  fletero,
  viajesIniciales,
  comisionPctInicial,
  ivaPctInicial,
  generando,
  error,
  onCancelar,
  onConfirmar,
}: {
  fletero: FleteroInfo
  viajesIniciales: ViajeParaLiquidar[]
  comisionPctInicial: number
  ivaPctInicial: number
  generando: boolean
  error: string | null
  onCancelar: () => void
  onConfirmar: (viajes: ViajeParaLiquidar[], comisionPct: number, ivaPct: number) => void
}) {
  const [viajes, setViajes] = useState<ViajeParaLiquidar[]>(viajesIniciales)
  const [comisionPct, setComisionPct] = useState(comisionPctInicial)
  const [ivaPct, setIvaPct] = useState(ivaPctInicial)

  function actualizarCelda(id: string, campo: keyof ViajeParaLiquidar, valor: unknown) {
    setViajes((prev) => prev.map((v) => v.id === id ? { ...v, [campo]: valor } : v))
  }

  const viajesParaCalc = viajes.map((v) => ({
    kilos: v.kilosEdit ?? v.kilos ?? 0,
    tarifaFletero: v.tarifaEdit ?? v.tarifaOperativaInicial,
  }))
  const preview = calcularLiquidacion(viajesParaCalc, comisionPct, ivaPct)

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-background">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
        <h2 className="text-lg font-semibold">Liquidar {viajes.length} viaje(s) seleccionado(s)</h2>
        <button onClick={onCancelar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
      </div>

      {/* Tabla editable tipo excel */}
      <div className="flex-1 overflow-auto px-6 py-4">
        {/* Cabecera: datos del fletero */}
        <div className="mb-4 rounded-md border bg-muted/40 px-5 py-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
            Liquidación a
          </p>
          <div className="grid grid-cols-2 gap-x-8 gap-y-2 text-sm">
            <div>
              <span className="text-muted-foreground">Razón Social: </span>
              <span className="font-medium">{fletero.razonSocial}</span>
            </div>
            <div>
              <span className="text-muted-foreground">CUIT: </span>
              <span className="font-medium">{fletero.cuit}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Condición IVA: </span>
              <span className="font-medium">{labelCondicionIva(fletero.condicionIva)}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Dirección: </span>
              <span className="font-medium">{fletero.direccion ?? "—"}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Nº Líquido Producto: </span>
              <span className="font-mono font-bold text-base">{formatearNroComprobante(fletero.nroProximoComprobante)}</span>
            </div>
          </div>
        </div>

        {error && <div className="mb-3 p-3 bg-red-50 text-red-700 rounded text-sm">{error}</div>}
        <div className="overflow-x-auto rounded border">
          <table className="w-full text-sm">
            <thead className="bg-slate-50 sticky top-0">
              <tr>
                <th className="px-2 py-2 text-left whitespace-nowrap">Fecha</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Remito</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Cupo</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Mercadería</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Procedencia</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Origen</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Destino</th>
                <th className="px-2 py-2 text-left whitespace-nowrap">Prov. Destino</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Kilos</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Tarifa</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Ton</th>
                <th className="px-2 py-2 text-right whitespace-nowrap">Importe</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {viajes.map((v) => {
                const kilos = v.kilosEdit ?? v.kilos ?? 0
                const tarifa = v.tarifaEdit ?? v.tarifaOperativaInicial
                const ton = kilos > 0 ? calcularToneladas(kilos) : null
                const importe = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                return (
                  <tr key={v.id} className="hover:bg-muted/20">
                    <td className="px-1 py-1">
                      <input
                        type="date"
                        value={v.fechaEdit ?? v.fechaViaje.slice(0, 10)}
                        onChange={(e) => actualizarCelda(v.id, "fechaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.remitoEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "remitoEdit", e.target.value)}
                        className="h-7 w-24 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      {(v.tieneCupoEdit ?? v.tieneCupo) ? (
                        <input
                          type="text"
                          value={v.cupoEdit ?? ""}
                          onChange={(e) => actualizarCelda(v.id, "cupoEdit", e.target.value)}
                          className="h-7 w-20 rounded border bg-background px-1 text-xs"
                        />
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.mercaderiaEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "mercaderiaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.procedenciaEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "procedenciaEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={v.origenEdit ?? v.provinciaOrigen ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "origenEdit", e.target.value as ProvinciaArgentina)}
                        className="h-7 w-36 rounded border bg-background px-1 text-xs"
                      >
                        <option value="">— sin provincia —</option>
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="text"
                        value={v.destinoEdit ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "destinoEdit", e.target.value)}
                        className="h-7 w-28 rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <select
                        value={v.provinciaDestinoEdit ?? v.provinciaDestino ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "provinciaDestinoEdit", e.target.value as ProvinciaArgentina)}
                        className="h-7 w-36 rounded border bg-background px-1 text-xs"
                      >
                        <option value="">— sin provincia —</option>
                        {PROVINCIAS_ARGENTINA.map((p) => (
                          <option key={p} value={p}>{p}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={v.kilosEdit ?? v.kilos ?? ""}
                        onChange={(e) => actualizarCelda(v.id, "kilosEdit", parseFloat(e.target.value) || undefined)}
                        min="0"
                        step="1"
                        className="h-7 w-24 text-right rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-1 py-1">
                      <input
                        type="number"
                        value={v.tarifaEdit ?? v.tarifaOperativaInicial}
                        onChange={(e) => actualizarCelda(v.id, "tarifaEdit", parseFloat(e.target.value) || v.tarifaOperativaInicial)}
                        min="0"
                        step="0.01"
                        className="h-7 w-28 text-right rounded border bg-background px-1 text-xs"
                      />
                    </td>
                    <td className="px-2 py-1 text-right text-muted-foreground text-xs">
                      {ton?.toLocaleString("es-AR") ?? "-"}
                    </td>
                    <td className="px-2 py-1 text-right font-medium text-xs">
                      {importe != null ? formatearMoneda(importe) : "-"}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Footer */}
      <div className="border-t px-6 py-4 shrink-0 bg-background">
        <div className="flex flex-wrap items-end gap-6">
          <div className="flex gap-4">
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">Comisión %</label>
              <input
                type="number"
                value={comisionPct}
                onChange={(e) => setComisionPct(parseFloat(e.target.value) || 0)}
                min="0" max="100" step="0.01"
                className="h-8 w-24 rounded border bg-background px-2 text-sm"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-muted-foreground block mb-1">IVA %</label>
              <input
                type="number"
                value={ivaPct}
                onChange={(e) => setIvaPct(parseFloat(e.target.value) || 0)}
                min="0" max="100" step="0.01"
                className="h-8 w-24 rounded border bg-background px-2 text-sm"
              />
            </div>
          </div>
          <div className="flex-1 text-sm space-y-0.5">
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Bruto ({viajes.length} viajes):</span>
              <span className="w-36 text-right">{formatearMoneda(preview.subtotalBruto)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">Comisión ({comisionPct}%):</span>
              <span className="w-36 text-right">- {formatearMoneda(preview.comisionMonto)}</span>
            </div>
            <div className="flex justify-end gap-8 font-medium">
              <span>Neto:</span>
              <span className="w-36 text-right">{formatearMoneda(preview.neto)}</span>
            </div>
            <div className="flex justify-end gap-8">
              <span className="text-muted-foreground">IVA ({ivaPct}%):</span>
              <span className="w-36 text-right">+ {formatearMoneda(preview.ivaMonto)}</span>
            </div>
            <div className="flex justify-end gap-8 font-bold text-base border-t pt-1">
              <span>TOTAL FINAL:</span>
              <span className="w-36 text-right">{formatearMoneda(preview.totalFinal)}</span>
            </div>
          </div>
          <div className="flex gap-2 items-end">
            <button onClick={onCancelar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
              Cancelar
            </button>
            <button
              onClick={() => onConfirmar(viajes, comisionPct, ivaPct)}
              disabled={generando}
              className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 disabled:opacity-50"
            >
              {generando ? "Generando..." : "Confirmar y generar liquidación"}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * LiquidacionesClient: LiquidacionesClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI completa de liquidaciones:
 * selector de fletero, tabla de viajes pendientes, modales de edición y preview,
 * y sección de liquidaciones emitidas con modales de detalle.
 * Existe para gestionar el proceso de liquidación ARCA desde el panel.
 *
 * Ejemplos:
 * // Rol interno, sin fletero → muestra instrucción de selección
 * <LiquidacionesClient rol="OPERADOR_TRANSMAGG" fleteros={[...]} fleteroIdPropio={null} />
 * // Rol FLETERO → carga automáticamente sus viajes y liquidaciones
 * <LiquidacionesClient rol="FLETERO" fleteros={[]} fleteroIdPropio="f1" />
 * // Con fletero seleccionado → tabla de viajes + lista de liquidaciones
 * <LiquidacionesClient rol="ADMIN_TRANSMAGG" fleteros={[...]} fleteroIdPropio={null} />
 */
type CuentaBancaria = { id: string; nombre: string; bancoOEntidad: string }

type LiquidacionesClientPropsExt = LiquidacionesClientProps & {
  cuentasBancarias: CuentaBancaria[]
}

export function LiquidacionesClient({ rol, fleteros, camiones, choferes, fleteroIdPropio, cuentasBancarias, titulo = "Liquidaciones" }: LiquidacionesClientPropsExt) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [viajesPendientes, setViajesPendientes] = useState<ViajeParaLiquidar[]>([])
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [seleccionados, setSeleccionados] = useState<Set<string>>(new Set())
  const [enPreview, setEnPreview] = useState(false)
  const [comisionPct, setComisionPct] = useState<number>(10)
  const [ivaPct] = useState<number>(21)
  const [generando, setGenerando] = useState(false)
  const [errorGen, setErrorGen] = useState<string | null>(null)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)
  const [viajeEditando, setViajeEditando] = useState<ViajeParaLiquidar | null>(null)
  const [fleteroInfo, setFleteroInfo] = useState<FleteroInfo | null>(null)
  const [anulando, setAnulando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string } | null>(null)
  const [editando, setEditando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string; liquidacionId: string; fleteroId: string } | null>(null)

  /**
   * cargarDatos: () -> Promise<void>
   *
   * Sin parámetros (usa el estado fleteroId del closure), carga los viajes pendientes,
   * liquidaciones, datos del fletero y el próximo número de comprobante desde la API.
   * Esta función existe para sincronizar el estado local del panel con la base de datos
   * cada vez que se selecciona un fletero o se confirma una liquidación.
   *
   * Ejemplos:
   * // Con fleteroId vacío → no hace nada
   * cargarDatos() // no ejecuta fetch
   * // Con fleteroId válido → actualiza viajesPendientes, liquidaciones, fleteroInfo
   * cargarDatos() // setViajesPendientes([...]), setLiquidaciones([...]), setFleteroInfo({...})
   */
  const cargarDatos = useCallback(async () => {
    if (!fleteroId) return
    setCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones?fleteroId=${fleteroId}`)
      if (res.ok) {
        const data = await res.json()
        const viajesConEdit = (data.viajesPendientes ?? []).map((v: ViajeParaLiquidar) => ({
          ...v,
          kilosEdit: v.kilos ?? undefined,
          tarifaEdit: v.tarifaOperativaInicial,
          fechaEdit: v.fechaViaje.slice(0, 10),
          remitoEdit: v.remito ?? "",
          tieneCupoEdit: v.tieneCupo ?? false,
          cupoEdit: v.tieneCupo ? (v.cupo ?? "") : "",
          mercaderiaEdit: v.mercaderia ?? "",
          procedenciaEdit: v.procedencia ?? "",
          origenEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaOrigen ?? "")
            ? v.provinciaOrigen as ProvinciaArgentina
            : undefined,
          destinoEdit: v.destino ?? "",
          provinciaDestinoEdit: (PROVINCIAS_ARGENTINA as readonly string[]).includes(v.provinciaDestino ?? "")
            ? v.provinciaDestino as ProvinciaArgentina
            : undefined,
          camionIdEdit: v.camionId,
          choferIdEdit: v.choferId,
        }))
        setViajesPendientes(viajesConEdit)
        setLiquidaciones(data.liquidaciones ?? [])
        const fleteroEncontrado = fleteros.find((f) => f.id === fleteroId)
        if (fleteroEncontrado) {
          if (esInterno && fleteroEncontrado.comisionDefault != null) setComisionPct(fleteroEncontrado.comisionDefault)
          setFleteroInfo({
            razonSocial: fleteroEncontrado.razonSocial,
            cuit: data.fletero?.cuit ?? "",
            condicionIva: data.fletero?.condicionIva ?? "",
            direccion: data.fletero?.direccion ?? null,
            nroProximoComprobante: data.nroProximoComprobante ?? 1,
          })
        }
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, esInterno, fleteros])

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

  function guardarViajeEditado(v: ViajeParaLiquidar) {
    setViajesPendientes((prev) => prev.map((vp) => vp.id === v.id ? v : vp))
  }

  const viajesSeleccionados = viajesPendientes.filter((v) => seleccionados.has(v.id))

  async function confirmarLiquidacion(viajesEditados: ViajeParaLiquidar[], comision: number, iva: number) {
    if (!fleteroId || viajesEditados.length === 0) return
    setGenerando(true)
    setErrorGen(null)
    try {
      const body = {
        fleteroId,
        comisionPct: comision,
        ivaPct: iva,
        viajes: viajesEditados.map((v) => ({
          viajeId: v.id,
          camionId: v.camionIdEdit ?? v.camionId,
          choferId: v.choferIdEdit ?? v.choferId,
          fechaViaje: v.fechaEdit ?? v.fechaViaje.slice(0, 10),
          remito: v.remitoEdit || null,
          cupo: (v.tieneCupoEdit ?? v.tieneCupo) ? (v.cupoEdit || null) : null,
          mercaderia: v.mercaderiaEdit || null,
          procedencia: v.procedenciaEdit || null,
          provinciaOrigen: v.origenEdit || null,
          destino: v.destinoEdit || null,
          provinciaDestino: v.provinciaDestinoEdit || null,
          kilos: v.kilosEdit ?? v.kilos ?? 0,
          tarifaFletero: v.tarifaEdit ?? v.tarifaOperativaInicial,
        })),
      }
      const res = await fetch("/api/liquidaciones", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        setErrorGen(err.error ?? "Error al generar liquidación")
        return
      }
      setEnPreview(false)
      setSeleccionados(new Set())
      cargarDatos()
    } finally {
      setGenerando(false)
    }
  }

  async function cambiarEstadoLiquidacion(id: string, estado: string) {
    setCambioEstadoCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setLiquidacionDetalle(null)
        cargarDatos()
      }
    } finally {
      setCambioEstadoCargando(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">{titulo}</h2>
        <p className="text-muted-foreground">
          {rol === "FLETERO" ? "Tus liquidaciones de viajes" : "Circuito de liquidación al fletero"}
        </p>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        <WorkflowNote
          titulo="Datos guardados"
          descripcion="La liquidación guarda los datos del viaje y la tarifa al fletero tal como están en ese momento."
        />
        <WorkflowNote
          titulo="Edición previa"
          descripcion="Antes de generar el líquido producto podés ajustar kilos, fecha y tarifa específica del fletero."
        />
        <WorkflowNote
          titulo="Independencia"
          descripcion="Un viaje puede estar liquidado al fletero y seguir pendiente de facturar a la empresa."
        />
      </div>

      {/* Selector de Fletero */}
      {esInterno && (
        <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
          <div className="flex flex-col gap-1 min-w-[250px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <select
              value={fleteroId}
              onChange={(e) => { setFleteroId(e.target.value); setSeleccionados(new Set()); setEnPreview(false) }}
              className="h-9 rounded-md border bg-background px-2 text-sm"
            >
              <option value="">Seleccioná un fletero...</option>
              {fleteros.map((f) => <option key={f.id} value={f.id}>{f.razonSocial}</option>)}
            </select>
          </div>
        </div>
      )}

      {!fleteroId && esInterno && (
        <div className="flex flex-col items-center justify-center py-16 text-center text-muted-foreground">
          <p className="text-lg">Seleccioná un Fletero para ver sus viajes y liquidaciones</p>
        </div>
      )}

      {fleteroId && (
        <>
          {/* SECCIÓN A: Viajes pendientes */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <h3 className="text-base font-semibold">Viajes pendientes de liquidación</h3>
                <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-yellow-100 text-yellow-800">
                  {viajesPendientes.length}
                </span>
              </div>
              {seleccionados.size > 0 && (
                <button
                  onClick={() => setEnPreview(true)}
                  className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90"
                >
                  Liquidar seleccionados ({seleccionados.size})
                </button>
              )}
            </div>

            {cargando ? (
              <div className="text-center py-6 text-muted-foreground">Cargando...</div>
            ) : viajesPendientes.length === 0 ? (
              <div className="text-center py-6 text-muted-foreground">Sin viajes pendientes de liquidación.</div>
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
                      <th className="px-3 py-2 text-left">Remito</th>
                      <th className="px-3 py-2 text-left">Cupo</th>
                      <th className="px-3 py-2 text-left">Mercadería</th>
                      <th className="px-3 py-2 text-left">Origen</th>
                      <th className="px-3 py-2 text-left">Destino</th>
                      <th className="px-3 py-2 text-right">Kilos</th>
                      <th className="px-3 py-2 text-right">Ton</th>
                      <th className="px-3 py-2 text-right">Tarifa / ton</th>
                      <th className="px-3 py-2 text-right">Importe</th>
                      <th className="px-3 py-2" />
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {viajesPendientes.map((v) => {
                      const kilos = v.kilosEdit ?? v.kilos ?? 0
                      const tarifa = v.tarifaEdit ?? v.tarifaOperativaInicial
                      const ton = kilos > 0 ? calcularToneladas(kilos) : null
                      const total = kilos > 0 ? calcularTotalViaje(kilos, tarifa) : null
                      return (
                        <tr key={v.id} className={seleccionados.has(v.id) ? "bg-blue-50" : "hover:bg-muted/30"}>
                          <td className="px-3 py-2 text-center">
                            <input type="checkbox" checked={seleccionados.has(v.id)} onChange={() => toggleSeleccion(v.id)} />
                          </td>
                          <td className="px-3 py-2">{formatearFecha(v.fechaEdit ?? new Date(v.fechaViaje))}</td>
                          <td className="px-3 py-2">{v.remitoEdit || v.remito || "-"}</td>
                          <td className="px-3 py-2">{(v.tieneCupoEdit ?? v.tieneCupo) ? (v.cupoEdit || v.cupo || "-") : "—"}</td>
                          <td className="px-3 py-2">{v.mercaderiaEdit || v.mercaderia || "-"}</td>
                          <td className="px-3 py-2">{v.origenEdit || v.provinciaOrigen || v.procedencia || "-"}</td>
                          <td className="px-3 py-2">{v.provinciaDestinoEdit || v.destinoEdit || v.provinciaDestino || v.destino || "-"}</td>
                          <td className="px-3 py-2 text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "-"}</td>
                          <td className="px-3 py-2 text-right text-muted-foreground">{ton?.toLocaleString("es-AR") ?? "-"}</td>
                          <td className="px-3 py-2 text-right">{formatearMoneda(tarifa)}</td>
                          <td className="px-3 py-2 text-right font-medium">{total != null ? formatearMoneda(total) : "-"}</td>
                          <td className="px-3 py-2">
                            <button
                              onClick={() => setViajeEditando(v)}
                              className="h-7 px-2 rounded border text-xs font-medium hover:bg-accent"
                            >
                              Editar
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* SECCIÓN B: Liquidaciones emitidas */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <h3 className="text-base font-semibold">Liquidaciones</h3>
              <span className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-gray-100 text-gray-700">
                {liquidaciones.length}
              </span>
            </div>
            {liquidaciones.length === 0 ? (
              <div className="text-center py-4 text-muted-foreground">Sin liquidaciones registradas.</div>
            ) : (
              <div className="space-y-2">
                {liquidaciones.map((liq) => {
                  const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago ?? null
                  return (
                    <div key={liq.id} className="flex items-center justify-between p-4 rounded-lg border hover:bg-muted/30">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatearFecha(new Date(liq.grabadaEn))}</span>
                          <EstadoBadge estado={liq.estado} />
                          {op && (
                            <button
                              onClick={(e) => { e.stopPropagation(); window.open(`/api/ordenes-pago/${op.id}/pdf`, "_blank") }}
                              className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-violet-100 text-violet-800 hover:bg-violet-200"
                            >
                              OP {op.nro.toLocaleString("es-AR")}
                            </button>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">{liq.viajes.length} viaje(s)</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <p className="font-bold">{formatearMoneda(liq.total)}</p>
                        <button
                          onClick={() => setLiquidacionDetalle(liq)}
                          className="h-8 px-3 rounded-md border text-xs font-medium hover:bg-accent"
                        >
                          Ver detalle
                        </button>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </>
      )}

      {/* Modal detalle liquidación emitida */}
      {liquidacionDetalle && (
        <ModalDetalleLiquidacion
          liq={liquidacionDetalle}
          emailFletero=""
          onCambiarEstado={(estado) => cambiarEstadoLiquidacion(liquidacionDetalle.id, estado)}
          onAnularPago={(pagoId) => {
            const pago = liquidacionDetalle.pagos.find((p) => p.id === pagoId)
            if (pago) setAnulando({ pagoId, pagoMonto: pago.monto, pagoTipo: pago.tipoPago, pagoFecha: pago.fechaPago })
          }}
          onEditarPago={(pagoId) => {
            const pago = liquidacionDetalle.pagos.find((p) => p.id === pagoId)
            if (pago) setEditando({ pagoId, pagoMonto: pago.monto, pagoTipo: pago.tipoPago, pagoFecha: pago.fechaPago, liquidacionId: liquidacionDetalle.id, fleteroId: liquidacionDetalle.fleteroId })
          }}
          onCerrar={() => setLiquidacionDetalle(null)}
          cargando={cambioEstadoCargando}
        />
      )}

      {/* Modal anular pago fletero */}
      {anulando && (
        <ModalAnularPagoFletero
          pagoId={anulando.pagoId}
          pagoMonto={anulando.pagoMonto}
          pagoTipo={anulando.pagoTipo}
          pagoFecha={anulando.pagoFecha}
          onConfirmar={() => {
            setAnulando(null)
            setLiquidacionDetalle(null)
            cargarDatos()
          }}
          onCerrar={() => setAnulando(null)}
        />
      )}

      {/* Modal editar pago fletero */}
      {editando && (
        <ModalEditarPagoFletero
          pagoId={editando.pagoId}
          pagoMonto={editando.pagoMonto}
          pagoTipo={editando.pagoTipo}
          pagoFecha={editando.pagoFecha}
          liquidacionId={editando.liquidacionId}
          fleteroId={editando.fleteroId}
          onConfirmar={() => {
            setEditando(null)
            setLiquidacionDetalle(null)
            cargarDatos()
          }}
          onCerrar={() => setEditando(null)}
        />
      )}

      {/* Modal editar viaje */}
      {viajeEditando && (
        <ModalEditarViaje
          viaje={viajeEditando}
          camiones={camiones}
          choferes={choferes}
          fleteroId={fleteroId}
          onGuardar={guardarViajeEditado}
          onCerrar={() => setViajeEditando(null)}
        />
      )}

      {/* Modal preview / confirmar liquidación */}
      {enPreview && (
        <ModalPreviewLiquidacion
          fletero={fleteroInfo ?? { razonSocial: "", cuit: "", condicionIva: "", nroProximoComprobante: 1 }}
          viajesIniciales={viajesSeleccionados}
          comisionPctInicial={comisionPct}
          ivaPctInicial={ivaPct}
          generando={generando}
          error={errorGen}
          onCancelar={() => { setEnPreview(false); setErrorGen(null) }}
          onConfirmar={confirmarLiquidacion}
        />
      )}
    </div>
  )
}
