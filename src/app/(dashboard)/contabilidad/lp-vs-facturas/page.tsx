/**
 * Propósito: Página de comparación LP vs Facturas (ruta /contabilidad/lp-vs-facturas).
 * Para cada viaje que tiene tanto una liquidación como una factura emitida,
 * muestra el subtotal en cada documento y la diferencia, agrupado por provincia.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { formatearMoneda } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import type { Rol } from "@/types"

function parsePeriodo(searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }): { desde: Date; hasta: Date } {
  const { mes, anio, desde, hasta } = searchParams
  if (mes && anio) {
    const d = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const h = new Date(d)
    h.setMonth(h.getMonth() + 1)
    return { desde: d, hasta: h }
  }
  if (desde || hasta) {
    return {
      desde: desde ? new Date(`${desde}T00:00:00.000Z`) : new Date("2000-01-01"),
      hasta: hasta ? new Date(`${hasta}T23:59:59.999Z`) : new Date("2099-12-31"),
    }
  }
  const hoy = new Date()
  return {
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    hasta: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
  }
}

/**
 * ContabilidadLpVsFacturasPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los parámetros de período, renderiza la comparación LP vs Facturas
 * agrupada por provincia con diferencias y totales.
 */
export default async function ContabilidadLpVsFacturasPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.reportes"))) redirect("/dashboard")

  const { desde, hasta } = parsePeriodo(searchParams)

  const viajes = await prisma.viaje.findMany({
    where: {
      fechaViaje: { gte: desde, lt: hasta },
      enLiquidaciones: { some: {} },
      enFacturas: { some: {} },
    },
    include: {
      empresa: { select: { razonSocial: true } },
      enLiquidaciones: {
        include: { liquidacion: { select: { nroComprobante: true } } },
        orderBy: { liquidacion: { grabadaEn: "asc" } },
        take: 1,
      },
      enFacturas: {
        include: { factura: { select: { nroComprobante: true } } },
        orderBy: { factura: { emitidaEn: "asc" } },
        take: 1,
      },
    },
    orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
  })

  type Row = {
    remito: string
    nroLP: string
    netoLP: number
    nroFact: string
    netoFact: number
    diferencia: number
    empresa: string
    fecha: Date
  }

  const provinciasMap = new Map<string, Row[]>()

  for (const v of viajes) {
    const vel = v.enLiquidaciones[0]
    const vef = v.enFacturas[0]
    if (!vel || !vef) continue
    const provincia = v.provinciaOrigen ?? "SIN PROVINCIA"
    if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
    const netoLP = vel.subtotal
    const netoFact = vef.subtotal
    provinciasMap.get(provincia)!.push({
      remito: v.remito ?? "—",
      nroLP: vel.liquidacion.nroComprobante ? String(vel.liquidacion.nroComprobante) : "—",
      netoLP,
      nroFact: vef.factura.nroComprobante ?? "—",
      netoFact,
      diferencia: netoFact - netoLP,
      empresa: v.empresa.razonSocial,
      fecha: v.fechaViaje,
    })
  }

  const provincias = Array.from(provinciasMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, rows]) => ({
      nombre,
      rows,
      totalNetoLP: sumarImportes(rows.map(r => r.netoLP)),
      totalNetoFact: sumarImportes(rows.map(r => r.netoFact)),
      totalDiferencia: sumarImportes(rows.map(r => r.diferencia)),
    }))

  const totalNetoLP = sumarImportes(provincias.map(p => p.totalNetoLP))
  const totalNetoFact = sumarImportes(provincias.map(p => p.totalNetoFact))
  const totalDiferencia = sumarImportes(provincias.map(p => p.totalDiferencia))
  const totalViajes = viajes.filter((v) => v.enLiquidaciones[0] && v.enFacturas[0]).length

  const exportParams = new URLSearchParams()
  if (searchParams.mes) exportParams.set("mes", searchParams.mes)
  if (searchParams.anio) exportParams.set("anio", searchParams.anio)
  if (searchParams.desde) exportParams.set("desde", searchParams.desde)
  if (searchParams.hasta) exportParams.set("hasta", searchParams.hasta)
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Conciliación de Viajes</h2>
        <p className="text-muted-foreground">Comparación de subtotales por viaje entre liquidaciones y facturas emitidas</p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/lp-vs-facturas"
        mes={searchParams.mes}
        anio={searchParams.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes comparados</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{totalViajes}</p>
            <p className="text-xs text-muted-foreground">{provincias.length} provincia(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Neto LP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalNetoLP)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Neto Fact</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalNetoFact)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Diferencia Total</CardTitle>
          </CardHeader>
          <CardContent>
            <p className={`text-2xl font-bold ${totalDiferencia !== 0 ? "text-destructive" : ""}`}>
              {formatearMoneda(totalDiferencia)}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Exportación */}
      <div className="flex gap-2">
        <a
          href={`/api/contabilidad/lp-vs-facturas/pdf${exportQuery}`}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
        >
          Ver PDF
        </a>
        <a
          href={`/api/contabilidad/lp-vs-facturas/excel${exportQuery}`}
          download
          className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
        >
          Exportar Excel
        </a>
      </div>

      {/* Tabla por provincias */}
      {provincias.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
          Sin viajes con liquidación y factura para el período seleccionado.
        </div>
      ) : (
        <div className="space-y-4">
          {provincias.map((p) => (
            <div key={p.nombre} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2.5 font-semibold text-sm">
                PROVINCIA: {p.nombre}
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Remito</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Nro LP</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Neto LP</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Nro Fact</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Neto Fact</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Diferencia</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Empresa</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2 font-mono text-xs">{r.remito}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{r.nroLP}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(r.netoLP)}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{r.nroFact}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(r.netoFact)}</td>
                        <td className={`px-3 py-2 text-right tabular-nums font-medium ${r.diferencia !== 0 ? "text-destructive" : ""}`}>
                          {formatearMoneda(r.diferencia)}
                        </td>
                        <td className="px-3 py-2 text-sm">{r.empresa}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-semibold border-t-2">
                      <td colSpan={2} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase tracking-wide">
                        Total Provincia
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(p.totalNetoLP)}</td>
                      <td />
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(p.totalNetoFact)}</td>
                      <td className={`px-3 py-2 text-right tabular-nums ${p.totalDiferencia !== 0 ? "text-destructive" : ""}`}>
                        {formatearMoneda(p.totalDiferencia)}
                      </td>
                      <td />
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          <div className="border rounded-lg bg-muted px-4 py-3 flex flex-wrap gap-6 font-semibold text-sm">
            <span>TOTAL GENERAL</span>
            <span className="text-muted-foreground font-normal">LP: <span className="font-semibold text-foreground">{formatearMoneda(totalNetoLP)}</span></span>
            <span className="text-muted-foreground font-normal">Fact: <span className="font-semibold text-foreground">{formatearMoneda(totalNetoFact)}</span></span>
            <span className="text-muted-foreground font-normal">Diferencia: <span className={`font-semibold ${totalDiferencia !== 0 ? "text-destructive" : "text-foreground"}`}>{formatearMoneda(totalDiferencia)}</span></span>
          </div>
        </div>
      )}
    </div>
  )
}
