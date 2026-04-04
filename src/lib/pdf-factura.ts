/**
 * Propósito: Generación del PDF de Factura Emitida a empresa.
 * Layout consistente con pdf-liquidacion.ts: cabecera, timbre, tabla, totales, pie con CAE/QR.
 * Usa pdfkit para generar el PDF directamente (sin Puppeteer).
 */

import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import { obtenerUrlQRFiscal } from "@/lib/arca/qr"

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtNumero(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtKilos(n: number): string {
  return n.toLocaleString("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function fmtNroCbte(ptoVenta: number | null, nro: string | null): string {
  if (!ptoVenta || !nro) return "Borrador"
  const n = parseInt(nro)
  if (isNaN(n)) return nro
  return `${String(ptoVenta).padStart(4, "0")}-${String(n).padStart(8, "0")}`
}

function letraCbte(tipoCbte: number): string {
  if (tipoCbte === 1 || tipoCbte === 201) return "A"
  if (tipoCbte === 6) return "B"
  return "X"
}

function blueLine(doc: PDFKit.PDFDocument) {
  const y = doc.y + 4
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1.5).stroke()
  doc.y = y + 6
}

function blueLineThin(doc: PDFKit.PDFDocument) {
  const y = doc.y + 3
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(0.8).stroke()
  doc.y = y + 5
}

/**
 * generarPDFFactura: (facturaId: string) -> Promise<Buffer>
 *
 * Genera el PDF de una factura emitida a empresa. Incluye CAE, QR fiscal
 * y número definitivo si la factura fue autorizada en ARCA.
 *
 * @param facturaId — UUID de la factura.
 * @returns Buffer con el PDF generado.
 * @throws Error si la factura no existe.
 */
export async function generarPDFFactura(facturaId: string): Promise<Buffer> {
  const fac = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
      viajes: {
        orderBy: { fechaViaje: "asc" },
        select: {
          fechaViaje: true,
          remito: true,
          mercaderia: true,
          procedencia: true,
          destino: true,
          kilos: true,
          tarifaEmpresa: true,
          subtotal: true,
        },
      },
    },
  })

  if (!fac) throw new Error(`Factura ${facturaId} no encontrada`)

  const nroCbte = fmtNroCbte(fac.ptoVenta, fac.nroComprobante)
  const letra = letraCbte(fac.tipoCbte)

  // QR: usar fiscal si autorizada, sino no incluir QR
  let qrBuffer: Buffer | null = null
  if (fac.qrData) {
    try {
      const qrUrl = obtenerUrlQRFiscal(fac.qrData)
      qrBuffer = await QRCode.toBuffer(qrUrl, { width: 160, margin: 1 })
    } catch { /* skip */ }
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageLeft = 40
    const pageRight = 555

    /* ── HEADER ── */
    const headerTop = doc.y

    doc.font("Helvetica-Bold").fontSize(13).text("TRANS-MAGG S.R.L.", pageLeft, headerTop, { width: 180 })
    doc.font("Helvetica").fontSize(9).fillColor("#333333")
      .text("C.U.I.T. 30-70938168-3", pageLeft, doc.y + 2, { width: 180 })
    doc.text("Belgrano 184, 2109 Acebal (S.F.)", { width: 180 })
    doc.text("Tel: (03469) 15695306", { width: 180 })
    const afterLeftY = doc.y

    // Timbre
    const timbreX = 250, timbreY = headerTop, timbreW = 60, timbreH = 42
    doc.strokeColor("#000000").lineWidth(2).rect(timbreX, timbreY, timbreW, timbreH).stroke()
    doc.font("Helvetica-Bold").fontSize(28).fillColor("#000000")
      .text(letra, timbreX, timbreY + 4, { width: timbreW, align: "center" })
    doc.font("Helvetica").fontSize(9).fillColor("#555555")
      .text(`Código ${String(fac.tipoCbte).padStart(3, "0")}`, timbreX, timbreY + 30, { width: timbreW, align: "center" })

    // Right column
    const rightX = 350
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000")
      .text(`Factura ${letra}${fac.tipoCbte === 201 ? " MiPyME" : ""}`, rightX, headerTop, { width: pageRight - rightX, align: "right" })
    const detailY = headerTop + 18
    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    const lines = [
      `Nro: ${nroCbte}`,
      `Fecha: ${fmtFecha(fac.emitidaEn)}`,
      `Responsable Inscripto`,
      `C.U.I.T.: 30-70938168-3`,
      `Ing. Brutos Conv. Multi.: 0921-759945-2`,
    ]
    lines.forEach((line, i) => {
      doc.text(line, rightX, detailY + i * 12, { width: pageRight - rightX, align: "right" })
    })
    doc.y = Math.max(afterLeftY, detailY + lines.length * 12) + 4
    blueLine(doc)

    /* ── Empresa data ── */
    doc.fillColor("#000000").fontSize(10)
    doc.font("Helvetica-Bold").text("Sres: ", pageLeft, doc.y, { continued: true })
    doc.font("Helvetica").text(fac.empresa.razonSocial.toUpperCase())
    doc.font("Helvetica-Bold").text("Domicilio: ", pageLeft, doc.y + 2, { continued: true })
    doc.font("Helvetica").text((fac.empresa as { direccion?: string | null }).direccion ?? "—")
    doc.font("Helvetica-Bold").text("C.U.I.T.: ", pageLeft, doc.y + 2, { continued: true })
    doc.font("Helvetica").text(fmtCuit(fac.empresa.cuit))
    doc.y += 2
    blueLineThin(doc)

    /* ── Table ── */
    const headers = ["Fecha", "Remito", "Mercadería", "Procedencia", "Destino", "Kilos", "Tarifa", "STotal"]
    const colWidths = [58, 58, 80, 72, 60, 48, 55, 55]
    const rightAlignCols = new Set([5, 6, 7])

    const tableHeaderY = doc.y
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000")
    doc.moveTo(pageLeft, tableHeaderY - 1).lineTo(pageRight, tableHeaderY - 1).strokeColor("#1e40af").lineWidth(1.5).stroke()
    let x = pageLeft
    headers.forEach((h, i) => {
      doc.text(h, x + 2, tableHeaderY + 2, { width: colWidths[i] - 4, align: rightAlignCols.has(i) ? "right" : "left" })
      x += colWidths[i]
    })
    const headerBottomY = tableHeaderY + 14
    doc.moveTo(pageLeft, headerBottomY).lineTo(pageRight, headerBottomY).strokeColor("#1e40af").lineWidth(1.5).stroke()

    doc.font("Helvetica").fontSize(7)
    let rowY = headerBottomY + 3
    fac.viajes.forEach((v, idx) => {
      if (idx % 2 !== 0) {
        doc.save().rect(pageLeft, rowY - 1, pageRight - pageLeft, 13).fill("#f8fafc").restore()
      }
      doc.fillColor("#000000")
      x = pageLeft
      const cells = [
        fmtFecha(v.fechaViaje),
        v.remito ?? "—",
        v.mercaderia ?? "—",
        v.procedencia ?? "—",
        v.destino ?? "—",
        v.kilos != null ? fmtKilos(v.kilos) : "—",
        fmtNumero(v.tarifaEmpresa),
        fmtNumero(v.subtotal),
      ]
      cells.forEach((cell, i) => {
        doc.text(cell, x + 2, rowY, { width: colWidths[i] - 4, align: rightAlignCols.has(i) ? "right" : "left" })
        x += colWidths[i]
      })
      rowY += 13
    })
    doc.y = rowY + 2
    blueLineThin(doc)

    /* ── Totals ── */
    const totalsWidth = 280
    const totalsLeft = pageRight - totalsWidth
    const labelW = 170, valorW = 100, valorX = totalsLeft + labelW + 10

    function totalRow(label: string, valor: string, opts?: { bold?: boolean; fontSize?: number }) {
      const fs = opts?.fontSize ?? 10
      doc.fontSize(fs)
      if (opts?.bold) doc.font("Helvetica-Bold"); else doc.font("Helvetica")
      doc.fillColor("#000000")
      const y = doc.y
      doc.text(label, totalsLeft, y, { width: labelW, align: "left" })
      doc.font(opts?.bold ? "Helvetica-Bold" : "Courier").text(valor, valorX, y, { width: valorW, align: "right" })
      doc.y = y + fs + 4
    }

    const alicuota = fac.ivaMonto > 0 ? Math.round((fac.ivaMonto / fac.neto) * 100) : 0
    totalRow("Neto", fmt(fac.neto))
    totalRow(`IVA (${alicuota}%)`, fmt(fac.ivaMonto))
    const sepY = doc.y + 1
    doc.moveTo(totalsLeft, sepY).lineTo(pageRight, sepY).strokeColor("#1e40af").lineWidth(0.8).stroke()
    doc.y = sepY + 5
    totalRow("Total", fmt(fac.total), { bold: true, fontSize: 11 })
    doc.y += 4
    blueLine(doc)

    /* ── Footer ── */
    const footerY = doc.y + 2
    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    doc.font("Helvetica-Bold").text("CAE: ", pageLeft, footerY, { continued: true })
    doc.font("Helvetica").text(fac.cae ?? "Pendiente")
    doc.font("Helvetica-Bold").text("Vto: ", pageLeft, doc.y + 1, { continued: true })
    doc.font("Helvetica").text(fac.caeVto ? fmtFecha(fac.caeVto) : "—")

    if (qrBuffer) doc.image(qrBuffer, 240, footerY, { width: 80 })

    const firmaX = 420, firmaLineY = footerY + 60
    doc.moveTo(firmaX, firmaLineY).lineTo(pageRight, firmaLineY).strokeColor("#cccccc").lineWidth(1).stroke()
    doc.font("Helvetica").fontSize(8).fillColor("#888888")
      .text("Firma / Sello", firmaX, firmaLineY + 4, { width: pageRight - firmaX, align: "center" })

    doc.end()
  })
}
