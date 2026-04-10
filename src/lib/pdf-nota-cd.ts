/**
 * Propósito: Generación del PDF de Nota de Crédito / Débito emitida.
 * Layout consistente con pdf-factura.ts — diseño ARCA estándar.
 * Usa pdfkit. Incluye CAE/QR fiscal cuando la nota fue autorizada en ARCA.
 *
 * Diseño (CLAUDE.md):
 * - Encabezado 3 columnas: izq logo+emisor, centro letra+código, der tipo+nro+fecha
 * - Líneas NEGRAS (no azules)
 * - Pie con QR fiscal, logo ARCA + "Comprobante Autorizado", paginación, CAE
 * - SIN "Firma/Sello"
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

function fmtNroCbte(ptoVenta: number | null, nro: number | null): string {
  if (!ptoVenta || !nro) return "Borrador"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

/**
 * letraCbte: number -> string
 *
 * Dado el tipoCbte ARCA, devuelve la letra del comprobante.
 * Soporta NC/ND A, B y FCE A.
 *
 * Ejemplos:
 * letraCbte(2) => "A"   // ND A
 * letraCbte(3) => "A"   // NC A
 * letraCbte(7) => "B"   // ND B
 * letraCbte(8) => "B"   // NC B
 * letraCbte(202) => "A" // ND FCE A
 * letraCbte(203) => "A" // NC FCE A
 */
function letraCbte(tipoCbte: number | null): string {
  if (!tipoCbte) return "—"
  if ([2, 3, 202, 203].includes(tipoCbte)) return "A"
  if ([7, 8].includes(tipoCbte)) return "B"
  return "—"
}

/**
 * nombreTipoCbte: (tipo, tipoCbte) -> string
 *
 * Dado el tipo interno y el tipoCbte ARCA, devuelve el nombre completo.
 *
 * Ejemplos:
 * nombreTipoCbte("NC_EMITIDA", 3)   => "Nota de Crédito A"
 * nombreTipoCbte("ND_EMITIDA", 2)   => "Nota de Débito A"
 * nombreTipoCbte("NC_EMITIDA", 8)   => "Nota de Crédito B"
 * nombreTipoCbte("ND_EMITIDA", 202) => "Nota de Débito A MiPyME"
 * nombreTipoCbte("NC_EMITIDA", 203) => "Nota de Crédito A MiPyME"
 */
function nombreTipoCbte(tipo: string, tipoCbte: number | null): string {
  const esNC = tipo === "NC_EMITIDA"
  const base = esNC ? "Nota de Crédito" : "Nota de Débito"
  if (!tipoCbte) return base

  const letra = letraCbte(tipoCbte)
  const esFCE = [202, 203].includes(tipoCbte)
  return `${base} ${letra}${esFCE ? " MiPyME" : ""}`
}

function codigoCbte(tipoCbte: number): string {
  return String(tipoCbte).padStart(2, "0")
}

function fmtCondicionIva(valor: string): string {
  return valor
    .replace(/_/g, " ")
    .toLowerCase()
    .replace(/\b\w/g, (c) => c.toUpperCase())
}

/**
 * generarPDFNotaCD: (notaId: string) -> Promise<Buffer>
 *
 * Genera el PDF de una nota de crédito o débito emitida con diseño ARCA estándar.
 * Incluye CAE y QR fiscal si la nota fue autorizada en ARCA.
 *
 * @param notaId — UUID de la nota.
 * @returns Buffer con el PDF generado.
 * @throws Error si la nota no existe.
 */
export async function generarPDFNotaCD(notaId: string): Promise<Buffer> {
  const nota = await prisma.notaCreditoDebito.findUnique({
    where: { id: notaId },
    include: {
      factura: {
        select: {
          nroComprobante: true, ptoVenta: true, tipoCbte: true, emitidaEn: true,
          empresa: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
        },
      },
      liquidacion: {
        select: {
          nroComprobante: true, ptoVenta: true, tipoCbte: true, grabadaEn: true,
          comisionPct: true, ivaPct: true,
          fletero: { select: { razonSocial: true, cuit: true, direccion: true, condicionIva: true } },
        },
      },
      operador: { select: { nombre: true, apellido: true } },
      items: { orderBy: { orden: "asc" as const }, select: { concepto: true, subtotal: true } },
      viajesAfectados: {
        select: {
          viaje: {
            select: { fechaViaje: true, remito: true, destino: true, procedencia: true },
          },
          tarifaOriginal: true,
          subtotalOriginal: true,
          subtotalCorregido: true,
        },
      },
    },
  })

  if (!nota) throw new Error(`Nota ${notaId} no encontrada`)

  const emisor = await obtenerDatosEmisor()
  const letra = letraCbte(nota.tipoCbte)
  const titulo = nombreTipoCbte(nota.tipo, nota.tipoCbte)

  // Receptor
  const fac = nota.factura
  const liq = nota.liquidacion
  const receptor = fac
    ? {
        razonSocial: fac.empresa.razonSocial,
        cuit: fac.empresa.cuit,
        direccion: (fac.empresa as { direccion?: string | null }).direccion,
        condicionIva: (fac.empresa as { condicionIva?: string }).condicionIva ?? "—",
      }
    : liq
    ? {
        razonSocial: liq.fletero.razonSocial,
        cuit: liq.fletero.cuit,
        direccion: liq.fletero.direccion,
        condicionIva: "—",
      }
    : { razonSocial: "—", cuit: "—", direccion: null as string | null, condicionIva: "—" }

  // Comprobante asociado formateado
  const cbteAsocLabel = fac
    ? `Factura ${fac.nroComprobante ? fmtNroCbte(fac.ptoVenta, parseInt(fac.nroComprobante)) : "s/n"} del ${fmtFecha(fac.emitidaEn)}`
    : liq
    ? `LP ${liq.nroComprobante ? fmtNroCbte(liq.ptoVenta, liq.nroComprobante) : "s/n"} del ${fmtFecha(liq.grabadaEn)}`
    : "—"

  // QR fiscal
  let qrBuffer: Buffer | null = null
  if (nota.qrData) {
    try {
      qrBuffer = await QRCode.toBuffer(obtenerUrlQRFiscal(nota.qrData), { width: 200, margin: 1 })
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
    const footerH = 100
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

    // Fila superior: nombre tipo comprobante + recuadro con letra
    const letraBoxSize = 44
    const letraBoxX = headerRightX + headerRightW - pad - letraBoxSize
    const letraBoxY = rightBoxY + pad

    doc.font("Helvetica-Bold").fontSize(12).fillColor(TEXT)
      .text(titulo, headerRightX + pad, rightBoxY + pad + 4, { width: innerW - letraBoxSize - 10 })

    // Recuadro con letra
    if (letra !== "—") {
      doc.save()
      doc.fillColor(NAVY)
      doc.roundedRect(letraBoxX, letraBoxY, letraBoxSize, letraBoxSize, 6).fill()
      doc.font("Helvetica-Bold").fontSize(24).fillColor("white")
        .text(letra, letraBoxX, letraBoxY + 5, { width: letraBoxSize, align: "center" })
      doc.font("Helvetica-Bold").fontSize(10).fillColor("white")
        .text(codigoCbte(nota.tipoCbte ?? 0), letraBoxX, letraBoxY + 30, { width: letraBoxSize, align: "center" })
      doc.restore()
    }

    // Datos debajo en el box
    const ptoVentaStr = String(nota.ptoVenta ?? 1).padStart(4, "0")
    const nroStr = nota.nroComprobante ? String(nota.nroComprobante).padStart(8, "0") : "Borrador"

    let infoY = rightBoxY + pad + letraBoxSize + 8
    const infoX = headerRightX + pad
    const infoW = innerW

    doc.font("Helvetica").fontSize(8.5).fillColor(TEXT)
    doc.text(`Punto de Venta: ${ptoVentaStr}  Comp. Nro: ${nroStr}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Fecha de Emisión: ${fmtFecha(nota.creadoEn)}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`IIBB: ${emisor.iibb}`, infoX, infoY, { width: infoW })
    infoY = doc.y + 1
    doc.text(`Inicio de Actividades: ${emisor.fechaInicioActividades}`, infoX, infoY, { width: infoW })

    cursorY = Math.max(doc.y + 4, rightBoxY + rightBoxH) + 12

    // ─── 3. SECCIÓN RECEPTOR ──────────────────────────────────────────

    const clientBoxPadX = 12
    const clientBoxPadY = 14
    const clientLineH = 20
    const clientLineCount = 3 + (receptor.direccion ? 1 : 0)
    const clientBoxH = clientBoxPadY * 2 + clientLineCount * clientLineH

    doc.save()
    doc.fillColor(BG_LIGHT)
    doc.roundedRect(left, cursorY, contentW, clientBoxH, 8).fill()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.roundedRect(left, cursorY, contentW, clientBoxH, 8).stroke()
    doc.restore()

    let clientY = cursorY + clientBoxPadY
    const clientTextX = left + clientBoxPadX

    // Razón social
    doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT)
      .text("Sres: ", clientTextX, clientY + 2, { continued: true })
    doc.font("Helvetica-Bold").text(receptor.razonSocial.toUpperCase())
    clientY += clientLineH

    // CUIT
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
      .text("C.U.I.T.: ", clientTextX, clientY + 2, { continued: true })
    doc.font("Helvetica").text(fmtCuit(receptor.cuit))
    clientY += clientLineH

    // Condición IVA
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
      .text("Condición IVA: ", clientTextX, clientY + 2, { continued: true })
    doc.font("Helvetica").text(fmtCondicionIva(receptor.condicionIva))
    clientY += clientLineH

    // Dirección (opcional)
    if (receptor.direccion) {
      doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
        .text("Domicilio: ", clientTextX, clientY + 2, { continued: true })
      doc.font("Helvetica").text(receptor.direccion)
      clientY += clientLineH
    }

    cursorY = cursorY + clientBoxH + 12

    // ─── 4. COMPROBANTE ASOCIADO ──────────────────────────────────────

    doc.save()
    doc.fillColor(HEADER_BG)
    doc.roundedRect(left, cursorY, contentW, 24, 4).fill()
    doc.restore()
    doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
      .text("Comprobante asociado: ", left + 8, cursorY + 6, { continued: true })
    doc.font("Helvetica").text(cbteAsocLabel)
    cursorY += 32

    // ─── 5. DETALLE DE ÍTEMS ──────────────────────────────────────────

    if (nota.items && nota.items.length > 0) {
      // Header tabla
      const colNum = { x: left, w: 35 }
      const colConcepto = { x: left + 35, w: contentW - 35 - 120 }
      const colSubtotal = { x: right - 120, w: 120 }

      doc.save()
      doc.fillColor(HEADER_BG)
      doc.roundedRect(left, cursorY, contentW, 24, 4).fill()
      doc.restore()

      doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
      doc.text("#", colNum.x + 8, cursorY + 7, { width: colNum.w - 8 })
      doc.text("Concepto", colConcepto.x + 4, cursorY + 7, { width: colConcepto.w - 8 })
      doc.text("Subtotal", colSubtotal.x + 4, cursorY + 7, { width: colSubtotal.w - 8, align: "right" })
      cursorY += 28

      // Filas
      doc.font("Helvetica").fontSize(9).fillColor(TEXT)
      nota.items.forEach((item, idx) => {
        if (cursorY + 20 > footerLineY) {
          doc.addPage()
          cursorY = margin + 10
        }

        doc.font("Helvetica").fontSize(9).fillColor(TEXT)
        doc.text(String(idx + 1), colNum.x + 8, cursorY + 4, { width: colNum.w - 8 })
        doc.text(item.concepto, colConcepto.x + 4, cursorY + 4, { width: colConcepto.w - 8 })
        doc.font("Helvetica").fontSize(9)
        doc.text(`$ ${fmtMoneda(Number(item.subtotal))}`, colSubtotal.x + 4, cursorY + 4, { width: colSubtotal.w - 8, align: "right" })
        cursorY += 20

        // Separador
        doc.save()
        doc.strokeColor(BORDER).lineWidth(0.3)
        doc.moveTo(left, cursorY).lineTo(right, cursorY).stroke()
        doc.restore()
      })
    } else {
      // Legacy: concepto/motivo/subtipo
      if (nota.descripcion) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
          .text("Concepto: ", left, cursorY, { continued: true })
        doc.font("Helvetica").text(nota.descripcion)
        cursorY = doc.y + 4
      }
      if (nota.motivoDetalle) {
        doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
          .text("Motivo: ", left, cursorY, { continued: true })
        doc.font("Helvetica").text(nota.motivoDetalle)
        cursorY = doc.y + 4
      }
    }

    // Viajes afectados (si hay)
    if (nota.viajesAfectados.length > 0) {
      cursorY += 8
      doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
        .text("Viajes afectados:", left, cursorY)
      cursorY = doc.y + 4
      doc.font("Helvetica").fontSize(7).fillColor(TEXT)
      nota.viajesAfectados.forEach((va) => {
        const v = va.viaje
        const dif = (va.subtotalCorregido ?? 0) - va.subtotalOriginal
        doc.text(
          `${fmtFecha(v.fechaViaje)} — ${v.procedencia ?? "—"} → ${v.destino ?? "—"} — Dif: $ ${fmtMoneda(dif)}`,
          left + 8, cursorY, { width: contentW - 16 }
        )
        cursorY = doc.y + 2
      })
    }

    cursorY += 8

    // ─── 6. TOTALES ───────────────────────────────────────────────────

    const neto = Number(nota.montoNeto)
    const ivaMonto = Number(nota.montoIva)
    const total = Number(nota.montoTotal)

    const totalsW = 220
    const totalsLeft = right - totalsW
    const labelW = 120
    const valX = totalsLeft + labelW + 4
    const valW = totalsW - labelW - 8

    // Espacio para totales
    const esLP = !!nota.liquidacion
    const lineasTotales = esLP && nota.incluirComision ? 80 : 50
    if (cursorY + lineasTotales > footerLineY) {
      doc.addPage()
      cursorY = margin + 10
    }

    doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)

    if (esLP && nota.liquidacion) {
      const comisionPct = nota.liquidacion.comisionPct ?? 0

      if (nota.incluirComision && comisionPct > 0) {
        // NC/ND sobre LP con comisión: mostrar ajuste viajes + ajuste comisión
        const comisionNeto = Math.round(neto * comisionPct / 100 * 100) / 100
        const netoViajes = Math.round((neto - comisionNeto) * 100) / 100

        doc.text("Ajuste viajes:", totalsLeft, cursorY, { width: labelW, align: "right" })
        doc.text(`$ ${fmtMoneda(netoViajes)}`, valX, cursorY, { width: valW, align: "right" })
        cursorY += 14

        doc.text(`Ajuste comisión (${comisionPct}%):`, totalsLeft, cursorY, { width: labelW, align: "right" })
        doc.text(`$ ${fmtMoneda(comisionNeto)}`, valX, cursorY, { width: valW, align: "right" })
        cursorY += 14
      } else {
        // NC/ND sobre LP sin comisión: solo ajuste viajes
        doc.text("Ajuste viajes:", totalsLeft, cursorY, { width: labelW, align: "right" })
        doc.text(`$ ${fmtMoneda(neto)}`, valX, cursorY, { width: valW, align: "right" })
        cursorY += 14
      }

      doc.text("Neto:", totalsLeft, cursorY, { width: labelW, align: "right" })
      doc.text(`$ ${fmtMoneda(neto)}`, valX, cursorY, { width: valW, align: "right" })
      cursorY += 14

      if (ivaMonto > 0) {
        doc.text("IVA:", totalsLeft, cursorY, { width: labelW, align: "right" })
        doc.text(`$ ${fmtMoneda(ivaMonto)}`, valX, cursorY, { width: valW, align: "right" })
        cursorY += 16
      }
    } else {
      // NC/ND sobre factura: neto + IVA
      doc.text("Neto:", totalsLeft, cursorY, { width: labelW, align: "right" })
      doc.text(`$ ${fmtMoneda(neto)}`, valX, cursorY, { width: valW, align: "right" })
      cursorY += 16

      if (ivaMonto > 0) {
        doc.text("IVA:", totalsLeft, cursorY, { width: labelW, align: "right" })
        doc.text(`$ ${fmtMoneda(ivaMonto)}`, valX, cursorY, { width: valW, align: "right" })
        cursorY += 16
      }
    }

    // Línea separadora
    doc.save()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.moveTo(totalsLeft, cursorY).lineTo(right, cursorY).stroke()
    doc.restore()
    cursorY += 6

    doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
    doc.text("TOTAL:", totalsLeft, cursorY, { width: labelW, align: "right" })
    doc.text(`$ ${fmtMoneda(total)}`, valX, cursorY, { width: valW, align: "right" })

    // ─── 7. PIE (estampado en CADA página) ────────────────────────────

    const range = doc.bufferedPageRange()
    const totalPages = range.count

    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i)

      const fY = footerLineY

      // Rectángulo de fondo
      doc.save()
      doc.fillColor(BG_LIGHT)
      doc.roundedRect(left, fY, contentW, footerH, 8).fill()
      doc.strokeColor(BORDER).lineWidth(0.5)
      doc.roundedRect(left, fY, contentW, footerH, 8).stroke()
      doc.restore()

      // QR fiscal (izquierda)
      const qrSize = 80
      const qrX = left + 8
      const qrY = fY + (footerH - qrSize) / 2
      if (qrBuffer) {
        try { doc.image(qrBuffer, qrX, qrY, { width: qrSize, height: qrSize }) } catch { /* skip */ }
      }

      // "Comprobante Autorizado" + logo ARCA
      const arcaTextX = qrX + qrSize + 12
      doc.font("Helvetica").fontSize(9).fillColor(TEXT)
        .text("Comprobante Autorizado", arcaTextX, fY + 22, { width: 120, lineBreak: false })

      if (emisor.logoArca) {
        try {
          doc.image(emisor.logoArca, arcaTextX, fY + 42, { fit: [80, 38] })
        } catch { /* skip invalid image */ }
      }

      // Pág. X/N (centro)
      doc.font("Helvetica").fontSize(8).fillColor(TEXT)
        .text(`Pág. ${i + 1}/${totalPages}`, left, fY + (footerH - 8) / 2, { width: contentW, align: "center" })

      // CAE (derecha)
      const caeW = 200
      const caeX = right - caeW
      const caeTextW = 190

      doc.font("Helvetica-Bold").fontSize(10).fillColor(TEXT)
        .text(`CAE N°: ${nota.cae ?? "Pendiente"}`, caeX, fY + 24, { width: caeTextW, align: "right" })

      doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
        .text(`Fecha de Vto.: ${nota.caeVto ? fmtFecha(nota.caeVto) : "—"}`, caeX, fY + 42, { width: caeTextW, align: "right" })
    }

    doc.flushPages()
    doc.end()
  })
}
