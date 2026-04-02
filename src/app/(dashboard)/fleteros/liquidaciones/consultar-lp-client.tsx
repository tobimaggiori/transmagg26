"use client"

/**
 * Propósito: Componente de consulta de Líquidos Producto.
 * Filtros por fletero, estado y período → tabla con columnas exactas.
 * Modal de detalle de viajes solo lectura.
 */

import React, { useState, useCallback, useEffect, useMemo } from "react"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
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
  viaje?: { nroCartaPorte: string | null }
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
  fletero: { razonSocial: string; cuit?: string }
  viajes: ViajeEnLiquidacion[]
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago: { id: string; nro: number; fecha: string; pdfS3Key?: string | null } | null }[]
}

type ConsultarLPClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
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

// ─── Helpers de estado ───────────────────────────────────────────────────────

function resolverEstadoLP(liq: Liquidacion): "EMITIDO" | "PAGADO" | "NO_PAGADO" {
  const tienePagoConfirmado = liq.pagos.some((p) => !p.anulado && p.ordenPago)
  if (tienePagoConfirmado) return "PAGADO"
  if (liq.estado === "ANULADA") return "NO_PAGADO"
  // Emitido sin OP o con OP pendiente
  return liq.nroComprobante ? "EMITIDO" : "NO_PAGADO"
}

// ─── Modal detalle LP ────────────────────────────────────────────────────────

function ModalDetalleLP({
  liq,
  onCerrar,
}: {
  liq: Liquidacion
  onCerrar: () => void
}) {
  const nroLP = liq.nroComprobante
    ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
    : "Borrador"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-[90vw] max-h-[90vh] overflow-y-auto">
        {/* Cabecera */}
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <div>
            <h2 className="text-lg font-semibold">
              LP Nro: {nroLP} | Fletero: {liq.fletero.razonSocial.toUpperCase()} | Fecha: {formatearFecha(new Date(liq.grabadaEn))}
            </h2>
          </div>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Tabla de viajes */}
        <div className="px-6 py-4">
          <div className="overflow-x-auto rounded border">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="border-b font-semibold uppercase text-xs bg-slate-50">
                  <th className="px-3 py-2 text-left">Fecha</th>
                  <th className="px-3 py-2 text-left">Carta de Porte</th>
                  <th className="px-3 py-2 text-left">Remito</th>
                  <th className="px-3 py-2 text-left">Cupo</th>
                  <th className="px-3 py-2 text-left">Mercadería</th>
                  <th className="px-3 py-2 text-left">Ciudad Origen</th>
                  <th className="px-3 py-2 text-left">Prov. Origen</th>
                  <th className="px-3 py-2 text-left">Ciudad Destino</th>
                  <th className="px-3 py-2 text-left">Prov. Destino</th>
                  <th className="px-3 py-2 text-right">Kilos</th>
                  <th className="px-3 py-2 text-right">Tarifa</th>
                  <th className="px-3 py-2 text-right">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                {liq.viajes.map((v, i) => (
                  <tr key={v.id} className={i % 2 === 0 ? "bg-white" : "bg-gray-50"}>
                    <td className="px-3 py-2 whitespace-nowrap">{formatearFecha(new Date(v.fechaViaje))}</td>
                    <td className="px-3 py-2">{v.viaje?.nroCartaPorte ?? "—"}</td>
                    <td className="px-3 py-2">{v.remito ?? "—"}</td>
                    <td className="px-3 py-2">{v.cupo ?? "—"}</td>
                    <td className="px-3 py-2">{v.mercaderia ?? "—"}</td>
                    <td className="px-3 py-2">{v.procedencia ?? "—"}</td>
                    <td className="px-3 py-2">{v.provinciaOrigen ?? "—"}</td>
                    <td className="px-3 py-2">{v.destino ?? "—"}</td>
                    <td className="px-3 py-2">{v.provinciaDestino ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{v.kilos?.toLocaleString("es-AR") ?? "—"}</td>
                    <td className="px-3 py-2 text-right">{formatearMoneda(v.tarifaFletero)}</td>
                    <td className="px-3 py-2 text-right font-medium">{formatearMoneda(v.subtotal)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Totales */}
          <div className="mt-4 space-y-1 text-sm max-w-md ml-auto">
            <div className="flex justify-between"><span>Total Viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
            <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>-{formatearMoneda(liq.comisionMonto)}</span></div>
            <div className="flex justify-between font-medium"><span>Total neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
            <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>{formatearMoneda(liq.ivaMonto)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL:</span><span>{formatearMoneda(liq.total)}</span></div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end">
          <button
            onClick={onCerrar}
            className="h-9 px-6 rounded-md border text-sm font-medium hover:bg-accent"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  )
}

// ─── Tabla ────────────────────────────────────────────────────────────────────

function TablaLiquidaciones({
  liquidaciones,
  fleteros,
  onAbrirPDF,
  onVerDetalle,
}: {
  liquidaciones: Liquidacion[]
  fleteros: Fletero[]
  onAbrirPDF: (params: { url: string; titulo: string } | { fetchUrl: string; titulo: string }) => void
  onVerDetalle: (liq: Liquidacion) => void
}) {
  return (
    <div className="overflow-x-auto rounded-lg border">
      <table className="w-full text-sm">
        <thead className="bg-slate-50">
          <tr className="uppercase text-xs font-semibold">
            <th className="px-3 py-2 text-left">Fecha</th>
            <th className="px-3 py-2 text-left">Nro</th>
            <th className="px-3 py-2 text-left">Fletero</th>
            <th className="px-3 py-2 text-left">CUIT</th>
            <th className="px-3 py-2 text-left">OP Nro</th>
            <th className="px-3 py-2 text-center">Detalle</th>
          </tr>
        </thead>
        <tbody className="divide-y">
          {liquidaciones.map((liq) => {
            const nroLP = liq.nroComprobante
              ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
              : null
            const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago
            const fletero = fleteros.find((f) => f.id === liq.fleteroId)
            const cuit = liq.fletero.cuit ?? fletero?.cuit ?? "—"
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
                <td className="px-3 py-2 uppercase">{liq.fletero.razonSocial}</td>
                <td className="px-3 py-2 font-mono text-xs">{cuit}</td>
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
                <td className="px-3 py-2 text-center">
                  <button
                    type="button"
                    onClick={() => onVerDetalle(liq)}
                    className="h-7 px-3 rounded border text-xs font-medium hover:bg-accent"
                  >
                    Ver
                  </button>
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarLPClient({ rol, fleteros, fleteroIdPropio }: ConsultarLPClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()

  const [fleteroId, setFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [cargando, setCargando] = useState(false)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)

  // Filtros
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>("")
  const [filtroHasta, setFiltroHasta] = useState<string>("")
  const [filtroNroLP, setFiltroNroLP] = useState<string>("")

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
    // Filtro por estado semántico
    if (filtroEstado) {
      const estadoSem = resolverEstadoLP(liq)
      if (estadoSem !== filtroEstado) return false
    }
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
            <option value="EMITIDO">EMITIDO</option>
            <option value="PAGADO">PAGADO</option>
            <option value="NO_PAGADO">NO PAGADO</option>
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
        <div className="text-center py-10 text-muted-foreground">Seleccioná un fletero para ver sus liquidaciones.</div>
      ) : cargando ? (
        <div className="text-center py-10 text-muted-foreground">Cargando...</div>
      ) : liquidacionesFiltradas.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">Sin liquidaciones para los filtros seleccionados.</div>
      ) : (
        <TablaLiquidaciones
          liquidaciones={liquidacionesFiltradas}
          fleteros={fleteros}
          onAbrirPDF={(params) => abrirPDF(params)}
          onVerDetalle={(liq) => setLiquidacionDetalle(liq)}
        />
      )}

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLP
          liq={liquidacionDetalle}
          onCerrar={() => setLiquidacionDetalle(null)}
        />
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
