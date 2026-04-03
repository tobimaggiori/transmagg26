/**
 * Propósito: Página de IIBB (ruta /contabilidad/iibb).
 * Muestra el reporte "Listado de Viajes por Provincia" con filtro de período,
 * tabla agrupada por provincia con subtotales y exportación PDF y Excel.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import { LibroIibbClient } from "./libro-iibb-client"
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

/**
 * ContabilidadIibbPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Dado los parámetros de período, consulta los asientos de IIBB con detalle
 * de viaje y los muestra agrupados por provincia con subtotales.
 * Existe para generar el reporte de IIBB por provincia requerido para la declaración mensual.
 *
 * Ejemplos:
 * // ?mes=3&anio=2026 → viajes de marzo 2026 agrupados por provincia
 * <ContabilidadIibbPage searchParams={{ mes: "3", anio: "2026" }} />
 * // Sin filtro → mes actual
 * <ContabilidadIibbPage searchParams={{}} />
 */
export default async function ContabilidadIibbPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!puedeAcceder(rol, "iibb")) redirect("/dashboard")

  const hoy = new Date()
  const anioActual = hoy.getFullYear()
  const mesActual = hoy.getMonth() + 1

  // Default to current month if no filter provided
  const params = {
    mes: searchParams.mes ?? String(mesActual),
    anio: searchParams.anio ?? String(anioActual),
    desde: searchParams.desde,
    hasta: searchParams.hasta,
  }

  const whereExtra = construirWherePeriodo(params)

  const asientos = await prisma.asientoIibb.findMany({
    where: whereExtra,
    include: {
      viajeEnLiquidacion: {
        include: {
          viaje: { include: { empresa: { select: { razonSocial: true } } } },
        },
      },
      viajeEnFactura: {
        include: {
          factura: { include: { empresa: { select: { razonSocial: true } } } },
        },
      },
    },
    orderBy: [{ provincia: "asc" }, { periodo: "asc" }],
    take: 1000,
  })

  // Group by province
  type FilaViaje = {
    id: string
    fecha: Date | null
    empresa: string
    mercaderia: string
    procedencia: string
    subtotal: number
  }
  type GrupoProvincia = { provincia: string; filas: FilaViaje[]; total: number }

  const gruposMap = new Map<string, GrupoProvincia>()

  for (const a of asientos) {
    const vel = a.viajeEnLiquidacion
    const vef = a.viajeEnFactura

    const fecha = vef?.fechaViaje ?? vel?.fechaViaje ?? null
    const empresa =
      vef?.factura.empresa.razonSocial ??
      vel?.viaje.empresa.razonSocial ??
      "—"
    const mercaderia = vef?.mercaderia ?? vel?.mercaderia ?? "—"
    const procedencia = vef?.procedencia ?? vel?.procedencia ?? "—"

    if (!gruposMap.has(a.provincia)) {
      gruposMap.set(a.provincia, { provincia: a.provincia, filas: [], total: 0 })
    }
    const grupo = gruposMap.get(a.provincia)!
    grupo.filas.push({ id: a.id, fecha, empresa, mercaderia, procedencia, subtotal: a.montoIngreso })
    grupo.total += a.montoIngreso
  }

  const grupos = Array.from(gruposMap.values()).sort((a, b) =>
    a.provincia.localeCompare(b.provincia)
  )

  const totalGeneral = grupos.reduce((acc, g) => acc + g.total, 0)

  // Export params
  const exportParams = new URLSearchParams()
  if (params.mes) exportParams.set("mes", params.mes)
  if (params.anio) exportParams.set("anio", params.anio)
  if (params.desde) exportParams.set("desde", params.desde)
  if (params.hasta) exportParams.set("hasta", params.hasta)
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  const periodoLabel =
    searchParams.desde && searchParams.hasta
      ? `${searchParams.desde} al ${searchParams.hasta}`
      : `${String(params.mes).padStart(2, "0")}/${params.anio}`

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingresos Brutos (IIBB)</h2>
        <p className="text-muted-foreground">
          Listado de Viajes por Provincia — Período: {periodoLabel}
        </p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/iibb"
        mes={params.mes}
        anio={params.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* Card resumen */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-muted-foreground">Total base imponible IIBB</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-2xl font-bold">{formatearMoneda(totalGeneral)}</p>
          <p className="text-xs text-muted-foreground">
            {asientos.length} viaje(s) en {grupos.length} provincia(s) · {periodoLabel}
          </p>
        </CardContent>
      </Card>

      {/* Botones exportación */}
      {grupos.length > 0 && (
        <div className="flex gap-2">
          <a
            href={`/api/contabilidad/iibb/pdf${exportQuery}`}
            target="_blank"
            rel="noopener noreferrer"
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
          >
            Descargar PDF
          </a>
          <a
            href={`/api/contabilidad/iibb/excel${exportQuery}`}
            download
            className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
          >
            Exportar Excel
          </a>
        </div>
      )}

      {/* Tabla agrupada por provincia */}
      {grupos.length === 0 ? (
        <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
          Sin asientos de IIBB para el período seleccionado.
        </div>
      ) : (
        <div className="space-y-6">
          {grupos.map((grupo) => (
            <div key={grupo.provincia} className="border rounded-lg overflow-hidden">
              {/* Cabecera de provincia */}
              <div className="bg-muted px-4 py-2.5 flex items-center justify-between">
                <span className="font-semibold text-sm uppercase tracking-wide">
                  Provincia: {grupo.provincia}
                </span>
                <span className="text-sm font-medium">
                  {grupo.filas.length} viaje(s) — Subtotal: {formatearMoneda(grupo.total)}
                </span>
              </div>
              {/* Tabla de viajes de esta provincia */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-muted/30">
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Fecha</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Empresa</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Mercadería</th>
                      <th className="px-3 py-2 text-left font-medium text-xs text-muted-foreground">Procedencia</th>
                      <th className="px-3 py-2 text-right font-medium text-xs text-muted-foreground">SubTotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {grupo.filas.map((fila) => (
                      <tr key={fila.id} className="border-b hover:bg-muted/30">
                        <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                          {fila.fecha ? formatearFecha(fila.fecha) : "—"}
                        </td>
                        <td className="px-3 py-2">{fila.empresa}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fila.mercaderia}</td>
                        <td className="px-3 py-2 text-muted-foreground">{fila.procedencia}</td>
                        <td className="px-3 py-2 text-right tabular-nums font-medium">
                          {formatearMoneda(fila.subtotal)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-muted font-semibold border-t">
                      <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                        Total de la Provincia
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">{formatearMoneda(grupo.total)}</td>
                    </tr>
                  </tfoot>
                </table>
              </div>
            </div>
          ))}

          {/* Total general */}
          <div className="border rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
            <span className="font-bold text-sm uppercase tracking-wide">Total General</span>
            <span className="font-bold text-xl">{formatearMoneda(totalGeneral)}</span>
          </div>
        </div>
      )}

      {/* Separador visual */}
      <div className="border-t pt-6">
        <LibroIibbClient libros={[]} />
      </div>
    </div>
  )
}
