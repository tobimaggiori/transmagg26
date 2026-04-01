/**
 * Propósito: Página del Libro IVA (ruta /contabilidad/iva).
 * Muestra cuatro tabs — IVA Ventas, IVA Compras, Ventas por Alícuota, Compras por Alícuota —
 * con formato de libro contable real, resumen en cards y botones de exportación PDF y Excel por tab.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import type { Rol } from "@/types"

function construirWherePeriodo({
  mes,
  anio,
  desde,
  hasta,
}: {
  mes?: string
  anio?: string
  desde?: string
  hasta?: string
}): Record<string, unknown> {
  if (mes && anio) {
    const m = String(mes).padStart(2, "0")
    return { periodo: `${anio}-${m}` }
  }
  if (desde || hasta) {
    const where: Record<string, string> = {}
    if (desde) where.gte = desde.slice(0, 7)
    if (hasta) where.lte = hasta.slice(0, 7)
    return { periodo: where }
  }
  return {}
}

type TabActivo = "ventas" | "compras" | "ventas-alicuota" | "compras-alicuota"

function parseTab(tab?: string): TabActivo {
  if (tab === "compras") return "compras"
  if (tab === "ventas-alicuota") return "ventas-alicuota"
  if (tab === "compras-alicuota") return "compras-alicuota"
  return "ventas"
}

/**
 * ContabilidadIvaPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los parámetros de período y tab activo, renderiza el Libro IVA con
 * cuatro tabs en formato de libro contable con exportación PDF y Excel.
 * Existe para reemplazar la vista simple de asientos de IVA.
 */
export default async function ContabilidadIvaPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string; tab?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "iva")) redirect("/dashboard")

  const tabActivo = parseTab(searchParams.tab)
  const whereExtra = construirWherePeriodo(searchParams)

  const asientos = await prisma.asientoIva.findMany({
    where: whereExtra,
    include: {
      facturaEmitida: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          emitidaEn: true,
          empresa: { select: { razonSocial: true, cuit: true } },
        },
      },
      facturaProveedor: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          fechaCbte: true,
          proveedor: { select: { razonSocial: true, cuit: true } },
        },
      },
      liquidacion: {
        select: {
          nroComprobante: true,
          ptoVenta: true,
          grabadaEn: true,
          fletero: { select: { razonSocial: true, cuit: true } },
        },
      },
    },
    orderBy: [{ periodo: "asc" }],
    take: 2000,
  })

  const ventas = asientos.filter((a) => a.tipo === "VENTA")
  const compras = asientos.filter((a) => a.tipo === "COMPRA")

  const totalNetoVentas = ventas.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaVentas = ventas.reduce((acc, a) => acc + a.montoIva, 0)
  const totalNetoCompras = compras.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaCompras = compras.reduce((acc, a) => acc + a.montoIva, 0)
  const posicionIva = totalIvaVentas - totalIvaCompras

  // Grouping for compras-alicuota: tipoCbte → alicuota
  const comprasAlicuotaMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
  for (const a of compras) {
    const tipoCbte = a.tipoReferencia === "LIQUIDACION"
      ? "Cta Vta Liq Prod"
      : (a.facturaProveedor?.tipoCbte ?? "—")
    if (!comprasAlicuotaMap.has(tipoCbte)) comprasAlicuotaMap.set(tipoCbte, new Map())
    const byAlicuota = comprasAlicuotaMap.get(tipoCbte)!
    const prev = byAlicuota.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
    byAlicuota.set(a.alicuota, { neto: prev.neto + a.baseImponible, iva: prev.iva + a.montoIva, count: prev.count + 1 })
  }
  const comprasAlicuota = Array.from(comprasAlicuotaMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Grouping for ventas-alicuota: tipoCbte → alicuota
  const ventasAlicuotaMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
  for (const a of ventas) {
    const tipoCbte = a.tipoReferencia === "LIQUIDACION" ? "Cta Vta Liq Prod" : (a.facturaEmitida?.tipoCbte ?? "—")
    if (!ventasAlicuotaMap.has(tipoCbte)) ventasAlicuotaMap.set(tipoCbte, new Map())
    const byAlicuota = ventasAlicuotaMap.get(tipoCbte)!
    const prev = byAlicuota.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
    byAlicuota.set(a.alicuota, { neto: prev.neto + a.baseImponible, iva: prev.iva + a.montoIva, count: prev.count + 1 })
  }
  const ventasAlicuota = Array.from(ventasAlicuotaMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Build export params preserving current filter
  const exportParams = new URLSearchParams()
  if (searchParams.mes) exportParams.set("mes", searchParams.mes)
  if (searchParams.anio) exportParams.set("anio", searchParams.anio)
  if (searchParams.desde) exportParams.set("desde", searchParams.desde)
  if (searchParams.hasta) exportParams.set("hasta", searchParams.hasta)
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  function tabUrl(tab: TabActivo) {
    const p = new URLSearchParams(exportParams)
    p.set("tab", tab)
    return `/contabilidad/iva?${p.toString()}`
  }

  const tabs: { key: TabActivo; label: string; count: number }[] = [
    { key: "ventas", label: "IVA Ventas", count: ventas.length },
    { key: "compras", label: "IVA Compras", count: compras.length },
    { key: "ventas-alicuota", label: "Ventas por Alícuota", count: ventas.length },
    { key: "compras-alicuota", label: "Compras por Alícuota", count: compras.length },
  ]

  // Export endpoint per tab
  const exportEndpointMap: Record<TabActivo, string> = {
    "ventas": "iva-ventas",
    "compras": "iva-compras",
    "ventas-alicuota": "iva-ventas-alicuota",
    "compras-alicuota": "iva-compras-alicuota",
  }
  const exportEndpoint = exportEndpointMap[tabActivo]

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Libro IVA</h2>
        <p className="text-muted-foreground">Libro de IVA Ventas e IVA Compras — Transmagg</p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/iva"
        extraParams={{ tab: tabActivo }}
        mes={searchParams.mes}
        anio={searchParams.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalIvaVentas)}</p>
            <p className="text-xs text-muted-foreground">{ventas.length} asiento(s) · Base: {formatearMoneda(totalNetoVentas)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalIvaCompras)}</p>
            <p className="text-xs text-muted-foreground">{compras.length} asiento(s) · Base: {formatearMoneda(totalNetoCompras)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Posición IVA</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${posicionIva >= 0 ? "text-destructive" : "text-green-600"}`}>
              {formatearMoneda(posicionIva)}
            </p>
            <p className="text-xs text-muted-foreground">{posicionIva >= 0 ? "Saldo deudor (a pagar)" : "Saldo acreedor (a favor)"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs nav */}
      <div className="border-b">
        <nav className="flex gap-0 -mb-px">
          {tabs.map((t) => (
            <a
              key={t.key}
              href={tabUrl(t.key)}
              className={`px-4 py-2.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                tabActivo === t.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground"
              }`}
            >
              {t.label} ({t.count})
            </a>
          ))}
        </nav>
      </div>

      {/* Botones exportación */}
      <div className="flex gap-2">
        <a
          href={`/api/contabilidad/${exportEndpoint}/pdf${exportQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
        >
          Descargar PDF
        </a>
        <a
          href={`/api/contabilidad/${exportEndpoint}/excel${exportQuery}`}
          download
          className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
        >
          Exportar Excel
        </a>
      </div>

      {/* Tabla IVA Ventas */}
      {tabActivo === "ventas" && (
        <div className="border rounded-lg overflow-hidden">
          {ventas.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Sin asientos de IVA Ventas para el período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Fecha</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Empresa</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Comprobante</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">IVA</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">CUIT</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((a) => {
                    const esLP = a.tipoReferencia === "LIQUIDACION"
                    const fecha = esLP ? a.liquidacion?.grabadaEn : a.facturaEmitida?.emitidaEn
                    const empresa = esLP
                      ? (a.liquidacion?.fletero.razonSocial ?? "—")
                      : (a.facturaEmitida?.empresa.razonSocial ?? "—")
                    const cbte = esLP
                      ? (a.liquidacion?.ptoVenta != null && a.liquidacion?.nroComprobante != null
                          ? `LP ${String(a.liquidacion.ptoVenta).padStart(4, "0")}-${String(a.liquidacion.nroComprobante).padStart(8, "0")}`
                          : "LP s/n")
                      : (a.facturaEmitida
                          ? `${a.facturaEmitida.tipoCbte} ${a.facturaEmitida.nroComprobante ?? "s/n"}`
                          : "—")
                    const cuit = esLP ? a.liquidacion?.fletero.cuit : a.facturaEmitida?.empresa.cuit
                    return (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {fecha ? formatearFecha(fecha) : a.periodo}
                        </td>
                        <td className="px-3 py-2 font-medium">{empresa}</td>
                        <td className="px-3 py-2 font-mono text-xs">{cbte}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(a.baseImponible)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatearMoneda(a.montoIva)}
                          <span className="text-xs text-muted-foreground ml-1">({a.alicuota}%)</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {cuit ? formatearCuit(cuit) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={3} className="px-3 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                      Totales del período
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalNetoVentas)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalIvaVentas)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabla IVA Compras */}
      {tabActivo === "compras" && (
        <div className="border rounded-lg overflow-hidden">
          {compras.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">
              Sin asientos de IVA Compras para el período seleccionado.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Fecha</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Proveedor / Fletero</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Comprobante</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">IVA</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">CUIT</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((a) => {
                    const fecha = a.facturaProveedor?.fechaCbte
                    const proveedor = a.facturaProveedor?.proveedor.razonSocial ?? "—"
                    const cbte = a.facturaProveedor
                      ? `${a.facturaProveedor.tipoCbte} ${a.facturaProveedor.nroComprobante}`
                      : "—"
                    const cuit = a.facturaProveedor?.proveedor.cuit
                    return (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {fecha ? formatearFecha(fecha) : a.periodo}
                        </td>
                        <td className="px-3 py-2 font-medium">{proveedor}</td>
                        <td className="px-3 py-2 font-mono text-xs">{cbte}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(a.baseImponible)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatearMoneda(a.montoIva)}
                          <span className="text-xs text-muted-foreground ml-1">({a.alicuota}%)</span>
                        </td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {cuit ? formatearCuit(cuit) : "—"}
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={3} className="px-3 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                      Totales del período
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalNetoCompras)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalIvaCompras)}</td>
                    <td />
                  </tr>
                </tfoot>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Tabla Ventas por Alícuota */}
      {tabActivo === "ventas-alicuota" && (
        <div className="space-y-4">
          {ventas.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
              Sin asientos de IVA Ventas para el período seleccionado.
            </div>
          ) : (
            ventasAlicuota.map(([tipoCbte, byAlicuota]) => {
              const filas = Array.from(byAlicuota.entries()).sort(([a], [b]) => a - b)
              const totalNeto = filas.reduce((acc, [, v]) => acc + v.neto, 0)
              const totalIva = filas.reduce((acc, [, v]) => acc + v.iva, 0)
              return (
                <div key={tipoCbte} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-semibold text-sm">
                    Tipo comprobante: {tipoCbte}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Alícuota</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Cant. asientos</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map(([alicuota, v]) => (
                        <tr key={alicuota} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2">{alicuota}%</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{v.count}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(v.neto)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(v.iva)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-semibold text-xs border-t">
                        <td colSpan={2} className="px-4 py-2 text-right text-muted-foreground uppercase tracking-wide">
                          Subtotal {tipoCbte}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(totalNeto)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(totalIva)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })
          )}
          {ventas.length > 0 && (
            <div className="border rounded-lg bg-muted px-4 py-3 flex justify-between font-semibold text-sm">
              <span>TOTAL GENERAL VENTAS</span>
              <span>{formatearMoneda(totalNetoVentas)} neto · {formatearMoneda(totalIvaVentas)} IVA</span>
            </div>
          )}
        </div>
      )}

      {/* Tabla Compras por Alícuota */}
      {tabActivo === "compras-alicuota" && (
        <div className="space-y-4">
          {compras.length === 0 ? (
            <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
              Sin asientos de IVA Compras para el período seleccionado.
            </div>
          ) : (
            comprasAlicuota.map(([tipoCbte, byAlicuota]) => {
              const filas = Array.from(byAlicuota.entries()).sort(([a], [b]) => a - b)
              const totalNeto = filas.reduce((acc, [, v]) => acc + v.neto, 0)
              const totalIva = filas.reduce((acc, [, v]) => acc + v.iva, 0)
              return (
                <div key={tipoCbte} className="border rounded-lg overflow-hidden">
                  <div className="bg-muted px-4 py-2 font-semibold text-sm">
                    Tipo comprobante: {tipoCbte}
                  </div>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b bg-muted/20">
                        <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Alícuota</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Cant. asientos</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                        <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">IVA</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filas.map(([alicuota, v]) => (
                        <tr key={alicuota} className="border-b hover:bg-muted/20">
                          <td className="px-4 py-2">{alicuota}%</td>
                          <td className="px-4 py-2 text-right text-muted-foreground">{v.count}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(v.neto)}</td>
                          <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(v.iva)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-muted/30 font-semibold text-xs border-t">
                        <td colSpan={2} className="px-4 py-2 text-right text-muted-foreground uppercase tracking-wide">
                          Subtotal {tipoCbte}
                        </td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(totalNeto)}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(totalIva)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )
            })
          )}
          {compras.length > 0 && (
            <div className="border rounded-lg bg-muted px-4 py-3 flex justify-between font-semibold text-sm">
              <span>TOTAL GENERAL COMPRAS</span>
              <span>{formatearMoneda(totalNetoCompras)} neto · {formatearMoneda(totalIvaCompras)} IVA</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
