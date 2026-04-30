/**
 * Propósito: Generación de PDFs del Libro IVA con pdfkit.
 *
 * Exporta cinco funciones puras input → Buffer:
 *
 *  - generarPDFLibroIva(asientos, mesAnio)
 *      Master: ambas secciones (Ventas + Compras) + posición neta. Se
 *      usa desde /api/iva/generar y /api/iva/[mesAnio]/email.
 *
 *  - generarPDFIvaVentas(asientos, periodoLabel)
 *  - generarPDFIvaCompras(asientos, periodoLabel)
 *      Una sección tabular (la que ve el operador en pantalla).
 *
 *  - generarPDFVentasPorAlicuota(asientos, periodoLabel)
 *  - generarPDFComprasPorAlicuota(asientos, periodoLabel)
 *      Agrupado por tipo de comprobante con subtotales por alícuota.
 *
 * Toda la lógica de "qué empresa / cuit / tipo / número mostrar" está
 * delegada en `src/lib/iva-portal/display-asientos.ts`. Pantalla y PDF
 * coinciden por construcción.
 */

import PDFDocument from "pdfkit"
import { sumarImportes, restarImportes, absMonetario } from "@/lib/money"
import {
  type AsientoDisplayInput,
  datosAsientoVenta,
  datosAsientoCompra,
} from "@/lib/iva-portal/display-asientos"

// ─── Asiento input shape ─────────────────────────────────────────────────────

/**
 * AsientoPdf: AsientoDisplayInput + campos del asiento (tipo, base, alícuota, IVA).
 */
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
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
  ]
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`
}

// ─── Layout shared ───────────────────────────────────────────────────────────

const PAGE_MARGIN = 36
const PAGE_WIDTH = 595 // A4 portrait width in points
const CONTENT_WIDTH = PAGE_WIDTH - PAGE_MARGIN * 2 // 523

function header(doc: PDFKit.PDFDocument, titulo: string, subtitulo: string) {
  doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
    .text("Libro de IVA Trans-Magg S.R.L.", PAGE_MARGIN, PAGE_MARGIN)
  doc.font("Helvetica").fontSize(9).fillColor("#666")
    .text("CUIT 30-70938168-3", { continued: false })
  doc.moveDown(0.4)
  doc.font("Helvetica-Bold").fontSize(11).fillColor("#000").text(titulo)
  doc.font("Helvetica").fontSize(8).fillColor("#666").text(subtitulo)
  doc.moveDown(0.3)
  doc.moveTo(PAGE_MARGIN, doc.y).lineTo(PAGE_WIDTH - PAGE_MARGIN, doc.y)
    .strokeColor("#1e40af").lineWidth(1).stroke()
  doc.moveDown(0.4)
  doc.fillColor("#000")
}

function footer(doc: PDFKit.PDFDocument) {
  doc.moveDown(1)
  doc.font("Helvetica").fontSize(7).fillColor("#999")
    .text(`Generado el ${fmtFecha(new Date())} · Trans-Magg S.R.L.`, PAGE_MARGIN, doc.y, {
      align: "center", width: CONTENT_WIDTH,
    })
  doc.fillColor("#000")
}

function checkPageBreak(doc: PDFKit.PDFDocument, threshold = 770) {
  if (doc.y > threshold) doc.addPage()
}

// ─── Tabla detalle (ventas o compras) ────────────────────────────────────────
// Columnas: Fecha · Empresa · CUIT · Tipo cbte. · Número · Neto · IVA
// Mismas que se ven en pantalla.

const COL_DETALLE_X = [PAGE_MARGIN,  88, 230, 308, 396, 460, 510]
const COL_DETALLE_W = [   52,       138,  78,  88,  62,  50,  49]
const COL_DETALLE_HEAD = ["Fecha", "Empresa", "CUIT", "Tipo cbte.", "Número", "Neto Grav.", "IVA"]
const COL_DETALLE_RIGHT_FROM = 5 // índices >= 5 alineados a la derecha

function drawDetalleHeader(doc: PDFKit.PDFDocument) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 14).fill("#e5e7eb")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  for (let i = 0; i < COL_DETALLE_HEAD.length; i++) {
    const align = i >= COL_DETALLE_RIGHT_FROM ? "right" : "left"
    doc.text(COL_DETALLE_HEAD[i], COL_DETALLE_X[i], y + 4, {
      width: COL_DETALLE_W[i], align, lineBreak: false,
    })
  }
  doc.font("Helvetica").fontSize(7)
  doc.y = y + 16
}

function drawDetalleRow(doc: PDFKit.PDFDocument, cells: string[]) {
  checkPageBreak(doc)
  const y = doc.y
  doc.font("Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i >= COL_DETALLE_RIGHT_FROM ? "right" : "left"
    doc.text(cells[i], COL_DETALLE_X[i], y + 2, {
      width: COL_DETALLE_W[i], align, lineBreak: false, ellipsis: true,
    })
  }
  doc.y = y + 12
}

function drawDetalleTotalsRow(doc: PDFKit.PDFDocument, totalNeto: number, totalIva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 14).fill("#f3f4f6")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  doc.text("TOTALES DEL PERÍODO", COL_DETALLE_X[0], y + 4, {
    width: COL_DETALLE_X[5] - COL_DETALLE_X[0] - 6, align: "right", lineBreak: false,
  })
  doc.text(fmt(totalNeto), COL_DETALLE_X[5], y + 4, {
    width: COL_DETALLE_W[5], align: "right", lineBreak: false,
  })
  doc.text(fmt(totalIva), COL_DETALLE_X[6], y + 4, {
    width: COL_DETALLE_W[6], align: "right", lineBreak: false,
  })
  doc.font("Helvetica").fontSize(7)
  doc.y = y + 18
}

function renderDetalle(
  doc: PDFKit.PDFDocument,
  asientos: AsientoPdf[],
  modo: "VENTAS" | "COMPRAS",
) {
  if (asientos.length === 0) {
    doc.font("Helvetica").fontSize(8).fillColor("#888")
      .text(`Sin asientos de IVA ${modo === "VENTAS" ? "Ventas" : "Compras"} en el período.`, PAGE_MARGIN, doc.y)
    doc.fillColor("#000").moveDown(0.5)
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
      fmt(a.baseImponible),
      `${fmt(a.montoIva)} (${a.alicuota}%)`,
    ])
    totalNeto = sumarImportes([totalNeto, a.baseImponible])
    totalIva = sumarImportes([totalIva, a.montoIva])
  }
  drawDetalleTotalsRow(doc, totalNeto, totalIva)
}

// ─── Tabla por alícuota ──────────────────────────────────────────────────────
// Agrupada por tipo de comprobante. Cada grupo muestra:
//   Alícuota | Cant. asientos | Neto | IVA  + subtotal del grupo
// Al final, total general.

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

const COL_ALIC_X = [PAGE_MARGIN, 130, 230, 380]
const COL_ALIC_W = [   86,        96,  146, 113]
const COL_ALIC_HEAD = ["Alícuota", "Cant. asientos", "Neto Gravado", "IVA"]

function drawAlicHeader(doc: PDFKit.PDFDocument) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 14).fill("#f3f4f6")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  for (let i = 0; i < COL_ALIC_HEAD.length; i++) {
    const align = i >= 1 ? "right" : "left"
    doc.text(COL_ALIC_HEAD[i], COL_ALIC_X[i], y + 4, {
      width: COL_ALIC_W[i], align, lineBreak: false,
    })
  }
  doc.font("Helvetica").fontSize(7)
  doc.y = y + 16
}

function drawAlicRow(doc: PDFKit.PDFDocument, alicuota: number, count: number, neto: number, iva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.font("Helvetica").fontSize(7).fillColor("#000")
  doc.text(`${alicuota}%`, COL_ALIC_X[0], y + 2, { width: COL_ALIC_W[0], lineBreak: false })
  doc.text(String(count), COL_ALIC_X[1], y + 2, { width: COL_ALIC_W[1], align: "right", lineBreak: false })
  doc.text(fmt(neto), COL_ALIC_X[2], y + 2, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(iva), COL_ALIC_X[3], y + 2, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.y = y + 12
}

function drawAlicSubtotal(doc: PDFKit.PDFDocument, tipo: string, neto: number, iva: number) {
  checkPageBreak(doc)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 13).fill("#e5e7eb")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  doc.text(`Subtotal ${tipo}`, COL_ALIC_X[0], y + 3, {
    width: COL_ALIC_X[2] - COL_ALIC_X[0] - 6, align: "right", lineBreak: false,
  })
  doc.text(fmt(neto), COL_ALIC_X[2], y + 3, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(iva), COL_ALIC_X[3], y + 3, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.font("Helvetica").fontSize(7)
  doc.y = y + 16
}

function renderAlicuotaSection(
  doc: PDFKit.PDFDocument,
  asientos: AsientoPdf[],
  modo: "VENTAS" | "COMPRAS",
) {
  if (asientos.length === 0) {
    doc.font("Helvetica").fontSize(8).fillColor("#888")
      .text(`Sin asientos de IVA ${modo === "VENTAS" ? "Ventas" : "Compras"} en el período.`, PAGE_MARGIN, doc.y)
    doc.fillColor("#000").moveDown(0.5)
    return
  }
  const grupos = agruparPorTipoYAlicuota(asientos, modo)
  let totalNeto = 0
  let totalIva = 0
  for (const g of grupos) {
    checkPageBreak(doc, 740)
    doc.font("Helvetica-Bold").fontSize(8.5).fillColor("#000")
      .text(`Tipo comprobante: ${g.tipo}`, PAGE_MARGIN, doc.y)
    doc.moveDown(0.2)
    drawAlicHeader(doc)
    for (const fila of g.filas) {
      drawAlicRow(doc, fila.alicuota, fila.count, fila.neto, fila.iva)
    }
    drawAlicSubtotal(doc, g.tipo, g.subtotalNeto, g.subtotalIva)
    doc.moveDown(0.4)
    totalNeto = sumarImportes([totalNeto, g.subtotalNeto])
    totalIva = sumarImportes([totalIva, g.subtotalIva])
  }
  // Total general
  checkPageBreak(doc, 750)
  const y = doc.y
  doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 16).fill("#1e40af")
  doc.fillColor("#fff").font("Helvetica-Bold").fontSize(8.5)
  doc.text(`TOTAL GENERAL ${modo}`, COL_ALIC_X[0] + 6, y + 5, {
    width: COL_ALIC_X[2] - COL_ALIC_X[0] - 12, lineBreak: false,
  })
  doc.text(fmt(totalNeto), COL_ALIC_X[2], y + 5, { width: COL_ALIC_W[2], align: "right", lineBreak: false })
  doc.text(fmt(totalIva), COL_ALIC_X[3], y + 5, { width: COL_ALIC_W[3], align: "right", lineBreak: false })
  doc.fillColor("#000").font("Helvetica").fontSize(7)
  doc.y = y + 20
}

// ─── Builder común ───────────────────────────────────────────────────────────

function buildPdf(callback: (doc: PDFKit.PDFDocument) => void): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: PAGE_MARGIN, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
    callback(doc)
    doc.end()
  })
}

// ─── Exports ─────────────────────────────────────────────────────────────────

/**
 * generarPDFLibroIva: AsientoPdf[] string -> Promise<Buffer>
 *
 * PDF master con Ventas + Compras detallado y Posición Neta. Se usa para el
 * archivo mensual que se sube a R2 y se manda por email.
 *
 * Ejemplos:
 * generarPDFLibroIva(asientos, "2026-04") => Buffer con %PDF magic
 */
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
    header(doc, `Libro IVA — ${nombreMes(mesAnio)}`, `${asientos.length} asiento(s)`)

    doc.font("Helvetica-Bold").fontSize(10).text(`IVA Ventas (${ventas.length})`, PAGE_MARGIN, doc.y)
    doc.moveDown(0.3)
    renderDetalle(doc, ventas, "VENTAS")
    doc.moveDown(0.6)

    doc.font("Helvetica-Bold").fontSize(10).text(`IVA Compras (${compras.length})`, PAGE_MARGIN, doc.y)
    doc.moveDown(0.3)
    renderDetalle(doc, compras, "COMPRAS")
    doc.moveDown(0.8)

    // Posición neta
    checkPageBreak(doc, 700)
    const y = doc.y
    doc.rect(PAGE_MARGIN, y, CONTENT_WIDTH, 50).lineWidth(1.5).strokeColor("#000").stroke()
    doc.font("Helvetica").fontSize(8).fillColor("#666")
    doc.text("IVA VENTAS", PAGE_MARGIN + 10, y + 8)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000").text(fmt(totalIvaV), PAGE_MARGIN + 10, y + 22)
    doc.font("Helvetica").fontSize(8).fillColor("#666")
    doc.text("IVA COMPRAS", PAGE_MARGIN + 180, y + 8)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000").text(fmt(totalIvaC), PAGE_MARGIN + 180, y + 22)
    doc.font("Helvetica").fontSize(8).fillColor("#666")
    doc.text("POSICIÓN NETA", PAGE_MARGIN + 360, y + 8)
    const posColor = posicion >= 0 ? "#dc2626" : "#16a34a"
    const posLabel = posicion >= 0 ? "A PAGAR" : "A FAVOR"
    doc.font("Helvetica-Bold").fontSize(11).fillColor(posColor)
    doc.text(`${fmt(absMonetario(posicion))} ${posLabel}`, PAGE_MARGIN + 360, y + 22)
    doc.y = y + 56
    doc.fillColor("#000")

    footer(doc)
  })
}

/**
 * generarPDFIvaVentas: AsientoPdf[] string -> Promise<Buffer>
 *
 * PDF tabular de IVA Ventas (la pestaña "IVA Ventas" de la pantalla).
 * Mismas columnas que la UI: Fecha · Empresa · CUIT · Tipo cbte. · Número · Neto · IVA.
 */
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

/**
 * generarPDFIvaCompras: AsientoPdf[] string -> Promise<Buffer>
 */
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

/**
 * generarPDFVentasPorAlicuota: AsientoPdf[] string -> Promise<Buffer>
 */
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

/**
 * generarPDFComprasPorAlicuota: AsientoPdf[] string -> Promise<Buffer>
 */
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
