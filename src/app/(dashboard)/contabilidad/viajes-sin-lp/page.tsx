/**
 * Propósito: Página de Viajes Facturados sin LP (ruta /contabilidad/viajes-sin-lp).
 * Lista los viajes que tienen factura emitida pero no están en ninguna liquidación activa,
 * agrupados por provincia de origen.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearFecha } from "@/lib/utils"
import { sumarImportes, formatearMoneda } from "@/lib/money"
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

function labelTipoCbte(tipoCbte: number): string {
  const map: Record<number, string> = {
    1: "Factura A",
    6: "Factura B",
    201: "Factura A MiPyme",
  }
  return map[tipoCbte] ?? `Tipo ${tipoCbte}`
}

/**
 * ContabilidadViajesSinLpPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los parámetros de período, renderiza los viajes facturados sin liquidación
 * agrupados por provincia con totales.
 */
export default async function ContabilidadViajesSinLpPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "cuentas")) redirect("/dashboard")

  const { desde, hasta } = parsePeriodo(searchParams)

  const registros = await prisma.viajeEnFactura.findMany({
    where: {
      fechaViaje: { gte: desde, lt: hasta },
      factura: { estado: { notIn: ["ANULADA"] } },
      viaje: {
        enLiquidaciones: {
          none: { liquidacion: { estado: { notIn: ["ANULADA"] } } },
        },
      },
    },
    include: {
      viaje: { include: { empresa: { select: { razonSocial: true } } } },
      factura: { select: { nroComprobante: true, tipoCbte: true } },
    },
    orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
  })

  type Row = {
    fecha: Date
    empresa: string
    remito: string
    nroComp: string
    tipoComprobante: string
    subtotal: number
  }

  const provinciasMap = new Map<string, Row[]>()

  for (const r of registros) {
    const provincia = r.provinciaOrigen ?? "SIN PROVINCIA"
    if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
    provinciasMap.get(provincia)!.push({
      fecha: r.fechaViaje,
      empresa: r.viaje.empresa.razonSocial,
      remito: r.remito ?? "—",
      nroComp: r.factura.nroComprobante ?? "—",
      tipoComprobante: labelTipoCbte(r.factura.tipoCbte),
      subtotal: r.subtotal,
    })
  }

  const provincias = Array.from(provinciasMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, rows]) => ({
      nombre,
      rows,
      total: sumarImportes(rows.map(r => r.subtotal)),
    }))

  const totalGeneral = sumarImportes(provincias.map(p => p.total))

  const exportParams = new URLSearchParams()
  if (searchParams.mes) exportParams.set("mes", searchParams.mes)
  if (searchParams.anio) exportParams.set("anio", searchParams.anio)
  if (searchParams.desde) exportParams.set("desde", searchParams.desde)
  if (searchParams.hasta) exportParams.set("hasta", searchParams.hasta)
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Viajes Facturados sin LP</h2>
        <p className="text-muted-foreground">Viajes con factura emitida que no tienen Líquido Producto asociado</p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/viajes-sin-lp"
        mes={searchParams.mes}
        anio={searchParams.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viajes sin LP</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{registros.length}</p>
            <p className="text-xs text-muted-foreground">{provincias.length} provincia(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Facturado</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalGeneral)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Provincias afectadas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{provincias.length}</p>
            <p className="text-xs text-muted-foreground">{provincias.map((p) => p.nombre).join(", ")}</p>
          </CardContent>
        </Card>
      </div>

      {/* Exportación */}
      <div className="flex gap-2">
        <a
          href={`/api/contabilidad/viajes-sin-lp/pdf${exportQuery}`}
          target="_blank"
          rel="noopener noreferrer"
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
        >
          Descargar PDF
        </a>
        <a
          href={`/api/contabilidad/viajes-sin-lp/excel${exportQuery}`}
          download
          className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
        >
          Exportar Excel
        </a>
      </div>

      {/* Tabla por provincias */}
      {provincias.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
          Sin viajes facturados sin LP para el período seleccionado.
        </div>
      ) : (
        <div className="space-y-4">
          {provincias.map((p) => (
            <div key={p.nombre} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
                <span className="font-semibold text-sm">PROVINCIA: {p.nombre}</span>
                <span className="font-semibold text-sm">{formatearMoneda(p.total)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Empresa</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Remito</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">Nro Comp.</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Tipo</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">S.Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {p.rows.map((r, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {formatearFecha(r.fecha)}
                        </td>
                        <td className="px-3 py-2">{r.empresa}</td>
                        <td className="px-3 py-2 font-mono text-xs">{r.remito}</td>
                        <td className="px-3 py-2 text-right font-mono text-xs">{r.nroComp}</td>
                        <td className="px-3 py-2 text-xs text-muted-foreground">{r.tipoComprobante}</td>
                        <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(r.subtotal)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-semibold border-t-2">
                      <td colSpan={5} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase tracking-wide">
                        Total de la Provincia
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(p.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          <div className="border rounded-lg bg-muted px-4 py-3 flex justify-between font-semibold text-sm">
            <span>TOTAL GENERAL</span>
            <span>{formatearMoneda(totalGeneral)}</span>
          </div>
        </div>
      )}
    </div>
  )
}
