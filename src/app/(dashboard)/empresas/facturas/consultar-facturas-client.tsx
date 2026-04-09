"use client"

/**
 * Propósito: Componente cliente para consultar el historial de facturas emitidas a empresas.
 * Filtros por empresa, nro comprobante, fechas y estado. Tabla con totales.
 * Acciones: abrir PDF, emitir NC/ND.
 */

import { useState, useEffect, useCallback, useMemo } from "react"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { sumarImportes, restarImportes, calcularNetoMasIva } from "@/lib/money"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { hoyLocalYmd } from "@/lib/date-local"

// ─── Tipos ────────────────────────────────────────────────────────────────────

type ReciboRef = {
  id: string
  nro: number
  ptoVenta: number
}

type NotaCDRef = { tipo: string; montoTotal: number }

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
  recibo: ReciboRef | null
  totalPagado?: number
  notasCreditoDebito?: NotaCDRef[]
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
  const [notaModal, setNotaModal] = useState<FacturaRow | null>(null)

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

  async function abrirPDF(facturaId: string) {
    try {
      const res = await fetch(`/api/facturas/${facturaId}/pdf`)
      if (!res.ok) return
      const contentType = res.headers.get("content-type") ?? ""
      if (contentType.includes("application/pdf")) {
        const blob = await res.blob()
        window.open(URL.createObjectURL(blob), "_blank")
      } else {
        const data = await res.json()
        if (data.url) window.open(data.url, "_blank")
      }
    } catch { /* ignore */ }
  }

  const empresasItems = [
    { id: "", label: "Todas las empresas" },
    ...empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: formatearCuit(e.cuit) })),
  ]

  // Columnas: Fecha, Tipo, Nº, [Empresa], Total, Saldo, Estado, Recibo, NC/ND, Ver PDF
  const colCount = mostrarColumnaEmpresa ? 10 : 9

  /**
   * calcularSaldoVigente: FacturaRow -> number
   * saldo = total + sum(ND) - sum(NC) - totalPagado
   */
  function calcularSaldoVigente(fact: FacturaRow): number {
    const totalPagado = fact.totalPagado ?? 0
    const notas = fact.notasCreditoDebito ?? []
    const ajusteNC = sumarImportes(notas.filter((n) => n.tipo === "NC_EMITIDA").map((n) => n.montoTotal))
    const ajusteND = sumarImportes(notas.filter((n) => n.tipo === "ND_EMITIDA").map((n) => n.montoTotal))
    const netoVigente = Math.max(0, restarImportes(sumarImportes([fact.total, ajusteND]), ajusteNC))
    return Math.max(0, restarImportes(netoVigente, totalPagado))
  }

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
                  <th className="px-3 py-3 text-right font-semibold">Total</th>
                  <th className="px-3 py-3 text-right">Saldo</th>
                  <th className="px-3 py-3 text-center">Estado</th>
                  <th className="px-3 py-3 text-left">Recibo</th>
                  <th className="px-3 py-3 text-center">NC/ND</th>
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
                  facturas.map((fact) => {
                    const puedeEmitirNcNd = fact.estadoArca === "AUTORIZADA" &&
                      ["EMITIDA", "PARCIALMENTE_COBRADA", "COBRADA"].includes(fact.estado)
                    return (
                      <tr key={fact.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2">{formatearFecha(fact.emitidaEn)}</td>
                        <td className="px-3 py-2 text-sm">{labelTipoCbte(fact.tipoCbte, fact.modalidadMiPymes)}</td>
                        <td className="px-3 py-2 font-mono text-sm">{formatNroComprobante(fact.ptoVenta, fact.nroComprobante)}</td>
                        {mostrarColumnaEmpresa && <td className="px-3 py-2 max-w-[160px] truncate">{fact.empresa.razonSocial}</td>}
                        <td className="px-3 py-2 text-right font-semibold">{formatearMoneda(fact.total)}</td>
                        <td className="px-3 py-2 text-right text-muted-foreground">
                          {(() => {
                            const saldo = calcularSaldoVigente(fact)
                            return saldo > 0 ? formatearMoneda(saldo) : <span className="text-success">Saldada</span>
                          })()}
                        </td>
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
                        <td className="px-3 py-2 font-mono text-sm">
                          {fact.recibo ? formatNroComprobante(fact.recibo.ptoVenta, fact.recibo.nro) : ""}
                        </td>
                        <td className="px-3 py-2 text-center">
                          {fact._count.notasCreditoDebito > 0 && (
                            <span className="text-sm text-muted-foreground">{fact._count.notasCreditoDebito}</span>
                          )}
                          {puedeEmitirNcNd && (
                            <button
                              onClick={() => setNotaModal(fact)}
                              className="text-xs text-primary hover:text-primary/80 hover:underline font-medium ml-1"
                            >
                              Emitir
                            </button>
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
                    )
                  })
                )}
              </tbody>
              {facturas.length > 0 && (
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={mostrarColumnaEmpresa ? 4 : 3} className="px-3 py-3 text-right text-sm">Totales ({facturas.length})</td>
                    <td className="px-3 py-3 text-right">{formatearMoneda(sumarImportes(facturas.map(f => f.total)))}</td>
                    <td className="px-3 py-3 text-right text-muted-foreground">{formatearMoneda(sumarImportes(facturas.map(f => calcularSaldoVigente(f))))}</td>
                    <td colSpan={4}></td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Modal emisión NC/ND */}
      {notaModal && (
        <ModalEmitirNotaEmpresa
          factura={notaModal}
          onClose={() => setNotaModal(null)}
          onEmitida={() => { setNotaModal(null); void handleBuscar() }}
        />
      )}
    </div>
  )
}

// ─── Modal Emitir NC/ND ──────────────────────────────────────────────────────

type ItemNota = { concepto: string; subtotal: string }

function ModalEmitirNotaEmpresa({
  factura,
  onClose,
  onEmitida,
}: {
  factura: FacturaRow
  onClose: () => void
  onEmitida: () => void
}) {
  // Calcular saldo para determinar NC vs ND
  const totalPagado = factura.totalPagado ?? 0
  const notasNC = (factura.notasCreditoDebito ?? []).filter((n) => n.tipo === "NC_EMITIDA")
  const notasND = (factura.notasCreditoDebito ?? []).filter((n) => n.tipo === "ND_EMITIDA")
  const ajusteNC = sumarImportes(notasNC.map((n) => n.montoTotal))
  const ajusteND = sumarImportes(notasND.map((n) => n.montoTotal))
  const netoVigente = Math.max(0, restarImportes(sumarImportes([factura.total, ajusteND]), ajusteNC))
  const saldoPendiente = Math.max(0, restarImportes(netoVigente, totalPagado))

  const tipoPermitido: "NC" | "ND" = saldoPendiente > 0 ? "NC" : "ND"

  const [tipoNota, setTipoNota] = useState<"NC" | "ND">(tipoPermitido)
  const [fechaEmision, setFechaEmision] = useState(hoyLocalYmd())
  const [items, setItems] = useState<ItemNota[]>([{ concepto: "", subtotal: "" }])
  const [generando, setGenerando] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [exito, setExito] = useState<{ cae?: string; nro?: number; ptoVenta?: number } | null>(null)

  // Preview de totales
  const preview = useMemo(() => {
    const subtotales = items.map((i) => parseFloat(i.subtotal) || 0).filter((s) => s > 0)
    if (subtotales.length === 0) return null
    const neto = sumarImportes(subtotales)
    const result = calcularNetoMasIva(neto, factura.ivaPct)
    return { neto: result.neto, iva: result.iva, total: result.total }
  }, [items, factura.ivaPct])

  function agregarItem() {
    setItems([...items, { concepto: "", subtotal: "" }])
  }

  function eliminarItem(idx: number) {
    if (items.length <= 1) return
    setItems(items.filter((_, i) => i !== idx))
  }

  function actualizarItem(idx: number, campo: "concepto" | "subtotal", valor: string) {
    const nuevos = [...items]
    nuevos[idx] = { ...nuevos[idx], [campo]: valor }
    setItems(nuevos)
  }

  async function emitir() {
    setError(null)
    setGenerando(true)
    try {
      const itemsValidos = items
        .filter((i) => i.concepto.trim() && parseFloat(i.subtotal) > 0)
        .map((i) => ({ concepto: i.concepto.trim(), subtotal: parseFloat(i.subtotal) }))

      if (itemsValidos.length === 0) {
        setError("Ingresá al menos un ítem con concepto y subtotal")
        return
      }

      const res = await fetch("/api/notas-credito-debito", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          facturaId: factura.id,
          tipoNota,
          fechaEmision,
          items: itemsValidos,
          idempotencyKey: crypto.randomUUID(),
        }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Error al emitir la nota")
        return
      }

      const data = await res.json()
      setExito({
        cae: data.arca?.cae,
        nro: data.arca?.nroComprobante,
        ptoVenta: data.arca?.ptoVenta,
      })
    } catch {
      setError("Error de red al emitir")
    } finally {
      setGenerando(false)
    }
  }

  const labelTipo = tipoNota === "NC" ? "Nota de Crédito" : "Nota de Débito"

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div
        className="bg-background rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6 space-y-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-bold">Emitir {labelTipo}</h2>
            <p className="text-sm text-muted-foreground">
              Sobre Factura {labelTipoCbte(factura.tipoCbte, factura.modalidadMiPymes)}{" "}
              {formatNroComprobante(factura.ptoVenta, factura.nroComprobante)}
            </p>
          </div>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground text-xl leading-none">&times;</button>
        </div>

        {/* Info factura */}
        <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-sm bg-muted/40 rounded-lg p-3">
          <span className="text-muted-foreground">Empresa</span>
          <span className="font-medium">{factura.empresa.razonSocial}</span>
          <span className="text-muted-foreground">Total factura</span>
          <span className="font-medium">{formatearMoneda(factura.total)}</span>
          <span className="text-muted-foreground">Total pagado</span>
          <span>{formatearMoneda(totalPagado)}</span>
          <span className="text-muted-foreground">Saldo pendiente</span>
          <span className="font-semibold">{formatearMoneda(saldoPendiente)}</span>
        </div>

        {exito ? (
          <div className="rounded-lg border border-green-200 bg-green-50 p-4 space-y-2">
            <p className="font-semibold text-green-800">{labelTipo} emitida exitosamente</p>
            {exito.cae && <p className="text-sm text-green-700">CAE: {exito.cae}</p>}
            {exito.nro && exito.ptoVenta && (
              <p className="text-sm text-green-700">
                Nro: {String(exito.ptoVenta).padStart(4, "0")}-{String(exito.nro).padStart(8, "0")}
              </p>
            )}
            <Button size="sm" onClick={onEmitida}>Cerrar</Button>
          </div>
        ) : (
          <>
            {/* Tipo de nota */}
            <div>
              <Label>Tipo de nota</Label>
              <div className="flex gap-4 mt-1">
                <label className={`flex items-center gap-2 text-sm ${tipoPermitido !== "NC" ? "opacity-40" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name="tipoNota"
                    value="NC"
                    checked={tipoNota === "NC"}
                    onChange={() => setTipoNota("NC")}
                    disabled={tipoPermitido !== "NC"}
                    className="accent-primary"
                  />
                  Nota de Crédito
                  <span className="text-xs text-muted-foreground">(reduce deuda)</span>
                </label>
                <label className={`flex items-center gap-2 text-sm ${tipoPermitido !== "ND" ? "opacity-40" : "cursor-pointer"}`}>
                  <input
                    type="radio"
                    name="tipoNota"
                    value="ND"
                    checked={tipoNota === "ND"}
                    onChange={() => setTipoNota("ND")}
                    disabled={tipoPermitido !== "ND"}
                    className="accent-primary"
                  />
                  Nota de Débito
                  <span className="text-xs text-muted-foreground">(suma deuda)</span>
                </label>
              </div>
            </div>

            {/* Fecha emisión */}
            <div>
              <Label>Fecha de emisión</Label>
              <Input
                type="date"
                value={fechaEmision}
                onChange={(e) => setFechaEmision(e.target.value)}
                max={hoyLocalYmd()}
                min={hoyLocalYmd(new Date(Date.now() - 10 * 24 * 60 * 60 * 1000))}
                className="w-48"
              />
            </div>

            {/* Items */}
            <div className="space-y-2">
              <Label>Ítems</Label>
              {items.map((item, idx) => (
                <div key={idx} className="flex gap-2 items-start">
                  <Input
                    value={item.concepto}
                    onChange={(e) => actualizarItem(idx, "concepto", e.target.value)}
                    placeholder="Concepto"
                    className="flex-1"
                  />
                  <Input
                    type="number"
                    value={item.subtotal}
                    onChange={(e) => actualizarItem(idx, "subtotal", e.target.value)}
                    placeholder="Subtotal"
                    className="w-36 text-right"
                    min="0.01"
                    step="0.01"
                  />
                  {items.length > 1 && (
                    <button
                      onClick={() => eliminarItem(idx)}
                      className="h-9 px-2 text-red-500 hover:text-red-700 text-lg leading-none"
                      title="Eliminar ítem"
                    >
                      &times;
                    </button>
                  )}
                </div>
              ))}
              <button
                onClick={agregarItem}
                className="text-xs text-primary hover:underline font-medium"
              >
                + Agregar ítem
              </button>
            </div>

            {/* Preview */}
            {preview && (
              <div className="bg-muted/40 rounded-lg p-3 space-y-1 text-sm">
                <div className="flex justify-between">
                  <span>Neto</span>
                  <span>{formatearMoneda(preview.neto)}</span>
                </div>
                <div className="flex justify-between">
                  <span>IVA ({factura.ivaPct}%)</span>
                  <span>+ {formatearMoneda(preview.iva)}</span>
                </div>
                <div className="flex justify-between font-bold text-base border-t pt-1">
                  <span>Total</span>
                  <span>{formatearMoneda(preview.total)}</span>
                </div>
              </div>
            )}

            {error && (
              <div className="rounded-lg bg-red-50 border border-red-200 p-3 text-sm text-red-700">{error}</div>
            )}

            {/* Acciones */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={onClose} disabled={generando}>Cancelar</Button>
              <Button onClick={emitir} disabled={generando || !preview}>
                {generando ? "Emitiendo..." : `Emitir ${labelTipo}`}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
