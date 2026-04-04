/**
 * Proposito: Generacion del PDF del Libro de Percepciones e Impuestos mensual con pdfkit.
 * Dos secciones: Percepciones sufridas, Otros impuestos internos. Mas resumen del periodo.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"
import PDFDocument from "pdfkit"

/* -- Formatters ------------------------------------------------------------ */

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtNumero(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
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
  origen: string
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
      comprobante: r.facturaSeguro?.nroComprobante ?? "\u2014",
      proveedor: r.facturaSeguro?.aseguradora.razonSocial ?? "\u2014",
      fecha: r.facturaSeguro?.fecha ?? new Date(),
      tipo: r.tipo.replace(/_/g, " "),
      descripcion: r.descripcion,
      monto: r.monto,
    }
  })
}

/* -- PDF drawing helpers --------------------------------------------------- */

function blueLine(doc: PDFKit.PDFDocument) {
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#1e40af").lineWidth(1.5).stroke()
  doc.moveDown(0.3)
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  if (doc.y > 720) doc.addPage()
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e40af")
  doc.text(title, 40, doc.y)
  doc.moveDown(0.15)
  blueLine(doc)
  doc.fillColor("#000")
}

function checkPage(doc: PDFKit.PDFDocument) {
  if (doc.y > 750) doc.addPage()
}

/* Seccion 1 percepciones: 6 columns */
const P_X = [40, 115, 200, 300, 385, 465]
const P_W = [75, 85, 100, 85, 80, 65]
const P_HEADERS = ["Tipo", "Origen", "Proveedor / Emp.", "Comprobante", "Fecha", "Monto"]

function drawPercHeader(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < P_HEADERS.length; i++) {
    const align = i === 5 ? "right" : "left"
    doc.text(P_HEADERS[i], P_X[i], y + 3, { width: P_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(40, y2).lineTo(555, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
  doc.font("Helvetica").fontSize(7)
}

function drawPercRow(doc: PDFKit.PDFDocument, cells: string[], bg?: string) {
  checkPage(doc)
  const y = doc.y
  if (bg) { doc.rect(40, y, 515, 12).fill(bg) }
  doc.font("Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i === 5 ? "right" : "left"
    doc.text(cells[i], P_X[i], y + 2, { width: P_W[i], align, lineBreak: false })
  }
  doc.y = y + 13
}

/* Seccion 2 impuestos internos: 6 columns */
const I_X = [40, 115, 200, 300, 385, 465]
const I_W = [75, 85, 100, 85, 80, 65]
const I_HEADERS = ["Tipo", "Descripcion", "Proveedor", "Comprobante", "Fecha", "Monto"]

function drawImpHeader(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < I_HEADERS.length; i++) {
    const align = i === 5 ? "right" : "left"
    doc.text(I_HEADERS[i], I_X[i], y + 3, { width: I_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(40, y2).lineTo(555, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
  doc.font("Helvetica").fontSize(7)
}

function drawImpRow(doc: PDFKit.PDFDocument, cells: string[], bg?: string) {
  checkPage(doc)
  const y = doc.y
  if (bg) { doc.rect(40, y, 515, 12).fill(bg) }
  doc.font("Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i === 5 ? "right" : "left"
    doc.text(cells[i], I_X[i], y + 2, { width: I_W[i], align, lineBreak: false })
  }
  doc.y = y + 13
}

function drawTotalRow(doc: PDFKit.PDFDocument, label: string, value: string, colX: number, colW: number) {
  checkPage(doc)
  const y = doc.y
  doc.rect(40, y, 515, 14).fill("#e0e7ff")
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  doc.text(label, 40, y + 3, { width: colX - 40, align: "right" })
  doc.text(value, colX, y + 3, { width: colW, align: "right" })
  doc.y = y + 16
}

/* -- Main export ----------------------------------------------------------- */

export async function generarPDFLibroPercepciones(mesAnio: string): Promise<Buffer> {
  const { desde, hasta } = parsePeriodo(mesAnio)

  const [percepciones, impuestosInternos] = await Promise.all([
    obtenerPercepcionesSufridas(mesAnio, desde, hasta),
    obtenerImpuestosInternos(mesAnio),
  ])

  const totalPercepciones = sumarImportes(percepciones.map(p => p.monto))
  const totalImpuestos = sumarImportes(impuestosInternos.map(imp => imp.monto))
  const totalGeneral = sumarImportes([totalPercepciones, totalImpuestos])

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    /* -- Cabecera -- */
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
    doc.text("TRANS-MAGG S.R.L.", 40, 40)
    doc.font("Helvetica").fontSize(9).fillColor("#333")
    doc.text("C.U.I.T. 30-70938168-3")
    doc.text("Belgrano 184, 2109 Acebal (S.F.)")
    doc.text("Ing. Brutos Conv. Multi.: 0921-759945-2")

    // Title right-aligned
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#1e40af")
    doc.text("LIBRO DE PERCEPCIONES E IMPUESTOS", 280, 40, { width: 275, align: "right" })
    doc.font("Helvetica").fontSize(11).fillColor("#000")
    doc.text(fmtMesAnio(mesAnio), 280, doc.y, { width: 275, align: "right" })

    doc.y = Math.max(doc.y, 100)
    doc.moveDown(0.3)
    blueLine(doc)
    doc.moveDown(0.3)

    /* -- SECCION 1: PERCEPCIONES Y RETENCIONES SUFRIDAS -- */
    sectionTitle(doc, "1. PERCEPCIONES Y RETENCIONES SUFRIDAS")

    if (percepciones.length > 0) {
      drawPercHeader(doc)

      percepciones.forEach((p, i) => {
        drawPercRow(doc, [
          p.tipo,
          p.origen,
          p.proveedor,
          p.comprobante,
          fmtFecha(p.fecha),
          fmtNumero(p.monto),
        ], i % 2 !== 0 ? "#f8fafc" : undefined)
      })

      drawTotalRow(doc, "Total Percepciones y Retenciones", fmtNumero(totalPercepciones), P_X[5], P_W[5])
    } else {
      doc.font("Helvetica").fontSize(8).fillColor("#666")
      doc.text("Sin percepciones ni retenciones en el periodo.", 40, doc.y)
      doc.fillColor("#000")
    }

    doc.moveDown(0.8)

    /* -- SECCION 2: OTROS IMPUESTOS -- */
    sectionTitle(doc, "2. OTROS IMPUESTOS (Internos, ICL, CO2)")

    if (impuestosInternos.length > 0) {
      drawImpHeader(doc)

      impuestosInternos.forEach((imp, i) => {
        drawImpRow(doc, [
          imp.tipo,
          imp.descripcion ?? "\u2014",
          imp.proveedor,
          imp.comprobante,
          fmtFecha(imp.fecha),
          fmtNumero(imp.monto),
        ], i % 2 !== 0 ? "#f8fafc" : undefined)
      })

      drawTotalRow(doc, "Total Impuestos", fmtNumero(totalImpuestos), I_X[5], I_W[5])
    } else {
      doc.font("Helvetica").fontSize(8).fillColor("#666")
      doc.text("Sin impuestos internos en el periodo.", 40, doc.y)
      doc.fillColor("#000")
    }

    doc.moveDown(1)

    /* -- RESUMEN DEL PERIODO -- */
    if (doc.y > 680) doc.addPage()
    const boxY = doc.y
    doc.rect(40, boxY, 515, 70).strokeColor("#1e40af").lineWidth(1.5).stroke()

    doc.font("Helvetica-Bold").fontSize(10).fillColor("#1e40af")
    doc.text("RESUMEN DEL PERIODO", 52, boxY + 8)

    doc.font("Helvetica").fontSize(9).fillColor("#000")
    const lineY1 = boxY + 24
    doc.text("Percepciones y Retenciones sufridas", 52, lineY1)
    doc.text(fmt(totalPercepciones), 400, lineY1, { width: 145, align: "right" })

    const lineY2 = lineY1 + 14
    doc.text("Impuestos internos", 52, lineY2)
    doc.text(fmt(totalImpuestos), 400, lineY2, { width: 145, align: "right" })

    // Separator inside box
    const sepY = lineY2 + 16
    doc.moveTo(52, sepY).lineTo(545, sepY).strokeColor("#1e40af").lineWidth(0.8).stroke()

    const lineY3 = sepY + 4
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
    doc.text("TOTAL GENERAL", 52, lineY3)
    doc.text(fmt(totalGeneral), 400, lineY3, { width: 145, align: "right" })

    doc.y = boxY + 76

    /* -- Footer -- */
    doc.moveDown(1.5)
    doc.font("Helvetica").fontSize(7).fillColor("#666")
    doc.text(
      `Generado el ${fmtFecha(new Date())} \u2014 TRANS-MAGG S.R.L. \u2014 Sistema de gestion`,
      40, doc.y, { align: "center", width: 515 }
    )

    doc.end()
  })
}
