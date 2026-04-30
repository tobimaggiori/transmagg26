/**
 * Propósito: Página de libro de IVA de Transmagg.
 * Muestra asientos de IVA ventas y compras con filtros por período.
 * Incluye botón para descargar el libro IVA del período como PDF.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { tienePermiso } from "@/lib/permissions"
import { formatearMoneda } from "@/lib/utils"
import { sumarImportes, restarImportes } from "@/lib/money"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import type { Rol } from "@/types"

/**
 * construirWherePeriodo: ({ mes?, anio?, desde?, hasta? }) -> Record<string, unknown>
 *
 * Dado los params de filtro, construye el objeto where para filtrar por período (YYYY-MM).
 * Convierte fechas a formato de período para comparación con el campo `periodo` de AsientoIva.
 * Existe para centralizar la lógica de filtrado por período sin duplicarla en la página.
 *
 * Ejemplos:
 * construirWherePeriodo({ mes: "3", anio: "2026" }) === { periodo: "2026-03" }
 * construirWherePeriodo({ desde: "2026-01-01", hasta: "2026-03-31" }) === { periodo: { gte: "2026-01", lte: "2026-03" } }
 * construirWherePeriodo({}) === {}
 */
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
 * IvaPage: ({ searchParams }) -> Promise<JSX.Element>
 *
 * Muestra los asientos de IVA (ventas y compras) filtrados por período.
 * Filtros: por mes/año o por rango de fechas personalizado.
 * Botón "Descargar PDF" genera el libro IVA del período en formato imprimible.
 * Existe para el libro IVA del sistema con posición IVA calculada dinámicamente.
 *
 * Ejemplos:
 * // Sesión ADMIN_TRANSMAGG, ?mes=3&anio=2026 → asientos de marzo 2026
 * <IvaPage searchParams={{ mes: "3", anio: "2026" }} />
 * // ?desde=2026-01-01&hasta=2026-03-31 → asientos del trimestre
 * <IvaPage searchParams={{ desde: "2026-01-01", hasta: "2026-03-31" }} />
 * // Sin filtros → todos los asientos
 * <IvaPage searchParams={{}} />
 */
export default async function IvaPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  if (!(await tienePermiso(session.user.id, rol, "iva"))) redirect("/dashboard")

  const whereExtra = construirWherePeriodo(searchParams)

  const asientos = await prisma.asientoIva.findMany({
    where: whereExtra,
    include: {
      facturaEmitida: {
        select: {
          nroComprobante: true,
          empresa: { select: { razonSocial: true } },
        },
      },
      facturaProveedor: {
        select: {
          nroComprobante: true,
          proveedor: { select: { razonSocial: true } },
        },
      },
    },
    orderBy: [{ periodo: "desc" }, { tipo: "asc" }],
    take: 500,
  })

  const totalVentas = sumarImportes(asientos.filter((a) => a.tipo === "VENTA").map(a => a.montoIva))
  const totalCompras = sumarImportes(asientos.filter((a) => a.tipo === "COMPRA").map(a => a.montoIva))
  const posicionIva = restarImportes(totalVentas, totalCompras)

  // Construir URL del PDF con los mismos filtros
  const pdfParams = new URLSearchParams()
  if (searchParams.mes) pdfParams.set("mes", searchParams.mes)
  if (searchParams.anio) pdfParams.set("anio", searchParams.anio)
  if (searchParams.desde) pdfParams.set("desde", searchParams.desde)
  if (searchParams.hasta) pdfParams.set("hasta", searchParams.hasta)
  const pdfUrl = `/api/iva/pdf${pdfParams.toString() ? "?" + pdfParams.toString() : ""}`

  const anioActual = new Date().getFullYear()
  const anios = [anioActual - 1, anioActual, anioActual + 1]
  const meses = [
    { num: 1, nombre: "Enero" }, { num: 2, nombre: "Febrero" }, { num: 3, nombre: "Marzo" },
    { num: 4, nombre: "Abril" }, { num: 5, nombre: "Mayo" }, { num: 6, nombre: "Junio" },
    { num: 7, nombre: "Julio" }, { num: 8, nombre: "Agosto" }, { num: 9, nombre: "Septiembre" },
    { num: 10, nombre: "Octubre" }, { num: 11, nombre: "Noviembre" }, { num: 12, nombre: "Diciembre" },
  ]

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">IVA</h2>
          <p className="text-muted-foreground">Libro de asientos de IVA — Ventas e IVA Compras</p>
        </div>
        <a
          href={pdfUrl}
          className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
        >
          Ver PDF
        </a>
      </div>

      {/* Filtros */}
      <div className="border rounded-lg p-4 space-y-3 bg-muted/40">
        <p className="text-sm font-medium">Filtrar por período</p>
        <div className="flex flex-wrap gap-4">
          {/* Filtro por mes/año */}
          <form method="GET" action="/iva" className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Mes</label>
              <select name="mes" defaultValue={searchParams.mes ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm min-w-[120px]">
                <option value="">—</option>
                {meses.map((m) => <option key={m.num} value={String(m.num)}>{m.nombre}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Año</label>
              <select name="anio" defaultValue={searchParams.anio ?? String(anioActual)} className="h-9 rounded-md border bg-background px-2 text-sm">
                {anios.map((a) => <option key={a} value={String(a)}>{a}</option>)}
              </select>
            </div>
            <button type="submit" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              Ver mes
            </button>
          </form>

          <div className="text-sm text-muted-foreground flex items-center">o</div>

          {/* Filtro por rango */}
          <form method="GET" action="/iva" className="flex items-end gap-2">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Desde</label>
              <input type="date" name="desde" defaultValue={searchParams.desde ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-muted-foreground">Hasta</label>
              <input type="date" name="hasta" defaultValue={searchParams.hasta ?? ""} className="h-9 rounded-md border bg-background px-2 text-sm" />
            </div>
            <button type="submit" className="h-9 px-3 rounded-md bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90">
              Ver rango
            </button>
          </form>

          <a href="/iva" className="h-9 px-3 rounded-md border text-sm font-medium inline-flex items-center self-end hover:bg-accent">
            Limpiar filtros
          </a>
        </div>
      </div>

      {/* Resumen posición IVA */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA Ventas</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalVentas)}</p>
            <p className="text-xs text-muted-foreground">{asientos.filter((a) => a.tipo === "VENTA").length} asiento(s)</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">IVA Compras</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">{formatearMoneda(totalCompras)}</p>
            <p className="text-xs text-muted-foreground">{asientos.filter((a) => a.tipo === "COMPRA").length} asiento(s)</p>
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
            <p className="text-xs text-muted-foreground">{posicionIva >= 0 ? "Saldo deudor" : "Saldo acreedor"}</p>
          </CardContent>
        </Card>
      </div>

      {/* Lista de asientos */}
      {asientos.length === 0 ? (
        <Card>
          <CardHeader>
            <CardTitle>Sin asientos de IVA</CardTitle>
            <CardDescription>No hay asientos para el período seleccionado.</CardDescription>
          </CardHeader>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Asientos de IVA</CardTitle>
            <CardDescription>{asientos.length} asiento(s) · IVA Ventas e IVA Compras</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {asientos.map((asiento) => {
                const razonSocial =
                  asiento.facturaEmitida?.empresa.razonSocial ??
                  asiento.facturaProveedor?.proveedor.razonSocial ??
                  "—"
                const comprobante =
                  asiento.facturaEmitida?.nroComprobante ??
                  asiento.facturaProveedor?.nroComprobante ??
                  ""
                return (
                  <div
                    key={asiento.id}
                    className="flex items-center justify-between rounded-lg border p-3 text-sm"
                  >
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center rounded px-2 py-0.5 text-xs font-medium ${asiento.tipo === "VENTA" ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                        {asiento.tipo}
                      </span>
                      <div>
                        <p className="font-medium">{razonSocial}</p>
                        <p className="text-muted-foreground">
                          {asiento.periodo}{comprobante ? ` · ${comprobante}` : ""} · {asiento.alicuota}%
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold">{formatearMoneda(asiento.montoIva)}</p>
                      <p className="text-xs text-muted-foreground">Base: {formatearMoneda(asiento.baseImponible)}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
