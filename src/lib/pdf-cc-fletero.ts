/**
 * Propósito: Generación del PDF de la Cuenta Corriente de un fletero con pdfkit.
 * Incluye cabecera con razón social + CUIT, rango de fechas, tabla cronológica
 * de movimientos (Fecha, Concepto, Comprobante, Debe, Haber, Saldo) y totales.
 */

import PDFDocument from "pdfkit"

export interface MovimientoCCFleteroPDF {
  fecha: string
  concepto: string
  comprobante: string
  debe: number
  haber: number
  saldo: number
}

export interface DatosPDFCCFletero {
  fletero: { razonSocial: string; cuit: string }
  movimientos: MovimientoCCFleteroPDF[]
  totalDebe: number
  totalHaber: number
  saldoFinal: number
  desde: Date | null
  hasta: Date
  logo?: Buffer | null
}

function fmtMoneda(n: number): string {
  const abs = Math.abs(n).toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  return n < 0 ? `- $ ${abs}` : `$ ${abs}`
}

function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "—"
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d))
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

// Columnas A4 portrait con margen 40: ancho útil 515 (40..555)
// Fecha | Concepto | Comprobante | Debe | Haber | Saldo
const COL_X = [40, 110, 240, 345, 420, 495]
const COL_W = [70, 130, 105,  75,  75,  60]

function drawTableHeader(doc: PDFKit.PDFDocument) {
  if (doc.y > 780) doc.addPage()
  const y = doc.y
  doc.rect(40, y, 515, 16).fill("#f0f0f0")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(8)
  const headers = ["Fecha", "Concepto", "Comprobante", "Debe", "Haber", "Saldo"]
  for (let i = 0; i < headers.length; i++) {
    const align = i >= 3 ? "right" : "left"
    doc.text(headers[i], COL_X[i], y + 4, { width: COL_W[i], align })
  }
  doc.font("Helvetica").fontSize(8)
  doc.y = y + 18
}

function drawRow(doc: PDFKit.PDFDocument, cells: string[]) {
  if (doc.y > 780) {
    doc.addPage()
    drawTableHeader(doc)
  }
  const y = doc.y
  doc.font("Helvetica").fontSize(8).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i >= 3 ? "right" : "left"
    doc.text(cells[i], COL_X[i], y + 2, { width: COL_W[i], align, lineBreak: false })
  }
  doc.y = y + 13
}

function drawTotalsRow(doc: PDFKit.PDFDocument, label: string, totalDebe: number, totalHaber: number, saldoFinal: number) {
  if (doc.y > 780) doc.addPage()
  const y = doc.y
  doc.rect(40, y, 515, 18).fill("#e5e7eb")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(8)
  doc.text(label, COL_X[0], y + 5, { width: COL_W[0] + COL_W[1] + COL_W[2], align: "right" })
  doc.text(fmtMoneda(totalDebe), COL_X[3], y + 5, { width: COL_W[3], align: "right" })
  doc.text(fmtMoneda(totalHaber), COL_X[4], y + 5, { width: COL_W[4], align: "right" })
  doc.text(fmtMoneda(saldoFinal), COL_X[5], y + 5, { width: COL_W[5], align: "right" })
  doc.font("Helvetica")
  doc.y = y + 20
}

/**
 * generarPDFCCFletero: DatosPDFCCFletero -> Promise<Buffer>
 *
 * Dado el fletero, rango de fechas, movimientos con saldo acumulado y totales,
 * genera un PDF A4 portrait con cabecera (razón social + CUIT + rango) y tabla
 * cronológica de movimientos más totales.
 *
 * Ejemplos:
 * generarPDFCCFletero({ fletero, movimientos: [], totalDebe: 0, totalHaber: 0, saldoFinal: 0, desde, hasta })
 * // => Buffer (PDF A4 con mensaje "Sin movimientos en el período")
 *
 * generarPDFCCFletero({ fletero, movimientos: [m1, m2], ... })
 * // => Buffer con 2 filas y totales
 */
export async function generarPDFCCFletero(datos: DatosPDFCCFletero): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Cabecera: logo solo arriba-izquierda; los datos de fletero van debajo
    const LOGO_X = 40
    const LOGO_Y = 40
    const LOGO_W = 120
    const LOGO_H = 55
    let cursorY = LOGO_Y

    if (datos.logo) {
      try {
        doc.image(datos.logo, LOGO_X, LOGO_Y, { fit: [LOGO_W, LOGO_H] })
        cursorY = LOGO_Y + LOGO_H + 12
      } catch {
        // Si el logo falla, seguimos sin logo
      }
    }

    doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
      .text(datos.fletero.razonSocial, 40, cursorY, { width: 515 })
    doc.font("Helvetica").fontSize(10).fillColor("#444")
      .text(`CUIT: ${fmtCuit(datos.fletero.cuit)}`, 40, doc.y, { width: 515 })

    doc.moveDown(0.3)
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
      .text("Cuenta Corriente", 40, doc.y, { width: 515 })
    doc.font("Helvetica").fontSize(9).fillColor("#555")
      .text(
        datos.desde
          ? `Período: ${fmtFecha(datos.desde)} al ${fmtFecha(datos.hasta)}`
          : `Al ${fmtFecha(datos.hasta)}`,
        40, doc.y, { width: 515 }
      )
    doc.fillColor("#000")

    // Separador
    doc.moveDown(0.3)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#1e40af").lineWidth(1.2).stroke()
    doc.moveDown(0.4)

    // Tabla
    drawTableHeader(doc)

    if (datos.movimientos.length === 0) {
      doc.font("Helvetica").fontSize(9).fillColor("#888")
      doc.text("Sin movimientos en el período.", 40, doc.y + 4, { width: 515, align: "center" })
      doc.fillColor("#000").moveDown(0.6)
    } else {
      for (const m of datos.movimientos) {
        drawRow(doc, [
          fmtFecha(m.fecha),
          m.concepto,
          m.comprobante || "—",
          m.debe > 0 ? fmtMoneda(m.debe) : "",
          m.haber > 0 ? fmtMoneda(m.haber) : "",
          fmtMoneda(m.saldo),
        ])
      }
    }

    const labelTotales = datos.desde
      ? `Totales desde ${fmtFecha(datos.desde)} hasta ${fmtFecha(datos.hasta)}:`
      : `Totales al ${fmtFecha(datos.hasta)}`
    drawTotalsRow(doc, labelTotales, datos.totalDebe, datos.totalHaber, datos.saldoFinal)

    // Footer
    doc.moveDown(1.2)
    doc.font("Helvetica").fontSize(8).fillColor("#888")
      .text(
        `Generado el ${fmtFecha(new Date())}`,
        40, doc.y, { align: "center", width: 515 }
      )

    doc.end()
  })
}
