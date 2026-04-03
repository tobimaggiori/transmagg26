/**
 * Proposito: Pagina de IIBB (ruta /contabilidad/iibb).
 * Replica la estructura del PDF del Libro de IIBB (pdf-libro-iibb.ts) como HTML:
 *   1. IIBB por Actividad (agrupado por provincia)
 *   2. Percepciones y Retenciones IIBB
 *   3. Resumen Jurisdiccional
 * Usa las mismas queries Prisma que generarPDFLibroIIBB().
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import { LibroIibbClient } from "./libro-iibb-client"
import type { Rol } from "@/types"

/* ── Tipos internos (mismos que pdf-libro-iibb.ts) ─────────────────────────── */

interface FilaActividad {
  provincia: string
  facturaNro: string
  empresa: string
  fechaFactura: Date
  mercaderia: string
  procedencia: string
  totalEmpresa: number
  totalFletero: number
  difTarifa: number
  comisionViaje: number
  baseIIBB: number
}

interface PercepcionFila {
  tipo: string
  proveedor: string
  nroComprobante: string
  fecha: Date
  monto: number
}

interface RetencionFila {
  nroRecibo: string
  empresa: string
  fecha: Date
  monto: number
}

/* ── Data fetching (replicado de pdf-libro-iibb.ts) ────────────────────────── */

async function obtenerDatosActividad(desde: Date, hasta: Date): Promise<FilaActividad[]> {
  const facturas = await prisma.facturaEmitida.findMany({
    where: { emitidaEn: { gte: desde, lt: hasta } },
    select: { id: true },
  })

  if (facturas.length === 0) return []

  const facturaIds = facturas.map((f) => f.id)

  const viajesConLP = await prisma.viajeEnFactura.findMany({
    where: { facturaId: { in: facturaIds } },
    include: {
      viaje: {
        include: {
          enLiquidaciones: {
            include: {
              liquidacion: {
                select: {
                  comisionPct: true,
                  subtotalBruto: true,
                  comisionMonto: true,
                },
              },
            },
            take: 1,
          },
        },
      },
      factura: {
        select: {
          emitidaEn: true,
          nroComprobante: true,
          empresa: { select: { razonSocial: true } },
        },
      },
    },
  })

  const filas: FilaActividad[] = []

  for (const vf of viajesConLP) {
    const totalEmpresa = vf.subtotal
    const kilos = vf.kilos ?? 0

    const vel = vf.viaje.enLiquidaciones[0]
    const tarifaFletero = vel?.tarifaFletero ?? 0
    const totalFletero = (kilos / 1000) * tarifaFletero
    const difTarifa = totalEmpresa - totalFletero

    let comisionViaje = 0
    if (vel?.liquidacion) {
      const lp = vel.liquidacion
      if (lp.subtotalBruto > 0) {
        comisionViaje = (lp.comisionMonto / lp.subtotalBruto) * vel.subtotal
      }
    }

    const baseIIBB = difTarifa + comisionViaje

    filas.push({
      provincia: vf.provinciaOrigen ?? "Sin provincia",
      facturaNro: vf.factura.nroComprobante ?? "Borrador",
      empresa: vf.factura.empresa.razonSocial,
      fechaFactura: vf.factura.emitidaEn,
      mercaderia: vf.mercaderia ?? "—",
      procedencia: vf.procedencia ?? "—",
      totalEmpresa,
      totalFletero,
      difTarifa,
      comisionViaje,
      baseIIBB,
    })
  }

  return filas
}

async function obtenerPercepciones(desde: Date, hasta: Date): Promise<PercepcionFila[]> {
  const factProv = await prisma.facturaProveedor.findMany({
    where: {
      fechaCbte: { gte: desde, lt: hasta },
      percepcionIIBB: { gt: 0 },
    },
    select: {
      nroComprobante: true,
      fechaCbte: true,
      percepcionIIBB: true,
      proveedor: { select: { razonSocial: true } },
    },
  })

  return factProv.map((fp) => ({
    tipo: "Percepcion Proveedor",
    proveedor: fp.proveedor.razonSocial,
    nroComprobante: fp.nroComprobante,
    fecha: fp.fechaCbte,
    monto: fp.percepcionIIBB ?? 0,
  }))
}

async function obtenerRetenciones(desde: Date, hasta: Date): Promise<RetencionFila[]> {
  const recibos = await prisma.reciboCobranza.findMany({
    where: {
      fecha: { gte: desde, lt: hasta },
      retencionIIBB: { gt: 0 },
    },
    select: {
      nro: true,
      fecha: true,
      retencionIIBB: true,
      empresa: { select: { razonSocial: true } },
    },
  })

  return recibos.map((r) => ({
    nroRecibo: String(r.nro),
    empresa: r.empresa.razonSocial,
    fecha: r.fecha,
    monto: r.retencionIIBB,
  }))
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

const MESES_NOMBRE = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function fmtMesAnio(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  return `${MESES_NOMBRE[parseInt(mes, 10) - 1]} ${anio}`
}

/* ── Page component ────────────────────────────────────────────────────────── */

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

  const params = {
    mes: searchParams.mes ?? String(mesActual),
    anio: searchParams.anio ?? String(anioActual),
    desde: searchParams.desde,
    hasta: searchParams.hasta,
  }

  // Build mesAnio "YYYY-MM" for queries
  const m = String(params.mes).padStart(2, "0")
  const mesAnio = `${params.anio}-${m}`

  const anioNum = parseInt(params.anio, 10)
  const mesNum = parseInt(params.mes, 10)
  const desde = new Date(anioNum, mesNum - 1, 1)
  const hasta = new Date(anioNum, mesNum, 1)

  // Fetch data in parallel (same as generarPDFLibroIIBB)
  const [filasActividad, percepciones, retenciones] = await Promise.all([
    obtenerDatosActividad(desde, hasta),
    obtenerPercepciones(desde, hasta),
    obtenerRetenciones(desde, hasta),
  ])

  // Group actividad by provincia
  const porProvincia = new Map<string, FilaActividad[]>()
  for (const f of filasActividad) {
    const arr = porProvincia.get(f.provincia) ?? []
    arr.push(f)
    porProvincia.set(f.provincia, arr)
  }

  // Province totals for resumen jurisdiccional
  const provinciaTotales = new Map<string, { totalFacturado: number; baseIIBB: number }>()
  for (const [provincia, filas] of Array.from(porProvincia.entries())) {
    const totalFacturado = filas.reduce((s: number, f: FilaActividad) => s + f.totalEmpresa, 0)
    const baseIIBB = filas.reduce((s: number, f: FilaActividad) => s + f.baseIIBB, 0)
    provinciaTotales.set(provincia, { totalFacturado, baseIIBB })
  }

  const totalFacturado = filasActividad.reduce((s, f) => s + f.totalEmpresa, 0)
  const totalBaseIIBB = filasActividad.reduce((s, f) => s + f.baseIIBB, 0)
  const totalPercepciones = percepciones.reduce((s, p) => s + p.monto, 0)
  const totalRetenciones = retenciones.reduce((s, r) => s + r.monto, 0)

  // Export params
  const exportParams = new URLSearchParams()
  if (params.mes) exportParams.set("mes", params.mes)
  if (params.anio) exportParams.set("anio", params.anio)
  if (params.desde) exportParams.set("desde", params.desde ?? "")
  if (params.hasta) exportParams.set("hasta", params.hasta ?? "")
  const exportQuery = exportParams.toString() ? `?${exportParams.toString()}` : ""

  const provinciasOrdenadas = Array.from(porProvincia.entries()).sort((a, b) =>
    a[0].localeCompare(b[0]),
  )

  const hayDatos = filasActividad.length > 0 || percepciones.length > 0 || retenciones.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Ingresos Brutos (IIBB)</h2>
        <p className="text-muted-foreground">
          Libro de IIBB — Convenio Multilateral Art. 9
        </p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/iibb"
        mes={params.mes}
        anio={params.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* ── Header block (document-style) ──────────────────────────────────── */}
      <div className="border-t-4 border-[#1e40af] bg-slate-50 rounded-lg p-6">
        <div className="text-center space-y-1">
          <p className="text-lg font-bold tracking-wide">
            TRANS-MAGG S.R.L. — C.U.I.T. 30-70938168-3
          </p>
          <p className="text-sm font-semibold text-[#1e40af] uppercase tracking-wider">
            Libro de Ingresos Brutos — Convenio Multilateral Art. 9
          </p>
          <p className="text-sm text-muted-foreground">
            {fmtMesAnio(mesAnio)}
          </p>
        </div>
      </div>

      {/* ── Export buttons ──────────────────────────────────────────────────── */}
      {hayDatos && (
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

      {/* ── SECCION 1: IIBB POR ACTIVIDAD ──────────────────────────────────── */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
          1. IIBB por Actividad (Transporte de Cargas)
        </div>

        {filasActividad.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Sin viajes facturados para el periodo seleccionado.
          </div>
        ) : (
          <div className="space-y-4">
            {provinciasOrdenadas.map(([provincia, filas]) => {
              const provDifTarifa = filas.reduce((s, f) => s + f.difTarifa, 0)
              const provComision = filas.reduce((s, f) => s + f.comisionViaje, 0)
              const provBaseIIBB = filas.reduce((s, f) => s + f.baseIIBB, 0)

              return (
                <div key={provincia} className="border rounded-lg overflow-hidden">
                  {/* Province header */}
                  <div className="border-l-4 border-[#1e40af] bg-blue-50/50 px-4 py-2">
                    <span className="font-semibold text-sm">{provincia}</span>
                    <span className="text-xs text-muted-foreground ml-2">
                      ({filas.length} viaje{filas.length !== 1 ? "s" : ""})
                    </span>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="bg-slate-50">
                          <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Fecha</th>
                          <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Empresa</th>
                          <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Mercaderia</th>
                          <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Procedencia</th>
                          <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Dif. Tarifa</th>
                          <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Comision LP</th>
                          <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Base IIBB</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filas.map((fila, i) => (
                          <tr key={i} className="border-b hover:bg-muted/30">
                            <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                              {formatearFecha(fila.fechaFactura)}
                            </td>
                            <td className="px-3 py-2">{fila.empresa}</td>
                            <td className="px-3 py-2 text-muted-foreground">{fila.mercaderia}</td>
                            <td className="px-3 py-2 text-muted-foreground">{fila.procedencia}</td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatearMoneda(fila.difTarifa)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums">
                              {formatearMoneda(fila.comisionViaje)}
                            </td>
                            <td className="px-3 py-2 text-right tabular-nums font-medium">
                              {formatearMoneda(fila.baseIIBB)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                      <tfoot>
                        <tr className="bg-muted font-semibold border-t">
                          <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                            Subtotal {provincia}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatearMoneda(provDifTarifa)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatearMoneda(provComision)}
                          </td>
                          <td className="px-3 py-2 text-right tabular-nums">
                            {formatearMoneda(provBaseIIBB)}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>
                </div>
              )
            })}

            {/* Total general actividad */}
            <div className="border rounded-lg bg-muted/50 px-4 py-3 flex items-center justify-between">
              <span className="font-bold text-sm uppercase tracking-wide">Total General Actividad</span>
              <div className="flex gap-6 text-sm">
                <span className="text-muted-foreground">
                  Facturado: <span className="font-semibold text-foreground tabular-nums">{formatearMoneda(totalFacturado)}</span>
                </span>
                <span className="text-muted-foreground">
                  Base IIBB: <span className="font-bold text-foreground tabular-nums">{formatearMoneda(totalBaseIIBB)}</span>
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── SECCION 2: PERCEPCIONES Y RETENCIONES IIBB ─────────────────────── */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
          2. Percepciones y Retenciones IIBB
        </div>

        {/* Percepciones */}
        {percepciones.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="border-l-4 border-[#1e40af] bg-blue-50/50 px-4 py-2">
              <span className="font-semibold text-sm">Percepciones sufridas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Origen</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Proveedor</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Comprobante</th>
                    <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {percepciones.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatearFecha(p.fecha)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.tipo}</td>
                      <td className="px-3 py-2">{p.proveedor}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.nroComprobante}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatearMoneda(p.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                      Total Percepciones
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatearMoneda(totalPercepciones)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-sm text-muted-foreground">
            Sin percepciones en el periodo.
          </div>
        )}

        {/* Retenciones */}
        {retenciones.length > 0 ? (
          <div className="border rounded-lg overflow-hidden">
            <div className="border-l-4 border-[#1e40af] bg-blue-50/50 px-4 py-2">
              <span className="font-semibold text-sm">Retenciones sufridas</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Origen</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Empresa</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Comprobante</th>
                    <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {retenciones.map((r, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatearFecha(r.fecha)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">Retencion Cobranza</td>
                      <td className="px-3 py-2">{r.empresa}</td>
                      <td className="px-3 py-2 text-muted-foreground">Recibo #{r.nroRecibo}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatearMoneda(r.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="bg-muted font-semibold border-t">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                      Total Retenciones
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatearMoneda(totalRetenciones)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        ) : (
          <div className="border rounded-lg p-4 text-sm text-muted-foreground">
            Sin retenciones en el periodo.
          </div>
        )}
      </div>

      {/* ── SECCION 3: RESUMEN JURISDICCIONAL ──────────────────────────────── */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
          3. Resumen Jurisdiccional
        </div>

        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50">
                  <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Provincia</th>
                  <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Total Facturado</th>
                  <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Base IIBB</th>
                  <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Retenciones IIBB</th>
                </tr>
              </thead>
              <tbody>
                {Array.from(provinciaTotales.entries())
                  .sort((a, b) => a[0].localeCompare(b[0]))
                  .map(([provincia, totales]) => (
                    <tr key={provincia} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 font-medium">{provincia}</td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatearMoneda(totales.totalFacturado)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums">
                        {formatearMoneda(totales.baseIIBB)}
                      </td>
                      <td className="px-3 py-2 text-right tabular-nums text-muted-foreground">
                        —
                      </td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="bg-muted font-semibold border-t-2 border-[#1e40af]">
                  <td className="px-3 py-2 font-bold">TOTALES</td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatearMoneda(totalFacturado)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatearMoneda(totalBaseIIBB)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {formatearMoneda(totalPercepciones + totalRetenciones)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      {/* ── LibroIibbClient (generacion del libro) ─────────────────────────── */}
      <div className="border-t pt-6">
        <LibroIibbClient libros={[]} />
      </div>
    </div>
  )
}
