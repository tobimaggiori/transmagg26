"use client"

/**
 * Propósito: Componente cliente para consultar el historial de facturas a empresas.
 * Filtros por empresa, nro comprobante, fechas y estado. Tabla con totales.
 * Modal de detalle con viajes, pagos y acciones (cobro, cambio de estado).
 */

import { useState, useEffect, useCallback } from "react"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog"
import { RegistrarCobroModal } from "@/components/forms/registrar-cobro-form"
import { TipoCbteBadge } from "@/app/(dashboard)/empresas/facturar/facturar-client"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type PagoRow = {
  monto: number
  tipoPago: string
  fechaPago: string
  referencia: string | null
}

type ViajeEnFacturaRow = {
  id: string
  fechaViaje: string
  remito: string | null
  mercaderia: string | null
  procedencia: string | null
  provinciaOrigen: string | null
  destino: string | null
  provinciaDestino: string | null
  kilos: number | null
  tarifaEmpresa: number
  subtotal: number
  viaje: {
    fletero: { razonSocial: string }
    camion: { patenteChasis: string }
    chofer: { nombre: string; apellido: string }
  }
}

type FacturaRow = {
  id: string
  emitidaEn: string
  tipoCbte: number
  modalidadMiPymes?: string | null
  nroComprobante: string | null
  ivaPct: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  empresa: { id: string; razonSocial: string; cuit: string }
  viajes: ViajeEnFacturaRow[]
  pagos: PagoRow[]
  totalPagado: number
  _count: { notasCreditoDebito: number }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type ConsultarFacturasClientProps = {
  empresas: Array<{ id: string; razonSocial: string; cuit: string }>
  cuentasBancarias: Array<{ id: string; nombre: string; bancoOEntidad: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function primerDiaMesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`
}

function hoy(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

/**
 * EstadoBadge: { estado: string } -> JSX.Element
 *
 * Dado un string de estado de factura, devuelve un badge de colores
 * correspondiente al estado. Cubre BORRADOR, EMITIDA, PARCIALMENTE_COBRADA,
 * COBRADA y ANULADA.
 * Existe para mostrar estados de forma visual y uniforme en la tabla.
 *
 * Ejemplos:
 * <EstadoBadge estado="EMITIDA" /> // => badge azul "EMITIDA"
 * <EstadoBadge estado="COBRADA" /> // => badge verde "COBRADA"
 */
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
 * ConsultarFacturasClient: ConsultarFacturasClientProps -> JSX.Element
 *
 * Dado el listado de empresas y cuentas bancarias, renderiza un panel de consulta
 * de facturas con filtros por empresa, nro comprobante, rango de fechas y estado.
 * Al buscar consulta GET /api/empresas/facturas con los filtros activos.
 * Muestra tabla con totales y permite ver el detalle de cada factura en un modal.
 * El modal de detalle muestra viajes, pagos recibidos y botones de acción:
 * registrar cobro (EMITIDA/PARCIALMENTE_COBRADA), marcar emitida (BORRADOR),
 * anular (BORRADOR/EMITIDA).
 * Existe para que los operadores internos puedan gestionar el historial de facturas
 * sin mezclar con el flujo de creación.
 *
 * Ejemplos:
 * // Carga inicial con filtros del mes actual
 * <ConsultarFacturasClient empresas={[...]} cuentasBancarias={[...]} />
 * // Con empresa seleccionada → tabla de sus facturas
 * <ConsultarFacturasClient empresas={[{id:"e1",razonSocial:"ACME",cuit:"20123456789"}]} cuentasBancarias={[...]} />
 */
export function ConsultarFacturasClient({ empresas, cuentasBancarias }: ConsultarFacturasClientProps) {
  const [filtroEmpresaId, setFiltroEmpresaId] = useState<string>("")
  const [filtroNroComprobante, setFiltroNroComprobante] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>(primerDiaMesActual())
  const [filtroHasta, setFiltroHasta] = useState<string>(hoy())
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [facturas, setFacturas] = useState<FacturaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [facturaDetalle, setFacturaDetalle] = useState<FacturaRow | null>(null)
  const [cobrandoFactura, setCobrandoFactura] = useState<FacturaRow | null>(null)
  const [saldoAFavorCC, setSaldoAFavorCC] = useState(0)
  const [cambioEstadoCargando, setCambioEstadoCargando] = useState(false)

  const handleBuscar = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filtroEmpresaId) params.set("empresaId", filtroEmpresaId)
      if (filtroNroComprobante) params.set("nroComprobante", filtroNroComprobante)
      if (filtroDesde) params.set("desde", filtroDesde)
      if (filtroHasta) params.set("hasta", filtroHasta)
      if (filtroEstado) params.set("estado", filtroEstado)
      const res = await fetch(`/api/empresas/facturas?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setFacturas(data as FacturaRow[])
      }
    } finally {
      setLoading(false)
    }
  }, [filtroEmpresaId, filtroNroComprobante, filtroDesde, filtroHasta, filtroEstado])

  useEffect(() => {
    void handleBuscar()
    // Only on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function cambiarEstado(id: string, estado: string) {
    setCambioEstadoCargando(true)
    try {
      const res = await fetch(`/api/facturas/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ estado }),
      })
      if (res.ok) {
        setFacturaDetalle(null)
        void handleBuscar()
      }
    } finally {
      setCambioEstadoCargando(false)
    }
  }

  async function abrirCobro(factura: FacturaRow) {
    try {
      const res = await fetch(`/api/empresas/${factura.empresa.id}/saldo-cc`)
      if (res.ok) {
        const data = await res.json()
        setSaldoAFavorCC((data as { saldoAFavor?: number }).saldoAFavor ?? 0)
      }
    } catch {
      // silencioso
    }
    setCobrandoFactura(factura)
    setFacturaDetalle(null)
  }

  const empresasItems = [
    { id: "", label: "Todas las empresas" },
    ...empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: formatearCuit(e.cuit) })),
  ]

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Consultar Facturas</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            <div className="lg:col-span-2">
              <Label>Empresa</Label>
              <SearchCombobox
                items={empresasItems}
                value={filtroEmpresaId}
                onChange={setFiltroEmpresaId}
                placeholder="Todas las empresas"
              />
            </div>
            <div>
              <Label>Nº Comprobante</Label>
              <Input
                value={filtroNroComprobante}
                onChange={(e) => setFiltroNroComprobante(e.target.value)}
                placeholder="0001-00000001"
              />
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={filtroDesde} onChange={(e) => setFiltroDesde(e.target.value)} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={filtroHasta} onChange={(e) => setFiltroHasta(e.target.value)} />
            </div>
            <div>
              <Label>Estado</Label>
              <select
                value={filtroEstado}
                onChange={(e) => setFiltroEstado(e.target.value)}
                className="h-9 w-full rounded-md border bg-background px-3 text-sm"
              >
                <option value="">Todos</option>
                <option value="BORRADOR">Borrador</option>
                <option value="EMITIDA">Emitida</option>
                <option value="PARCIALMENTE_COBRADA">Parcialmente Cobrada</option>
                <option value="COBRADA">Cobrada</option>
                <option value="ANULADA">Anulada</option>
              </select>
            </div>
            <div className="flex items-end">
              <Button onClick={() => void handleBuscar()} disabled={loading} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Nº Comprobante</th>
                  <th className="px-3 py-3 text-left">Tipo</th>
                  <th className="px-3 py-3 text-left">Empresa</th>
                  <th className="px-3 py-3 text-right">Neto</th>
                  <th className="px-3 py-3 text-right">IVA</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-right">Cobrado</th>
                  <th className="px-3 py-3 text-center">NC/ND</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">Buscando...</td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan={11} className="px-3 py-8 text-center text-muted-foreground">Sin resultados</td>
                  </tr>
                ) : (
                  facturas.map((fact) => {
                    const cobradoPct = fact.total > 0 ? (fact.totalPagado / fact.total * 100) : 0
                    return (
                      <tr key={fact.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2">{formatearFecha(fact.emitidaEn)}</td>
                        <td className="px-3 py-2 font-mono text-xs">{fact.nroComprobante ?? "—"}</td>
                        <td className="px-3 py-2"><TipoCbteBadge tipoCbte={fact.tipoCbte} modalidad={fact.modalidadMiPymes ?? undefined} /></td>
                        <td className="px-3 py-2 max-w-[160px] truncate">{fact.empresa.razonSocial}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(fact.neto)}</td>
                        <td className="px-3 py-2 text-right">{formatearMoneda(fact.ivaMonto)}</td>
                        <td className="px-3 py-2 text-right font-semibold">{formatearMoneda(fact.total)}</td>
                        <td className="px-3 py-2 text-center"><EstadoBadge estado={fact.estado} /></td>
                        <td className="px-3 py-2 text-right text-sm">
                          {fact.totalPagado > 0
                            ? <span className={cobradoPct >= 100 ? "text-green-700 font-medium" : ""}>{formatearMoneda(fact.totalPagado)}</span>
                            : <span className="text-muted-foreground">—</span>}
                        </td>
                        <td className="px-3 py-2 text-center text-xs text-muted-foreground">
                          {fact._count.notasCreditoDebito > 0 ? fact._count.notasCreditoDebito : "—"}
                        </td>
                        <td className="px-3 py-2">
                          <Button size="sm" variant="outline" onClick={() => setFacturaDetalle(fact)}>Ver</Button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {facturas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={4} className="px-3 py-3 text-right text-sm">Totales ({facturas.length})</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(facturas.reduce((a, f) => a + f.neto, 0))}</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(facturas.reduce((a, f) => a + f.ivaMonto, 0))}</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(facturas.reduce((a, f) => a + f.total, 0))}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal detalle */}
      {facturaDetalle && (
        <Dialog open onOpenChange={(open) => { if (!open) setFacturaDetalle(null) }}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 flex-wrap">
                <span>{facturaDetalle.empresa.razonSocial}</span>
                <span className="text-muted-foreground text-sm">{formatearFecha(facturaDetalle.emitidaEn)}</span>
                <span className="text-muted-foreground text-sm">Tipo {facturaDetalle.tipoCbte}</span>
                {facturaDetalle.nroComprobante && (
                  <span className="font-mono text-xs text-muted-foreground">#{facturaDetalle.nroComprobante}</span>
                )}
                <EstadoBadge estado={facturaDetalle.estado} />
              </DialogTitle>
            </DialogHeader>

            {/* Viajes */}
            <div className="space-y-3">
              <h3 className="font-semibold text-sm">Viajes incluidos ({facturaDetalle.viajes.length})</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="border-b bg-muted/50">
                      <th className="px-2 py-2 text-left">Remito</th>
                      <th className="px-2 py-2 text-left">Mercadería</th>
                      <th className="px-2 py-2 text-left">Origen</th>
                      <th className="px-2 py-2 text-left">Destino</th>
                      <th className="px-2 py-2 text-right">Kilos</th>
                      <th className="px-2 py-2 text-right">Ton</th>
                      <th className="px-2 py-2 text-right">Tarifa</th>
                      <th className="px-2 py-2 text-right">Importe</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {facturaDetalle.viajes.map((vef) => {
                      const kilos = vef.kilos ?? 0
                      const ton = kilos > 0 ? (kilos / 1000).toLocaleString("es-AR", { minimumFractionDigits: 3, maximumFractionDigits: 3 }) : "—"
                      return (
                        <tr key={vef.id} className="hover:bg-muted/20">
                          <td className="px-2 py-1">{vef.remito ?? "—"}</td>
                          <td className="px-2 py-1">{vef.mercaderia ?? "—"}</td>
                          <td className="px-2 py-1">{vef.provinciaOrigen ?? vef.procedencia ?? "—"}</td>
                          <td className="px-2 py-1">{vef.provinciaDestino ?? vef.destino ?? "—"}</td>
                          <td className="px-2 py-1 text-right">{kilos > 0 ? kilos.toLocaleString("es-AR") : "—"}</td>
                          <td className="px-2 py-1 text-right">{ton}</td>
                          <td className="px-2 py-1 text-right">{formatearMoneda(vef.tarifaEmpresa)}</td>
                          <td className="px-2 py-1 text-right font-medium">{formatearMoneda(vef.subtotal)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>

              {/* Totales */}
              <div className="space-y-1 text-sm border-t pt-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Neto:</span>
                  <span>{formatearMoneda(facturaDetalle.neto)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">IVA ({facturaDetalle.ivaPct}%):</span>
                  <span>{formatearMoneda(facturaDetalle.ivaMonto)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total:</span>
                  <span>{formatearMoneda(facturaDetalle.total)}</span>
                </div>
              </div>

              {/* Pagos */}
              {facturaDetalle.pagos.length > 0 && (
                <div className="space-y-2">
                  <h3 className="font-semibold text-sm">Pagos recibidos</h3>
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b bg-muted/50">
                        <th className="px-2 py-2 text-left">Tipo</th>
                        <th className="px-2 py-2 text-left">Fecha</th>
                        <th className="px-2 py-2 text-left">Referencia</th>
                        <th className="px-2 py-2 text-right">Monto</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y">
                      {facturaDetalle.pagos.map((p, i) => (
                        <tr key={i} className="hover:bg-muted/20">
                          <td className="px-2 py-1">{p.tipoPago}</td>
                          <td className="px-2 py-1">{formatearFecha(p.fechaPago)}</td>
                          <td className="px-2 py-1">{p.referencia ?? "—"}</td>
                          <td className="px-2 py-1 text-right font-medium">{formatearMoneda(p.monto)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  <div className="flex justify-end text-sm font-semibold">
                    <span>Total cobrado: {formatearMoneda(facturaDetalle.totalPagado)}</span>
                  </div>
                </div>
              )}

              {/* NC/ND */}
              {facturaDetalle._count.notasCreditoDebito > 0 && (
                <p className="text-xs text-muted-foreground">
                  Esta factura tiene {facturaDetalle._count.notasCreditoDebito} nota(s) de crédito/débito asociada(s).
                </p>
              )}
            </div>

            <DialogFooter className="flex-wrap gap-2">
              {(facturaDetalle.estado === "EMITIDA" || facturaDetalle.estado === "PARCIALMENTE_COBRADA") && (
                <Button
                  onClick={() => void abrirCobro(facturaDetalle)}
                  variant="default"
                >
                  Registrar cobro
                </Button>
              )}
              {facturaDetalle.estado === "BORRADOR" && (
                <Button
                  onClick={() => void cambiarEstado(facturaDetalle.id, "EMITIDA")}
                  disabled={cambioEstadoCargando}
                  variant="default"
                >
                  Marcar Emitida
                </Button>
              )}
              {(facturaDetalle.estado === "BORRADOR" || facturaDetalle.estado === "EMITIDA") && (
                <Button
                  onClick={() => void cambiarEstado(facturaDetalle.id, "ANULADA")}
                  disabled={cambioEstadoCargando}
                  variant="destructive"
                >
                  Anular
                </Button>
              )}
              <Button variant="outline" onClick={() => setFacturaDetalle(null)}>
                Cerrar
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {/* Modal cobro */}
      {cobrandoFactura && (
        <RegistrarCobroModal
          factura={{
            id: cobrandoFactura.id,
            nroComprobante: cobrandoFactura.nroComprobante,
            tipoCbte: cobrandoFactura.tipoCbte,
            total: cobrandoFactura.total,
            pagosExistentes: cobrandoFactura.totalPagado,
            empresa: cobrandoFactura.empresa,
          }}
          cuentasBancarias={cuentasBancarias}
          saldoAFavorCC={saldoAFavorCC}
          onSuccess={() => {
            setFacturaDetalle(null)
            setCobrandoFactura(null)
            void handleBuscar()
          }}
          onClose={() => setCobrandoFactura(null)}
        />
      )}
    </div>
  )
}
