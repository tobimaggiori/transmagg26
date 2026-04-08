"use client"

/**
 * Propósito: Componente cliente para consultar el historial de facturas emitidas a empresas.
 * Filtros por empresa, nro comprobante, fechas y estado. Tabla con totales.
 * Acción principal: abrir PDF de cada factura desde R2.
 */

import { useState, useEffect, useCallback } from "react"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type FacturaRow = {
  id: string
  emitidaEn: string
  tipoCbte: number
  modalidadMiPymes?: string | null
  ptoVenta: number | null
  nroComprobante: string | null
  ivaPct: number
  neto: number
  ivaMonto: number
  total: number
  estado: string
  estadoArca: string
  pdfS3Key: string | null
  empresa: { id: string; razonSocial: string; cuit: string }
  _count: { notasCreditoDebito: number }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type ConsultarFacturasClientProps = {
  empresas: Array<{ id: string; razonSocial: string; cuit: string }>
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function primerDiaMesActual(): string {
  const hoy = new Date()
  return `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}-01`
}

function hoyStr(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`
}

function formatNroComprobante(ptoVenta: number | null, nroComprobante: string | number | null): string {
  if (!nroComprobante) return "—"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const nro = String(nroComprobante).padStart(8, "0")
  return `${pv}-${nro}`
}

function labelTipoCbte(tipoCbte: number, modalidad?: string | null): string {
  if (tipoCbte === 1) return "Fact. A"
  if (tipoCbte === 6) return "Fact. B"
  if (tipoCbte === 201) return modalidad ? `MiPyme ${modalidad}` : "MiPyme"
  if (tipoCbte === 3) return "NC A"
  if (tipoCbte === 8) return "NC B"
  if (tipoCbte === 2) return "ND A"
  if (tipoCbte === 7) return "ND B"
  return `Cbte ${tipoCbte}`
}

function EstadoBadge({ estado }: { estado: string }) {
  const estilos: Record<string, string> = {
    EMITIDA: "bg-info-soft text-info",
    PARCIALMENTE_COBRADA: "bg-warning-soft text-warning",
    COBRADA: "bg-success-soft text-success",
  }
  const labels: Record<string, string> = {
    PARCIALMENTE_COBRADA: "Parcial",
  }
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${estilos[estado] ?? "bg-secondary text-muted-foreground"}`}>
      {labels[estado] ?? estado}
    </span>
  )
}

// ─── Componente principal ─────────────────────────────────────────────────────

export function ConsultarFacturasClient({ empresas }: ConsultarFacturasClientProps) {
  const [filtroEmpresaId, setFiltroEmpresaId] = useState<string>("")
  const [filtroNroComprobante, setFiltroNroComprobante] = useState<string>("")
  const [filtroDesde, setFiltroDesde] = useState<string>(primerDiaMesActual())
  const [filtroHasta, setFiltroHasta] = useState<string>(hoyStr())
  const [filtroEstado, setFiltroEstado] = useState<string>("")
  const [facturas, setFacturas] = useState<FacturaRow[]>([])
  const [loading, setLoading] = useState(false)
  const [autorizandoArcaId, setAutorizandoArcaId] = useState<string | null>(null)

  const empresaSeleccionada = empresas.find((e) => e.id === filtroEmpresaId)
  const mostrarColumnaEmpresa = !filtroEmpresaId

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function reintentarArca(facturaId: string) {
    setAutorizandoArcaId(facturaId)
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 45000)
    try {
      const res = await fetch(`/api/facturas/${facturaId}/autorizar-arca`, { method: "POST", signal: controller.signal })
      clearTimeout(timeoutId)
      if (res.ok) handleBuscar()
    } catch { clearTimeout(timeoutId) }
    finally { setAutorizandoArcaId(null) }
  }

  function abrirPDF(facturaId: string) {
    window.open(`/api/facturas/${facturaId}/pdf`, "_blank")
  }

  const empresasItems = [
    { id: "", label: "Todas las empresas" },
    ...empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: formatearCuit(e.cuit) })),
  ]

  const colCount = mostrarColumnaEmpresa ? 9 : 8

  return (
    <div className="space-y-5">
      <h1 className="text-[34px] font-bold tracking-tight text-foreground leading-tight">Consultar Facturas</h1>

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
                className="h-9 w-full rounded-lg border border-input bg-background px-3 text-base"
              >
                <option value="">Todos</option>
                <option value="EMITIDA">Emitida</option>
                <option value="PARCIALMENTE_COBRADA">Parcialmente Cobrada</option>
                <option value="COBRADA">Cobrada</option>
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

      {/* Encabezado contextual */}
      {empresaSeleccionada && (
        <p className="text-[15px] font-medium text-foreground">
          Historial de facturas emitidas a {empresaSeleccionada.razonSocial} — {formatearCuit(empresaSeleccionada.cuit)}
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
                  <th className="px-3 py-3 text-left">Tipo</th>
                  <th className="px-3 py-3 text-left">Nº Comprobante</th>
                  {mostrarColumnaEmpresa && <th className="px-3 py-3 text-left">Empresa</th>}
                  <th className="px-3 py-3 text-right">Neto</th>
                  <th className="px-3 py-3 text-right">IVA</th>
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3"></th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Buscando...</td>
                  </tr>
                ) : facturas.length === 0 ? (
                  <tr>
                    <td colSpan={colCount} className="px-3 py-8 text-center text-muted-foreground">Sin resultados</td>
                  </tr>
                ) : (
                  facturas.map((fact) => (
                    <tr key={fact.id} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2">{formatearFecha(fact.emitidaEn)}</td>
                      <td className="px-3 py-2 text-sm">{labelTipoCbte(fact.tipoCbte, fact.modalidadMiPymes)}</td>
                      <td className="px-3 py-2 font-mono text-xs">{formatNroComprobante(fact.ptoVenta, fact.nroComprobante)}</td>
                      {mostrarColumnaEmpresa && <td className="px-3 py-2 max-w-[160px] truncate">{fact.empresa.razonSocial}</td>}
                      <td className="px-3 py-2 text-right">{formatearMoneda(fact.neto)}</td>
                      <td className="px-3 py-2 text-right">{formatearMoneda(fact.ivaMonto)}</td>
                      <td className="px-3 py-2 text-right font-semibold">{formatearMoneda(fact.total)}</td>
                      <td className="px-3 py-2 text-center">
                        <EstadoBadge estado={fact.estado} />
                        {(fact.estadoArca === "PENDIENTE" || fact.estadoArca === "RECHAZADA") && (
                          <span className="inline-flex items-center gap-1 ml-1">
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${fact.estadoArca === "PENDIENTE" ? "bg-warning-soft text-warning" : "bg-error-soft text-error"}`}>
                              {fact.estadoArca === "PENDIENTE" ? "Pendiente ARCA" : "Rechazada ARCA"}
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); reintentarArca(fact.id) }}
                              disabled={autorizandoArcaId === fact.id}
                              className="inline-flex items-center rounded px-1.5 py-0.5 text-[10px] font-medium bg-warning text-warning-foreground hover:bg-warning/80 disabled:opacity-50"
                              title="Reintentar autorización ARCA"
                            >
                              {autorizandoArcaId === fact.id ? "..." : "↻"}
                            </button>
                          </span>
                        )}
                      </td>
                      <td className="px-3 py-2">
                        {fact.pdfS3Key ? (
                          <Button size="sm" variant="outline" onClick={() => abrirPDF(fact.id)}>Ver PDF</Button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Sin PDF</span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {facturas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={mostrarColumnaEmpresa ? 4 : 3} className="px-3 py-3 text-right text-sm">Totales ({facturas.length})</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(facturas.map(f => f.neto)))}</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(facturas.map(f => f.ivaMonto)))}</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(facturas.map(f => f.total)))}</td>
                    <td colSpan={2}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
