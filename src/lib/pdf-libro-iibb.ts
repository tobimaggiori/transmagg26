/**
 * Proposito: Generacion del PDF del Libro de IIBB mensual.
 * Tres secciones: IIBB por Actividad, Percepciones/Retenciones, Resumen Jurisdiccional.
 * El HTML se convierte a PDF binario con Puppeteer (A4).
 */

import { prisma } from "@/lib/prisma"
import puppeteer from "puppeteer"

/* ── Formatters (mismos que pdf-liquidacion) ───────────────────────────────── */

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtNumero(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n)
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function fmtMesAnio(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${meses[parseInt(mes, 10) - 1]} ${anio}`
}

/* ── Helpers ────────────────────────────────────────────────────────────────── */

function parsePeriodo(mesAnio: string): { desde: Date; hasta: Date } {
  const [anio, mes] = mesAnio.split("-").map(Number)
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 1) // primer dia del mes siguiente
  return { desde, hasta }
}

/* ── Tipos internos ─────────────────────────────────────────────────────────── */

interface FilaActividad {
  provincia: string
  facturaNro: string
  empresa: string
  fechaFactura: Date
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

/* ── Data fetching ──────────────────────────────────────────────────────────── */

async function obtenerDatosActividad(desde: Date, hasta: Date): Promise<FilaActividad[]> {
  // Get facturas emitidas in the period
  const facturas = await prisma.facturaEmitida.findMany({
    where: {
      emitidaEn: { gte: desde, lt: hasta },
    },
    select: { id: true },
  })

  if (facturas.length === 0) return []

  const facturaIds = facturas.map((f) => f.id)

  // Get viajes with their linked ViajeEnLiquidacion
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

    // Get tarifaFletero from ViajeEnLiquidacion
    const vel = vf.viaje.enLiquidaciones[0]
    const tarifaFletero = vel?.tarifaFletero ?? 0
    const totalFletero = (kilos / 1000) * tarifaFletero
    const difTarifa = totalEmpresa - totalFletero

    // Commission attributable to this viaje
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

/* ── HTML generation ────────────────────────────────────────────────────────── */

function generarHTML(
  mesAnio: string,
  filasActividad: FilaActividad[],
  percepciones: PercepcionFila[],
  retenciones: RetencionFila[],
): string {
  // Group by provincia for section 1
  const porProvincia = new Map<string, FilaActividad[]>()
  for (const f of filasActividad) {
    const arr = porProvincia.get(f.provincia) ?? []
    arr.push(f)
    porProvincia.set(f.provincia, arr)
  }

  // Build section 1 rows
  let seccion1Rows = ""
  const provinciaTotales = new Map<string, { totalFacturado: number; baseIIBB: number }>()

  for (const [provincia, filas] of Array.from(porProvincia.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    let provTotalFacturado = 0
    let provBaseIIBB = 0

    seccion1Rows += `
      <tr style="background:#e0e7ff">
        <td colspan="7" style="padding:6px 8px; font-weight:bold; color:#1e40af">${provincia}</td>
      </tr>`

    for (const fila of filas) {
      provTotalFacturado += fila.totalEmpresa
      provBaseIIBB += fila.baseIIBB

      seccion1Rows += `
      <tr>
        <td style="padding:3px 6px">${fila.facturaNro}</td>
        <td style="padding:3px 6px">${fila.empresa}</td>
        <td style="padding:3px 6px">${fmtFecha(fila.fechaFactura)}</td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(fila.totalEmpresa)}</td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(fila.totalFletero)}</td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(fila.comisionViaje)}</td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace; font-weight:bold">${fmtNumero(fila.baseIIBB)}</td>
      </tr>`
    }

    seccion1Rows += `
      <tr style="background:#f1f5f9; font-weight:bold">
        <td colspan="3" style="padding:3px 6px; text-align:right">Subtotal ${provincia}</td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(provTotalFacturado)}</td>
        <td colspan="2"></td>
        <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(provBaseIIBB)}</td>
      </tr>`

    provinciaTotales.set(provincia, {
      totalFacturado: provTotalFacturado,
      baseIIBB: provBaseIIBB,
    })
  }

  const totalBaseIIBB = filasActividad.reduce((s, f) => s + f.baseIIBB, 0)
  const totalFacturado = filasActividad.reduce((s, f) => s + f.totalEmpresa, 0)

  // Section 2 - Percepciones
  const filasPercepciones = percepciones
    .map(
      (p, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:3px 6px">${p.tipo}</td>
      <td style="padding:3px 6px">${p.proveedor}</td>
      <td style="padding:3px 6px">${p.nroComprobante}</td>
      <td style="padding:3px 6px">${fmtFecha(p.fecha)}</td>
      <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(p.monto)}</td>
    </tr>`,
    )
    .join("")

  const totalPercepciones = percepciones.reduce((s, p) => s + p.monto, 0)

  // Section 2 - Retenciones
  const filasRetenciones = retenciones
    .map(
      (r, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:3px 6px">Recibo #${r.nroRecibo}</td>
      <td style="padding:3px 6px">${r.empresa}</td>
      <td style="padding:3px 6px">${fmtFecha(r.fecha)}</td>
      <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(r.monto)}</td>
    </tr>`,
    )
    .join("")

  const totalRetenciones = retenciones.reduce((s, r) => s + r.monto, 0)

  // Section 3 - Resumen jurisdiccional
  // Group percepciones by... we don't have province on percepciones, so they go in a general row
  // Retenciones similarly have no province info
  // Build resumen from provinciaTotales
  const resumenRows: string[] = []
  for (const [provincia, totales] of Array.from(provinciaTotales.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
    resumenRows.push(`
    <tr>
      <td style="padding:4px 8px; font-weight:500">${provincia}</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">${fmt(totales.totalFacturado)}</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">${fmt(totales.baseIIBB)}</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">—</td>
    </tr>`)
  }

  // Add totals row for percepciones/retenciones
  resumenRows.push(`
    <tr style="background:#f1f5f9; font-weight:bold; border-top:1.5px solid #1e40af">
      <td style="padding:4px 8px">TOTALES</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">${fmt(totalFacturado)}</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">${fmt(totalBaseIIBB)}</td>
      <td style="padding:4px 8px; text-align:right; font-family:'Courier New',monospace">${fmt(totalPercepciones + totalRetenciones)}</td>
    </tr>`)

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro IIBB — ${fmtMesAnio(mesAnio)}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; }
    .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; position: relative; }
    .blue-line { border: none; height: 1.5px; background: #1e40af; margin: 8px 0; }
    .blue-line-thin { border: none; height: 0.8px; background: #1e40af; margin: 6px 0; }

    .header { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left .empresa-nombre { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .header-left .empresa-dato { font-size: 9px; color: #333; line-height: 1.5; }
    .header-right { text-align: right; }
    .header-right .titulo { font-size: 14px; font-weight: bold; color: #1e40af; }
    .header-right .periodo { font-size: 11px; margin-top: 4px; }

    .section-title {
      font-size: 11px; font-weight: bold; color: #1e40af;
      margin: 12px 0 6px 0; padding: 4px 0;
      border-bottom: 1.5px solid #1e40af;
    }

    table { width: 100%; border-collapse: collapse; font-size: 8.5px; margin-bottom: 6px; }
    th {
      font-weight: bold; text-align: left; padding: 4px 6px;
      border-top: 1.5px solid #1e40af; border-bottom: 1.5px solid #1e40af;
      background: #fff; font-size: 8px;
    }
    th.right { text-align: right; }
    td { padding: 3px 6px; }

    .total-row { font-weight: bold; background: #e0e7ff; }
    .total-row td { padding: 5px 6px; }

    .footer { margin-top: 16px; font-size: 8px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Cabecera -->
    <div class="header">
      <div class="header-left">
        <div class="empresa-nombre">TRANS-MAGG S.R.L.</div>
        <div class="empresa-dato">
          C.U.I.T. 30-70938168-3<br>
          Belgrano 184, 2109 Acebal (S.F.)<br>
          Ing. Brutos Conv. Multi.: 0921-759945-2
        </div>
      </div>
      <div class="header-right">
        <div class="titulo">LIBRO DE INGRESOS BRUTOS</div>
        <div class="periodo">${fmtMesAnio(mesAnio)}</div>
      </div>
    </div>

    <hr class="blue-line">

    <!-- SECCION 1: IIBB POR ACTIVIDAD -->
    <div class="section-title">1. IIBB POR ACTIVIDAD (Transporte de Cargas)</div>
    <table>
      <thead>
        <tr>
          <th>Factura</th>
          <th>Empresa</th>
          <th>Fecha</th>
          <th class="right">Total Empresa</th>
          <th class="right">Total Fletero</th>
          <th class="right">Comision</th>
          <th class="right">Base IIBB</th>
        </tr>
      </thead>
      <tbody>
        ${seccion1Rows}
        <tr class="total-row">
          <td colspan="3" style="text-align:right">TOTAL GENERAL</td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalFacturado)}</td>
          <td></td>
          <td></td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalBaseIIBB)}</td>
        </tr>
      </tbody>
    </table>

    <!-- SECCION 2: PERCEPCIONES Y RETENCIONES -->
    <div class="section-title">2. PERCEPCIONES Y RETENCIONES</div>

    ${percepciones.length > 0 ? `
    <p style="font-size:9px; font-weight:bold; margin:4px 0">Percepciones sufridas</p>
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Proveedor</th>
          <th>Comprobante</th>
          <th>Fecha</th>
          <th class="right">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${filasPercepciones}
        <tr class="total-row">
          <td colspan="4" style="text-align:right">Total Percepciones</td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalPercepciones)}</td>
        </tr>
      </tbody>
    </table>
    ` : `<p style="font-size:9px; color:#666; margin:4px 0">Sin percepciones en el periodo.</p>`}

    ${retenciones.length > 0 ? `
    <p style="font-size:9px; font-weight:bold; margin:4px 0">Retenciones sufridas</p>
    <table>
      <thead>
        <tr>
          <th>Recibo</th>
          <th>Empresa</th>
          <th>Fecha</th>
          <th class="right">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${filasRetenciones}
        <tr class="total-row">
          <td colspan="3" style="text-align:right">Total Retenciones</td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalRetenciones)}</td>
        </tr>
      </tbody>
    </table>
    ` : `<p style="font-size:9px; color:#666; margin:4px 0">Sin retenciones en el periodo.</p>`}

    <!-- SECCION 3: RESUMEN JURISDICCIONAL -->
    <div class="section-title">3. RESUMEN JURISDICCIONAL</div>
    <table>
      <thead>
        <tr>
          <th>Provincia</th>
          <th class="right">Total Facturado</th>
          <th class="right">Base IIBB</th>
          <th class="right">Perc. + Ret.</th>
        </tr>
      </thead>
      <tbody>
        ${resumenRows.join("")}
      </tbody>
    </table>

    <!-- Pie -->
    <div class="footer">
      Generado el ${fmtFecha(new Date())} — TRANS-MAGG S.R.L. — Sistema de gestion
    </div>
  </div>
</body>
</html>`
}

/* ── PDF generation ─────────────────────────────────────────────────────────── */

export async function generarPDFLibroIIBB(mesAnio: string): Promise<Buffer> {
  const { desde, hasta } = parsePeriodo(mesAnio)

  const [filasActividad, percepciones, retenciones] = await Promise.all([
    obtenerDatosActividad(desde, hasta),
    obtenerPercepciones(desde, hasta),
    obtenerRetenciones(desde, hasta),
  ])

  const html = generarHTML(mesAnio, filasActividad, percepciones, retenciones)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
