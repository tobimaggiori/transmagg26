/**
 * Propósito: Generación del PDF de Factura Emitida a empresa.
 * Diseño oficial ARCA: encabezado 3 columnas, datos receptor, tabla de viajes,
 * totales y pie con QR fiscal + logo ARCA anclado al fondo de la página.
 * Tamaño A4 imprimible con márgenes de 15mm.
 */

import { prisma } from "@/lib/prisma"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import { obtenerUrlQRFiscal } from "@/lib/arca/qr"

// ─── Helpers de formato ──────────────────────────────────────────────────────

function fmtMoneda(n: number): string {
  const parts = Math.abs(n).toFixed(2).split(".")
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${n < 0 ? "-" : ""}${entero},${parts[1]}`
}

function fmtKilos(n: number): string {
  return Math.round(n).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function fmtFecha(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function letraCbte(tipoCbte: number): string {
  if (tipoCbte === 1 || tipoCbte === 201) return "A"
  if (tipoCbte === 6) return "B"
  return "X"
}

function nombreTipoCbte(tipoCbte: number): string {
  if (tipoCbte === 1) return "Factura A"
  if (tipoCbte === 6) return "Factura B"
  if (tipoCbte === 201) return "Factura de Credito A MiPyme"
  return `Comprobante (${tipoCbte})`
}

// ─── Generador ───────────────────────────────────────────────────────────────

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
          cupo: true,
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

  const emisor = await obtenerDatosEmisor()
  const letra = letraCbte(fac.tipoCbte)

  // QR fiscal
  let qrBuffer: Buffer | null = null
  if (fac.qrData) {
    try {
      const qrUrl = obtenerUrlQRFiscal(fac.qrData)
      qrBuffer = await QRCode.toBuffer(qrUrl, { width: 140, margin: 1 })
    } catch { /* skip */ }
  }

  // CBU MiPymes
  let cbuMiPymes: string | null = null
  if (fac.tipoCbte === 201) {
    const config = await prisma.configuracionArca.findUnique({ where: { id: "unico" }, select: { cbuMiPymes: true } })
    cbuMiPymes = config?.cbuMiPymes ?? null
  }

  return new Promise((resolve, reject) => {
    const margin = 42.52 // ~15mm
    const doc = new PDFDocument({ margin, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageW = 595.28 // A4 width in points
    const pageH = 841.89 // A4 height in points
    const left = margin
    const right = pageW - margin
    const contentW = right - left

    // ─── ENCABEZADO (3 columnas con borde) ─────────────────────────────

    const headerTop = margin
    const headerH = 110
    const headerBottom = headerTop + headerH
    const colCenterX = left + contentW * 0.4
    const colRightX = left + contentW * 0.6

    // Borde exterior
    doc.strokeColor("#000000").lineWidth(1)
      .rect(left, headerTop, contentW, headerH).stroke()

    // Líneas verticales separadoras
    doc.moveTo(colCenterX, headerTop).lineTo(colCenterX, headerBottom).stroke()
    doc.moveTo(colRightX, headerTop).lineTo(colRightX, headerBottom).stroke()

    // ── Columna izquierda: logo + datos emisor
    const colLeftPad = left + 8
    let leftY = headerTop + 8

    if (emisor.logoComprobante) {
      try {
        doc.image(emisor.logoComprobante, colLeftPad, leftY, { width: 60, height: 40, fit: [60, 40] })
      } catch { /* skip invalid image */ }
      leftY += 44
    }

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000")
      .text(emisor.razonSocial, colLeftPad, leftY, { width: colCenterX - colLeftPad - 8 })
    leftY = doc.y + 2
    doc.font("Helvetica").fontSize(8)
      .text(emisor.domicilio, colLeftPad, leftY, { width: colCenterX - colLeftPad - 8 })
    leftY = doc.y + 2
    doc.text(`Condición IVA: ${emisor.condicionIva}`, colLeftPad, leftY, { width: colCenterX - colLeftPad - 8 })

    // ── Centro: letra + código
    const centerW = colRightX - colCenterX
    const letraBoxW = 40
    const letraBoxH = 40
    const letraBoxX = colCenterX + (centerW - letraBoxW) / 2
    const letraBoxY = headerTop + 15

    doc.strokeColor("#000000").lineWidth(1.5)
      .rect(letraBoxX, letraBoxY, letraBoxW, letraBoxH).stroke()
    doc.font("Helvetica-Bold").fontSize(26).fillColor("#000000")
      .text(letra, letraBoxX, letraBoxY + 5, { width: letraBoxW, align: "center" })
    doc.font("Helvetica").fontSize(8).fillColor("#000000")
      .text(`Código ${String(fac.tipoCbte).padStart(3, "0")}`, colCenterX, letraBoxY + letraBoxH + 4, { width: centerW, align: "center" })

    // ── Columna derecha: tipo comprobante + datos
    const colRightPad = colRightX + 8
    const colRightW = right - colRightPad - 4
    let rightY = headerTop + 8

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000")
      .text(nombreTipoCbte(fac.tipoCbte), colRightPad, rightY, { width: colRightW })
    rightY = doc.y + 4

    const ptoVentaStr = String(fac.ptoVenta ?? 1).padStart(4, "0")
    const nroStr = fac.nroComprobante ? String(parseInt(fac.nroComprobante) || 0).padStart(8, "0") : "Borrador"
    doc.font("Helvetica").fontSize(8)
      .text(`Punto de Venta: ${ptoVentaStr} Comp. Nro: ${nroStr}`, colRightPad, rightY, { width: colRightW })
    rightY = doc.y + 2
    doc.text(`Fecha de Emisión: ${fmtFecha(fac.emitidaEn)}`, colRightPad, rightY, { width: colRightW })
    rightY = doc.y + 6
    doc.text(`CUIT: ${emisor.cuit}`, colRightPad, rightY, { width: colRightW })
    rightY = doc.y + 2
    doc.text(`IIBB: ${emisor.iibb}`, colRightPad, rightY, { width: colRightW })
    rightY = doc.y + 2
    doc.text(`Fecha de Inicio de Actividades: ${emisor.fechaInicioActividades}`, colRightPad, rightY, { width: colRightW })

    // ─── DATOS DEL RECEPTOR ────────────────────────────────────────────

    let cursorY = headerBottom + 4

    // Línea superior
    doc.strokeColor("#000000").lineWidth(1)
    doc.moveTo(left, cursorY).lineTo(right, cursorY).stroke()
    cursorY += 6

    doc.font("Helvetica-Bold").fontSize(9).fillColor("#000000")
    doc.text("Sres: ", left + 4, cursorY, { continued: true })
    doc.font("Helvetica").text(fac.empresa.razonSocial.toUpperCase())
    cursorY = doc.y + 2

    // Domicilio y localidad en la misma línea
    doc.font("Helvetica-Bold").text("Domicilio: ", left + 4, cursorY, { continued: true })
    doc.font("Helvetica").text(fac.empresa.direccion ?? "—")
    cursorY = doc.y + 2

    doc.font("Helvetica-Bold").text("CUIT: ", left + 4, cursorY, { continued: true })
    doc.font("Helvetica").text(fmtCuit(fac.empresa.cuit))
    cursorY = doc.y + 2

    // Fecha de pago + CBU (en la misma línea si hay CBU MiPymes)
    if (fac.tipoCbte === 201 && cbuMiPymes) {
      doc.font("Helvetica-Bold").text("Fecha de Pago: ", left + 4, cursorY, { continued: true })
      doc.font("Helvetica").text(fmtFecha(fac.emitidaEn), { continued: true })
      doc.font("Helvetica-Bold").text("     C.B.U: ", { continued: true })
      doc.font("Helvetica").text(cbuMiPymes)
    } else {
      doc.font("Helvetica-Bold").text("Fecha de Pago: ", left + 4, cursorY, { continued: true })
      doc.font("Helvetica").text(fmtFecha(fac.emitidaEn))
    }
    cursorY = doc.y + 4

    // Línea inferior
    doc.moveTo(left, cursorY).lineTo(right, cursorY).stroke()
    cursorY += 6

    // ─── TABLA DE VIAJES ───────────────────────────────────────────────

    const colDefs = [
      { header: "Fecha",       w: 52, align: "left" as const },
      { header: "Remito",      w: 50, align: "left" as const },
      { header: "Cupo",        w: 38, align: "left" as const },
      { header: "Mercaderia",  w: 68, align: "left" as const },
      { header: "Procedencia", w: 62, align: "left" as const },
      { header: "Destino",     w: 55, align: "left" as const },
      { header: "Kilos",       w: 45, align: "right" as const },
      { header: "Tarifa",      w: 50, align: "right" as const },
      { header: "STotal",      w: 55, align: "right" as const },
    ]

    // Header línea superior
    doc.strokeColor("#000000").lineWidth(1)
    doc.moveTo(left, cursorY).lineTo(right, cursorY).stroke()
    cursorY += 3

    // Header text
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000")
    let colX = left
    for (const col of colDefs) {
      doc.text(col.header, colX + 2, cursorY, { width: col.w - 4, align: col.align })
      colX += col.w
    }
    cursorY += 11

    // Header línea inferior
    doc.moveTo(left, cursorY).lineTo(right, cursorY).stroke()
    cursorY += 3

    // Rows
    doc.font("Helvetica").fontSize(7).fillColor("#000000")
    for (const v of fac.viajes) {
      const cells = [
        fmtFecha(v.fechaViaje),
        v.remito ?? "—",
        v.cupo ?? "—",
        v.mercaderia ?? "—",
        v.procedencia ?? "—",
        v.destino ?? "—",
        v.kilos != null ? fmtKilos(v.kilos) : "—",
        fmtMoneda(Number(v.tarifaEmpresa)),
        fmtMoneda(Number(v.subtotal)),
      ]
      colX = left
      for (let i = 0; i < colDefs.length; i++) {
        doc.text(cells[i], colX + 2, cursorY, { width: colDefs[i].w - 4, align: colDefs[i].align })
        colX += colDefs[i].w
      }
      cursorY += 11
    }

    cursorY += 4

    // ─── TOTALES ───────────────────────────────────────────────────────

    const totalsW = 180
    const totalsLeft = right - totalsW
    const labelW = 100
    const valorX = totalsLeft + labelW + 4
    const valorW = totalsW - labelW - 8

    // Recuadro de totales
    const neto = Number(fac.neto)
    const ivaMonto = Number(fac.ivaMonto)
    const total = Number(fac.total)
    const ivaPctDisplay = fac.ivaPct % 1 === 0 ? String(fac.ivaPct) : fac.ivaPct.toFixed(1)

    const totalsTop = cursorY
    const rowH = 16
    const totalsH = rowH * 3 + 8

    doc.strokeColor("#000000").lineWidth(1)
      .rect(totalsLeft, totalsTop, totalsW, totalsH).stroke()

    let totY = totalsTop + 6

    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    doc.text("Subtotal:", totalsLeft + 4, totY, { width: labelW - 4 })
    doc.text(`$ ${fmtMoneda(neto)}`, valorX, totY, { width: valorW, align: "right" })
    totY += rowH

    doc.text(`IVA ${ivaPctDisplay}%:`, totalsLeft + 4, totY, { width: labelW - 4 })
    doc.text(`$ ${fmtMoneda(ivaMonto)}`, valorX, totY, { width: valorW, align: "right" })
    totY += rowH

    doc.font("Helvetica-Bold").fontSize(10)
    doc.text("Importe Total:", totalsLeft + 4, totY, { width: labelW - 4 })
    doc.text(`$ ${fmtMoneda(total)}`, valorX, totY, { width: valorW, align: "right" })

    // ─── PIE (anclado al fondo de la página) ───────────────────────────

    const footerH = 80
    const footerLineY = pageH - margin - footerH
    const footerContentY = footerLineY + 6

    // Línea horizontal separadora
    doc.strokeColor("#000000").lineWidth(1)
    doc.moveTo(left, footerLineY).lineTo(right, footerLineY).stroke()

    // QR fiscal (izquierda)
    const qrSize = 65
    if (qrBuffer) {
      doc.image(qrBuffer, left + 4, footerContentY, { width: qrSize, height: qrSize })
    }

    // Logo ARCA + texto "Comprobante Autorizado" (al lado del QR)
    const arcaX = left + qrSize + 16
    if (emisor.logoArca) {
      try {
        doc.image(emisor.logoArca, arcaX, footerContentY, { width: 50, height: 30, fit: [50, 30] })
      } catch { /* skip invalid image */ }
      doc.font("Helvetica-Oblique").fontSize(7).fillColor("#000000")
        .text("Comprobante Autorizado", arcaX, footerContentY + 34, { width: 80 })
    } else {
      doc.font("Helvetica-Oblique").fontSize(7).fillColor("#000000")
        .text("Comprobante Autorizado", arcaX, footerContentY + 10, { width: 80 })
    }

    // Pág 1/1 (centro)
    doc.font("Helvetica").fontSize(8).fillColor("#000000")
      .text("Pág. 1/1", left, footerContentY + 30, { width: contentW, align: "center" })

    // CAE (derecha)
    const caeX = right - 160
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000000")
      .text("CAE N°: ", caeX, footerContentY + 10, { continued: true })
    doc.font("Helvetica").text(fac.cae ?? "Pendiente")
    doc.font("Helvetica-Bold").text("Fecha de Vto. de CAE: ", caeX, doc.y + 2, { continued: true })
    doc.font("Helvetica").text(fac.caeVto ? fmtFecha(fac.caeVto) : "—")

    doc.end()
  })
}
