/**
 * Propósito: Generación del PDF del Líquido Producto (Cuenta de Venta y LP).
 * Replica el layout oficial de Trans-Magg S.R.L. con cabecera, timbre, tabla de viajes y totales.
 * Usa pdfkit para generar el PDF directamente (sin Puppeteer).
 */

import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"
import crypto from "crypto"
import { obtenerUrlQRFiscal } from "@/lib/arca/qr"

function fmt(n: number): string {
  return (
    "$ " +
    n.toLocaleString("es-AR", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })
  )
}

function fmtNumero(n: number): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
}

function fmtKilos(n: number): string {
  return n.toLocaleString("es-AR", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function fmtNroLP(pto: number, nro: number): string {
  return `${String(pto).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function generarQRUrl(liquidacionId: string): string {
  const key = process.env.ENCRYPTION_KEY ?? "transmagg-default-key"
  const token = crypto
    .createHmac("sha256", key)
    .update(liquidacionId)
    .digest("hex")
    .slice(0, 32)
  const base = process.env.NEXTAUTH_URL ?? "https://transmagg.com"
  return `${base}/api/liquidaciones/${liquidacionId}/pdf?token=${token}`
}

/* ── Blue separator helpers ─────────────────────────────── */

function blueLine(doc: PDFKit.PDFDocument) {
  const y = doc.y + 4
  doc
    .moveTo(40, y)
    .lineTo(555, y)
    .strokeColor("#1e40af")
    .lineWidth(1.5)
    .stroke()
  doc.y = y + 6
}

function blueLineThin(doc: PDFKit.PDFDocument) {
  const y = doc.y + 3
  doc
    .moveTo(40, y)
    .lineTo(555, y)
    .strokeColor("#1e40af")
    .lineWidth(0.8)
    .stroke()
  doc.y = y + 5
}

/* ── Main export ────────────────────────────────────────── */

export async function generarPDFLiquidacion(
  liquidacionId: string
): Promise<Buffer> {
  const liq = await prisma.liquidacion.findUnique({
    where: { id: liquidacionId },
    include: {
      fletero: { select: { razonSocial: true, cuit: true, direccion: true } },
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
          tarifaFletero: true,
          subtotal: true,
        },
      },
    },
  })

  if (!liq) throw new Error(`Liquidación ${liquidacionId} no encontrada`)

  const nroLP =
    liq.nroComprobante && liq.ptoVenta
      ? fmtNroLP(liq.ptoVenta, liq.nroComprobante)
      : "Borrador"

  // QR: usar fiscal (RG 4291) si autorizada en ARCA, sino URL interna con HMAC
  const qrUrl = liq.qrData
    ? obtenerUrlQRFiscal(liq.qrData)
    : generarQRUrl(liq.id)

  /* Generate QR as PNG buffer */
  let qrBuffer: Buffer | null = null
  try {
    qrBuffer = await QRCode.toBuffer(qrUrl, { width: 160, margin: 1 })
  } catch {
    /* QR generation failed — skip silently */
  }

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const pageLeft = 40
    const pageRight = 555

    /* ── HEADER ──────────────────────────────────────── */

    const headerTop = doc.y

    // Left column — company info
    doc
      .font("Helvetica-Bold")
      .fontSize(13)
      .text("TRANS-MAGG S.R.L.", pageLeft, headerTop, { width: 180 })
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#333333")
      .text("C.U.I.T. 30-70938168-3", pageLeft, doc.y + 2, { width: 180 })
    doc.text("Belgrano 184, 2109 Acebal (S.F.)", { width: 180 })
    doc.text("Tel: (03469) 15695306", { width: 180 })

    const afterLeftY = doc.y

    // Center — "timbre" box
    const timbreX = 250
    const timbreY = headerTop
    const timbreW = 60
    const timbreH = 42
    doc
      .strokeColor("#000000")
      .lineWidth(2)
      .rect(timbreX, timbreY, timbreW, timbreH)
      .stroke()
    doc
      .font("Helvetica-Bold")
      .fontSize(28)
      .fillColor("#000000")
      .text("A", timbreX, timbreY + 4, {
        width: timbreW,
        align: "center",
      })
    doc
      .font("Helvetica")
      .fontSize(9)
      .fillColor("#555555")
      .text("Código 060", timbreX, timbreY + 30, {
        width: timbreW,
        align: "center",
      })

    // Right column — LP title + details
    const rightX = 350
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .fillColor("#000000")
      .text("Cuenta de Venta y Líquido Producto", rightX, headerTop, {
        width: pageRight - rightX,
        align: "right",
      })

    const detailY = headerTop + 18
    doc.font("Helvetica").fontSize(9).fillColor("#000000")

    const lines = [
      `Nro: ${nroLP}`,
      `Fecha: ${fmtFecha(liq.grabadaEn)}`,
      `Responsable Inscripto`,
      `C.U.I.T.: 30-70938168-3`,
      `Ing. Brutos Conv. Multi.: 0921-759945-2`,
      `Fecha de Inicio: 18/10/2005`,
    ]
    lines.forEach((line, i) => {
      doc.text(line, rightX, detailY + i * 12, {
        width: pageRight - rightX,
        align: "right",
      })
    })

    doc.y = Math.max(afterLeftY, detailY + lines.length * 12) + 4

    /* ── Blue separator ──────────────────────────────── */
    blueLine(doc)

    /* ── Fletero data ────────────────────────────────── */
    doc.fillColor("#000000").fontSize(10)
    doc
      .font("Helvetica-Bold")
      .text("Sres: ", pageLeft, doc.y, { continued: true })
    doc
      .font("Helvetica")
      .text(liq.fletero.razonSocial.toUpperCase())

    doc
      .font("Helvetica-Bold")
      .text("Domicilio: ", pageLeft, doc.y + 2, { continued: true })
    doc.font("Helvetica").text(liq.fletero.direccion ?? "—")

    doc
      .font("Helvetica-Bold")
      .text("C.U.I.T.: ", pageLeft, doc.y + 2, { continued: true })
    doc.font("Helvetica").text(fmtCuit(liq.fletero.cuit))

    doc.y += 2
    blueLineThin(doc)

    /* ── Table of viajes ─────────────────────────────── */

    const headers = [
      "Fecha",
      "Remito",
      "Cupo",
      "Mercadería",
      "Procedencia",
      "Destino",
      "Kilos",
      "Tarifa",
      "STotal",
    ]
    const colWidths = [58, 55, 42, 72, 72, 60, 48, 55, 55]
    const rightAlignCols = new Set([6, 7, 8]) // Kilos, Tarifa, STotal

    // Header row
    const tableHeaderY = doc.y
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#000000")

    // Top border of header
    doc
      .moveTo(pageLeft, tableHeaderY - 1)
      .lineTo(pageRight, tableHeaderY - 1)
      .strokeColor("#1e40af")
      .lineWidth(1.5)
      .stroke()

    let x = pageLeft
    headers.forEach((h, i) => {
      doc.text(h, x + 2, tableHeaderY + 2, {
        width: colWidths[i] - 4,
        align: rightAlignCols.has(i) ? "right" : "left",
      })
      x += colWidths[i]
    })

    const headerBottomY = tableHeaderY + 14
    doc
      .moveTo(pageLeft, headerBottomY)
      .lineTo(pageRight, headerBottomY)
      .strokeColor("#1e40af")
      .lineWidth(1.5)
      .stroke()

    // Data rows
    doc.font("Helvetica").fontSize(7)
    let rowY = headerBottomY + 3

    liq.viajes.forEach((v, idx) => {
      // Alternate row background
      if (idx % 2 !== 0) {
        doc
          .save()
          .rect(pageLeft, rowY - 1, pageRight - pageLeft, 13)
          .fill("#f8fafc")
          .restore()
      }

      doc.fillColor("#000000")
      x = pageLeft
      const cells = [
        fmtFecha(v.fechaViaje),
        v.remito ?? "—",
        v.cupo ?? "—",
        v.mercaderia ?? "—",
        v.procedencia ?? "—",
        v.destino ?? "—",
        v.kilos != null ? fmtKilos(v.kilos) : "—",
        fmtNumero(v.tarifaFletero),
        fmtNumero(v.subtotal),
      ]

      cells.forEach((cell, i) => {
        doc.text(cell, x + 2, rowY, {
          width: colWidths[i] - 4,
          align: rightAlignCols.has(i) ? "right" : "left",
        })
        x += colWidths[i]
      })

      rowY += 13
    })

    doc.y = rowY + 2
    blueLineThin(doc)

    /* ── Totals ──────────────────────────────────────── */

    const totalsWidth = 280
    const totalsLeft = pageRight - totalsWidth
    const labelW = 170
    const valorW = 100
    const valorX = totalsLeft + labelW + 10

    function totalRow(
      label: string,
      valor: string,
      opts?: { bold?: boolean; fontSize?: number }
    ) {
      const fs = opts?.fontSize ?? 10
      doc.fontSize(fs)
      if (opts?.bold) doc.font("Helvetica-Bold")
      else doc.font("Helvetica")
      doc.fillColor("#000000")

      const y = doc.y
      doc.text(label, totalsLeft, y, { width: labelW, align: "left" })
      doc.font(opts?.bold ? "Helvetica-Bold" : "Courier").text(valor, valorX, y, {
        width: valorW,
        align: "right",
      })
      doc.y = y + fs + 4
    }

    totalRow("Total Viajes", fmt(liq.subtotalBruto))
    totalRow(`Comisión s/conv. (${liq.comisionPct}%)`, fmt(liq.comisionMonto))
    totalRow("Total", fmt(liq.neto))

    // Thin blue separator
    const sepY1 = doc.y + 1
    doc
      .moveTo(totalsLeft, sepY1)
      .lineTo(pageRight, sepY1)
      .strokeColor("#1e40af")
      .lineWidth(0.8)
      .stroke()
    doc.y = sepY1 + 5

    totalRow("IVA (21%)", fmt(liq.ivaMonto))

    // Thin blue separator
    const sepY2 = doc.y + 1
    doc
      .moveTo(totalsLeft, sepY2)
      .lineTo(pageRight, sepY2)
      .strokeColor("#1e40af")
      .lineWidth(0.8)
      .stroke()
    doc.y = sepY2 + 5

    totalRow("Total", fmt(liq.total), { bold: true, fontSize: 11 })

    doc.y += 4
    blueLine(doc)

    /* ── Footer / Pie ────────────────────────────────── */

    const footerY = doc.y + 2

    // Left — CAE info
    doc.font("Helvetica").fontSize(9).fillColor("#000000")
    doc
      .font("Helvetica-Bold")
      .text("CAE: ", pageLeft, footerY, { continued: true })
    doc.font("Helvetica").text(liq.cae ?? "Pendiente")

    doc
      .font("Helvetica-Bold")
      .text("Vto: ", pageLeft, doc.y + 1, { continued: true })
    doc
      .font("Helvetica")
      .text(liq.caeVto ? fmtFecha(liq.caeVto) : "—")

    if (liq.arcaObservaciones) {
      doc
        .font("Helvetica-Bold")
        .text("Obs: ", pageLeft, doc.y + 1, { continued: true })
      doc.font("Helvetica").text(liq.arcaObservaciones)
    }

    // Center — QR code
    if (qrBuffer) {
      doc.image(qrBuffer, 240, footerY, { width: 80 })
    }

    // Right — Firma / Sello
    const firmaX = 420
    const firmaLineY = footerY + 60
    doc
      .moveTo(firmaX, firmaLineY)
      .lineTo(pageRight, firmaLineY)
      .strokeColor("#cccccc")
      .lineWidth(1)
      .stroke()
    doc
      .font("Helvetica")
      .fontSize(8)
      .fillColor("#888888")
      .text("Firma / Sello", firmaX, firmaLineY + 4, {
        width: pageRight - firmaX,
        align: "center",
      })

    doc.end()
  })
}
