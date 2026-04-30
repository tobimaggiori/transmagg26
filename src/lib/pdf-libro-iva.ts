/**
 * Propósito: Generación de PDFs del Libro IVA con pdfkit.
 *
 * Layout: A4 LANDSCAPE para tener room cómodo en las tablas. Tipografía
 * estándar de `src/lib/pdf-style.ts`.
 *
 * Exporta:
 *  - generarPDFLibroIva(asientos, mesAnio): master con Ventas + Compras
 *    + posición neta. Usado por /api/iva/generar y /api/iva/[mesAnio]/email.
 *  - generarPDFIvaVentas(asientos, periodoLabel): pestaña Ventas detallada.
 *  - generarPDFIvaCompras(asientos, periodoLabel): pestaña Compras detallada.
 *  - generarPDFVentasPorAlicuota(asientos, periodoLabel): agrupado.
 *  - generarPDFComprasPorAlicuota(asientos, periodoLabel): agrupado.
 *
 * Toda la lógica de "qué empresa / cuit / tipo / número mostrar" está
 * delegada en `src/lib/iva-portal/display-asientos.ts`. Pantalla y PDF
 * coinciden por construcción.
 */

import PDFDocument from "pdfkit"
import { sumarImportes, restarImportes, absMonetario } from "@/lib/money"
import { PDF_FONT, PDF_COLOR, PDF_MARGIN } from "@/lib/pdf-style"
import {
  type AsientoDisplayInput,
  datosAsientoVenta,
  datosAsientoCompra,
} from "@/lib/iva-portal/display-asientos"

// ─── Asiento input shape ─────────────────────────────────────────────────────

export type AsientoPdf = AsientoDisplayInput & {
  id: string
  tipo: string
  baseImponible: number
  alicuota: number
  montoIva: number
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d))
}

function fmtCuit(cuit: string | null | undefined): string {
  if (!cuit) return "—"
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function nombreMes(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const meses = [
    "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
    "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
  ]
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`
}

// ─── Layout (A4 LANDSCAPE) ───────────────────────────────────────────────────

const PAGE_WIDTH = 842
const PAGE_HEIGHT = 595
const CONTENT_WIDTH = PAGE_WIDTH - PDF_MARGIN * 2  // 770
const PAGE_BREAK_Y = PAGE_HEIGHT - PDF_MARGIN - 30 // deja espacio para footer

function header(doc: PDFKit.PDFDocument, titulo: string, subtitulo: string) {
  doc.font("Helvetica-Bold").fontSize(PDF_FONT.TITLE).fillColor(PDF_COLOR.TEXT)
    .text("Libro de IVA Trans-Magg S.R.L.", PDF_MARGIN, PDF_MARGIN)
  doc.font("Helvetica").fontSize(PDF_FONT.SUBTITLE).fillColor(PDF_COLOR.TEXT_MUTED)
    .text("CUIT 30-70938168-3")
  doc.moveDown(0.5)
  doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT).text(titulo)
  doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_MUTED).text(subtitulo)
  doc.moveDown(0.4)
  doc.moveTo(PDF_MARGIN, doc.y).lineTo(PAGE_WIDTH - PDF_MARGIN, doc.y)
    .strokeColor(PDF_COLOR.NAVY).lineWidth(1).stroke()
  doc.moveDown(0.5)
  doc.fillColor(PDF_COLOR.TEXT)
}

function footer(doc: PDFKit.PDFDocument) {
  doc.moveDown(0.8)
  doc.font("Helvetica").fontSize(PDF_FONT.FOOTER).fillColor(PDF_COLOR.TEXT_DIM)
    .text(`Generado el ${fmtFecha(new Date())} · Trans-Magg S.R.L.`, PDF_MARGIN, doc.y, {
      align: "center", width: CONTENT_WIDTH,
    })
  doc.fillColor(PDF_COLOR.TEXT)
}

function checkPageBreak(doc: PDFKit.PDFDocument, threshold = PAGE_BREAK_Y) {
  if (doc.y > threshold) doc.addPage()
}

// ─── Tabla detalle (ventas o compras) ────────────────────────────────────────
// Columnas (770pt total): Fecha · Empresa · CUIT · Tipo cbte. · Número · Alíc · Neto · IVA

const COL_DET_X = [PDF_MARGIN,  98,  238, 320,  450, 540, 590, 690]
const COL_DET_W = [   58,      136,  78,  126,   86,  44,  96,  90]
const COL_DET_HEAD = ["Fecha", "Empresa", "CUIT", "Tipo cbte.", "Número", "Alíc.", "Neto Grav.", "IVA"]
const COL_DET_RIGHT_FROM = 5

const ROW_HEIGHT = 14
const HEADER_ROW_HEIGHT = 16
const TOTAL_ROW_HEIGHT = 18

function drawDetalleHeader(doc: PDFKit.PDFDocument) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill(PDF_COLOR.HEADER_BG)
  doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_HEAD)
  for (let i = 0; i < COL_DET_HEAD.length; i++) {
    const align = i >= COL_DET_RIGHT_FROM ? "right" : "left"
    doc.text(COL_DET_HEAD[i], COL_DET_X[i], y + 4, {
      width: COL_DET_W[i], align, lineBreak: false,
    })
  }
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
  doc.y = y + HEADER_ROW_HEIGHT + 2
}

function drawDetalleRow(doc: PDFKit.PDFDocument, cells: string[]) {
  checkPageBreak(doc)
  const y = doc.y
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY).fillColor(PDF_COLOR.TEXT)
  for (let i = 0; i < cells.length; i++) {
    const align = i >= COL_DET_RIGHT_FROM ? "right" : "left"
    doc.text(cells[i], COL_DET_X[i], y + 2, {
      width: COL_DET_W[i], align, lineBreak: false, ellipsis: true,
    })
  }
  doc.y = y + ROW_HEIGHT
}

function drawDetalleTotalsRow(doc: PDFKit.PDFDocument, totalNeto: number, totalIva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, TOTAL_ROW_HEIGHT).fill(PDF_COLOR.TOTALS_BG)
  doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_TOTAL)
  doc.text("TOTALES DEL PERÍODO", COL_DET_X[0], y + 5, {
    width: COL_DET_X[6] - COL_DET_X[0] - 6, align: "right", lineBreak: false,
  })
  doc.text(fmt(totalNeto), COL_DET_X[6], y + 5, {
    width: COL_DET_W[6], align: "right", lineBreak: false,
  })
  doc.text(fmt(totalIva), COL_DET_X[7], y + 5, {
    width: COL_DET_W[7], align: "right", lineBreak: false,
  })
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
  doc.y = y + TOTAL_ROW_HEIGHT + 4
}

function renderDetalle(
  doc: PDFKit.PDFDocument,
  asientos: AsientoPdf[],
  modo: "VENTAS" | "COMPRAS",
) {
  if (asientos.length === 0) {
    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_DIM)
      .text(`Sin asientos de IVA ${modo === "VENTAS" ? "Ventas" : "Compras"} en el período.`, PDF_MARGIN, doc.y)
    doc.fillColor(PDF_COLOR.TEXT).moveDown(0.5)
    return
  }

  drawDetalleHeader(doc)
  let totalNeto = 0
  let totalIva = 0
  for (const a of asientos) {
    const d = modo === "VENTAS" ? datosAsientoVenta(a) : datosAsientoCompra(a)
    drawDetalleRow(doc, [
      fmtFecha(d.fecha),
      d.empresa,
      fmtCuit(d.cuit),
      d.tipoCbte,
      d.nroCbte,
      `${a.alicuota}%`,
      fmt(a.baseImponible),
      fmt(a.montoIva),
    ])
    totalNeto = sumarImportes([totalNeto, a.baseImponible])
    totalIva = sumarImportes([totalIva, a.montoIva])
  }
  drawDetalleTotalsRow(doc, totalNeto, totalIva)
}

// ─── Tabla por alícuota ──────────────────────────────────────────────────────

function agruparPorTipoYAlicuota(
  asientos: AsientoPdf[],
  modo: "VENTAS" | "COMPRAS",
): Array<{ tipo: string; filas: Array<{ alicuota: number; count: number; neto: number; iva: number }>; subtotalNeto: number; subtotalIva: number }> {
  const map = new Map<string, Map<number, { count: number; neto: number; iva: number }>>()
  for (const a of asientos) {
    const tipo = (modo === "VENTAS" ? datosAsientoVenta(a) : datosAsientoCompra(a)).tipoCbte
    if (!map.has(tipo)) map.set(tipo, new Map())
    const inner = map.get(tipo)!
    const prev = inner.get(a.alicuota) ?? { count: 0, neto: 0, iva: 0 }
    inner.set(a.alicuota, {
      count: prev.count + 1,
      neto: sumarImportes([prev.neto, a.baseImponible]),
      iva: sumarImportes([prev.iva, a.montoIva]),
    })
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([tipo, inner]) => {
      const filas = Array.from(inner.entries())
        .sort(([a], [b]) => a - b)
        .map(([alicuota, v]) => ({ alicuota, ...v }))
      const subtotalNeto = sumarImportes(filas.map(f => f.neto))
      const subtotalIva = sumarImportes(filas.map(f => f.iva))
      return { tipo, filas, subtotalNeto, subtotalIva }
    })
}

const COL_ALIC_X = [PDF_MARGIN, 200, 360, 560]
const COL_ALIC_W = [   140,     140, 180,  180]
const COL_ALIC_HEAD = ["Alícuota", "Cant. asientos", "Neto Gravado", "IVA"]

function drawAlicHeader(doc: PDFKit.PDFDocument) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill(PDF_COLOR.TOTALS_BG)
  doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_HEAD)
  for (let i = 0; i < COL_ALIC_HEAD.length; i++) {
    const align = i >= 1 ? "right" : "left"
    doc.text(COL_ALIC_HEAD[i], COL_ALIC_X[i], y + 4, {
      width: COL_ALIC_W[i], align, lineBreak: false,
    })
  }
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
  doc.y = y + HEADER_ROW_HEIGHT + 2
}

function drawAlicRow(doc: PDFKit.PDFDocument, alicuota: number, count: number, neto: number, iva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY).fillColor(PDF_COLOR.TEXT)
  doc.text(`${alicuota}%`, COL_ALIC_X[0], y + 2, { width: COL_ALIC_W[0], lineBreak: false })
  doc.text(String(count), COL_ALIC_X[1], y + 2, { width: COL_ALIC_W[1], align: "right", lineBreak: false })
  doc.text(fmt(neto), COL_ALIC_X[2], y + 2, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(iva), COL_ALIC_X[3], y + 2, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.y = y + ROW_HEIGHT
}

function drawAlicSubtotal(doc: PDFKit.PDFDocument, tipo: string, neto: number, iva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, HEADER_ROW_HEIGHT).fill(PDF_COLOR.HEADER_BG)
  doc.fillColor(PDF_COLOR.TEXT).font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_TOTAL)
  doc.text(`Subtotal ${tipo}`, COL_ALIC_X[0], y + 4, {
    width: COL_ALIC_X[2] - COL_ALIC_X[0] - 6, align: "right", lineBreak: false,
  })
  doc.text(fmt(neto), COL_ALIC_X[2], y + 4, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(iva), COL_ALIC_X[3], y + 4, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
  doc.y = y + HEADER_ROW_HEIGHT + 4
}

function renderAlicuotaSection(
  doc: PDFKit.PDFDocument,
  asientos: AsientoPdf[],
  modo: "VENTAS" | "COMPRAS",
) {
  if (asientos.length === 0) {
    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_DIM)
      .text(`Sin asientos de IVA ${modo === "VENTAS" ? "Ventas" : "Compras"} en el período.`, PDF_MARGIN, doc.y)
    doc.fillColor(PDF_COLOR.TEXT).moveDown(0.5)
    return
  }
  const grupos = agruparPorTipoYAlicuota(asientos, modo)
  let totalNeto = 0
  let totalIva = 0
  for (const g of grupos) {
    checkPageBreak(doc, PAGE_BREAK_Y - 60)
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
      .text(`Tipo comprobante: ${g.tipo}`, PDF_MARGIN, doc.y)
    doc.moveDown(0.3)
    drawAlicHeader(doc)
    for (const fila of g.filas) {
      drawAlicRow(doc, fila.alicuota, fila.count, fila.neto, fila.iva)
    }
    drawAlicSubtotal(doc, g.tipo, g.subtotalNeto, g.subtotalIva)
    doc.moveDown(0.5)
    totalNeto = sumarImportes([totalNeto, g.subtotalNeto])
    totalIva = sumarImportes([totalIva, g.subtotalIva])
  }
  // Total general
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, TOTAL_ROW_HEIGHT + 2).fill(PDF_COLOR.NAVY)
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(PDF_FONT.TABLE_TOTAL)
  doc.text(`TOTAL GENERAL ${modo}`, COL_ALIC_X[0] + 6, y + 5, {
    width: COL_ALIC_X[2] - COL_ALIC_X[0] - 12, lineBreak: false,
  })
  doc.text(fmt(totalNeto), COL_ALIC_X[2], y + 5, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(totalIva), COL_ALIC_X[3], y + 5, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.fillColor(PDF_COLOR.TEXT).font("Helvetica").fontSize(PDF_FONT.TABLE_BODY)
  doc.y = y + TOTAL_ROW_HEIGHT + 6
}

// ─── Builder común ───────────────────────────────────────────────────────────

function buildPdf(callback: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PDF_MARGIN, size: "A4", layout: "landscape" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    callback(doc)
    doc.end()
  })
}

// ─── Exports ─────────────────────────────────────────────────────────────────

export async function generarPDFLibroIva(
  asientos: AsientoPdf[],
  mesAnio: string,
): Promise<Buffer> {
  const ventas = asientos.filter(a => a.tipo === "VENTA")
  const compras = asientos.filter(a => a.tipo === "COMPRA")
  const totalIvaV = sumarImportes(ventas.map(a => a.montoIva))
  const totalIvaC = sumarImportes(compras.map(a => a.montoIva))
  const posicion = restarImportes(totalIvaV, totalIvaC)

  return buildPdf((doc) => {
    header(doc, `Libro IVA — ${nombreMes(mesAnio)}`, `${asientos.length} asiento(s) total`)

    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
      .text(`IVA Ventas (${ventas.length})`, PDF_MARGIN, doc.y)
    doc.moveDown(0.3)
    renderDetalle(doc, ventas, "VENTAS")
    doc.moveDown(0.7)

    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
      .text(`IVA Compras (${compras.length})`, PDF_MARGIN, doc.y)
    doc.moveDown(0.3)
    renderDetalle(doc, compras, "COMPRAS")
    doc.moveDown(0.8)

    // Posición neta
    checkPageBreak(doc, PAGE_BREAK_Y - 60)
    const y = doc.y
    doc.rect(PDF_MARGIN, y, CONTENT_WIDTH, 56).lineWidth(1.5).strokeColor(PDF_COLOR.TEXT).stroke()
    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_MUTED)
    doc.text("IVA VENTAS", PDF_MARGIN + 16, y + 10)
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
      .text(fmt(totalIvaV), PDF_MARGIN + 16, y + 26)

    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_MUTED)
    doc.text("IVA COMPRAS", PDF_MARGIN + 270, y + 10)
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(PDF_COLOR.TEXT)
      .text(fmt(totalIvaC), PDF_MARGIN + 270, y + 26)

    doc.font("Helvetica").fontSize(PDF_FONT.CAPTION).fillColor(PDF_COLOR.TEXT_MUTED)
    doc.text("POSICIÓN NETA", PDF_MARGIN + 540, y + 10)
    const posColor = posicion >= 0 ? PDF_COLOR.RED : PDF_COLOR.GREEN
    const posLabel = posicion >= 0 ? "A PAGAR" : "A FAVOR"
    doc.font("Helvetica-Bold").fontSize(PDF_FONT.SECTION).fillColor(posColor)
      .text(`${fmt(absMonetario(posicion))} ${posLabel}`, PDF_MARGIN + 540, y + 26)
    doc.y = y + 64
    doc.fillColor(PDF_COLOR.TEXT)

    footer(doc)
  })
}

export async function generarPDFIvaVentas(
  asientos: AsientoPdf[],
  periodoLabel: string,
): Promise<Buffer> {
  const ventas = asientos.filter(a => a.tipo === "VENTA")
  return buildPdf((doc) => {
    header(doc, "IVA Ventas", `Período: ${periodoLabel} · ${ventas.length} asiento(s)`)
    renderDetalle(doc, ventas, "VENTAS")
    footer(doc)
  })
}

export async function generarPDFIvaCompras(
  asientos: AsientoPdf[],
  periodoLabel: string,
): Promise<Buffer> {
  const compras = asientos.filter(a => a.tipo === "COMPRA")
  return buildPdf((doc) => {
    header(doc, "IVA Compras", `Período: ${periodoLabel} · ${compras.length} asiento(s)`)
    renderDetalle(doc, compras, "COMPRAS")
    footer(doc)
  })
}

export async function generarPDFVentasPorAlicuota(
  asientos: AsientoPdf[],
  periodoLabel: string,
): Promise<Buffer> {
  const ventas = asientos.filter(a => a.tipo === "VENTA")
  return buildPdf((doc) => {
    header(doc, "Ventas por Alícuota", `Período: ${periodoLabel} · ${ventas.length} asiento(s)`)
    renderAlicuotaSection(doc, ventas, "VENTAS")
    footer(doc)
  })
}

export async function generarPDFComprasPorAlicuota(
  asientos: AsientoPdf[],
  periodoLabel: string,
): Promise<Buffer> {
  const compras = asientos.filter(a => a.tipo === "COMPRA")
  return buildPdf((doc) => {
    header(doc, "Compras por Alícuota", `Período: ${periodoLabel} · ${compras.length} asiento(s)`)
    renderAlicuotaSection(doc, compras, "COMPRAS")
    footer(doc)
  })
}
