"use client"

/**
 * Propósito: Componente cliente para consultar el historial de Recibos de Cobranza.
 * Filtros por empresa y rango de fechas. Tabla con totales. Botón para ver PDF.
 */

import { useState, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"
import { PDFViewer } from "@/components/ui/pdf-viewer"
import { usePDFViewer } from "@/hooks/use-pdf-viewer"
import { sumarImportes } from "@/lib/money"

// ─── Tipos ────────────────────────────────────────────────────────────────────

interface Empresa {
  id: string
  razonSocial: string
  cuit: string
}

interface ReciboRow {
  id: string
  nro: number
  ptoVenta: number
  fecha: string
  totalCobrado: number
  totalRetenciones: number
  totalComprobantes: number
  pdfS3Key: string | null
  empresa: { razonSocial: string; cuit: string }
  operador: { nombre: string; apellido: string }
  facturas: { id: string; nroComprobante: string | null; tipoCbte: number; total: number }[]
  mediosPago: { tipo: string; monto: number }[]
}

interface ConsultarRecibosClientProps {
  empresas: Empresa[]
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtFecha(s: string) {
  return new Date(s).toLocaleDateString("es-AR")
}

function fmtNroRecibo(pto: number, nro: number) {
  return `${String(pto).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

// ─── Componente ───────────────────────────────────────────────────────────────

export function ConsultarRecibosClient({ empresas }: ConsultarRecibosClientProps) {
  const { estado: estadoPDF, abrirPDF, cerrarPDF } = usePDFViewer()
  const [empresaId, setEmpresaId] = useState("")
  const [desde, setDesde] = useState("")
  const [hasta, setHasta] = useState("")
  const [filtroNroRecibo, setFiltroNroRecibo] = useState("")
  const [recibos, setRecibos] = useState<ReciboRow[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [buscado, setBuscado] = useState(false)
  // PDF viewer state managed by usePDFViewer hook
  const [reciboDetalle, setReciboDetalle] = useState<ReciboRow | null>(null)

  const empresaItems = empresas.map((e) => ({ id: e.id, label: e.razonSocial, sublabel: e.cuit }))

  const buscar = useCallback(async () => {
    setLoading(true)
    setError(null)
    setBuscado(true)
    try {
      const params = new URLSearchParams()
      if (empresaId) params.set("empresaId", empresaId)
      if (desde) params.set("desde", desde)
      if (hasta) params.set("hasta", hasta)

      const res = await fetch(`/api/recibos-cobranza?${params.toString()}`)
      if (!res.ok) throw new Error("Error consultando recibos")
      const data: ReciboRow[] = await res.json()
      setRecibos(data)
    } catch {
      setError("No se pudieron cargar los recibos")
    } finally {
      setLoading(false)
    }
  }, [empresaId, desde, hasta])

  function verPDF(recibo: ReciboRow) {
    abrirPDF({
      fetchUrl: `/api/recibos-cobranza/${recibo.id}/pdf`,
      titulo: `Recibo ${fmtNroRecibo(recibo.ptoVenta, recibo.nro)} — ${recibo.empresa.razonSocial}`,
    })
  }

  const recibosFiltrados = filtroNroRecibo
    ? recibos.filter((r) =>
        fmtNroRecibo(r.ptoVenta, r.nro)
          .includes(filtroNroRecibo.trim())
      )
    : recibos

  const totalCobradoGeneral = sumarImportes(recibosFiltrados.map(r => r.totalCobrado))

  return (
    <div className="max-w-6xl mx-auto mt-6 space-y-6">
      <h1 className="text-2xl font-bold">Recibos por Cobranza</h1>

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            <div className="md:col-span-2">
              <Label className="text-xs mb-1">Empresa</Label>
              <SearchCombobox
                items={empresaItems}
                value={empresaId}
                onChange={setEmpresaId}
                placeholder="Todas las empresas..."
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Nro Recibo</Label>
              <Input
                type="text"
                placeholder="Ej: 0001-00000012"
                value={filtroNroRecibo}
                onChange={(e) => setFiltroNroRecibo(e.target.value)}
                className="h-9"
              />
            </div>
            <div>
              <Label className="text-xs mb-1">Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} className="h-9" />
            </div>
            <div>
              <Label className="text-xs mb-1">Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} className="h-9" />
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <Button onClick={buscar} disabled={loading}>
              {loading ? "Buscando..." : "Buscar"}
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setEmpresaId("")
                setDesde("")
                setHasta("")
                setFiltroNroRecibo("")
                setRecibos([])
                setBuscado(false)
                setError(null)
              }}
            >
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-sm text-destructive">
          {error}
        </div>
      )}

      {buscado && !loading && (
        <Card>
          <CardContent className="pt-4">
            {recibosFiltrados.length === 0 ? (
              <p className="text-muted-foreground text-sm py-4 text-center">
                No se encontraron recibos con los filtros indicados.
              </p>
            ) : (
              <>
                <table className="w-full text-sm border-collapse">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 pr-3">Nro Recibo</th>
                      <th className="text-left py-2 pr-3">Fecha</th>
                      <th className="text-left py-2 pr-3">Empresa</th>
                      <th className="text-right py-2 pr-3">Comprobantes</th>
                      <th className="text-right py-2 pr-3">Retenciones</th>
                      <th className="text-right py-2 pr-3">Total Cobrado</th>
                      <th className="text-left py-2 pr-3">Operador</th>
                      <th className="py-2"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {recibosFiltrados.map((r) => (
                      <tr
                        key={r.id}
                        className="border-b hover:bg-muted/40 cursor-pointer"
                        onClick={() => setReciboDetalle(reciboDetalle?.id === r.id ? null : r)}
                      >
                        <td className="py-2 pr-3 font-mono font-semibold">
                          {fmtNroRecibo(r.ptoVenta, r.nro)}
                        </td>
                        <td className="py-2 pr-3">{fmtFecha(r.fecha)}</td>
                        <td className="py-2 pr-3">{r.empresa.razonSocial}</td>
                        <td className="py-2 pr-3 text-right font-mono">{fmt(r.totalComprobantes)}</td>
                        <td className="py-2 pr-3 text-right font-mono">{fmt(r.totalRetenciones)}</td>
                        <td className="py-2 pr-3 text-right font-bold font-mono">{fmt(r.totalCobrado)}</td>
                        <td className="py-2 pr-3 text-muted-foreground">
                          {r.operador.nombre} {r.operador.apellido}
                        </td>
                        <td className="py-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={(e) => {
                              e.stopPropagation()
                              verPDF(r)
                            }}
                          >
                            PDF
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="border-t font-bold">
                      <td colSpan={5} className="py-2 pr-3">
                        {recibosFiltrados.length} recibo(s)
                      </td>
                      <td className="py-2 pr-3 text-right font-mono">{fmt(totalCobradoGeneral)}</td>
                      <td colSpan={2}></td>
                    </tr>
                  </tfoot>
                </table>

                {/* Detalle del recibo seleccionado */}
                {reciboDetalle && (
                  <div className="mt-4 p-4 border rounded-md bg-muted/20 space-y-3">
                    <p className="font-semibold text-sm">
                      Detalle: Recibo {fmtNroRecibo(reciboDetalle.ptoVenta, reciboDetalle.nro)}
                    </p>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Facturas</p>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Nro</th>
                              <th className="text-right py-1">Total</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reciboDetalle.facturas.map((f) => (
                              <tr key={f.id} className="border-b">
                                <td className="py-1">{f.nroComprobante ?? "—"}</td>
                                <td className="py-1 text-right font-mono">{fmt(f.total)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div>
                        <p className="text-xs text-muted-foreground uppercase mb-1">Medios de pago</p>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="border-b">
                              <th className="text-left py-1">Tipo</th>
                              <th className="text-right py-1">Monto</th>
                            </tr>
                          </thead>
                          <tbody>
                            {reciboDetalle.mediosPago.map((m, i) => (
                              <tr key={i} className="border-b">
                                <td className="py-1">
                                  {m.tipo === "TRANSFERENCIA"
                                    ? "Transferencia"
                                    : m.tipo === "ECHEQ"
                                    ? "ECheq"
                                    : "Cheque Físico"}
                                </td>
                                <td className="py-1 text-right font-mono">{fmt(m.monto)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      <PDFViewer {...estadoPDF} onClose={cerrarPDF} />
    </div>
  )
}
