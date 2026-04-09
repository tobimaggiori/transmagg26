"use client"

import { useState, useEffect, useCallback } from "react"
import { SearchCombobox } from "@/components/ui/search-combobox"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select } from "@/components/ui/select"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { ExternalLink } from "lucide-react"
import { hoyLocalYmd } from "@/lib/date-local"

// --- Tipos ---

type Fletero = { id: string; razonSocial: string; cuit: string }

type OrdenPago = {
  id: string
  nro: number
  fecha: string
  pdfS3Key: string | null
}

type LiquidacionRow = {
  id: string
  grabadaEn: string
  nroComprobante: number | null
  ptoVenta: number | null
  pdfS3Key: string | null
  total: number
  estado: string
  adelantosDesc: number
  gastosDesc: number
  ordenPago: OrdenPago | null
}

type CCData = {
  fletero: Fletero
  liquidaciones: LiquidacionRow[]
  totalEmitido: number
  totalPagado: number
  saldoPendiente: number
}

type ResumenFletero = {
  fletero: Fletero
  saldoAPagar: number
}

interface CCFleterosClientProps {
  fleteros: Fletero[]
}

// --- Badge de estado ---

function EstadoBadge({ estado }: { estado: string }) {
  if (estado === "PAGADA") {
    return (
      <span className="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-800">
        Pagado ✓
      </span>
    )
  }
  if (estado === "PARCIALMENTE_PAGADA") {
    return (
      <span className="inline-flex items-center rounded-full bg-orange-100 px-2 py-0.5 text-xs font-medium text-orange-800">
        Pago parcial
      </span>
    )
  }
  return (
    <span className="inline-flex items-center rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-800">
      Pendiente de pago
    </span>
  )
}

// --- Formato LP ---

function formatLP(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

// --- Componente principal ---

export function CCFleterosClient({ fleteros }: CCFleterosClientProps) {
  const hoy = hoyLocalYmd()
  const inicioAnio = hoyLocalYmd(new Date(new Date().getFullYear(), 0, 1))

  const [fleteroId, setFleteroId] = useState("")
  const [estadoFiltro, setEstadoFiltro] = useState("")
  const [desde, setDesde] = useState(inicioAnio)
  const [hasta, setHasta] = useState(hoy)
  const [data, setData] = useState<CCData | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Resumen de todos los fleteros con saldo
  const [resumenes, setResumenes] = useState<ResumenFletero[] | null>(null)
  const [loadingResumenes, setLoadingResumenes] = useState(true)

  useEffect(() => {
    fetch("/api/cuentas-corrientes/fleteros")
      .then((r) => r.json())
      .then((d: ResumenFletero[]) => {
        setResumenes(Array.isArray(d) ? d.filter((r) => r.saldoAPagar > 0) : [])
        setLoadingResumenes(false)
      })
      .catch(() => setLoadingResumenes(false))
  }, [])

  const cargarCC = useCallback(
    async (fId: string) => {
      if (!fId) return
      setLoading(true)
      setError(null)
      try {
        const params = new URLSearchParams({
          ...(estadoFiltro ? { estado: estadoFiltro } : {}),
          ...(desde ? { desde } : {}),
          ...(hasta ? { hasta } : {}),
        })
        const res = await fetch(`/api/fleteros/${fId}/cc-lps?${params}`)
        if (!res.ok) {
          const body = await res.json()
          throw new Error(body.error ?? "Error al cargar")
        }
        setData(await res.json())
      } catch (e) {
        setError(e instanceof Error ? e.message : "Error desconocido")
      } finally {
        setLoading(false)
      }
    },
    [estadoFiltro, desde, hasta]
  )

  function handleFiltrar() {
    cargarCC(fleteroId)
  }

  function seleccionarFletero(id: string) {
    setFleteroId(id)
    setData(null)
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-bold">Cuentas Corrientes — Fleteros</h1>

      {/* Resumen de saldos pendientes */}
      {!loadingResumenes && resumenes && resumenes.length > 0 && (
        <Card>
          <CardContent className="p-0">
            <div className="px-4 py-3 border-b bg-muted/30">
              <p className="text-sm font-medium text-muted-foreground">Saldos pendientes</p>
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground text-xs bg-muted/10">
                  <th className="px-4 py-2 font-medium">Fletero</th>
                  <th className="px-4 py-2 font-medium">CUIT</th>
                  <th className="px-4 py-2 font-medium text-right">Saldo pendiente</th>
                  <th className="px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {resumenes.map((r) => (
                  <tr
                    key={r.fletero.id}
                    className="border-b last:border-0 hover:bg-muted/30 cursor-pointer"
                    onClick={() => seleccionarFletero(r.fletero.id)}
                  >
                    <td className="px-4 py-2 font-medium">{r.fletero.razonSocial}</td>
                    <td className="px-4 py-2 text-muted-foreground">{formatearCuit(r.fletero.cuit)}</td>
                    <td className="px-4 py-2 text-right font-semibold text-red-600">
                      {formatearMoneda(r.saldoAPagar)}
                    </td>
                    <td className="px-4 py-2 text-right">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setFleteroId(r.fletero.id)
                          setData(null)
                        }}
                      >
                        Ver CC
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filtros */}
      <Card>
        <CardContent className="pt-4 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
            <div className="md:col-span-1">
              <Label>Fletero</Label>
              <SearchCombobox
                items={fleteros.map((f) => ({
                  id: f.id,
                  label: f.razonSocial,
                  sublabel: formatearCuit(f.cuit),
                }))}
                value={fleteroId}
                onChange={seleccionarFletero}
                placeholder="Buscar fletero..."
              />
            </div>
            <div>
              <Label>Estado</Label>
              <Select
                value={estadoFiltro}
                onChange={(e) => setEstadoFiltro(e.target.value)}
              >
                <option value="">Todos</option>
                <option value="pendientes">Pendientes</option>
                <option value="pagados">Pagados</option>
              </Select>
            </div>
            <div>
              <Label>Desde</Label>
              <Input type="date" value={desde} onChange={(e) => setDesde(e.target.value)} />
            </div>
            <div>
              <Label>Hasta</Label>
              <Input type="date" value={hasta} onChange={(e) => setHasta(e.target.value)} />
            </div>
          </div>
          <div className="flex gap-2">
            <Button onClick={handleFiltrar} disabled={!fleteroId || loading}>
              {loading ? "Cargando..." : "Ver cuenta corriente"}
            </Button>
          </div>
          {error && <p className="text-sm text-red-600">{error}</p>}
        </CardContent>
      </Card>

      {!data && !loading && (
        <p className="text-muted-foreground text-center py-8">
          Seleccioná un fletero para ver su cuenta corriente.
        </p>
      )}

      {data && (
        <>
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h2 className="text-xl font-semibold">{data.fletero.razonSocial}</h2>
              <p className="text-muted-foreground text-sm">CUIT: {formatearCuit(data.fletero.cuit)}</p>
            </div>
          </div>

          {/* Tabla de LPs */}
          <Card>
            <CardContent className="p-0">
              {data.liquidaciones.length === 0 ? (
                <p className="px-4 py-8 text-center text-muted-foreground">
                  Este fletero no tiene Líquidos Productos en el período seleccionado.
                </p>
              ) : (
                <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/50 text-left text-xs text-muted-foreground">
                      <th className="px-4 py-3">Fecha</th>
                      <th className="px-4 py-3">LP Nro</th>
                      <th className="px-4 py-3 text-right">Total LP</th>
                      <th className="px-4 py-3 text-right">Adelantos desc.</th>
                      <th className="px-4 py-3 text-right">Gastos desc.</th>
                      <th className="px-4 py-3">OP</th>
                      <th className="px-4 py-3">Estado</th>
                      <th className="px-4 py-3"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.liquidaciones.map((liq) => (
                      <tr key={liq.id} className="border-b last:border-0 hover:bg-muted/20">
                        <td className="px-4 py-3 text-muted-foreground whitespace-nowrap">
                          {formatearFecha(liq.grabadaEn)}
                        </td>
                        <td className="px-4 py-3">
                          {liq.pdfS3Key ? (
                            <a
                              href={`/api/storage/${liq.pdfS3Key}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="font-mono text-primary hover:underline inline-flex items-center gap-1"
                            >
                              LP {formatLP(liq.ptoVenta, liq.nroComprobante)}
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          ) : (
                            <span className="font-mono text-muted-foreground">
                              LP {formatLP(liq.ptoVenta, liq.nroComprobante)}
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right font-medium tabular-nums">
                          {formatearMoneda(liq.total)}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {liq.adelantosDesc > 0 ? formatearMoneda(liq.adelantosDesc) : "—"}
                        </td>
                        <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">
                          {liq.gastosDesc > 0 ? formatearMoneda(liq.gastosDesc) : "—"}
                        </td>
                        <td className="px-4 py-3">
                          {liq.ordenPago ? (
                            liq.ordenPago.pdfS3Key ? (
                              <a
                                href={`/api/storage/${liq.ordenPago.pdfS3Key}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-primary hover:underline inline-flex items-center gap-1 whitespace-nowrap"
                              >
                                OP Nro {liq.ordenPago.nro}
                                <ExternalLink className="h-3 w-3" />
                              </a>
                            ) : (
                              <span className="text-muted-foreground whitespace-nowrap">
                                OP Nro {liq.ordenPago.nro}
                              </span>
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3">
                          <EstadoBadge estado={liq.estado} />
                        </td>
                        <td className="px-4 py-3 text-right">
                          {!liq.ordenPago && liq.estado !== "PAGADA" && (
                            <a
                              href={`/fleteros/ordenes-de-pago?fleteroId=${data.fletero.id}`}
                              className="text-xs text-primary hover:underline whitespace-nowrap"
                            >
                              Ir a Órdenes de Pago →
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Totales al pie */}
          <div className="grid grid-cols-3 gap-4">
            <div className="border rounded p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total emitido</p>
              <p className="text-xl font-bold mt-1">{formatearMoneda(data.totalEmitido)}</p>
            </div>
            <div className="border rounded p-4 text-center">
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Total pagado</p>
              <p className="text-xl font-bold mt-1 text-green-700">{formatearMoneda(data.totalPagado)}</p>
            </div>
            <div className={`border rounded p-4 text-center ${data.saldoPendiente > 0 ? "border-red-200 bg-red-50" : ""}`}>
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Saldo pendiente</p>
              <p className={`text-xl font-bold mt-1 ${data.saldoPendiente > 0 ? "text-red-600" : "text-muted-foreground"}`}>
                {formatearMoneda(data.saldoPendiente)}
              </p>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
