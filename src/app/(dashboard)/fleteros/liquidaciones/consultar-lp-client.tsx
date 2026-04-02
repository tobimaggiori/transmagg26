"use client"

/**
 * Propósito: Componente de consulta de Líquidos Producto.
 * Filtros por fletero, estado y período → tabla con detalle y modal de pago.
 */

import React, { useState, useCallback, useEffect, Fragment, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { calcularToneladas } from "@/lib/viajes"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { SelectContactoEmail } from "@/components/forms/select-contacto-email"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string }

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
  cae: string | null
  arcaEstado: string | null
  fleteroId: string
  fletero: { razonSocial: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago: { id: string; nro: number; fecha: string } | null }[]
}

type ConsultarLPClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
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

// ─── Combobox Fletero ────────────────────────────────────────────────────────

function ComboboxFletero({ fleteros, value, onChange }: { fleteros: Fletero[]; value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false)
  const [busqueda, setBusqueda] = useState("")

  const filtrados = useMemo(() => {
    if (!busqueda) return fleteros
    const q = busqueda.toLowerCase()
    const qDigits = busqueda.replace(/\D/g, "")
    return fleteros.filter(
      (f) => f.razonSocial.toLowerCase().includes(q) || (qDigits && f.cuit.replace(/\D/g, "").includes(qDigits))
    )
  }, [fleteros, busqueda])

  const seleccionado = fleteros.find((f) => f.id === value)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex h-9 w-full items-center justify-between rounded-md border bg-background px-2 text-sm"
      >
        <span className="truncate">{seleccionado ? seleccionado.razonSocial : "Todos los fleteros"}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </PopoverTrigger>
      <PopoverContent className="w-[320px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Buscar por razón social o CUIT..." value={busqueda} onValueChange={setBusqueda} />
          <CommandList>
            <CommandEmpty>No se encontraron fleteros.</CommandEmpty>
            <CommandGroup>
              <CommandItem
                onSelect={() => { onChange(""); setOpen(false); setBusqueda("") }}
              >
                <Check className={cn("mr-2 h-4 w-4", value === "" ? "opacity-100" : "opacity-0")} />
                Todos los fleteros
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

// ─── Enviar email Orden de Pago ───────────────────────────────────────────────

function EnviarEmailOP({ ordenPagoId, nro, fleteroId }: { ordenPagoId: string; nro: number; fleteroId: string }) {
  const [abierto, setAbierto] = React.useState(false)
  const [email, setEmail] = React.useState("")
  const [enviando, setEnviando] = React.useState(false)
  const [resultado, setResultado] = React.useState<string | null>(null)

  async function enviar() {
    setEnviando(true)
    setResultado(null)
    try {
      const res = await fetch(`/api/ordenes-pago/${ordenPagoId}/enviar-email`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(email ? { emailDestino: email } : {}),
      })
      const data = await res.json()
      if (res.ok) {
        setResultado(`Enviado a ${data.emailDestino}`)
        setTimeout(() => { setAbierto(false); setResultado(null) }, 2000)
      } else {
        setResultado(data.error ?? "Error al enviar")
      }
    } catch {
      setResultado("Error de red")
    } finally {
      setEnviando(false)
    }
  }

  return (
    <>
      <button
        onClick={() => { setAbierto(true); setResultado(null) }}
        className="h-5 px-1.5 rounded border text-xs font-medium hover:bg-accent inline-flex items-center"
      >
        Email
      </button>
      {abierto && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50" onClick={() => setAbierto(false)}>
          <div className="bg-background rounded-lg shadow-xl p-5 w-80" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-semibold mb-1">Enviar OP Nro {String(nro).padStart(8, "0")}</h3>
            <div className="mb-3">
              <p className="text-xs font-medium mb-1">Enviar a</p>
              <SelectContactoEmail
                parentId={fleteroId}
                parentType="fletero"
                value={email}
                onChange={setEmail}
                disabled={enviando}
              />
            </div>
            {resultado && (
              <p className={`text-xs mb-2 ${resultado.startsWith("Enviado") ? "text-green-600" : "text-red-600"}`}>{resultado}</p>
            )}
            <div className="flex gap-2 justify-end">
              <button onClick={() => setAbierto(false)} className="h-8 px-3 rounded-md border text-sm hover:bg-accent">Cancelar</button>
              <button
                onClick={enviar}
                disabled={enviando || !email}
                className="h-8 px-3 rounded-md bg-blue-600 text-white text-sm hover:bg-blue-700 disabled:opacity-50"
              >
                {enviando ? "Enviando..." : "Enviar"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

// ─── Modal detalle liquidación ────────────────────────────────────────────────

/**
 * ModalDetalleLiquidacion: props -> JSX.Element
 *
 * Dado una liquidación, muestra el detalle de viajes y totales con botones de acción.
 * Existe para ver el desglose de una LP y cambiar su estado.
 */
function ModalDetalleLiquidacion({
  liq,
  onCambiarEstado,
  onAnularPago,
  onEditarPago,
  onCerrar,
  cargando,
  onAbrirPDF,
}: {
  liq: Liquidacion
  onCambiarEstado: (estado: string) => void
  onAnularPago?: (pagoId: string) => void
  onEditarPago?: (pagoId: string) => void
  onCerrar: () => void
  cargando: boolean
  onAbrirPDF?: (params: { url: string; titulo: string } | { fetchUrl: string; titulo: string }) => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-xl w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg font-semibold">
              {liq.nroComprobante
                ? `LP ${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)} — ${liq.fletero.razonSocial}`
                : `Liquidación — ${liq.fletero.razonSocial}`}
            </h2>
            <p className="text-sm text-muted-foreground">
              {formatearFecha(new Date(liq.grabadaEn))} · <EstadoBadge estado={liq.estado} />
              {liq.cae && (
                <span className="ml-2 inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium bg-green-100 text-green-800">
                  CAE {liq.cae}
                </span>
              )}
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
                <th className="px-3 py-2 text-right">Tarifa al fletero / ton</th>
                <th className="px-3 py-2 text-right">Importe guardado</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {liq.viajes.map((v) => (
                <tr key={v.id}>
                  <td className="px-3 py-2">{formatearFecha(new Date(v.fechaViaje))}</td>
                  <td className="px-3 py-2">{v.remito ?? "-"}</td>
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
                    <th className="px-3 py-2 text-left">Orden de Pago</th>
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
                          {p.ordenPago && (
                            <div className="flex items-center gap-1 flex-wrap">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                OP Nro {String(p.ordenPago.nro).padStart(8, "0")} — {formatearFecha(new Date(p.ordenPago.fecha))}
                              </span>
                              <button
                                type="button"
                                onClick={() => onAbrirPDF?.({
                                  url: `/api/ordenes-pago/${p.ordenPago!.id}/pdf`,
                                  titulo: `OP Nro ${String(p.ordenPago!.nro).padStart(8, "0")}`,
                                })}
                                className="h-5 px-1.5 rounded border text-xs font-medium hover:bg-accent inline-flex items-center"
                              >
                                Ver
                              </button>
                              <EnviarEmailOP ordenPagoId={p.ordenPago.id} nro={p.ordenPago.nro} fleteroId={liq.fleteroId} />
                            </div>
                          )}
                        </td>
                        <td className="px-3 py-2">
                          {!p.anulado && (
                            <div className="flex gap-1 justify-end">
                              {onEditarPago && (
                                <button
                                  onClick={() => onEditarPago(p.id)}
                                  className="h-6 px-2 rounded border text-xs font-medium hover:bg-accent"
                                >
                                  Editar
                                </button>
                              )}
                              {onAnularPago && (
                                <button
                                  onClick={() => onAnularPago(p.id)}
                                  className="h-6 px-2 rounded border text-xs font-medium text-red-600 hover:bg-red-50"
                                >
                                  Anular
                                </button>
                              )}
                            </div>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td colSpan={5} className="px-3 pb-2">
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

// ─── Componente principal ─────────────────────────────────────────────────────

/**
 * ConsultarLPClient: ConsultarLPClientProps -> JSX.Element
 *
 * Dado los datos de configuración del servidor, renderiza la UI de consulta de LP:
 * filtros por fletero, estado y período, tabla con Nro/Fletero/Fecha/Total/Estado/CAE/Acciones,
 * modal de detalle con cambio de estado, y modal de registro de pago.
 * Existe para el flujo de consulta de LPs separado del flujo de creación.
 *
 * Ejemplos:
 * // Rol interno → selector de fletero + tabla de todas las LPs
 * <ConsultarLPClient rol="ADMIN_TRANSMAGG" fleteros={[...]} cuentasBancarias={[...]} fleteroIdPropio={null} />
 * // Rol FLETERO → carga automáticamente sus LPs sin selector de fletero
 * <ConsultarLPClient rol="FLETERO" fleteros={[]} cuentasBancarias={[]} fleteroIdPropio="f1" />
 */
export function ConsultarLPClient({ rol, fleteros, fleteroIdPropio }: ConsultarLPClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>("")
  const [filtroHasta, setFiltroHasta] = useState<string>("")
  const [filtroNroLP, setFiltroNroLP] = useState<string>("")
  const [anulando, setAnulando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string } | null>(null)
  const [editando, setEditando] = useState<{ pagoId: string; pagoMonto: number; pagoTipo: string; pagoFecha: string; liquidacionId: string; fleteroId: string } | null>(null)

  const cargarDatos = useCallback(async () => {
    if (!fleteroId && esInterno) return
    const idAUsar = fleteroId || fleteroIdPropio
    if (!idAUsar) return
    setCargando(true)
    try {
      const res = await fetch(`/api/liquidaciones?fleteroId=${idAUsar}`)
      if (res.ok) {
        const data = await res.json()
        setLiquidaciones(data.liquidaciones ?? [])
      }
    } finally {
      setCargando(false)
    }
  }, [fleteroId, fleteroIdPropio, esInterno])

  useEffect(() => {
    cargarDatos()
  }, [cargarDatos])

  const liquidacionesFiltradas = liquidaciones.filter((liq) => {
    if (filtroEstado && liq.estado !== filtroEstado) return false
    if (filtroDesde) {
      const fecha = new Date(liq.grabadaEn)
      if (fecha < new Date(filtroDesde)) return false
    }
    if (filtroHasta) {
      const fecha = new Date(liq.grabadaEn)
      const hasta = new Date(filtroHasta)
      hasta.setHours(23, 59, 59)
      if (fecha > hasta) return false
    }
    if (filtroNroLP && liq.nroComprobante) {
      const nroFormateado = `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
      if (!nroFormateado.includes(filtroNroLP)) return false
    } else if (filtroNroLP && !liq.nroComprobante) {
      return false
    }
    return true
  })

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

  const _fleteroActual = fleteros.find((f) => f.id === (fleteroId || fleteroIdPropio)); void _fleteroActual

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Consultar Liq. Prod.</h2>
        <p className="text-muted-foreground">
          {rol === "FLETERO" ? "Tus liquidaciones de viajes" : "Historial de Líquidos Producto emitidos"}
        </p>
      </div>

      {/* Filtros */}
      <div className="flex flex-wrap gap-4 p-4 bg-muted/40 rounded-lg border">
        {esInterno && (
          <div className="flex flex-col gap-1 min-w-[220px]">
            <label className="text-xs font-medium text-muted-foreground">Fletero</label>
            <ComboboxFletero
              fleteros={fleteros}
              value={fleteroId}
              onChange={setFleteroId}
            />
          </div>
        )}
        <div className="flex flex-col gap-1 min-w-[120px]">
          <label className="text-xs font-medium text-muted-foreground">Nro LP</label>
          <input
            type="text"
            value={filtroNroLP}
            onChange={(e) => setFiltroNroLP(e.target.value)}
            placeholder="Ej: 7138"
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1 min-w-[160px]">
          <label className="text-xs font-medium text-muted-foreground">Estado</label>
          <select
            value={filtroEstado}
            onChange={(e) => setFiltroEstado(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          >
            <option value="">Todos</option>
            <option value="BORRADOR">Borrador</option>
            <option value="EMITIDA">Emitida</option>
            <option value="PARCIALMENTE_PAGADA">Parcial</option>
            <option value="PAGADA">Pagada</option>
            <option value="ANULADA">Anulada</option>
          </select>
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Desde</label>
          <input
            type="date"
            value={filtroDesde}
            onChange={(e) => setFiltroDesde(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-muted-foreground">Hasta</label>
          <input
            type="date"
            value={filtroHasta}
            onChange={(e) => setFiltroHasta(e.target.value)}
            className="h-9 rounded-md border bg-background px-2 text-sm"
          />
        </div>
        {(filtroEstado || filtroDesde || filtroHasta || filtroNroLP) && (
          <div className="flex items-end">
            <button
              onClick={() => { setFiltroEstado(""); setFiltroDesde(""); setFiltroHasta(""); setFiltroNroLP("") }}
              className="h-9 px-3 rounded-md border text-sm font-medium hover:bg-accent text-muted-foreground"
            >
              Limpiar filtros
            </button>
          </div>
        )}
      </div>

      {/* Tabla */}
      {esInterno && !fleteroId ? (
        cargando ? (
          <div className="text-center py-10 text-muted-foreground">Cargando...</div>
        ) : liquidacionesFiltradas.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">Sin liquidaciones registradas.</div>
        ) : (
          <TablaLiquidaciones
            liquidaciones={liquidacionesFiltradas}
            onAbrirPDF={(params) => abrirPDF(params)}
          />
        )
      ) : cargando ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : liquidacionesFiltradas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Sin liquidaciones para los filtros seleccionados.</div>
      ) : (
        <TablaLiquidaciones
          liquidaciones={liquidacionesFiltradas}
          onAbrirPDF={(params) => abrirPDF(params)}
        />
      )}

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLiquidacion
          liq={liquidacionDetalle}
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
          onAbrirPDF={(params) => abrirPDF(params)}
        />
      )}

      {/* Modal anular pago */}
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

      {/* Modal editar pago */}
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

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
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

// ─── Modal anular pago fletero ────────────────────────────────────────────────

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
  const [impactos, setImpactos] = useState<{ tipo: string; descripcion: string; detalle: string; estadoActual: string; nuevoEstado: string }[]>([])
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
          <button onClick={onCerrar} className="h-9 px-4 rounded-md border text-sm font-medium hover:bg-accent">
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

// ─── Tabla ────────────────────────────────────────────────────────────────────

function TablaLiquidaciones({
  liquidaciones,
  onAbrirPDF,
}: {
  liquidaciones: Liquidacion[]
  onAbrirPDF: (params: { url: string; titulo: string } | { fetchUrl: string; titulo: string }) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr>
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Nro</th>
            <th className="px-3 py-2 text-left">Fletero</th>
            <th className="px-3 py-2 text-left">OP Nro</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {liquidaciones.map((liq) => {
            const nroLP = liq.nroComprobante
              ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
              : null
            const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago
            return (
              <tr key={liq.id} className="hover:bg-muted/30">
                <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(liq.grabadaEn))}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {nroLP ? (
                    <button
                      type="button"
                      onClick={() => onAbrirPDF({
                        fetchUrl: `/api/liquidaciones/${liq.id}/pdf`,
                        titulo: `LP ${nroLP} — ${liq.fletero.razonSocial}`,
                      })}
                      className="text-primary hover:underline font-medium"
                    >
                      {nroLP}
                    </button>
                  ) : (
                    <span className="text-muted-foreground">Borrador</span>
                  )}
                </td>
                <td className="px-3 py-2">{liq.fletero.razonSocial}</td>
                <td className="px-3 py-2 font-mono text-xs">
                  {op ? (
                    <button
                      type="button"
                      onClick={() => onAbrirPDF({
                        url: `/api/ordenes-pago/${op.id}/pdf`,
                        titulo: `OP Nro ${String(op.nro).padStart(8, "0")}`,
                      })}
                      className="text-primary hover:underline font-medium"
                    >
                      {String(op.nro).padStart(8, "0")}
                    </button>
                  ) : (
                    <span className="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium bg-red-100 text-red-700">
                      NO PAGADO
                    </span>
                  )}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Historial de pagos ───────────────────────────────────────────────────────

type EntradaHistorial = {
  id: string
  tipoEvento: string
  justificacion: string
  estadoAnterior: string | null
  creadoEn: string
  operador: { nombre: string; apellido: string }
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
