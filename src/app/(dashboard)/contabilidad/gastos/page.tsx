/**
 * Propósito: Página de Detalle de Gastos por Concepto (ruta /contabilidad/gastos).
 * Muestra facturas de proveedores agrupadas por rubro/concepto y liquidaciones
 * emitidas bajo "VIAJES CONTRATADOS", con totales por rubro y total general.
 * Permite exportar a PDF y Excel.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { sumarImportes } from "@/lib/money"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import type { Rol } from "@/types"

function periodoFilter(searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }) {
  const { mes, anio, desde, hasta } = searchParams
  if (mes && anio) {
    const inicio = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const fin = new Date(inicio)
    fin.setMonth(fin.getMonth() + 1)
    return { desde: inicio, hasta: fin }
  }
  if (desde || hasta) {
    return {
      desde: desde ? new Date(`${desde}T00:00:00.000Z`) : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59.999Z`) : undefined,
    }
  }
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde: inicio, hasta: fin }
}

/**
 * ContabilidadGastosPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los parámetros de período, renderiza el detalle de gastos agrupado por concepto.
 * Existe para proveer visibilidad de gastos por rubro para el período seleccionado.
 */
export default async function ContabilidadGastosPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "contabilidad.reportes"))) redirect("/dashboard")

  const { desde, hasta } = periodoFilter(searchParams)

  const [facturas, liquidaciones] = await Promise.all([
    prisma.facturaProveedor.findMany({
      where: {
        fechaCbte: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { proveedor: { select: { razonSocial: true } } },
      orderBy: { fechaCbte: "asc" },
    }),
    prisma.liquidacion.findMany({
      where: {
        estado: "EMITIDA",
        grabadaEn: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { fletero: { select: { razonSocial: true } } },
      orderBy: { grabadaEn: "asc" },
    }),
  ])

  type Item = { descripcion: string; monto: number; fecha: Date | null }
  const rubrosMap = new Map<string, Item[]>()

  for (const f of facturas) {
    const rubro = f.concepto ?? "SIN CLASIFICAR"
    if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
    rubrosMap.get(rubro)!.push({
      descripcion: `${f.proveedor.razonSocial} — ${f.tipoCbte} ${f.nroComprobante}`,
      monto: f.total,
      fecha: f.fechaCbte,
    })
  }

  for (const liq of liquidaciones) {
    const rubro = "VIAJES CONTRATADOS"
    if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
    rubrosMap.get(rubro)!.push({
      descripcion: `Liquidación ${liq.nroComprobante ? String(liq.nroComprobante).padStart(8, "0") : "s/n"} — ${liq.fletero.razonSocial}`,
      monto: liq.total,
      fecha: liq.grabadaEn,
    })
  }

  const rubros = Array.from(rubrosMap.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([nombre, items]) => ({
      nombre,
      items,
      total: sumarImportes(items.map(i => i.monto)),
    }))

  const totalGeneral = sumarImportes(rubros.map(r => r.total))
  const totalItems = facturas.length + liquidaciones.length

  const exportParams = new URLSearchParams()
  if (searchParams.mes) exportParams.set("mes", searchParams.mes)
  if (searchParams.anio) exportParams.set("anio", searchParams.anio)
  if (searchParams.desde) exportParams.set("desde", searchParams.desde)
  if (searchParams.hasta) exportParams.set("hasta", searchParams.hasta)
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Detalle de Gastos</h2>
        <p className="text-muted-foreground">Gastos por concepto — Facturas proveedor y liquidaciones emitidas</p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/gastos"
        mes={searchParams.mes}
        anio={searchParams.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* Cards resumen */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Gastos</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalGeneral)}</p>
            <p className="text-xs text-muted-foreground">{totalItems} ítem(s) · {rubros.length} rubro(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Facturas Proveedor</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(sumarImportes(facturas.map(f => f.total)))}</p>
            <p className="text-xs text-muted-foreground">{facturas.length} factura(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Liquidaciones (Viajes)</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(sumarImportes(liquidaciones.map(l => l.total)))}</p>
            <p className="text-xs text-muted-foreground">{liquidaciones.length} liquidación(es) emitidas</p>
          </CardContent>
        </Card>
      </div>

      {/* Botones exportación */}
      <div className="flex gap-2">
        <a
          href={`/api/contabilidad/gastos/pdf${exportQuery}`}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
        >
          Ver PDF
        </a>
        <a
          href={`/api/contabilidad/gastos/excel${exportQuery}`}
          download
          className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
        >
          Exportar Excel
        </a>
      </div>

      {/* Tabla por rubros */}
      {rubros.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
          Sin gastos para el período seleccionado.
        </div>
      ) : (
        <div className="space-y-4">
          {rubros.map((r) => (
            <div key={r.nombre} className="border rounded-lg overflow-hidden">
              <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
                <span className="font-semibold text-sm">{r.nombre.replace(/_/g, " ")}</span>
                <span className="font-semibold text-sm">{formatearMoneda(r.total)}</span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/20">
                      <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Fecha</th>
                      <th className="px-4 py-2 text-left font-medium text-xs text-muted-foreground">Descripción</th>
                      <th className="px-4 py-2 text-right font-medium text-xs text-muted-foreground">Monto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {r.items.map((item, idx) => (
                      <tr key={idx} className="border-b hover:bg-muted/20">
                        <td className="px-4 py-2 text-muted-foreground whitespace-nowrap">
                          {item.fecha ? formatearFecha(item.fecha) : "—"}
                        </td>
                        <td className="px-4 py-2">{item.descripcion}</td>
                        <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(item.monto)}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted/30 font-semibold border-t">
                      <td colSpan={2} className="px-4 py-2 text-right text-xs text-muted-foreground uppercase tracking-wide">
                        Total {r.nombre.replace(/_/g, " ")}
                      </td>
                      <td className="px-4 py-2 text-right tabular-nums">{formatearMoneda(r.total)}</td>
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
