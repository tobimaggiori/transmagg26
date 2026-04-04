/**
 * Proposito: Generacion del PDF del Libro de IIBB mensual con pdfkit.
 * Tres secciones: IIBB por Actividad, Percepciones/Retenciones, Resumen Jurisdiccional.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, multiplicarImporte, dividirImporte } from "@/lib/money"
import { calcularTotalViaje } from "@/lib/viajes"
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

interface FilaActividad {
  provincia: string
  facturaNro: string
  empresa: string
  fechaFactura: Date
  remito: string
  subtotalFactura: number
  totalEmpresa: number
  totalFletero: number
  comisionFact: number
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

/* -- Data fetching --------------------------------------------------------- */

async function obtenerDatosActividad(desde: Date, hasta: Date): Promise<FilaActividad[]> {
  const facturas = await prisma.facturaEmitida.findMany({
    where: {
      emitidaEn: { gte: desde, lt: hasta },
    },
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
    const totalFletero = calcularTotalViaje(kilos, tarifaFletero)
    const comisionFact = restarImportes(totalEmpresa, totalFletero)

    let comisionViaje = 0
    if (vel?.liquidacion) {
      const lp = vel.liquidacion
      if (lp.subtotalBruto > 0) {
        comisionViaje = multiplicarImporte(dividirImporte(lp.comisionMonto, lp.subtotalBruto), vel.subtotal)
      }
    }

    const baseIIBB = sumarImportes([comisionFact, comisionViaje])

    filas.push({
      provincia: vf.provinciaOrigen ?? "Sin provincia",
      facturaNro: vf.factura.nroComprobante ?? "Borrador",
      empresa: vf.factura.empresa.razonSocial,
      fechaFactura: vf.factura.emitidaEn,
      remito: vf.remito ?? "—",
      subtotalFactura: totalEmpresa,
      totalEmpresa,
      totalFletero,
      comisionFact,
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

/* Seccion 1: 7 columns */
const S1_X = [40, 85, 125, 190, 245, 310, 375, 440, 500]
const S1_W = [45, 40, 65, 55, 65, 65, 65, 60, 55]
const S1_HEADERS = ["Fecha", "Remito", "Empresa", "Mercad.", "Proced.", "Sub. Fact.", "Com. Fact.", "Com. LP", "Base IIBB"]

function drawS1Header(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < S1_HEADERS.length; i++) {
    const align = i >= 5 ? "right" : "left"
    doc.text(S1_HEADERS[i], S1_X[i], y + 3, { width: S1_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(40, y2).lineTo(555, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
  doc.font("Helvetica").fontSize(7)
}

function drawS1Row(doc: PDFKit.PDFDocument, cells: string[], bold = false) {
  checkPage(doc)
  const y = doc.y
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i >= 5 ? "right" : "left"
    doc.text(cells[i], S1_X[i], y + 1, { width: S1_W[i], align, lineBreak: false })
  }
  doc.y = y + 12
}

function drawS1ProvinciaHeader(doc: PDFKit.PDFDocument, provincia: string) {
  checkPage(doc)
  const y = doc.y
  doc.rect(40, y, 515, 14).fill("#e0e7ff")
  doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#1e40af")
  doc.text(provincia, 46, y + 3, { lineBreak: false })
  doc.fillColor("#000")
  doc.y = y + 16
}

function drawS1SubtotalRow(doc: PDFKit.PDFDocument, label: string, subFact: string, comFact: string, comLP: string, baseIIBB: string) {
  checkPage(doc)
  const y = doc.y
  doc.rect(40, y, 515, 14).fill("#f1f5f9")
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  doc.text(label, S1_X[0], y + 3, { width: S1_X[5] - S1_X[0], align: "right" })
  doc.text(subFact, S1_X[5], y + 3, { width: S1_W[5], align: "right" })
  doc.text(comFact, S1_X[6], y + 3, { width: S1_W[6], align: "right" })
  doc.text(comLP, S1_X[7], y + 3, { width: S1_W[7], align: "right" })
  doc.text(baseIIBB, S1_X[8], y + 3, { width: S1_W[8], align: "right" })
  doc.y = y + 16
}

/* Seccion 2 percepciones: 5 columns */
const SP_X = [40, 145, 280, 380, 460]
const SP_W = [105, 135, 100, 80, 70]
const SP_HEADERS = ["Tipo", "Proveedor", "Comprobante", "Fecha", "Monto"]

function drawPercHeader(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < SP_HEADERS.length; i++) {
    const align = i === 4 ? "right" : "left"
    doc.text(SP_HEADERS[i], SP_X[i], y + 3, { width: SP_W[i], align, lineBreak: false })
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
    const align = i === 4 ? "right" : "left"
    doc.text(cells[i], SP_X[i], y + 2, { width: SP_W[i], align, lineBreak: false })
  }
  doc.y = y + 13
}

/* Seccion 2 retenciones: 4 columns */
const SR_X = [40, 160, 330, 460]
const SR_W = [120, 170, 130, 70]
const SR_HEADERS = ["Recibo", "Empresa", "Fecha", "Monto"]

function drawRetHeader(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < SR_HEADERS.length; i++) {
    const align = i === 3 ? "right" : "left"
    doc.text(SR_HEADERS[i], SR_X[i], y + 3, { width: SR_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(40, y2).lineTo(555, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
  doc.font("Helvetica").fontSize(7)
}

function drawRetRow(doc: PDFKit.PDFDocument, cells: string[], bg?: string) {
  checkPage(doc)
  const y = doc.y
  if (bg) { doc.rect(40, y, 515, 12).fill(bg) }
  doc.font("Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i === 3 ? "right" : "left"
    doc.text(cells[i], SR_X[i], y + 2, { width: SR_W[i], align, lineBreak: false })
  }
  doc.y = y + 13
}

/* Seccion 3 resumen: 4 columns */
const S3_X = [40, 200, 330, 460]
const S3_W = [160, 130, 130, 70]
const S3_HEADERS = ["Provincia", "Total Facturado", "Base IIBB", "Perc. + Ret."]

function drawS3Header(doc: PDFKit.PDFDocument) {
  checkPage(doc)
  const y = doc.y
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(7).fillColor("#000")
  for (let i = 0; i < S3_HEADERS.length; i++) {
    const align = i >= 1 ? "right" : "left"
    doc.text(S3_HEADERS[i], S3_X[i], y + 3, { width: S3_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(40, y2).lineTo(555, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
  doc.font("Helvetica").fontSize(7)
}

function drawS3Row(doc: PDFKit.PDFDocument, cells: string[], bold = false, bg?: string) {
  checkPage(doc)
  const y = doc.y
  if (bg) { doc.rect(40, y, 515, 14).fill(bg) }
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(7.5).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i >= 1 ? "right" : "left"
    doc.text(cells[i], S3_X[i], y + 3, { width: S3_W[i], align, lineBreak: false })
  }
  doc.y = y + 15
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

export async function generarPDFLibroIIBB(mesAnio: string): Promise<Buffer> {
  const { desde, hasta } = parsePeriodo(mesAnio)

  const [filasActividad, percepciones, retenciones] = await Promise.all([
    obtenerDatosActividad(desde, hasta),
    obtenerPercepciones(desde, hasta),
    obtenerRetenciones(desde, hasta),
  ])

  // Pre-compute totals
  const porProvincia = new Map<string, FilaActividad[]>()
  for (const f of filasActividad) {
    const arr = porProvincia.get(f.provincia) ?? []
    arr.push(f)
    porProvincia.set(f.provincia, arr)
  }

  const provinciaTotales = new Map<string, { totalFacturado: number; baseIIBB: number }>()
  const totalBaseIIBB = sumarImportes(filasActividad.map(f => f.baseIIBB))
  const totalFacturado = sumarImportes(filasActividad.map(f => f.totalEmpresa))
  const totalPercepciones = sumarImportes(percepciones.map(p => p.monto))
  const totalRetenciones = sumarImportes(retenciones.map(r => r.monto))

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
    doc.font("Helvetica-Bold").fontSize(14).fillColor("#1e40af")
    doc.text("LIBRO DE INGRESOS BRUTOS", 300, 40, { width: 255, align: "right" })
    doc.font("Helvetica").fontSize(11).fillColor("#000")
    doc.text(fmtMesAnio(mesAnio), 300, doc.y, { width: 255, align: "right" })

    doc.y = Math.max(doc.y, 100)
    doc.moveDown(0.3)
    blueLine(doc)
    doc.moveDown(0.3)

    /* -- SECCION 1: IIBB POR ACTIVIDAD -- */
    sectionTitle(doc, "1. IIBB POR ACTIVIDAD (Transporte de Cargas)")
    drawS1Header(doc)

    for (const [provincia, filas] of Array.from(porProvincia.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      drawS1ProvinciaHeader(doc, provincia)

      for (const fila of filas) {
        drawS1Row(doc, [
          fmtFecha(fila.fechaFactura),
          fila.remito,
          fila.empresa,
          "",
          "",
          fmtNumero(fila.subtotalFactura),
          fmtNumero(fila.comisionFact),
          fmtNumero(fila.comisionViaje),
          fmtNumero(fila.baseIIBB),
        ])
      }

      const provTotalFacturado = sumarImportes(filas.map(f => f.totalEmpresa))
      const provSubtotalFact = sumarImportes(filas.map(f => f.subtotalFactura))
      const provComisionFact = sumarImportes(filas.map(f => f.comisionFact))
      const provComisionLP = sumarImportes(filas.map(f => f.comisionViaje))
      const provBaseIIBB = sumarImportes(filas.map(f => f.baseIIBB))

      drawS1SubtotalRow(doc, `Subtotal ${provincia}`, fmtNumero(provSubtotalFact), fmtNumero(provComisionFact), fmtNumero(provComisionLP), fmtNumero(provBaseIIBB))
      provinciaTotales.set(provincia, { totalFacturado: provTotalFacturado, baseIIBB: provBaseIIBB })
    }

    // Total general
    checkPage(doc)
    const tyG = doc.y
    doc.rect(40, tyG, 515, 16).fill("#e0e7ff")
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor("#000")
    doc.text("TOTAL GENERAL", S1_X[0], tyG + 4, { width: S1_X[3] - S1_X[0], align: "right" })
    doc.text(fmtNumero(totalFacturado), S1_X[3], tyG + 4, { width: S1_W[3], align: "right" })
    doc.text(fmtNumero(totalBaseIIBB), S1_X[6], tyG + 4, { width: S1_W[6], align: "right" })
    doc.y = tyG + 20
    doc.moveDown(0.8)

    /* -- SECCION 2: PERCEPCIONES Y RETENCIONES -- */
    sectionTitle(doc, "2. PERCEPCIONES Y RETENCIONES")

    if (percepciones.length > 0) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#000")
      doc.text("Percepciones sufridas", 40, doc.y)
      doc.moveDown(0.3)
      drawPercHeader(doc)

      percepciones.forEach((p, i) => {
        drawPercRow(doc, [
          p.tipo,
          p.proveedor,
          p.nroComprobante,
          fmtFecha(p.fecha),
          fmtNumero(p.monto),
        ], i % 2 !== 0 ? "#f8fafc" : undefined)
      })

      drawTotalRow(doc, "Total Percepciones", fmtNumero(totalPercepciones), SP_X[4], SP_W[4])
    } else {
      doc.font("Helvetica").fontSize(8).fillColor("#666")
      doc.text("Sin percepciones en el periodo.", 40, doc.y)
      doc.fillColor("#000")
    }

    doc.moveDown(0.5)

    if (retenciones.length > 0) {
      doc.font("Helvetica-Bold").fontSize(8).fillColor("#000")
      doc.text("Retenciones sufridas", 40, doc.y)
      doc.moveDown(0.3)
      drawRetHeader(doc)

      retenciones.forEach((r, i) => {
        drawRetRow(doc, [
          `Recibo #${r.nroRecibo}`,
          r.empresa,
          fmtFecha(r.fecha),
          fmtNumero(r.monto),
        ], i % 2 !== 0 ? "#f8fafc" : undefined)
      })

      drawTotalRow(doc, "Total Retenciones", fmtNumero(totalRetenciones), SR_X[3], SR_W[3])
    } else {
      doc.font("Helvetica").fontSize(8).fillColor("#666")
      doc.text("Sin retenciones en el periodo.", 40, doc.y)
      doc.fillColor("#000")
    }

    doc.moveDown(0.8)

    /* -- SECCION 3: RESUMEN JURISDICCIONAL -- */
    sectionTitle(doc, "3. RESUMEN JURISDICCIONAL")
    drawS3Header(doc)

    for (const [provincia, totales] of Array.from(provinciaTotales.entries()).sort((a, b) => a[0].localeCompare(b[0]))) {
      drawS3Row(doc, [
        provincia,
        fmt(totales.totalFacturado),
        fmt(totales.baseIIBB),
        "\u2014",
      ])
    }

    // Totals row
    drawS3Row(doc, [
      "TOTALES",
      fmt(totalFacturado),
      fmt(totalBaseIIBB),
      fmt(sumarImportes([totalPercepciones, totalRetenciones])),
    ], true, "#f1f5f9")

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
