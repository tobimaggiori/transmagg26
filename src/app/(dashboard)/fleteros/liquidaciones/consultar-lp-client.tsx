"use client"

/**
 * Propósito: Componente cliente para consultar el historial de Líquidos Producto emitidos.
 * Filtros por fletero, nro comprobante, fechas. Tabla con totales.
 * Análogo a consultar-facturas-client.tsx.
 */

import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes, restarImportes } from "@/lib/money"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { hoyLocalYmd } from "@/lib/date-local"
import type { Rol } from "@/types"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type Fletero = { id: string; razonSocial: string; cuit: string }

type ViajeEnLiquidacion = {
  id: string
  viajeId: string
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
  viaje?: { nroCartaPorte: string | null; cartaPorteS3Key: string | null }
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
  pagos: { id: string; monto: number; tipoPago: string; fechaPago: string; anulado: boolean; ordenPago: { id: string; nro: number; anio: number; fecha: string; pdfS3Key?: string | null } | null }[]
  _count: { notasCreditoDebito: number }
}

type ConsultarLPClientProps = {
  rol: Rol
  fleteros: Fletero[]
  fleteroIdPropio: string | null
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatCuit(cuit: string): string {
  const clean = cuit.replace(/\D/g, "")
  if (clean.length !== 11) return cuit
  return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10)}`
}

function formatNroLP(ptoVenta: number | null, nroComprobante: number | null): string {
  if (!nroComprobante) return "—"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(nroComprobante)}`
}

function primerDiaMesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`
}

function calcularSaldoLP(liq: Liquidacion): number {
  const totalPagado = sumarImportes(liq.pagos.filter((p) => !p.anulado).map((p) => p.monto))
  return Math.max(0, restarImportes(liq.total, totalPagado))
}

// ─── Modal detalle LP ────────────────────────────────────────────────────────

function ModalDetalleLP({
  liq, onCerrar,
}: {
  liq: Liquidacion; onCerrar: () => void
}) {
  const nroLP = formatNroLP(liq.ptoVenta, liq.nroComprobante)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-background rounded-xl shadow-xl w-[90vw] max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-background border-b px-6 py-4 flex items-center justify-between z-10">
          <h2 className="text-lg font-semibold">
            LP Nro: {nroLP} | Fletero: {liq.fletero.razonSocial.toUpperCase()} | Fecha: {formatearFecha(new Date(liq.grabadaEn))}
          </h2>
          <button onClick={onCerrar} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

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
                    <td className="px-3 py-2">{v.viaje?.nroCartaPorte ?? <span className="text-muted-foreground">N/A</span>}</td>
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

          <div className="mt-4 space-y-1 text-sm max-w-md ml-auto">
            <div className="flex justify-between"><span>Total Viajes:</span><span>{formatearMoneda(liq.subtotalBruto)}</span></div>
            <div className="flex justify-between"><span>Comisión ({liq.comisionPct}%):</span><span>-{formatearMoneda(liq.comisionMonto)}</span></div>
            <div className="flex justify-between font-medium"><span>Total neto:</span><span>{formatearMoneda(liq.neto)}</span></div>
            <div className="flex justify-between"><span>IVA ({liq.ivaPct ?? 21}%):</span><span>{formatearMoneda(liq.ivaMonto)}</span></div>
            <div className="flex justify-between font-bold text-base border-t pt-1"><span>TOTAL:</span><span>{formatearMoneda(liq.total)}</span></div>
          </div>
        </div>

        <div className="sticky bottom-0 bg-background border-t px-6 py-4 flex justify-end">
          <button onClick={onCerrar} className="h-9 px-6 rounded-md border text-sm font-medium hover:bg-accent">Cerrar</button>
        </div>
      </div>
    </div>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarLPClient({ rol, fleteros, fleteroIdPropio }: ConsultarLPClientProps) {
  const esInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"

  const [filtroFleteroId, setFiltroFleteroId] = useState<string>(fleteroIdPropio ?? "")
  const [filtroNroLP, setFiltroNroLP] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>(primerDiaMesActual())
  const [filtroHasta, setFiltroHasta] = useState<string>(hoyLocalYmd())
  const [liquidaciones, setLiquidaciones] = useState<Liquidacion[]>([])
  const [loading, setLoading] = useState(false)
  const [autorizandoArcaId, setAutorizandoArcaId] = useState<string | null>(null)
  const [liquidacionDetalle, setLiquidacionDetalle] = useState<Liquidacion | null>(null)

  const fleteroSeleccionado = fleteros.find((f) => f.id === filtroFleteroId)
  const mostrarColumnaFletero = !filtroFleteroId

  const handleBuscar = useCallback(async () => {
    const idAUsar = filtroFleteroId || fleteroIdPropio
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (idAUsar) params.set("fleteroId", idAUsar)
      const res = await fetch(`/api/liquidaciones?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setLiquidaciones(data.liquidaciones ?? [])
      }
    } finally {
      setLoading(false)
    }
  }, [filtroFleteroId, fleteroIdPropio])

  useEffect(() => {
    void handleBuscar()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reintentarArca(liqId: string) {
    setAutorizandoArcaId(liqId)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/liquidaciones/${liqId}/autorizar-arca`, { method: "POST", signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) handleBuscar()
    } catch { clearTimeout(timeoutId) }
    finally { setAutorizandoArcaId(null) }
  }

  // Filtrado client-side (la API ya filtra por fletero)
  const liquidacionesFiltradas = liquidaciones.filter((liq) => {
    if (filtroDesde && new Date(liq.grabadaEn) < new Date(filtroDesde)) return false
    if (filtroHasta) {
      const hasta = new Date(filtroHasta)
      hasta.setHours(23, 59, 59)
      if (new Date(liq.grabadaEn) > hasta) return false
    }
    if (filtroNroLP && liq.nroComprobante) {
      const nroFormateado = formatNroLP(liq.ptoVenta, liq.nroComprobante)
      if (!nroFormateado.includes(filtroNroLP)) return false
    } else if (filtroNroLP && !liq.nroComprobante) {
      return false
    }
    return true
  })

  const fleterosItems = [
    { id: "", label: "Todos los fleteros" },
    ...fleteros.map((f) => ({ id: f.id, label: f.razonSocial, sublabel: formatCuit(f.cuit) })),
  ]

  // Columnas: Fecha, Nº Comprobante, [Fletero], Total, Saldo, OP, NC/ND
  const colCount = mostrarColumnaFletero ? 7 : 6

  return (
    <div className="space-y-5">
      <h1 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Consultar Líquidos Producto</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3 items-end">
            {esInterno && (
              <div className="lg:col-span-2">
                <Label>Fletero</Label>
                <SearchCombobox
                  items={fleterosItems}
                  value={filtroFleteroId}
                  onChange={(v) => { setFiltroFleteroId(v); }}
                  placeholder="Todos los fleteros"
                />
              </div>
            )}
            <div>
              <Label>Nº Comprobante</Label>
              <Input
                value={filtroNroLP}
                onChange={(e) => setFiltroNroLP(e.target.value)}
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
            <div className="flex items-end">
              <Button onClick={() => void handleBuscar()} disabled={loading} className="w-full">
                {loading ? "Buscando..." : "Buscar"}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Encabezado contextual */}
      {fleteroSeleccionado && (
        <p className="text-[15px] font-medium text-foreground">
          Historial de Líquidos Producto emitidos a {fleteroSeleccionado.razonSocial} — {formatCuit(fleteroSeleccionado.cuit)}
        </p>
      )}

      {/* Tabla */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-muted/50">
                  <th className="px-3 py-3 text-left">Fecha</th>
                  <th className="px-3 py-3 text-left">Nº Comprobante</th>
                  {mostrarColumnaFletero && <th className="px-3 py-3 text-left">Fletero</th>}
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right">Saldo</th>
                  <th className="px-3 py-3 text-left">OP</th>
                  <th className="px-3 py-3 text-center">NC/ND</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Buscando...</td>
                  </tr>
                ) : liquidacionesFiltradas.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Sin resultados</td>
                  </tr>
                ) : (
                  liquidacionesFiltradas.map((liq) => {
                    const nroLP = formatNroLP(liq.ptoVenta, liq.nroComprobante)
                    const op = liq.pagos.find((p) => !p.anulado && p.ordenPago)?.ordenPago
                    const saldo = calcularSaldoLP(liq)
                    return (
                      <tr key={liq.id} className="border-b hover:bg-muted/30 cursor-pointer" onClick={() => setLiquidacionDetalle(liq)}>
                        <td className="px-3 py-2">{formatearFecha(liq.grabadaEn)}</td>
                        <td className="px-3 py-2 font-mono text-sm" onClick={(e) => e.stopPropagation()}>
                          {liq.arcaEstado === "AUTORIZADA" && liq.nroComprobante ? (
                            <Link
                              href={`/comprobantes/visor?tipo=liquidacion&id=${liq.id}&titulo=${encodeURIComponent(
                                `LP ${nroLP} — ${liq.fletero.razonSocial}`
                              )}`}
                              className="text-primary hover:underline"
                            >
                              {nroLP}
                            </Link>
                          ) : (
                            <span>
                              {nroLP}
                              {(liq.arcaEstado === "PENDIENTE" || liq.arcaEstado === "RECHAZADA") && (
                                <span className="inline-flex items-center gap-1 ml-2">
                                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${liq.arcaEstado === "PENDIENTE" ? "bg-warning-soft text-warning" : "bg-error-soft text-error"}`}>
                                    {liq.arcaEstado === "PENDIENTE" ? "Pend. ARCA" : "Rechazada"}
                                  </span>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); reintentarArca(liq.id) }}
                                    disabled={autorizandoArcaId === liq.id}
                                    className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning text-warning-foreground hover:bg-warning/80 disabled:opacity-50"
                                    title="Reintentar autorización ARCA"
                                  >
                                    {autorizandoArcaId === liq.id ? "..." : "↻"}
                                  </button>
                                </span>
                              )}
                            </span>
                          )}
                        </td>
                        {mostrarColumnaFletero && <td className="px-3 py-2 max-w-[160px] truncate">{liq.fletero.razonSocial}</td>}
                        <td className="px-3 py-2 text-right font-semibold">{formatearMoneda(liq.total)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {saldo > 0 ? formatearMoneda(saldo) : <span className="text-success">Saldada</span>}
                        </td>
                        <td className="px-3 py-2 font-mono text-sm">
                          {op ? `${op.nro}-${op.anio}` : ""}
                        </td>
                        <td className="px-3 py-2 text-center" onClick={(e) => e.stopPropagation()}>
                          {liq._count.notasCreditoDebito > 0 && (
                            <span className="text-sm text-muted-foreground mr-1">{liq._count.notasCreditoDebito}</span>
                          )}
                          {esInterno && liq.arcaEstado === "AUTORIZADA" && (
                            <Link
                              href={`/fleteros/liquidaciones/${liq.id}/notas`}
                              className="text-xs text-primary hover:text-primary/80 hover:underline font-medium"
                            >
                              Ver NC/ND
                            </Link>
                          )}
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
              {liquidacionesFiltradas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={mostrarColumnaFletero ? 3 : 2} className="px-3 py-3 text-right text-sm">Totales ({liquidacionesFiltradas.length})</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(liquidacionesFiltradas.map(l => l.total)))}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{formatearMoneda(sumarImportes(liquidacionesFiltradas.map(l => calcularSaldoLP(l))))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal detalle */}
      {liquidacionDetalle && (
        <ModalDetalleLP liq={liquidacionDetalle} onCerrar={() => setLiquidacionDetalle(null)} />
      )}
    </div>
  )
}
