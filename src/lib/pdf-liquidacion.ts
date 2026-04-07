/**
 * generarPDFLiquidacion: string -> Promise<Buffer>
 *
 * Propósito: Genera el PDF de una Liquidación (Cuenta de Venta y Líquido Producto)
 * con diseño moderno navy/celeste, íconos vectoriales, tabla con provincias,
 * pie celeste con QR fiscal y paginación dinámica (bufferPages).
 *
 * Ejemplos:
 * generarPDFLiquidacion("abc-123") => Buffer de PDF A4 con los datos de la liquidación
 * generarPDFLiquidacion("inexistente") => throws Error("Liquidación inexistente no encontrada")
 */

import { prisma } from "@/lib/prisma"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import { obtenerUrlQRFiscal } from "@/lib/arca/qr"

// ─── Paleta ─────────────────────────────────────────────────────────────────

const NAVY = "#1e3a5f"
const BG_LIGHT = "#edf1f7"
const BORDER = "#c8d1dc"
const TEXT = "#1a1a1a"
const HEADER_BG = "#dce3ed"

// ─── Helpers de formato ─────────────────────────────────────────────────────

function fmtMoneda(n: number): string {
  const parts = Math.abs(n).toFixed(2).split(".")
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${n < 0 ? "-" : ""}${entero},${parts[1]}`
}

function fmtMonedaCompacta(n: number): string {
  const abs = Math.abs(n)
  const decimals = abs % 1
  const prefix = n < 0 ? "-" : ""
  if (Math.abs(decimals) < 0.005) {
    return prefix + Math.round(abs).toString().replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  }
  return prefix + fmtMoneda(n)
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

function fmtFechaCorta(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const aa = String(d.getFullYear()).slice(-2)
  return `${dd}/${mm}/${aa}`
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function fmtCondicionIva(valor: string): string {
  return valor
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

function fmtProvincia(prov: string): string {
  if (prov.toLowerCase().includes("santiago del estero")) return "S. Estero"
  return prov
}

function letraCbteLP(tipoCbte: number): string {
  if (tipoCbte === 60) return "A"
  if (tipoCbte === 61) return "B"
  return "X"
}

function nombreTipoCbteLP(tipoCbte: number): string {
  if (tipoCbte === 60) return "Cuenta de Venta y Líquido Producto A"
  if (tipoCbte === 61) return "Cuenta de Venta y Líquido Producto B"
  return `Comprobante (${tipoCbte})`
}

function codigoCbte(tipoCbte: number): string {
  return String(tipoCbte).padStart(2, "0")
}

// ─── Íconos vectoriales ─────────────────────────────────────────────────────

function drawIconPersona(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.fillColor(NAVY)
  doc.circle(x + 4, y + 2, 2).fill()
  doc.moveTo(x, y + 8).quadraticCurveTo(x + 4, y + 4, x + 8, y + 8).fill()
  doc.restore()
}

function drawIconDocumento(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.strokeColor(NAVY).lineWidth(0.8)
  doc.rect(x + 1, y, 6, 8).stroke()
  doc.moveTo(x + 2.5, y + 2.5).lineTo(x + 5.5, y + 2.5).stroke()
  doc.moveTo(x + 2.5, y + 4.5).lineTo(x + 5.5, y + 4.5).stroke()
  doc.restore()
}

function drawIconPin(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.fillColor(NAVY)
  doc.path(
    `M ${x + 4} ${y} C ${x} ${y} ${x} ${y + 5} ${x + 4} ${y + 8} C ${x + 8} ${y + 5} ${x + 8} ${y} ${x + 4} ${y} Z`
  ).fill()
  doc.fillColor("#ffffff")
  doc.circle(x + 4, y + 3, 1.5).fill()
  doc.restore()
}

function drawIconTarjeta(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.strokeColor(NAVY).lineWidth(0.8)
  doc.roundedRect(x, y + 1, 8, 6, 1).stroke()
  doc.moveTo(x, y + 3.5).lineTo(x + 8, y + 3.5).strokeColor(NAVY).lineWidth(1.5).stroke()
  doc.restore()
}

// ─── Generador ──────────────────────────────────────────────────────────────

export async function generarPDFLiquidacion(liquidacionId: string): Promise<Buffer> {
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    include: {
      fletero: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
      viajes: {
        orderBy: { fechaViaje: "asc" },
        select: {
          fechaViaje: true,
          remito: true,
          cupo: true,
          mercaderia: true,
          procedencia: true,
          provinciaOrigen: true,
          destino: true,
          provinciaDestino: true,
          kilos: true,
          tarifaFletero: true,
          subtotal: true,
        },
      },
    },
  })

  if (!liq) throw new Error(`Liquidación ${liquidacionId} no encontrada`)

  const emisor = await obtenerDatosEmisor()
  const tipoCbte = liq.tipoCbte ?? 60
  const letra = letraCbteLP(tipoCbte)

  // QR fiscal
  let qrBuffer: Buffer | null = null
  if (liq.qrData) {
    try {
      const qrUrl = obtenerUrlQRFiscal(liq.qrData)
      qrBuffer = await QRCode.toBuffer(qrUrl, { width: 140, margin: 1 })
    } catch { /* skip */ }
  }

  return new Promise((resolve, reject) => {
    const margin = 42.52 // ~15mm
    const doc = new PDFDocument({ margin, size: "A4", bufferPages: true })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageW = 595.28
    const pageH = 841.89
    const left = margin
    const right = pageW - margin
    const contentW = right - left
    const footerH = 72
    const footerLineY = pageH - margin - footerH

    // ─── 1. LÍNEA DECORATIVA SUPERIOR ──────────────────────────────────

    doc.save()
    doc.strokeColor(NAVY).lineWidth(2.5)
    doc.moveTo(left, margin).lineTo(right, margin).stroke()
    doc.restore()

    let cursorY = margin + 10

    // ─── 2. ENCABEZADO ─────────────────────────────────────────────────

    const headerLeftW = contentW * 0.48
    const headerRightW = 220
    const headerRightX = right - headerRightW

    // Izquierda: logo + datos emisor
    let leftY = cursorY
    if (emisor.logoComprobante) {
      try {
        doc.image(emisor.logoComprobante, left, leftY, { fit: [180, 50] })
        leftY += 54
      } catch {
        doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT)
          .text(emisor.razonSocial, left, leftY, { width: headerLeftW })
        leftY = doc.y + 4
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT)
        .text(emisor.razonSocial, left, leftY, { width: headerLeftW })
      leftY = doc.y + 4
    }

    doc.font("Helvetica").fontSize(10).fillColor(TEXT)
    doc.text(emisor.domicilio, left, leftY, { width: headerLeftW })
    leftY = doc.y + 1
    doc.text(`CUIT: ${emisor.cuit}`, left, leftY, { width: headerLeftW })
    leftY = doc.y + 1
    doc.text(`Condición IVA: ${emisor.condicionIva}`, left, leftY, { width: headerLeftW })

    // Derecha: rectángulo redondeado con tipo comprobante + letra
    const pad = 18
    const innerW = headerRightW - pad * 2
    const rightBoxH = 130
    const rightBoxY = cursorY

    doc.save()
    doc.strokeColor(BORDER).lineWidth(1)
    doc.roundedRect(headerRightX, rightBoxY, headerRightW, rightBoxH, 6).stroke()
    doc.restore()

    // Nombre tipo comprobante + recuadro navy con letra
    const letraBoxSize = 44
    const letraBoxX = headerRightX + headerRightW - pad - letraBoxSize
    const letraBoxY = rightBoxY + pad

    doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT)
      .text(nombreTipoCbteLP(tipoCbte), headerRightX + pad, rightBoxY + pad + 4, { width: innerW - letraBoxSize - 10 })

    doc.save()
    doc.fillColor(NAVY)
    doc.roundedRect(letraBoxX, letraBoxY, letraBoxSize, letraBoxSize, 6).fill()
    doc.font("Helvetica-Bold").fontSize(24).fillColor("white")
      .text(letra, letraBoxX, letraBoxY + 5, { width: letraBoxSize, align: "center" })
    doc.font("Helvetica-Bold").fontSize(10).fillColor("white")
      .text(codigoCbte(tipoCbte), letraBoxX, letraBoxY + 30, { width: letraBoxSize, align: "center" })
    doc.restore()

    // Datos debajo
    const ptoVentaStr = String(liq.ptoVenta ?? 1).padStart(4, "0")
    const nroStr = liq.nroComprobante ? String(liq.nroComprobante).padStart(8, "0") : "Borrador"

    let infoY = rightBoxY + pad + letraBoxSize + 8
    const infoX = headerRightX + pad
    const infoW = innerW

    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT)
    doc.text(`Punto de Venta: ${ptoVentaStr}  Comp. Nro: ${nroStr}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Fecha de Emisión: ${fmtFecha(liq.grabadaEn)}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`IIBB: ${emisor.iibb}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Inicio de Actividades: ${emisor.fechaInicioActividades}`, infoX, infoY, { width: infoW })

    cursorY = Math.max(doc.y + 4, rightBoxY + rightBoxH) + 12

    // ─── 3. SECCIÓN FLETERO ────────────────────────────────────────────

    type ClientLine = {
      icon: (d: PDFKit.PDFDocument, ix: number, iy: number) => void
      parts: { text: string; bold: boolean }[]
    }

    const clientLines: ClientLine[] = [
      {
        icon: drawIconPersona,
        parts: [
          { text: "Fletero: ", bold: true },
          { text: liq.fletero.razonSocial.toUpperCase(), bold: true },
          { text: `  |  CUIT: ${fmtCuit(liq.fletero.cuit)}`, bold: false },
        ],
      },
      {
        icon: drawIconDocumento,
        parts: [
          { text: "Condición IVA: ", bold: true },
          { text: fmtCondicionIva(liq.fletero.condicionIva ?? "—"), bold: false },
        ],
      },
      {
        icon: drawIconPin,
        parts: [
          { text: "Dirección: ", bold: true },
          { text: liq.fletero.direccion ?? "—", bold: false },
        ],
      },
      {
        icon: drawIconTarjeta,
        parts: [
          { text: "Método de Pago: ", bold: true },
          { text: liq.metodoPago ?? "Transferencia Bancaria", bold: false },
        ],
      },
    ]

    const clientBoxPadX = 12
    const clientBoxPadY = 14
    const clientLineH = 20
    const clientBoxH = clientBoxPadY * 2 + clientLines.length * clientLineH

    doc.save()
    doc.fillColor(BG_LIGHT)
    doc.roundedRect(left, cursorY, contentW, clientBoxH, 8).fill()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.roundedRect(left, cursorY, contentW, clientBoxH, 8).stroke()
    doc.restore()

    let clientY = cursorY + clientBoxPadY
    for (const line of clientLines) {
      line.icon(doc, left + clientBoxPadX, clientY + 1)
      let textX = left + clientBoxPadX + 14
      for (const part of line.parts) {
        const fontSize = line === clientLines[0] ? 10 : 9
        doc.font(part.bold ? "Helvetica-Bold" : "Helvetica").fontSize(fontSize).fillColor(TEXT)
        const w = doc.widthOfString(part.text)
        doc.text(part.text, textX, clientY + 2, { lineBreak: false })
        textX += w
      }
      clientY += clientLineH
    }

    cursorY = cursorY + clientBoxH + 12

    // ─── 4. TABLA DE VIAJES ────────────────────────────────────────────

    const colDefs = [
      { header: "Fecha",    w: 52,  align: "left" as const },
      { header: "Remito",   w: 52,  align: "left" as const },
      { header: "Producto", w: 60,  align: "left" as const },
      { header: "Origen",   w: 68,  align: "left" as const },
      { header: "Destino",  w: 68,  align: "left" as const },
      { header: "Kilos",    w: 48,  align: "right" as const },
      { header: "Tarifa",   w: 72,  align: "right" as const },
      { header: "SubTotal", w: 90,  align: "right" as const },
    ]

    const tableW = colDefs.reduce((s, c) => s + c.w, 0)
    const tableLeft = left
    const rowHBase = 18
    const rowHWithProv = 30
    const headerRowH = 28
    const cupoH = 16

    function drawTableHeader() {
      doc.save()
      doc.fillColor(HEADER_BG)
      doc.roundedRect(tableLeft, cursorY, tableW, headerRowH, 4).fill()
      doc.restore()

      doc.font("Helvetica-Bold").fontSize(11).fillColor(TEXT)
      let colX = tableLeft
      for (const col of colDefs) {
        doc.text(col.header, colX + 4, cursorY + (headerRowH - 11) / 2, { width: col.w - 8, align: col.align })
        colX += col.w
      }
      cursorY += headerRowH + 2
    }

    drawTableHeader()

    for (const v of liq.viajes) {
      const hasProv = !!(v.provinciaOrigen || v.provinciaDestino)
      const rowH = hasProv ? rowHWithProv : rowHBase
      const neededH = rowH + (v.cupo ? cupoH : 0)

      if (cursorY + neededH > footerLineY) {
        doc.addPage()
        doc.save()
        doc.strokeColor(NAVY).lineWidth(2.5)
        doc.moveTo(left, margin).lineTo(right, margin).stroke()
        doc.restore()
        cursorY = margin + 10
        drawTableHeader()
      }

      const colXs: number[] = []
      let cx = tableLeft
      for (const col of colDefs) {
        colXs.push(cx)
        cx += col.w
      }

      const textY = cursorY + (hasProv ? 2 : (rowH - 10) / 2)

      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      doc.text(fmtFechaCorta(v.fechaViaje), colXs[0] + 4, textY, { lineBreak: false })
      doc.text(v.remito ?? "—", colXs[1] + 4, textY, { lineBreak: false })
      doc.text(v.mercaderia ?? "—", colXs[2] + 4, textY, { lineBreak: false })

      // Origen
      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      doc.text(v.procedencia ?? "—", colXs[3] + 4, textY, { lineBreak: false })
      if (v.provinciaOrigen) {
        doc.font("Helvetica").fontSize(10).fillColor(TEXT)
        doc.text(fmtProvincia(v.provinciaOrigen), colXs[3] + 4, textY + 13, { lineBreak: false })
      }

      // Destino
      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      doc.text(v.destino ?? "—", colXs[4] + 4, textY, { lineBreak: false })
      if (v.provinciaDestino) {
        doc.font("Helvetica").fontSize(10).fillColor(TEXT)
        doc.text(fmtProvincia(v.provinciaDestino), colXs[4] + 4, textY + 13, { lineBreak: false })
      }

      // Kilos
      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      const kilosText = v.kilos != null ? fmtKilos(v.kilos) : "—"
      const kilosW = doc.widthOfString(kilosText)
      doc.text(kilosText, colXs[5] + colDefs[5].w - 4 - kilosW, textY, { lineBreak: false })

      // Tarifa (tarifaFletero)
      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      doc.text(`$ ${fmtMonedaCompacta(Number(v.tarifaFletero))}`, colXs[6] + 4, textY, { width: colDefs[6].w - 8, align: "right" })

      // SubTotal
      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT)
      doc.text(`$ ${fmtMonedaCompacta(Number(v.subtotal))}`, colXs[7] + 4, textY, { width: colDefs[7].w - 8, align: "right" })

      cursorY += rowH

      // Badge de cupo
      if (v.cupo) {
        const cupoText = `Cupo: ${v.cupo}`
        doc.font("Helvetica").fontSize(8.5)
        const cupoTextW = doc.widthOfString(cupoText) + 12
        doc.save()
        doc.fillColor(BG_LIGHT)
        doc.roundedRect(tableLeft + 8, cursorY, cupoTextW, 13, 4).fill()
        doc.strokeColor(BORDER).lineWidth(0.5)
        doc.roundedRect(tableLeft + 8, cursorY, cupoTextW, 13, 4).stroke()
        doc.restore()
        doc.font("Helvetica").fontSize(8.5).fillColor(TEXT)
          .text(cupoText, tableLeft + 14, cursorY + 2)
        cursorY += cupoH
      }

      // Separador
      doc.save()
      doc.strokeColor(BORDER).lineWidth(0.3)
      doc.moveTo(tableLeft, cursorY).lineTo(tableLeft + tableW, cursorY).stroke()
      doc.restore()
    }

    cursorY += 6

    // ─── 5. TOTALES ────────────────────────────────────────────────────

    const subtotalBruto = Number(liq.subtotalBruto)
    const comisionMonto = Number(liq.comisionMonto)
    const neto = Number(liq.neto)
    const ivaMonto = Number(liq.ivaMonto)
    const total = Number(liq.total)
    const comisionPctDisplay = liq.comisionPct % 1 === 0 ? String(liq.comisionPct) : liq.comisionPct.toFixed(1)
    const ivaPctDisplay = liq.ivaPct % 1 === 0 ? String(liq.ivaPct) : liq.ivaPct.toFixed(1)

    const totalsW = 200
    const totalsLeft = right - totalsW
    const labelW = 100
    const valX = totalsLeft + labelW + 4
    const valW = totalsW - labelW - 8

    // Verificar espacio para totales (~90pt)
    if (cursorY + 90 > footerLineY) {
      doc.addPage()
      doc.save()
      doc.strokeColor(NAVY).lineWidth(2.5)
      doc.moveTo(left, margin).lineTo(right, margin).stroke()
      doc.restore()
      cursorY = margin + 10
    }

    doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
    doc.text("Total Viajes:", totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(subtotalBruto)}`, valX, cursorY, { width: valW, align: "right" })
    cursorY += 16

    doc.text(`Comisión (${comisionPctDisplay}%):`, totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(comisionMonto)}`, valX, cursorY, { width: valW, align: "right" })
    cursorY += 16

    // Línea separadora
    doc.save()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.moveTo(totalsLeft, cursorY).lineTo(right, cursorY).stroke()
    doc.restore()
    cursorY += 6

    doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
    doc.text("Subtotal:", totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(neto)}`, valX, cursorY, { width: valW, align: "right" })
    cursorY += 16

    doc.text(`IVA ${ivaPctDisplay}%:`, totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(ivaMonto)}`, valX, cursorY, { width: valW, align: "right" })
    cursorY += 16

    // Línea separadora
    doc.save()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.moveTo(totalsLeft, cursorY).lineTo(right, cursorY).stroke()
    doc.restore()
    cursorY += 6

    doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
    doc.text("TOTAL:", totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(total)}`, valX, cursorY, { width: valW, align: "right" })

    // ─── 6. PIE (estampado en CADA página con paginación dinámica) ───

    const range = doc.bufferedPageRange()
    const totalPages = range.count

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i)

      const fY = footerLineY

      doc.save()
      doc.fillColor(BG_LIGHT)
      doc.roundedRect(left, fY, contentW, footerH, 8).fill()
      doc.strokeColor(BORDER).lineWidth(0.5)
      doc.roundedRect(left, fY, contentW, footerH, 8).stroke()
      doc.restore()

      // QR fiscal
      const qrSize = 52
      const qrX = left + 10
      const qrY = fY + (footerH - qrSize) / 2
      if (qrBuffer) {
        try { doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize }) } catch { /* skip */ }
      }

      // "Comprobante Autorizado" + logo ARCA
      const arcaTextX = qrX + qrSize + 14
      doc.font("Helvetica").fontSize(9).fillColor(TEXT)
        .text("Comprobante Autorizado", arcaTextX, fY + 16, { width: 120, lineBreak: false })

      if (emisor.logoArca) {
        try {
          doc.image(emisor.logoArca, arcaTextX, fY + 30, { fit: [45, 16] })
        } catch { /* skip */ }
      }

      // Pág. X/N
      doc.font("Helvetica").fontSize(8).fillColor(TEXT)
        .text(`Pág. ${i + 1}/${totalPages}`, left, fY + (footerH - 8) / 2, { width: contentW, align: "center" })

      // CAE
      const caeW = 200
      const caeX = right - caeW
      const caeTextW = 190
      const footerContentY = fY

      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT)
        .text(`CAE N°: ${liq.cae ?? "Pendiente"}`, caeX, footerContentY + 12, { width: caeTextW, align: "right" })

      doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
        .text(`Fecha de Vto.: ${liq.caeVto ? fmtFecha(liq.caeVto) : "—"}`, caeX, footerContentY + 30, { width: caeTextW, align: "right" })
    }

    doc.flushPages()
    doc.end()
  })
}
