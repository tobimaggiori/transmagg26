/**
 * Propósito: Generación del PDF de Nota de Crédito / Débito emitida.
 * Layout consistente con pdf-liquidacion.ts y pdf-factura.ts.
 * Usa pdfkit. Incluye CAE/QR fiscal cuando la nota fue autorizada en ARCA.
 */

import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import { obtenerUrlQRFiscal } from "@/lib/arca/qr"

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
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

function tipoLabel(tipo: string, tipoCbte: number | null): string {
  const esA = tipoCbte && [2, 3].includes(tipoCbte)
  if (tipo === "NC_EMITIDA") return `Nota de Crédito ${esA ? "A" : "B"}`
  if (tipo === "ND_EMITIDA") return `Nota de Débito ${esA ? "A" : "B"}`
  return "Nota"
}

function letraCbte(tipoCbte: number | null): string {
  if (!tipoCbte) return "—"
  if ([2, 3].includes(tipoCbte)) return "A"
  if ([7, 8].includes(tipoCbte)) return "B"
  return "—"
}

function blueLine(doc: PDFKit.PDFDocument) {
  const y = doc.y + 4
  doc.moveTo(40, y).lineTo(555, y).strokeColor("#1e40af").lineWidth(1.5).stroke()
  doc.y = y + 6
}

/**
 * generarPDFNotaCD: (notaId: string) -> Promise<Buffer>
 *
 * Genera el PDF de una nota de crédito o débito emitida. Incluye CAE y QR
 * fiscal si la nota fue autorizada en ARCA.
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
          empresa: { select: { razonSocial: true, cuit: true, direccion: true } },
        },
      },
      liquidacion: {
        select: {
          nroComprobante: true, ptoVenta: true, tipoCbte: true, grabadaEn: true,
          fletero: { select: { razonSocial: true, cuit: true, direccion: true } },
        },
      },
      operador: { select: { nombre: true, apellido: true } },
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

  const nroCbte = fmtNroCbte(nota.ptoVenta, nota.nroComprobante)
  const titulo = tipoLabel(nota.tipo, nota.tipoCbte)
  const letra = letraCbte(nota.tipoCbte)

  // Receptor: empresa (si hay factura) o fletero (si hay liquidación)
  const fac = nota.factura
  const liq = nota.liquidacion
  const receptor = fac
    ? { razonSocial: fac.empresa.razonSocial, cuit: fac.empresa.cuit, direccion: (fac.empresa as { direccion?: string | null }).direccion }
    : liq
    ? { razonSocial: liq.fletero.razonSocial, cuit: liq.fletero.cuit, direccion: liq.fletero.direccion }
    : { razonSocial: "—", cuit: "—", direccion: null as string | null }

  // Comprobante asociado
  const cbteAsoc = fac
    ? `Factura ${fac.nroComprobante ?? "s/n"} del ${fmtFecha(fac.emitidaEn)}`
    : liq
    ? `LP ${liq.nroComprobante ?? "s/n"} del ${fmtFecha(liq.grabadaEn)}`
    : "—"

  // QR fiscal
  let qrBuffer: Buffer | null = null
  if (nota.qrData) {
    try {
      qrBuffer = await QRCode.toBuffer(obtenerUrlQRFiscal(nota.qrData), { width: 160, margin: 1 })
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
    if (letra !== "—") {
      const timbreX = 250, timbreY = headerTop, timbreW = 60, timbreH = 42
      doc.strokeColor("#000000").lineWidth(2).rect(timbreX, timbreY, timbreW, timbreH).stroke()
      doc.font("Helvetica-Bold").fontSize(28).fillColor("#000000")
        .text(letra, timbreX, timbreY + 4, { width: timbreW, align: "center" })
      doc.font("Helvetica").fontSize(9).fillColor("#555555")
        .text(`Código ${String(nota.tipoCbte ?? 0).padStart(3, "0")}`, timbreX, timbreY + 30, { width: timbreW, align: "center" })
    }

    // Right column
    const rightX = 350
    doc.font("Helvetica-Bold").fontSize(12).fillColor("#000000")
      .text(titulo, rightX, headerTop, { width: pageRight - rightX, align: "right" })
    const detailY = headerTop + 18
    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    const lines = [
      `Nro: ${nroCbte}`,
      `Fecha: ${fmtFecha(nota.creadoEn)}`,
      `Responsable Inscripto`,
      `C.U.I.T.: 30-70938168-3`,
    ]
    lines.forEach((line, i) => {
      doc.text(line, rightX, detailY + i * 12, { width: pageRight - rightX, align: "right" })
    })
    doc.y = Math.max(afterLeftY, detailY + lines.length * 12) + 4
    blueLine(doc)

    /* ── Receptor ── */
    doc.fillColor("#000000").fontSize(10)
    doc.font("Helvetica-Bold").text("Sres: ", pageLeft, doc.y, { continued: true })
    doc.font("Helvetica").text(receptor.razonSocial.toUpperCase())
    if (receptor.direccion) {
      doc.font("Helvetica-Bold").text("Domicilio: ", pageLeft, doc.y + 2, { continued: true })
      doc.font("Helvetica").text(receptor.direccion)
    }
    doc.font("Helvetica-Bold").text("C.U.I.T.: ", pageLeft, doc.y + 2, { continued: true })
    doc.font("Helvetica").text(fmtCuit(receptor.cuit))
    doc.y += 2

    /* ── Comprobante asociado ── */
    doc.font("Helvetica-Bold").fontSize(9).text("Comprobante asociado: ", pageLeft, doc.y + 4, { continued: true })
    doc.font("Helvetica").text(cbteAsoc)
    doc.y += 4
    blueLine(doc)

    /* ── Detalle ── */
    doc.font("Helvetica").fontSize(10).fillColor("#000000")

    if (nota.descripcion) {
      doc.font("Helvetica-Bold").text("Concepto: ", pageLeft, doc.y, { continued: true })
      doc.font("Helvetica").text(nota.descripcion)
    }
    if (nota.motivoDetalle) {
      doc.font("Helvetica-Bold").text("Motivo: ", pageLeft, doc.y + 2, { continued: true })
      doc.font("Helvetica").text(nota.motivoDetalle)
    }
    if (nota.subtipo) {
      doc.font("Helvetica-Bold").text("Subtipo: ", pageLeft, doc.y + 2, { continued: true })
      doc.font("Helvetica").text(nota.subtipo.replace(/_/g, " "))
    }

    // Viajes afectados (si hay)
    if (nota.viajesAfectados.length > 0) {
      doc.y += 8
      doc.font("Helvetica-Bold").fontSize(8).text("Viajes afectados:", pageLeft, doc.y)
      doc.y += 4
      doc.font("Helvetica").fontSize(7)
      nota.viajesAfectados.forEach((va) => {
        const v = va.viaje
        const dif = (va.subtotalCorregido ?? 0) - va.subtotalOriginal
        doc.text(
          `${fmtFecha(v.fechaViaje)} — ${v.procedencia ?? "—"} → ${v.destino ?? "—"} — Dif: ${fmt(dif)}`,
          pageLeft + 8, doc.y, { width: pageRight - pageLeft - 16 }
        )
        doc.y += 2
      })
    }

    doc.y += 6
    blueLine(doc)

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

    totalRow("Neto", fmt(nota.montoNeto))
    if (nota.montoIva > 0) totalRow("IVA", fmt(nota.montoIva))
    const sepY = doc.y + 1
    doc.moveTo(totalsLeft, sepY).lineTo(pageRight, sepY).strokeColor("#1e40af").lineWidth(0.8).stroke()
    doc.y = sepY + 5
    totalRow("Total", fmt(nota.montoTotal), { bold: true, fontSize: 11 })
    doc.y += 4
    blueLine(doc)

    /* ── Footer ── */
    const footerY = doc.y + 2
    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    doc.font("Helvetica-Bold").text("CAE: ", pageLeft, footerY, { continued: true })
    doc.font("Helvetica").text(nota.cae ?? "Pendiente")
    doc.font("Helvetica-Bold").text("Vto: ", pageLeft, doc.y + 1, { continued: true })
    doc.font("Helvetica").text(nota.caeVto ? fmtFecha(nota.caeVto) : "—")

    if (qrBuffer) doc.image(qrBuffer, 240, footerY, { width: 80 })

    const firmaX = 420, firmaLineY = footerY + 60
    doc.moveTo(firmaX, firmaLineY).lineTo(pageRight, firmaLineY).strokeColor("#cccccc").lineWidth(1).stroke()
    doc.font("Helvetica").fontSize(8).fillColor("#888888")
      .text("Firma / Sello", firmaX, firmaLineY + 4, { width: pageRight - firmaX, align: "center" })

    doc.end()
  })
}
