/**
 * Propósito: Página del Libro IVA (ruta /contabilidad/iva).
 * Muestra cuatro tabs — IVA Ventas, IVA Compras, Ventas por Alícuota, Compras por Alícuota —
 * con formato de libro contable real, resumen en cards y botones de exportación PDF y Excel por tab.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { formatearMoneda, formatearFecha, formatearCuit } from "@/lib/utils"
import { sumarImportes, restarImportes } from "@/lib/money"
import { etiquetaComprobanteArca } from "@/lib/iva-portal/codigos-arca"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import { PortalIvaShell } from "./_components/portal-iva-shell"
// LibroIvaGeneracion removed — data is shown inline, export buttons handle PDF
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
  if (!(await tienePermiso(session.user.id, rol, "iva"))) redirect("/dashboard")

  const tabActivo = parseTab(searchParams.tab)
  const whereExtra = construirWherePeriodo(searchParams)

  const asientos = await prisma.asientoIva.findMany({
    where: whereExtra,
    include: {
      facturaEmitida: {
        select: {
          nroComprobante: true,
          tipoCbte: true,
          ptoVenta: true,
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
      notaCreditoDebito: {
        select: {
          tipo: true,
          tipoCbte: true,
          ptoVenta: true,
          nroComprobante: true,
          nroComprobanteExterno: true,
          fechaComprobanteExterno: true,
          emisorExterno: true,
          creadoEn: true,
          factura: {
            select: { empresa: { select: { razonSocial: true, cuit: true } } },
          },
          facturaProveedor: {
            select: { proveedor: { select: { razonSocial: true, cuit: true } } },
          },
        },
      },
      facturaSeguro: {
        select: {
          nroComprobante: true,
          tipoComprobante: true,
          fecha: true,
          aseguradora: { select: { razonSocial: true, cuit: true } },
        },
      },
    },
    orderBy: [{ periodo: "asc" }],
    take: 2000,
  })

  const ventas = asientos.filter((a) => a.tipo === "VENTA")
  const compras = asientos.filter((a) => a.tipo === "COMPRA")

  type Asiento = (typeof asientos)[number]

  function formatNumeroFiscal(pto: number | null | undefined, nro: number | string | null | undefined): string {
    const ptoStr = pto != null ? String(pto).padStart(4, "0") : "----"
    const nroStr = nro != null && nro !== "" ? String(nro).padStart(8, "0") : "s/n"
    return `${ptoStr}-${nroStr}`
  }

  type DatosAsiento = { fecha: Date | null; empresa: string; tipoCbte: string; nroCbte: string; cuit: string | null }

  function datosAsientoVenta(a: Asiento): DatosAsiento {
    if (a.tipoReferencia === "LIQUIDACION" && a.liquidacion) {
      return {
        fecha: a.liquidacion.grabadaEn,
        empresa: a.liquidacion.fletero.razonSocial,
        tipoCbte: "Cta. Vta. y Líq. Producto",
        nroCbte: formatNumeroFiscal(a.liquidacion.ptoVenta, a.liquidacion.nroComprobante),
        cuit: a.liquidacion.fletero.cuit,
      }
    }
    if (a.tipoReferencia === "FACTURA_EMITIDA" && a.facturaEmitida) {
      return {
        fecha: a.facturaEmitida.emitidaEn,
        empresa: a.facturaEmitida.empresa.razonSocial,
        tipoCbte: etiquetaComprobanteArca(a.facturaEmitida.tipoCbte),
        nroCbte: a.facturaEmitida.nroComprobante ?? "s/n",
        cuit: a.facturaEmitida.empresa.cuit,
      }
    }
    if ((a.tipoReferencia === "NC_EMITIDA" || a.tipoReferencia === "ND_EMITIDA") && a.notaCreditoDebito) {
      const n = a.notaCreditoDebito
      const empresa = n.factura?.empresa.razonSocial ?? n.emisorExterno ?? "—"
      const cuit = n.factura?.empresa.cuit ?? null
      const tipoLabel = n.tipoCbte != null
        ? etiquetaComprobanteArca(n.tipoCbte)
        : (a.tipoReferencia === "NC_EMITIDA" ? "Nota de Crédito" : "Nota de Débito")
      const numero = n.nroComprobante != null ? formatNumeroFiscal(n.ptoVenta, n.nroComprobante) : "s/n"
      return { fecha: n.creadoEn, empresa, tipoCbte: tipoLabel, nroCbte: numero, cuit }
    }
    return { fecha: null, empresa: "—", tipoCbte: "—", nroCbte: "—", cuit: null }
  }

  function datosAsientoCompra(a: Asiento): DatosAsiento {
    if (a.facturaProveedor) {
      return {
        fecha: a.facturaProveedor.fechaCbte,
        empresa: a.facturaProveedor.proveedor.razonSocial,
        tipoCbte: `Factura ${a.facturaProveedor.tipoCbte}`,
        nroCbte: a.facturaProveedor.nroComprobante,
        cuit: a.facturaProveedor.proveedor.cuit,
      }
    }
    if (a.tipoReferencia === "FACTURA_SEGURO" && a.facturaSeguro) {
      return {
        fecha: a.facturaSeguro.fecha,
        empresa: a.facturaSeguro.aseguradora.razonSocial,
        tipoCbte: `Factura ${a.facturaSeguro.tipoComprobante}`,
        nroCbte: a.facturaSeguro.nroComprobante,
        cuit: a.facturaSeguro.aseguradora.cuit,
      }
    }
    if ((a.tipoReferencia === "NC_RECIBIDA" || a.tipoReferencia === "ND_RECIBIDA") && a.notaCreditoDebito) {
      const n = a.notaCreditoDebito
      const empresa = n.facturaProveedor?.proveedor.razonSocial ?? n.emisorExterno ?? "—"
      const cuit = n.facturaProveedor?.proveedor.cuit ?? null
      const tipoLabel = n.tipoCbte != null
        ? etiquetaComprobanteArca(n.tipoCbte)
        : (a.tipoReferencia === "NC_RECIBIDA" ? "Nota de Crédito" : "Nota de Débito")
      const numero = n.nroComprobanteExterno
        ?? (n.nroComprobante != null ? formatNumeroFiscal(n.ptoVenta, n.nroComprobante) : "s/n")
      const fecha = n.fechaComprobanteExterno ?? n.creadoEn
      return { fecha, empresa, tipoCbte: tipoLabel, nroCbte: numero, cuit }
    }
    return { fecha: null, empresa: "—", tipoCbte: "—", nroCbte: "—", cuit: null }
  }

  const totalNetoVentas = sumarImportes(ventas.map(a => a.baseImponible))
  const totalIvaVentas = sumarImportes(ventas.map(a => a.montoIva))
  const totalNetoCompras = sumarImportes(compras.map(a => a.baseImponible))
  const totalIvaCompras = sumarImportes(compras.map(a => a.montoIva))
  const posicionIva = restarImportes(totalIvaVentas, totalIvaCompras)

  function etiquetaTipoCbteCompra(a: Asiento): string {
    if (a.facturaProveedor) return `Factura ${a.facturaProveedor.tipoCbte}`
    if (a.tipoReferencia === "FACTURA_SEGURO" && a.facturaSeguro) return `Factura Seguro ${a.facturaSeguro.tipoComprobante}`
    if ((a.tipoReferencia === "NC_RECIBIDA" || a.tipoReferencia === "ND_RECIBIDA") && a.notaCreditoDebito?.tipoCbte != null) {
      return etiquetaComprobanteArca(a.notaCreditoDebito.tipoCbte)
    }
    if (a.tipoReferencia === "NC_RECIBIDA") return "Nota de Crédito recibida"
    if (a.tipoReferencia === "ND_RECIBIDA") return "Nota de Débito recibida"
    return "—"
  }

  function etiquetaTipoCbteVenta(a: Asiento): string {
    if (a.tipoReferencia === "LIQUIDACION") return "Cta. Vta. y Líq. Producto"
    if (a.facturaEmitida) return etiquetaComprobanteArca(a.facturaEmitida.tipoCbte)
    if ((a.tipoReferencia === "NC_EMITIDA" || a.tipoReferencia === "ND_EMITIDA") && a.notaCreditoDebito?.tipoCbte != null) {
      return etiquetaComprobanteArca(a.notaCreditoDebito.tipoCbte)
    }
    if (a.tipoReferencia === "NC_EMITIDA") return "Nota de Crédito emitida"
    if (a.tipoReferencia === "ND_EMITIDA") return "Nota de Débito emitida"
    return "—"
  }

  // Grouping for compras-alicuota: tipoCbte → alicuota
  const comprasAlicuotaMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
  for (const a of compras) {
    const tipoCbte = etiquetaTipoCbteCompra(a)
    if (!comprasAlicuotaMap.has(tipoCbte)) comprasAlicuotaMap.set(tipoCbte, new Map())
    const byAlicuota = comprasAlicuotaMap.get(tipoCbte)!
    const prev = byAlicuota.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
    byAlicuota.set(a.alicuota, { neto: sumarImportes([prev.neto, a.baseImponible]), iva: sumarImportes([prev.iva, a.montoIva]), count: prev.count + 1 })
  }
  const comprasAlicuota = Array.from(comprasAlicuotaMap.entries()).sort(([a], [b]) => a.localeCompare(b))

  // Grouping for ventas-alicuota: tipoCbte → alicuota
  const ventasAlicuotaMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
  for (const a of ventas) {
    const tipoCbte = etiquetaTipoCbteVenta(a)
    if (!ventasAlicuotaMap.has(tipoCbte)) ventasAlicuotaMap.set(tipoCbte, new Map())
    const byAlicuota = ventasAlicuotaMap.get(tipoCbte)!
    const prev = byAlicuota.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
    byAlicuota.set(a.alicuota, { neto: sumarImportes([prev.neto, a.baseImponible]), iva: sumarImportes([prev.iva, a.montoIva]), count: prev.count + 1 })
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
      <h2 className="text-2xl font-bold tracking-tight">Libro de IVA Trans-Magg S.R.L.</h2>

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

      {/* Portal IVA / LID ARCA — gestión de período, ajustes y exportaciones TXT */}
      <PortalIvaShell mesAnioInicial={
        searchParams.mes && searchParams.anio
          ? `${searchParams.anio}-${String(searchParams.mes).padStart(2, "0")}`
          : new Date().toISOString().slice(0, 7)
      } />

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
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">CUIT</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Tipo cbte.</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Número</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {ventas.map((a) => {
                    const d = datosAsientoVenta(a)
                    return (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {d.fecha ? formatearFecha(d.fecha) : a.periodo}
                        </td>
                        <td className="px-3 py-2 font-medium">{d.empresa}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {d.cuit ? formatearCuit(d.cuit) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">{d.tipoCbte}</td>
                        <td className="px-3 py-2 font-mono text-xs">{d.nroCbte}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(a.baseImponible)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatearMoneda(a.montoIva)}
                          <span className="text-xs text-muted-foreground ml-1">({a.alicuota}%)</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={5} className="px-3 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                      Totales del período
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalNetoVentas)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalIvaVentas)}</td>
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
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Proveedor</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">CUIT</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Tipo cbte.</th>
                    <th className="px-3 py-3 text-left font-medium text-xs text-muted-foreground">Número</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">Neto Gravado</th>
                    <th className="px-3 py-3 text-right font-medium text-xs text-muted-foreground">IVA</th>
                  </tr>
                </thead>
                <tbody>
                  {compras.map((a) => {
                    const d = datosAsientoCompra(a)
                    return (
                      <tr key={a.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {d.fecha ? formatearFecha(d.fecha) : a.periodo}
                        </td>
                        <td className="px-3 py-2 font-medium">{d.empresa}</td>
                        <td className="px-3 py-2 font-mono text-xs text-muted-foreground">
                          {d.cuit ? formatearCuit(d.cuit) : "—"}
                        </td>
                        <td className="px-3 py-2 text-xs">{d.tipoCbte}</td>
                        <td className="px-3 py-2 font-mono text-xs">{d.nroCbte}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(a.baseImponible)}</td>
                        <td className="px-3 py-2 text-right tabular-nums">
                          {formatearMoneda(a.montoIva)}
                          <span className="text-xs text-muted-foreground ml-1">({a.alicuota}%)</span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t-2">
                    <td colSpan={5} className="px-3 py-3 text-right text-xs text-muted-foreground uppercase tracking-wide">
                      Totales del período
                    </td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalNetoCompras)}</td>
                    <td className="px-3 py-3 text-right tabular-nums">{formatearMoneda(totalIvaCompras)}</td>
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
              const totalNeto = sumarImportes(filas.map(([, v]) => v.neto))
              const totalIva = sumarImportes(filas.map(([, v]) => v.iva))
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
              const totalNeto = sumarImportes(filas.map(([, v]) => v.neto))
              const totalIva = sumarImportes(filas.map(([, v]) => v.iva))
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
