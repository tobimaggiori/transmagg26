/**
 * generarPDFFactura: string -> Promise<Buffer>
 *
 * Propósito: Genera el PDF de una Factura Emitida a empresa con diseño moderno.
 * Template con paleta navy/celeste, íconos vectoriales, tabla con header redondeado,
 * pie celeste claro con QR fiscal y paginación dinámica (bufferPages).
 *
 * Ejemplos:
 * generarPDFFactura("abc-123") => Buffer de PDF A4 con los datos de la factura
 * generarPDFFactura("inexistente") => throws Error("Factura inexistente no encontrada")
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

/**
 * codigoCbte: number -> string
 *
 * Propósito: Retorna el código de comprobante con padStart(2, "0").
 *
 * Ejemplos:
 * codigoCbte(1) => "01"
 * codigoCbte(201) => "201"
 */
function codigoCbte(tipoCbte: number): string {
  return String(tipoCbte).padStart(2, "0")
}

/**
 * fmtCondicionIva: string -> string
 *
 * Propósito: Formatea el enum de condición IVA reemplazando guiones bajos
 * por espacios y aplicando Title Case.
 *
 * Ejemplos:
 * fmtCondicionIva("RESPONSABLE_INSCRIPTO") => "Responsable Inscripto"
 * fmtCondicionIva("MONOTRIBUTISTA") => "Monotributista"
 * fmtCondicionIva("EXENTO") => "Exento"
 */
function fmtCondicionIva(valor: string): string {
  return valor
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

// ─── Íconos vectoriales ─────────────────────────────────────────────────────

/** Ícono persona (8x8): cabeza circular + hombros semicirculares */
function drawIconPersona(doc: PDFKit.PDFDocument, x: number, y: number): void {
  const cx = x + 4
  doc.save()
  doc.fillColor(NAVY)
  // Cabeza
  doc.circle(cx, y + 2, 2).fill()
  // Hombros (arco)
  doc.path(`M ${cx - 3.5} ${y + 8} Q ${cx - 3.5} ${y + 4.5} ${cx} ${y + 4.5} Q ${cx + 3.5} ${y + 4.5} ${cx + 3.5} ${y + 8} Z`).fill()
  doc.restore()
}

/** Ícono documento (8x8): rectángulo con 2 líneas internas */
function drawIconDocumento(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.strokeColor(NAVY).lineWidth(0.8)
  doc.rect(x + 0.5, y, 7, 8).stroke()
  doc.moveTo(x + 2, y + 2.5).lineTo(x + 6, y + 2.5).stroke()
  doc.moveTo(x + 2, y + 5).lineTo(x + 6, y + 5).stroke()
  doc.restore()
}

/** Ícono pin de ubicación (8x8): gota invertida con círculo vacío */
function drawIconPin(doc: PDFKit.PDFDocument, x: number, y: number): void {
  const cx = x + 4
  doc.save()
  doc.fillColor(NAVY)
  doc.path(
    `M ${cx} ${y + 8} ` +
    `C ${cx - 1} ${y + 6} ${cx - 3.5} ${y + 3.5} ${cx - 3.5} ${y + 2.5} ` +
    `C ${cx - 3.5} ${y + 0.5} ${cx - 2} ${y} ${cx} ${y} ` +
    `C ${cx + 2} ${y} ${cx + 3.5} ${y + 0.5} ${cx + 3.5} ${y + 2.5} ` +
    `C ${cx + 3.5} ${y + 3.5} ${cx + 1} ${y + 6} ${cx} ${y + 8} Z`
  ).fill()
  // Círculo vacío interior
  doc.fillColor("white")
  doc.circle(cx, y + 2.8, 1.2).fill()
  doc.restore()
}

/** Ícono tarjeta de crédito (8x6): rectángulo redondeado con banda magnética */
function drawIconTarjeta(doc: PDFKit.PDFDocument, x: number, y: number): void {
  doc.save()
  doc.strokeColor(NAVY).lineWidth(0.8)
  doc.roundedRect(x, y + 1, 8, 6, 1).stroke()
  doc.fillColor(NAVY)
  doc.rect(x, y + 3, 8, 1.5).fill()
  doc.restore()
}

// ─── Generador ──────────────────────────────────────────────────────────────

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
    const headerRightW = contentW * 0.48
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
    const rightBoxH = 110
    const rightBoxY = cursorY

    doc.save()
    doc.strokeColor(BORDER).lineWidth(1)
    doc.roundedRect(headerRightX, rightBoxY, headerRightW, rightBoxH, 6).stroke()
    doc.restore()

    // Fila superior del box: "Factura A" a la izquierda + recuadro navy con letra
    const letraBoxSize = 44
    const letraBoxX = headerRightX + headerRightW - pad - letraBoxSize
    const letraBoxY = rightBoxY + pad

    // Nombre tipo comprobante
    doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT)
      .text(nombreTipoCbte(fac.tipoCbte), headerRightX + pad, rightBoxY + pad + 4, { width: innerW - letraBoxSize - 10 })

    // Recuadro navy con letra
    doc.save()
    doc.fillColor(NAVY)
    doc.roundedRect(letraBoxX, letraBoxY, letraBoxSize, letraBoxSize, 6).fill()
    doc.font("Helvetica-Bold").fontSize(24).fillColor("white")
      .text(letra, letraBoxX, letraBoxY + 5, { width: letraBoxSize, align: "center" })
    doc.font("Helvetica-Bold").fontSize(10).fillColor("white")
      .text(codigoCbte(fac.tipoCbte), letraBoxX, letraBoxY + 30, { width: letraBoxSize, align: "center" })
    doc.restore()

    // Datos debajo en el box
    const ptoVentaStr = String(fac.ptoVenta ?? 1).padStart(4, "0")
    const nroStr = fac.nroComprobante ? String(parseInt(fac.nroComprobante) || 0).padStart(8, "0") : "Borrador"

    let infoY = rightBoxY + pad + letraBoxSize + 6
    const infoX = headerRightX + pad
    const infoW = innerW

    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT)
    doc.text(`Punto de Venta: ${ptoVentaStr}  Comp. Nro: ${nroStr}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Fecha de Emisión: ${fmtFecha(fac.emitidaEn)}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`CUIT: ${emisor.cuit}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`IIBB: ${emisor.iibb}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Inicio de Actividades: ${emisor.fechaInicioActividades}`, infoX, infoY, { width: infoW })

    cursorY = Math.max(doc.y, rightBoxY + rightBoxH) + 12

    // ─── 3. SECCIÓN CLIENTE ────────────────────────────────────────────

    const clientLines: { icon: (d: PDFKit.PDFDocument, x: number, y: number) => void; parts: { text: string; bold: boolean }[] }[] = [
      {
        icon: drawIconPersona,
        parts: [
          { text: "Cliente: ", bold: true },
          { text: fac.empresa.razonSocial.toUpperCase(), bold: true },
          { text: `  |  CUIT: ${fmtCuit(fac.empresa.cuit)}`, bold: false },
        ],
      },
      {
        icon: drawIconDocumento,
        parts: [
          { text: "Condición IVA: ", bold: true },
          { text: fmtCondicionIva(fac.empresa.condicionIva ?? "—"), bold: false },
        ],
      },
      {
        icon: drawIconPin,
        parts: [
          { text: "Dirección: ", bold: true },
          { text: fac.empresa.direccion ?? "—", bold: false },
        ],
      },
      {
        icon: drawIconTarjeta,
        parts: (() => {
          const p: { text: string; bold: boolean }[] = [
            { text: "Método de Pago: ", bold: true },
            { text: "Transferencia Bancaria", bold: false },
          ]
          if (fac.tipoCbte === 201 && cbuMiPymes) {
            p.push({ text: `  |  C.B.U: ${cbuMiPymes}`, bold: false })
          }
          return p
        })(),
      },
    ]

    const clientBoxPadX = 12
    const clientBoxPadY = 10
    const clientLineH = 18
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
        doc.text(part.text, textX, clientY + 1, { lineBreak: false })
        textX += w
      }
      clientY += clientLineH
    }

    cursorY = cursorY + clientBoxH + 12

    // ─── 4. TABLA DE VIAJES ────────────────────────────────────────────

    const colDefs = [
      { header: "Fecha",      w: 62,  align: "left" as const },
      { header: "Remito",     w: 56,  align: "left" as const },
      { header: "Mercadería", w: 72,  align: "left" as const },
      { header: "Origen",     w: 68,  align: "left" as const },
      { header: "Destino",    w: 68,  align: "left" as const },
      { header: "Kilos",      w: 50,  align: "right" as const },
      { header: "Tarifa",     w: 58,  align: "right" as const },
      { header: "Total",      w: 76,  align: "right" as const },
    ]

    const tableW = colDefs.reduce((s, c) => s + c.w, 0)
    const tableLeft = left
    const rowH = 18
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

    for (const v of fac.viajes) {
      // Calcular espacio necesario para esta fila
      const neededH = rowH + (v.cupo ? cupoH : 0)

      // Salto de página si no cabe antes del footer
      if (cursorY + neededH > footerLineY) {
        doc.addPage()
        // Línea decorativa superior en nueva página
        doc.save()
        doc.strokeColor(NAVY).lineWidth(2.5)
        doc.moveTo(left, margin).lineTo(right, margin).stroke()
        doc.restore()
        cursorY = margin + 10
        drawTableHeader()
      }

      const cells = [
        fmtFecha(v.fechaViaje),
        v.remito ?? "—",
        v.mercaderia ?? "—",
        v.procedencia ?? "—",
        v.destino ?? "—",
        v.kilos != null ? fmtKilos(v.kilos) : "—",
        `$ ${fmtMoneda(Number(v.tarifaEmpresa))}`,
        `$ ${fmtMoneda(Number(v.subtotal))}`,
      ]

      doc.font("Helvetica").fontSize(10).fillColor(TEXT)
      let colX = tableLeft
      for (let i = 0; i < colDefs.length; i++) {
        const fontToUse = i === colDefs.length - 1 ? "Helvetica-Bold" : "Helvetica"
        doc.font(fontToUse)
        doc.text(cells[i], colX + 4, cursorY + (rowH - 10) / 2, { width: colDefs[i].w - 8, align: colDefs[i].align })
        colX += colDefs[i].w
      }
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

      // Separador de fila
      doc.save()
      doc.strokeColor(BORDER).lineWidth(0.3)
      doc.moveTo(tableLeft, cursorY).lineTo(tableLeft + tableW, cursorY).stroke()
      doc.restore()
    }

    cursorY += 6

    // ─── 5. TOTALES ────────────────────────────────────────────────────

    const neto = Number(fac.neto)
    const ivaMonto = Number(fac.ivaMonto)
    const total = Number(fac.total)
    const ivaPctDisplay = fac.ivaPct % 1 === 0 ? String(fac.ivaPct) : fac.ivaPct.toFixed(1)

    const totalsW = 200
    const totalsLeft = right - totalsW
    const labelW = 100
    const valX = totalsLeft + labelW + 4
    const valW = totalsW - labelW - 8

    // Verificar espacio para totales (~50pt)
    if (cursorY + 50 > footerLineY) {
      doc.addPage()
      doc.save()
      doc.strokeColor(NAVY).lineWidth(2.5)
      doc.moveTo(left, margin).lineTo(right, margin).stroke()
      doc.restore()
      cursorY = margin + 10
    }

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

      // Rectángulo celeste claro de fondo
      doc.save()
      doc.fillColor(BG_LIGHT)
      doc.roundedRect(left, fY, contentW, footerH, 8).fill()
      doc.strokeColor(BORDER).lineWidth(0.5)
      doc.roundedRect(left, fY, contentW, footerH, 8).stroke()
      doc.restore()

      // QR fiscal (izquierda)
      const qrSize = 52
      const qrX = left + 10
      const qrY = fY + (footerH - qrSize) / 2
      if (qrBuffer) {
        try { doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize }) } catch { /* skip */ }
      }

      // "Comprobante Autorizado" + logo ARCA
      const arcaTextX = qrX + qrSize + 8
      doc.font("Helvetica").fontSize(9).fillColor(TEXT)
        .text("Comprobante Autorizado", arcaTextX, fY + 16, { width: 120, lineBreak: false })

      if (emisor.logoArca) {
        try {
          doc.image(emisor.logoArca, arcaTextX, fY + 30, { fit: [45, 16] })
        } catch { /* skip invalid image */ }
      }

      // Pág. X/N (centro)
      doc.font("Helvetica").fontSize(8).fillColor(TEXT)
        .text(`Pág. ${i + 1}/${totalPages}`, left, fY + (footerH - 8) / 2, { width: contentW, align: "center" })

      // CAE (derecha, directo sobre fondo celeste — SIN sub-caja)
      const caeRightMargin = right - 10
      const caeW = 170
      const caeX = caeRightMargin - caeW

      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT)
        .text(`CAE N°: ${fac.cae ?? "Pendiente"}`, caeX, fY + 18, { width: caeW, align: "right" })

      doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
        .text("Fecha de Vto.: ", caeX, fY + 34, { width: caeW, align: "right", continued: true })
      doc.font("Helvetica-Bold").text(fac.caeVto ? fmtFecha(fac.caeVto) : "—")
    }

    doc.flushPages()
    doc.end()
  })
}
