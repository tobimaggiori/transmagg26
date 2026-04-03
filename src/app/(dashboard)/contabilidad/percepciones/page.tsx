/**
 * Proposito: Pagina de Percepciones (ruta /contabilidad/percepciones).
 * Replica la estructura del PDF del Libro de Percepciones (pdf-libro-percepciones.ts) como HTML:
 *   1. Percepciones y Retenciones Sufridas (credito fiscal)
 *   2. Otros Impuestos Pagados (internos, ICL, CO2)
 * Usa las mismas queries Prisma que generarPDFLibroPercepciones().
 */

import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { formatearMoneda, formatearFecha } from "@/lib/utils"
import { FiltroPeriodo } from "@/components/contabilidad/filtro-periodo"
import type { Rol } from "@/types"

/* -- Tipos internos (mismos que pdf-libro-percepciones.ts) ------------------- */

interface FilaPercepcion {
  origen: string // "Factura Proveedor" | "Factura Seguro" | "Recibo Cobranza"
  comprobante: string
  proveedor: string
  fecha: Date
  tipo: string
  monto: number
}

interface FilaImpuestoInterno {
  proveedor: string
  comprobante: string
  fecha: Date
  tipo: string
  descripcion: string | null
  monto: number
}

/* -- Data fetching (replicado de pdf-libro-percepciones.ts) ------------------ */

async function obtenerPercepcionesSufridas(
  mesAnio: string,
  desde: Date,
  hasta: Date,
): Promise<FilaPercepcion[]> {
  const filas: FilaPercepcion[] = []

  // 1. PercepcionImpuesto con categoria=PERCEPCION
  const registros = await prisma.percepcionImpuesto.findMany({
    where: {
      periodo: mesAnio,
      categoria: "PERCEPCION",
    },
    include: {
      facturaProveedor: {
        select: {
          nroComprobante: true,
          fechaCbte: true,
          proveedor: { select: { razonSocial: true } },
        },
      },
      facturaSeguro: {
        select: {
          nroComprobante: true,
          fecha: true,
          aseguradora: { select: { razonSocial: true } },
        },
      },
    },
  })

  for (const r of registros) {
    if (r.facturaProveedor) {
      filas.push({
        origen: "Factura Proveedor",
        comprobante: r.facturaProveedor.nroComprobante,
        proveedor: r.facturaProveedor.proveedor.razonSocial,
        fecha: r.facturaProveedor.fechaCbte,
        tipo: r.tipo.replace(/_/g, " "),
        monto: r.monto,
      })
    } else if (r.facturaSeguro) {
      filas.push({
        origen: "Factura Seguro",
        comprobante: r.facturaSeguro.nroComprobante,
        proveedor: r.facturaSeguro.aseguradora.razonSocial,
        fecha: r.facturaSeguro.fecha,
        tipo: r.tipo.replace(/_/g, " "),
        monto: r.monto,
      })
    }
  }

  // 2. Retenciones de ReciboCobranza (Ganancias, IIBB, SUSS)
  const recibos = await prisma.reciboCobranza.findMany({
    where: {
      fecha: { gte: desde, lt: hasta },
      OR: [
        { retencionIIBB: { gt: 0 } },
        { retencionGanancias: { gt: 0 } },
        { retencionSUSS: { gt: 0 } },
      ],
    },
    select: {
      nro: true,
      fecha: true,
      retencionIIBB: true,
      retencionGanancias: true,
      retencionSUSS: true,
      empresa: { select: { razonSocial: true } },
    },
  })

  for (const r of recibos) {
    if (r.retencionIIBB > 0) {
      filas.push({
        origen: "Recibo Cobranza",
        comprobante: `Recibo #${r.nro}`,
        proveedor: r.empresa.razonSocial,
        fecha: r.fecha,
        tipo: "Retencion IIBB",
        monto: r.retencionIIBB,
      })
    }
    if (r.retencionGanancias > 0) {
      filas.push({
        origen: "Recibo Cobranza",
        comprobante: `Recibo #${r.nro}`,
        proveedor: r.empresa.razonSocial,
        fecha: r.fecha,
        tipo: "Retencion Ganancias",
        monto: r.retencionGanancias,
      })
    }
    if (r.retencionSUSS > 0) {
      filas.push({
        origen: "Recibo Cobranza",
        comprobante: `Recibo #${r.nro}`,
        proveedor: r.empresa.razonSocial,
        fecha: r.fecha,
        tipo: "Retencion SUSS",
        monto: r.retencionSUSS,
      })
    }
  }

  return filas
}

async function obtenerImpuestosInternos(mesAnio: string): Promise<FilaImpuestoInterno[]> {
  const registros = await prisma.percepcionImpuesto.findMany({
    where: {
      periodo: mesAnio,
      categoria: "IMPUESTO_INTERNO",
    },
    include: {
      facturaProveedor: {
        select: {
          nroComprobante: true,
          fechaCbte: true,
          proveedor: { select: { razonSocial: true } },
        },
      },
      facturaSeguro: {
        select: {
          nroComprobante: true,
          fecha: true,
          aseguradora: { select: { razonSocial: true } },
        },
      },
    },
  })

  return registros.map((r) => {
    if (r.facturaProveedor) {
      return {
        proveedor: r.facturaProveedor.proveedor.razonSocial,
        comprobante: r.facturaProveedor.nroComprobante,
        fecha: r.facturaProveedor.fechaCbte,
        tipo: r.tipo.replace(/_/g, " "),
        descripcion: r.descripcion,
        monto: r.monto,
      }
    }
    return {
      proveedor: r.facturaSeguro?.aseguradora.razonSocial ?? "—",
      comprobante: r.facturaSeguro?.nroComprobante ?? "—",
      fecha: r.facturaSeguro?.fecha ?? new Date(),
      tipo: r.tipo.replace(/_/g, " "),
      descripcion: r.descripcion,
      monto: r.monto,
    }
  })
}

/* -- Helpers ----------------------------------------------------------------- */

const MESES_NOMBRE = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
]

function fmtMesAnio(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  return `${MESES_NOMBRE[parseInt(mes, 10) - 1]} ${anio}`
}

/* -- Page component ---------------------------------------------------------- */

export default async function PercepcionesPage({
  searchParams,
}: {
  searchParams: { mes?: string; anio?: string; desde?: string; hasta?: string }
}) {
  const session = await auth()
  if (!session?.user) redirect("/login")

  const rol = (session.user.rol ?? "OPERADOR_EMPRESA") as Rol
  const esAdmin = rol === "ADMIN_TRANSMAGG"
  const esRolInterno = rol === "ADMIN_TRANSMAGG" || rol === "OPERADOR_TRANSMAGG"
  if (!(esAdmin || (esRolInterno && puedeAcceder(rol, "cuentas")))) redirect("/dashboard")

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

  // Fetch data in parallel (same as generarPDFLibroPercepciones)
  const [percepciones, impuestosInternos] = await Promise.all([
    obtenerPercepcionesSufridas(mesAnio, desde, hasta),
    obtenerImpuestosInternos(mesAnio),
  ])

  // Subtotals by tipo for percepciones
  const subtotalesPorTipoPerc = new Map<string, number>()
  for (const p of percepciones) {
    subtotalesPorTipoPerc.set(p.tipo, (subtotalesPorTipoPerc.get(p.tipo) ?? 0) + p.monto)
  }

  // Subtotals by tipo for impuestos internos
  const subtotalesPorTipoImp = new Map<string, number>()
  for (const imp of impuestosInternos) {
    subtotalesPorTipoImp.set(imp.tipo, (subtotalesPorTipoImp.get(imp.tipo) ?? 0) + imp.monto)
  }

  const totalPercepciones = percepciones.reduce((s, p) => s + p.monto, 0)
  const totalImpuestos = impuestosInternos.reduce((s, imp) => s + imp.monto, 0)
  const totalGeneral = totalPercepciones + totalImpuestos

  const hayDatos = percepciones.length > 0 || impuestosInternos.length > 0

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight">Percepciones e Impuestos</h2>
        <p className="text-muted-foreground">
          Libro de Percepciones, Retenciones e Impuestos Internos
        </p>
      </div>

      <FiltroPeriodo
        action="/contabilidad/percepciones"
        mes={params.mes}
        anio={params.anio}
        desde={searchParams.desde}
        hasta={searchParams.hasta}
      />

      {/* -- Header block (document-style) ------------------------------------ */}
      <div className="border-t-4 border-[#1e40af] bg-slate-50 rounded-lg p-6">
        <div className="text-center space-y-1">
          <p className="text-lg font-bold tracking-wide">
            TRANS-MAGG S.R.L. — C.U.I.T. 30-70938168-3
          </p>
          <p className="text-sm font-semibold text-[#1e40af] uppercase tracking-wider">
            Libro de Percepciones e Impuestos
          </p>
          <p className="text-sm text-muted-foreground">
            {fmtMesAnio(mesAnio)}
          </p>
        </div>
      </div>

      {/* -- Export buttons ---------------------------------------------------- */}
      {hayDatos && (
        <div className="flex gap-2">
          <a
            href={`/contabilidad/percepciones/generar`}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
          >
            Exportar PDF
          </a>
          <a
            href={`/contabilidad/percepciones/consultar`}
            className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
          >
            Consultar Libros Generados
          </a>
        </div>
      )}

      {/* -- SECCION 1: PERCEPCIONES Y RETENCIONES SUFRIDAS ------------------- */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
          1. Percepciones y Retenciones Sufridas
        </div>

        {percepciones.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Sin percepciones ni retenciones en el periodo seleccionado.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Origen</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Proveedor / Empresa</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Comprobante</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {percepciones.map((p, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatearFecha(p.fecha)}
                      </td>
                      <td className="px-3 py-2 text-muted-foreground">{p.origen}</td>
                      <td className="px-3 py-2">{p.proveedor}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.comprobante}</td>
                      <td className="px-3 py-2 text-muted-foreground">{p.tipo}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatearMoneda(p.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Subtotals by tipo */}
                  {Array.from(subtotalesPorTipoPerc.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([tipo, subtotal]) => (
                      <tr key={tipo} className="bg-slate-50/80 border-t text-sm">
                        <td colSpan={5} className="px-3 py-1.5 text-right text-xs text-muted-foreground">
                          Subtotal {tipo}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                          {formatearMoneda(subtotal)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-muted font-semibold border-t">
                    <td colSpan={5} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                      Total Percepciones y Retenciones
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatearMoneda(totalPercepciones)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* -- SECCION 2: OTROS IMPUESTOS PAGADOS ------------------------------- */}
      <div className="space-y-4">
        <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
          2. Otros Impuestos (Internos, ICL, CO2)
        </div>

        {impuestosInternos.length === 0 ? (
          <div className="border rounded-lg p-8 text-center text-muted-foreground text-sm">
            Sin impuestos internos en el periodo seleccionado.
          </div>
        ) : (
          <div className="border rounded-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-slate-50">
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Fecha</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Proveedor</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Comprobante</th>
                    <th className="px-3 py-2 text-left text-xs uppercase text-muted-foreground font-medium">Tipo</th>
                    <th className="px-3 py-2 text-right text-xs uppercase text-muted-foreground font-medium">Monto</th>
                  </tr>
                </thead>
                <tbody>
                  {impuestosInternos.map((imp, i) => (
                    <tr key={i} className="border-b hover:bg-muted/30">
                      <td className="px-3 py-2 text-muted-foreground whitespace-nowrap">
                        {formatearFecha(imp.fecha)}
                      </td>
                      <td className="px-3 py-2">{imp.proveedor}</td>
                      <td className="px-3 py-2 text-muted-foreground">{imp.comprobante}</td>
                      <td className="px-3 py-2 text-muted-foreground">{imp.tipo}</td>
                      <td className="px-3 py-2 text-right tabular-nums font-medium">
                        {formatearMoneda(imp.monto)}
                      </td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  {/* Subtotals by tipo */}
                  {Array.from(subtotalesPorTipoImp.entries())
                    .sort((a, b) => a[0].localeCompare(b[0]))
                    .map(([tipo, subtotal]) => (
                      <tr key={tipo} className="bg-slate-50/80 border-t text-sm">
                        <td colSpan={4} className="px-3 py-1.5 text-right text-xs text-muted-foreground">
                          Subtotal {tipo}
                        </td>
                        <td className="px-3 py-1.5 text-right tabular-nums text-muted-foreground">
                          {formatearMoneda(subtotal)}
                        </td>
                      </tr>
                    ))}
                  <tr className="bg-muted font-semibold border-t">
                    <td colSpan={4} className="px-3 py-2 text-right text-xs text-muted-foreground uppercase">
                      Total Otros Impuestos
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {formatearMoneda(totalImpuestos)}
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* -- RESUMEN DEL PERIODO ---------------------------------------------- */}
      {hayDatos && (
        <div className="border rounded-lg overflow-hidden">
          <div className="border-l-4 border-[#1e40af] bg-blue-50 px-4 py-2 font-bold uppercase text-sm">
            Resumen del Periodo
          </div>
          <div className="p-4 space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Percepciones y Retenciones sufridas</span>
              <span className="tabular-nums font-medium">{formatearMoneda(totalPercepciones)}</span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Impuestos internos</span>
              <span className="tabular-nums font-medium">{formatearMoneda(totalImpuestos)}</span>
            </div>
            <div className="flex items-center justify-between text-sm font-bold border-t border-[#1e40af] pt-2 mt-2">
              <span>TOTAL GENERAL</span>
              <span className="tabular-nums">{formatearMoneda(totalGeneral)}</span>
            </div>
          </div>
        </div>
      )}

      {/* -- Export button at the bottom -------------------------------------- */}
      {hayDatos && (
        <div className="flex gap-2 border-t pt-4">
          <a
            href={`/contabilidad/percepciones/generar`}
            className="h-9 px-4 rounded-md bg-primary text-primary-foreground text-sm font-medium inline-flex items-center gap-2 hover:bg-primary/90"
          >
            Exportar PDF
          </a>
          <a
            href={`/contabilidad/percepciones/consultar`}
            className="h-9 px-4 rounded-md border text-sm font-medium inline-flex items-center gap-2 hover:bg-accent"
          >
            Consultar Libros Generados
          </a>
        </div>
      )}
    </div>
  )
}
