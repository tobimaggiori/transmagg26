/**
 * Proposito: Generacion del PDF de "Viajes propios" con pdfkit (A4 portrait).
 * Lista los viajes que tienen factura emitida pero no estan asociados a ninguna LP,
 * agrupados por provincia de origen.
 */

import PDFDocument from "pdfkit"
import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"

function fmtMoneda(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

function fmtComprobante(ptoVenta: number | null | undefined, nro: string | null | undefined): string {
  if (!nro) return "—"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const n = String(nro).padStart(8, "0")
  return `${pv}-${n}`
}

interface FilaViaje {
  fecha: Date
  empresa: string
  comprobante: string
  subtotal: number
}

interface SeccionProvincia {
  provincia: string
  filas: FilaViaje[]
  subtotal: number
}

/**
 * fitFontSize: (doc, text, maxWidth, baseSize, minSize) -> number
 *
 * Dado un texto y el ancho disponible en la celda, devuelve el tamaño
 * de fuente más grande dentro del rango [minSize, baseSize] que permite
 * que `text` entre completo. La función deja `doc.fontSize` en el valor
 * elegido para que el caller lo pueda usar inmediatamente.
 */
function fitFontSize(doc: PDFKit.PDFDocument, text: string, maxWidth: number, baseSize: number, minSize: number): number {
  doc.fontSize(baseSize)
  if (doc.widthOfString(text) <= maxWidth) return baseSize
  let size = baseSize
  while (size > minSize) {
    size -= 0.5
    doc.fontSize(size)
    if (doc.widthOfString(text) <= maxWidth) return size
  }
  doc.fontSize(minSize)
  return minSize
}

const MARGIN = 40
const PAGE_W = 595
const USABLE_W = PAGE_W - MARGIN * 2
const COL_X = [MARGIN, MARGIN + 60, MARGIN + 350, MARGIN + 440]
const COL_W = [60, 290, 90, 75]
const COL_HEADERS = ["Fecha", "Empresa", "Comprobante", "Subtotal"]
const ROW_H = 14

function checkPage(doc: PDFKit.PDFDocument, headerFn: () => void) {
  if (doc.y > 780) {
    doc.addPage()
    headerFn()
  }
}

function drawTableHeader(doc: PDFKit.PDFDocument) {
  const y = doc.y
  doc.moveTo(MARGIN, y).lineTo(MARGIN + USABLE_W, y).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#000")
  for (let i = 0; i < COL_HEADERS.length; i++) {
    const align = i === 3 ? "right" : "left"
    doc.text(COL_HEADERS[i], COL_X[i], y + 3, { width: COL_W[i], align, lineBreak: false })
  }
  const y2 = y + 14
  doc.moveTo(MARGIN, y2).lineTo(MARGIN + USABLE_W, y2).strokeColor("#1e40af").lineWidth(1).stroke()
  doc.y = y2 + 3
}

function drawProvinciaHeader(doc: PDFKit.PDFDocument, provincia: string) {
  const y = doc.y
  doc.rect(MARGIN, y, USABLE_W, 14).fill("#e0e7ff")
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#1e40af")
  doc.text(`PROVINCIA: ${provincia}`, MARGIN + 6, y + 3, { lineBreak: false })
  doc.fillColor("#000")
  doc.y = y + 16
}

function drawRow(doc: PDFKit.PDFDocument, fila: FilaViaje) {
  const y = doc.y
  doc.font("Helvetica").fillColor("#000")

  doc.fontSize(8).text(fmtFecha(fila.fecha), COL_X[0], y + 2, { width: COL_W[0], lineBreak: false })

  const empresaSize = fitFontSize(doc, fila.empresa, COL_W[1] - 4, 8, 5)
  doc.fontSize(empresaSize).text(fila.empresa, COL_X[1], y + 2 + (8 - empresaSize) / 2, {
    width: COL_W[1], lineBreak: false,
  })

  doc.fontSize(8).text(fila.comprobante, COL_X[2], y + 2, { width: COL_W[2], lineBreak: false })
  doc.text(fmtMoneda(fila.subtotal), COL_X[3], y + 2, { width: COL_W[3], align: "right", lineBreak: false })

  doc.moveTo(MARGIN, y + ROW_H).lineTo(MARGIN + USABLE_W, y + ROW_H).strokeColor("#e5e7eb").lineWidth(0.5).stroke()
  doc.y = y + ROW_H
}

function drawSubtotalProvincia(doc: PDFKit.PDFDocument, subtotal: number) {
  const y = doc.y
  doc.rect(MARGIN, y, USABLE_W, 14).fill("#f1f5f9")
  doc.font("Helvetica-Bold").fontSize(8).fillColor("#000")
  doc.text("Total de la Provincia", COL_X[0], y + 3, { width: COL_X[3] - COL_X[0] - 4, align: "right", lineBreak: false })
  doc.text(fmtMoneda(subtotal), COL_X[3], y + 3, { width: COL_W[3], align: "right", lineBreak: false })
  doc.y = y + 16
}

function drawTotalGeneral(doc: PDFKit.PDFDocument, total: number) {
  const y = doc.y
  doc.rect(MARGIN, y, USABLE_W, 18).fill("#cbd5e1")
  doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
  doc.text("TOTAL GENERAL", MARGIN + 8, y + 4, { lineBreak: false })
  doc.text(fmtMoneda(total), COL_X[3], y + 4, { width: COL_W[3], align: "right", lineBreak: false })
  doc.y = y + 22
}

async function obtenerSecciones(desde: Date, hasta: Date): Promise<SeccionProvincia[]> {
  const registros = await prisma.viajeEnFactura.findMany({
    where: {
      fechaViaje: { gte: desde, lt: hasta },
      viaje: { enLiquidaciones: { none: {} } },
    },
    include: {
      viaje: { include: { empresa: { select: { razonSocial: true } } } },
      factura: { select: { ptoVenta: true, nroComprobante: true } },
    },
    orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
  })

  const map = new Map<string, FilaViaje[]>()
  for (const r of registros) {
    const provincia = r.provinciaOrigen ?? "SIN PROVINCIA"
    const fila: FilaViaje = {
      fecha: r.fechaViaje,
      empresa: r.viaje.empresa.razonSocial,
      comprobante: fmtComprobante(r.factura.ptoVenta, r.factura.nroComprobante),
      subtotal: r.subtotal,
    }
    const arr = map.get(provincia) ?? []
    arr.push(fila)
    map.set(provincia, arr)
  }

  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([provincia, filas]) => ({
      provincia,
      filas,
      subtotal: sumarImportes(filas.map((f) => f.subtotal)),
    }))
}

/**
 * generarPDFViajesPropios: (desde, hasta, periodoLabel) -> Promise<Buffer>
 *
 * Genera un PDF A4 portrait con los viajes facturados sin LP en el período
 * [desde, hasta), agrupados por provincia. Incluye 4 columnas
 * (Fecha, Empresa, Comprobante, Subtotal), subtotal por provincia y total general.
 * El nombre de empresa se reduce automáticamente si excede el ancho de la columna.
 */
export async function generarPDFViajesPropios(desde: Date, hasta: Date, periodoLabel: string): Promise<Buffer> {
  const secciones = await obtenerSecciones(desde, hasta)
  const totalGeneral = sumarImportes(secciones.map((s) => s.subtotal))
  const totalViajes = secciones.reduce((acc, s) => acc + s.filas.length, 0)

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: MARGIN, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (c: Buffer) => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const drawHeaderTop = () => {
      doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
      doc.text("Transmagg — Viajes propios", MARGIN, MARGIN)
      doc.font("Helvetica").fontSize(9).fillColor("#444")
      doc.text(`Período: ${periodoLabel}  ·  ${totalViajes} viaje(s)  ·  Generado: ${fmtFecha(new Date())}`, MARGIN, doc.y + 2)
      doc.moveDown(0.5)
      doc.fillColor("#000")
    }

    drawHeaderTop()

    if (secciones.length === 0) {
      doc.font("Helvetica").fontSize(10).fillColor("#666")
      doc.text("Sin viajes para el período seleccionado.", MARGIN, doc.y + 10)
      doc.end()
      return
    }

    for (const sec of secciones) {
      checkPage(doc, drawHeaderTop)
      drawProvinciaHeader(doc, sec.provincia)
      drawTableHeader(doc)
      for (const fila of sec.filas) {
        checkPage(doc, drawHeaderTop)
        drawRow(doc, fila)
      }
      drawSubtotalProvincia(doc, sec.subtotal)
      doc.moveDown(0.4)
    }

    drawTotalGeneral(doc, totalGeneral)

    doc.end()
  })
}
