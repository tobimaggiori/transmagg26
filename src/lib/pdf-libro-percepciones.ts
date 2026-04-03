/**
 * Proposito: Generacion del PDF del Libro de Percepciones e Impuestos mensual.
 * Dos secciones: Percepciones sufridas, Otros impuestos internos.
 * El HTML se convierte a PDF binario con Puppeteer (A4).
 */

import { prisma } from "@/lib/prisma"
import puppeteer from "puppeteer"

/* -- Formatters ------------------------------------------------------------ */

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

/* -- Helpers --------------------------------------------------------------- */

function parsePeriodo(mesAnio: string): { desde: Date; hasta: Date } {
  const [anio, mes] = mesAnio.split("-").map(Number)
  const desde = new Date(anio, mes - 1, 1)
  const hasta = new Date(anio, mes, 1)
  return { desde, hasta }
}

/* -- Tipos internos -------------------------------------------------------- */

interface FilaPercepcion {
  origen: string       // "Factura Proveedor" | "Factura Seguro" | "Recibo Cobranza"
  comprobante: string
  proveedor: string
  fecha: Date
  tipo: string
  monto: number
}

interface FilaImpuestoInterno {
  origen: string
  comprobante: string
  proveedor: string
  fecha: Date
  tipo: string
  descripcion: string | null
  monto: number
}

/* -- Data fetching --------------------------------------------------------- */

async function obtenerPercepcionesSufridas(mesAnio: string, desde: Date, hasta: Date): Promise<FilaPercepcion[]> {
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
        origen: "Factura Proveedor",
        comprobante: r.facturaProveedor.nroComprobante,
        proveedor: r.facturaProveedor.proveedor.razonSocial,
        fecha: r.facturaProveedor.fechaCbte,
        tipo: r.tipo.replace(/_/g, " "),
        descripcion: r.descripcion,
        monto: r.monto,
      }
    }
    return {
      origen: "Factura Seguro",
      comprobante: r.facturaSeguro?.nroComprobante ?? "—",
      proveedor: r.facturaSeguro?.aseguradora.razonSocial ?? "—",
      fecha: r.facturaSeguro?.fecha ?? new Date(),
      tipo: r.tipo.replace(/_/g, " "),
      descripcion: r.descripcion,
      monto: r.monto,
    }
  })
}

/* -- HTML generation ------------------------------------------------------- */

function generarHTML(
  mesAnio: string,
  percepciones: FilaPercepcion[],
  impuestosInternos: FilaImpuestoInterno[],
): string {
  // Section 1: Percepciones sufridas
  const filasPerc = percepciones
    .map(
      (p, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:3px 6px">${p.tipo}</td>
      <td style="padding:3px 6px">${p.origen}</td>
      <td style="padding:3px 6px">${p.proveedor}</td>
      <td style="padding:3px 6px">${p.comprobante}</td>
      <td style="padding:3px 6px">${fmtFecha(p.fecha)}</td>
      <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(p.monto)}</td>
    </tr>`,
    )
    .join("")

  const totalPercepciones = percepciones.reduce((s, p) => s + p.monto, 0)

  // Section 2: Otros impuestos internos
  const filasImp = impuestosInternos
    .map(
      (imp, i) => `
    <tr style="background:${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:3px 6px">${imp.tipo}</td>
      <td style="padding:3px 6px">${imp.descripcion ?? "—"}</td>
      <td style="padding:3px 6px">${imp.proveedor}</td>
      <td style="padding:3px 6px">${imp.comprobante}</td>
      <td style="padding:3px 6px">${fmtFecha(imp.fecha)}</td>
      <td style="padding:3px 6px; text-align:right; font-family:'Courier New',monospace">${fmtNumero(imp.monto)}</td>
    </tr>`,
    )
    .join("")

  const totalImpuestos = impuestosInternos.reduce((s, imp) => s + imp.monto, 0)

  const totalGeneral = totalPercepciones + totalImpuestos

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro Percepciones — ${fmtMesAnio(mesAnio)}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 9px; color: #000; }
    .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; position: relative; }
    .blue-line { border: none; height: 1.5px; background: #1e40af; margin: 8px 0; }

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

    .resumen-box {
      margin-top: 16px; padding: 10px;
      border: 1.5px solid #1e40af; border-radius: 4px;
    }
    .resumen-box .titulo { font-size: 10px; font-weight: bold; color: #1e40af; margin-bottom: 6px; }
    .resumen-linea { display: flex; justify-content: space-between; margin: 3px 0; font-size: 9px; }
    .resumen-total { font-weight: bold; border-top: 1px solid #1e40af; padding-top: 4px; margin-top: 6px; font-size: 10px; }

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
        <div class="titulo">LIBRO DE PERCEPCIONES E IMPUESTOS</div>
        <div class="periodo">${fmtMesAnio(mesAnio)}</div>
      </div>
    </div>

    <hr class="blue-line">

    <!-- SECCION 1: PERCEPCIONES SUFRIDAS -->
    <div class="section-title">1. PERCEPCIONES Y RETENCIONES SUFRIDAS</div>
    ${percepciones.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Origen</th>
          <th>Proveedor / Empresa</th>
          <th>Comprobante</th>
          <th>Fecha</th>
          <th class="right">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${filasPerc}
        <tr class="total-row">
          <td colspan="5" style="text-align:right">Total Percepciones y Retenciones</td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalPercepciones)}</td>
        </tr>
      </tbody>
    </table>
    ` : `<p style="font-size:9px; color:#666; margin:4px 0">Sin percepciones ni retenciones en el periodo.</p>`}

    <!-- SECCION 2: OTROS IMPUESTOS -->
    <div class="section-title">2. OTROS IMPUESTOS (Internos, ICL, CO2)</div>
    ${impuestosInternos.length > 0 ? `
    <table>
      <thead>
        <tr>
          <th>Tipo</th>
          <th>Descripcion</th>
          <th>Proveedor</th>
          <th>Comprobante</th>
          <th>Fecha</th>
          <th class="right">Monto</th>
        </tr>
      </thead>
      <tbody>
        ${filasImp}
        <tr class="total-row">
          <td colspan="5" style="text-align:right">Total Impuestos</td>
          <td style="text-align:right; font-family:'Courier New',monospace">${fmtNumero(totalImpuestos)}</td>
        </tr>
      </tbody>
    </table>
    ` : `<p style="font-size:9px; color:#666; margin:4px 0">Sin impuestos internos en el periodo.</p>`}

    <!-- RESUMEN -->
    <div class="resumen-box">
      <div class="titulo">RESUMEN DEL PERIODO</div>
      <div class="resumen-linea">
        <span>Percepciones y Retenciones sufridas</span>
        <span style="font-family:'Courier New',monospace">${fmt(totalPercepciones)}</span>
      </div>
      <div class="resumen-linea">
        <span>Impuestos internos</span>
        <span style="font-family:'Courier New',monospace">${fmt(totalImpuestos)}</span>
      </div>
      <div class="resumen-linea resumen-total">
        <span>TOTAL GENERAL</span>
        <span style="font-family:'Courier New',monospace">${fmt(totalGeneral)}</span>
      </div>
    </div>

    <!-- Pie -->
    <div class="footer">
      Generado el ${fmtFecha(new Date())} — TRANS-MAGG S.R.L. — Sistema de gestion
    </div>
  </div>
</body>
</html>`
}

/* -- PDF generation -------------------------------------------------------- */

export async function generarPDFLibroPercepciones(mesAnio: string): Promise<Buffer> {
  const { desde, hasta } = parsePeriodo(mesAnio)

  const [percepciones, impuestosInternos] = await Promise.all([
    obtenerPercepcionesSufridas(mesAnio, desde, hasta),
    obtenerImpuestosInternos(mesAnio),
  ])

  const html = generarHTML(mesAnio, percepciones, impuestosInternos)

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
