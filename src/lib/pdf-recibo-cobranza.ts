/**
 * Proposito: Generacion del PDF del Recibo por Cobranza a Empresa.
 * Replica el layout de un recibo oficial de Trans-Magg S.R.L.
 * Genera el PDF directamente con pdfkit (A4).
 */

import { prisma } from "@/lib/prisma"
import PDFDocument from "pdfkit"
// QRCode not used in recibos (no QR code in this document type)
// import QRCode from "qrcode"

// ─── Constantes de layout ────────────────────────────────────────────────────

const PAGE_MARGIN = 40         // ~14mm
const A4_WIDTH = 595.28
const A4_HEIGHT = 841.89
const CONTENT_WIDTH = A4_WIDTH - PAGE_MARGIN * 2
const FONT_SIZE_NORMAL = 9
const FONT_SIZE_SMALL = 8
const FONT_SIZE_XS = 7
const FONT_SIZE_TITLE = 14
const FONT_SIZE_SECTION = 8
const FONT_SIZE_NRO = 16
const LINE_COLOR = "#cccccc"
const HEADER_BG = "#e8e8e8"
const SECTION_BG = "#f0f0f0"
const SUBTOTAL_BG = "#f9f9f9"
const TOTALES_HEADER_BG = "#1a1a1a"
// const MUTED_COLOR = "#999999"

// ─── Helpers de formato ──────────────────────────────────────────────────────

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtFecha(d: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(d)
}

function fmtNroRecibo(pto: number, nro: number): string {
  return `${String(pto).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

function tipoCbteLabel(t: number): string {
  if (t === 1) return "Factura A"
  if (t === 6) return "Factura B"
  if (t === 201) return "Factura A MiPyme"
  return `Cbte ${t}`
}

function condicionIvaLabel(c: string): string {
  const map: Record<string, string> = {
    RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
    MONOTRIBUTISTA: "Monotributista",
    EXENTO: "Exento",
    CONSUMIDOR_FINAL: "Consumidor Final",
  }
  return map[c] ?? c
}

function tipoMedioLabel(t: string): string {
  if (t === "TRANSFERENCIA") return "Transferencia"
  if (t === "ECHEQ") return "ECheq"
  if (t === "CHEQUE_FISICO") return "Cheque Fisico"
  return t
}

// ─── Numero a letras (espanol, pesos argentinos) ─────────────────────────────

const UNIDADES = [
  "", "UNO", "DOS", "TRES", "CUATRO", "CINCO", "SEIS", "SIETE", "OCHO", "NUEVE",
  "DIEZ", "ONCE", "DOCE", "TRECE", "CATORCE", "QUINCE", "DIECISEIS", "DIECISIETE",
  "DIECIOCHO", "DIECINUEVE", "VEINTE", "VEINTIUNO", "VEINTIDOS", "VEINTITRES",
  "VEINTICUATRO", "VEINTICINCO", "VEINTISEIS", "VEINTISIETE", "VEINTIOCHO", "VEINTINUEVE",
]

const DECENAS = [
  "", "", "VEINTE", "TREINTA", "CUARENTA", "CINCUENTA",
  "SESENTA", "SETENTA", "OCHENTA", "NOVENTA",
]

const CENTENAS = [
  "", "CIEN", "DOSCIENTOS", "TRESCIENTOS", "CUATROCIENTOS", "QUINIENTOS",
  "SEISCIENTOS", "SETECIENTOS", "OCHOCIENTOS", "NOVECIENTOS",
]

function centenas(n: number): string {
  if (n === 0) return ""
  if (n < 30) return UNIDADES[n]
  if (n < 100) {
    const d = Math.floor(n / 10)
    const u = n % 10
    return u === 0 ? DECENAS[d] : `${DECENAS[d]} Y ${UNIDADES[u]}`
  }
  if (n === 100) return "CIEN"
  const c = Math.floor(n / 100)
  const resto = n % 100
  return resto === 0 ? CENTENAS[c] : `${CENTENAS[c]} ${centenas(resto)}`
}

function miles(n: number): string {
  if (n === 0) return ""
  if (n === 1) return "MIL"
  return `${centenas(n)} MIL`
}

/**
 * numeroALetras: number -> string
 *
 * Convierte un numero entero positivo a su representacion en palabras en espanol.
 * Solo parte entera — el uso en el recibo es para los pesos (sin centavos en texto).
 *
 * Ejemplos:
 * numeroALetras(1000)    === "MIL"
 * numeroALetras(1270000) === "UN MILLON DOSCIENTOS SETENTA MIL"
 * numeroALetras(2500000) === "DOS MILLONES QUINIENTOS MIL"
 */
export function numeroALetras(n: number): string {
  const entero = Math.floor(Math.abs(n))
  if (entero === 0) return "CERO"

  const millones = Math.floor(entero / 1_000_000)
  const resto = entero % 1_000_000
  const milesPart = Math.floor(resto / 1000)
  const centenasPart = resto % 1000

  const partes: string[] = []

  if (millones > 0) {
    if (millones === 1) partes.push("UN MILLON")
    else partes.push(`${centenas(millones)} MILLONES`)
  }
  if (milesPart > 0) partes.push(miles(milesPart))
  if (centenasPart > 0) partes.push(centenas(centenasPart))

  return partes.join(" ")
}

// ─── PDFKit drawing helpers ──────────────────────────────────────────────────

/** Draw a horizontal line across full content width */
function drawHLine(doc: PDFKit.PDFDocument, y: number, color = LINE_COLOR, width = 0.5) {
  doc.save()
    .moveTo(PAGE_MARGIN, y)
    .lineTo(A4_WIDTH - PAGE_MARGIN, y)
    .lineWidth(width)
    .strokeColor(color)
    .stroke()
    .restore()
}

/** Draw a filled rectangle */
function drawRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, fill: string) {
  doc.save().rect(x, y, w, h).fill(fill).restore()
}

/** Draw a stroked rectangle */
function drawStrokeRect(doc: PDFKit.PDFDocument, x: number, y: number, w: number, h: number, color = LINE_COLOR, width = 0.5) {
  doc.save().rect(x, y, w, h).lineWidth(width).strokeColor(color).stroke().restore()
}

/**
 * Draw a table with headers and rows.
 * Returns the Y position after the table.
 */
function drawTable(
  doc: PDFKit.PDFDocument,
  startY: number,
  columns: { label: string; width: number; align?: "left" | "right" | "center" }[],
  rows: string[][],
  options?: { subtotalRow?: string[]; subtotalLabel?: string }
): number {
  const x0 = PAGE_MARGIN
  const rowHeight = 16
  const headerHeight = 16
  const cellPadding = 4

  // Header background
  drawRect(doc, x0, startY, CONTENT_WIDTH, headerHeight, HEADER_BG)
  drawStrokeRect(doc, x0, startY, CONTENT_WIDTH, headerHeight)

  // Header text
  let cx = x0
  for (const col of columns) {
    const textOpts: PDFKit.Mixins.TextOptions = {
      width: col.width - cellPadding * 2,
      align: col.align ?? "left",
      lineBreak: false,
    }
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL)
      .fillColor("#000")
      .text(col.label, cx + cellPadding, startY + 4, textOpts)
    cx += col.width
  }

  let y = startY + headerHeight

  // Data rows
  for (const row of rows) {
    // Cell borders
    drawStrokeRect(doc, x0, y, CONTENT_WIDTH, rowHeight)

    cx = x0
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const cellText = row[i] ?? ""
      doc.font("Helvetica").fontSize(FONT_SIZE_NORMAL)
        .fillColor("#000")
        .text(cellText, cx + cellPadding, y + 4, {
          width: col.width - cellPadding * 2,
          align: col.align ?? "left",
          lineBreak: false,
        })
      cx += col.width
    }
    y += rowHeight
  }

  // Subtotal row
  if (options?.subtotalRow) {
    drawRect(doc, x0, y, CONTENT_WIDTH, rowHeight, SUBTOTAL_BG)
    drawStrokeRect(doc, x0, y, CONTENT_WIDTH, rowHeight)

    cx = x0
    for (let i = 0; i < columns.length; i++) {
      const col = columns[i]
      const cellText = options.subtotalRow[i] ?? ""
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL)
        .fillColor("#000")
        .text(cellText, cx + cellPadding, y + 4, {
          width: col.width - cellPadding * 2,
          align: col.align ?? "left",
          lineBreak: false,
        })
      cx += col.width
    }
    y += rowHeight
  }

  return y
}

// ─── PDF generation ──────────────────────────────────────────────────────────

function buildPDF(
  recibo: {
    nro: number
    ptoVenta: number
    fecha: Date
    totalCobrado: number
    totalRetenciones: number
    totalComprobantes: number
    retencionGanancias: number
    retencionIIBB: number
    retencionSUSS: number
    empresa: { razonSocial: string; cuit: string; condicionIva: string; direccion: string | null }
    operador: { nombre: string; apellido: string }
    facturas: { nroComprobante: string | null; tipoCbte: number; total: number; emitidaEn: Date }[]
    mediosPago: {
      tipo: string
      monto: number
      cuentaId: string | null
      fechaTransferencia: Date | null
      referencia: string | null
      nroCheque: string | null
      bancoEmisor: string | null
      fechaEmision: Date | null
      fechaPago: Date | null
    }[]
  },
  cuentaMap: Record<string, { nombre: string; bancoOEntidad: string }>
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({
      size: "A4",
      margins: { top: PAGE_MARGIN, bottom: PAGE_MARGIN, left: PAGE_MARGIN, right: PAGE_MARGIN },
      info: {
        Title: `Recibo de Cobranza Nro ${fmtNroRecibo(recibo.ptoVenta, recibo.nro)} - Trans-Magg S.R.L.`,
        Author: "Trans-Magg S.R.L.",
      },
    })

    const chunks: Uint8Array[] = []
    doc.on("data", (chunk: Uint8Array) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const nroTexto = fmtNroRecibo(recibo.ptoVenta, recibo.nro)
    let y = PAGE_MARGIN

    // ─── Encabezado ────────────────────────────────────────────────────────

    // Left side: company info
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_TITLE).fillColor("#000")
      .text("TRANS-MAGG S.R.L.", PAGE_MARGIN, y)

    doc.font("Helvetica").fontSize(FONT_SIZE_SMALL).fillColor("#333333")
      .text("C.U.I.T. 30-70938168-3", PAGE_MARGIN, y + 18)
      .text("Belgrano 184 - 2109 Acebal (S.F.)", PAGE_MARGIN, y + 28)
      .text("Responsable Inscripto", PAGE_MARGIN, y + 38)

    // Right side: document info
    const rightX = A4_WIDTH - PAGE_MARGIN - 200
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
      .text("RECIBO DE COBRANZA", rightX, y, { width: 200, align: "right" })

    doc.font("Helvetica").fontSize(FONT_SIZE_SMALL).fillColor("#555555")
      .text("Nro:", rightX, y + 16, { width: 200, align: "right" })

    doc.font("Courier-Bold").fontSize(FONT_SIZE_NRO).fillColor("#000")
      .text(nroTexto, rightX, y + 27, { width: 200, align: "right" })

    doc.font("Helvetica").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(`Fecha: ${fmtFecha(recibo.fecha)}`, rightX, y + 46, { width: 200, align: "right" })

    y += 58
    // Separator line
    drawHLine(doc, y, "#000000", 2)
    y += 8

    // ─── Datos de la empresa receptora ─────────────────────────────────────

    const boxY = y
    const boxHeight = 52
    drawStrokeRect(doc, PAGE_MARGIN, boxY, CONTENT_WIDTH, boxHeight)

    const col1LblX = PAGE_MARGIN + 8
    const col1ValX = PAGE_MARGIN + 80
    const col2LblX = PAGE_MARGIN + CONTENT_WIDTH / 2 + 8
    const col2ValX = PAGE_MARGIN + CONTENT_WIDTH / 2 + 80

    // Row 1
    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("EMPRESA", col1LblX, boxY + 6)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(recibo.empresa.razonSocial, col1ValX, boxY + 5, { width: CONTENT_WIDTH / 2 - 90, lineBreak: false })

    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("CUIT", col2LblX, boxY + 6)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(fmtCuit(recibo.empresa.cuit), col2ValX, boxY + 5)

    // Row 2
    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("DIRECCION", col1LblX, boxY + 28)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(recibo.empresa.direccion ?? "-", col1ValX, boxY + 27, { width: CONTENT_WIDTH / 2 - 90, lineBreak: false })

    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("COND. IVA", col2LblX, boxY + 28)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(condicionIvaLabel(recibo.empresa.condicionIva), col2ValX, boxY + 27)

    y = boxY + boxHeight + 10

    // ─── Comprobantes cobrados ─────────────────────────────────────────────

    // Section title
    drawRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14, SECTION_BG)
    drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SECTION).fillColor("#000")
      .text("COMPROBANTES COBRADOS", PAGE_MARGIN + 6, y + 3)
    y += 14

    const factColWidths = [
      CONTENT_WIDTH * 0.20,
      CONTENT_WIDTH * 0.25,
      CONTENT_WIDTH * 0.30,
      CONTENT_WIDTH * 0.25,
    ]
    const factColumns = [
      { label: "Fecha", width: factColWidths[0] },
      { label: "Tipo", width: factColWidths[1] },
      { label: "Nro. Comprobante", width: factColWidths[2] },
      { label: "Importe", width: factColWidths[3], align: "right" as const },
    ]
    const factRows = recibo.facturas.map((f) => [
      fmtFecha(f.emitidaEn),
      tipoCbteLabel(f.tipoCbte),
      f.nroComprobante ?? "-",
      fmt(f.total),
    ])
    const factSubtotal = ["Total Comprobantes", "", "", fmt(recibo.totalComprobantes)]

    y = drawTable(doc, y, factColumns, factRows, { subtotalRow: factSubtotal })
    y += 10

    // ─── Retenciones (solo si hay) ─────────────────────────────────────────

    if (recibo.totalRetenciones > 0) {
      drawRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14, SECTION_BG)
      drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14)
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SECTION).fillColor("#000")
        .text("RETENCIONES APLICADAS", PAGE_MARGIN + 6, y + 3)
      y += 14

      const retColumns = [
        { label: "Concepto", width: CONTENT_WIDTH * 0.6 },
        { label: "Importe", width: CONTENT_WIDTH * 0.4, align: "right" as const },
      ]
      const retRows: string[][] = []
      if (recibo.retencionGanancias > 0) retRows.push(["Ret. Ganancias", fmt(recibo.retencionGanancias)])
      if (recibo.retencionIIBB > 0) retRows.push(["Ret. IIBB", fmt(recibo.retencionIIBB)])
      if (recibo.retencionSUSS > 0) retRows.push(["Ret. SUSS", fmt(recibo.retencionSUSS)])

      const retSubtotal = ["Total Retenciones", fmt(recibo.totalRetenciones)]

      y = drawTable(doc, y, retColumns, retRows, { subtotalRow: retSubtotal })
      y += 10
    }

    // ─── Medios de pago ────────────────────────────────────────────────────

    drawRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14, SECTION_BG)
    drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, 14)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SECTION).fillColor("#000")
      .text("DETALLE DE MEDIOS DE PAGO", PAGE_MARGIN + 6, y + 3)
    y += 14

    const medColumns = [
      { label: "Tipo", width: CONTENT_WIDTH * 0.20 },
      { label: "Detalle", width: CONTENT_WIDTH * 0.55 },
      { label: "Importe", width: CONTENT_WIDTH * 0.25, align: "right" as const },
    ]
    const medRows = recibo.mediosPago.map((m) => {
      let detalle = ""
      if (m.tipo === "TRANSFERENCIA") {
        const cuenta = m.cuentaId ? cuentaMap[m.cuentaId] : null
        const cuentaStr = cuenta ? `${cuenta.nombre} (${cuenta.bancoOEntidad})` : ""
        const fechaStr = m.fechaTransferencia ? fmtFecha(m.fechaTransferencia) : ""
        const refStr = m.referencia ? `Ref: ${m.referencia}` : ""
        detalle = [cuentaStr, fechaStr, refStr].filter(Boolean).join(" - ")
      } else if (m.tipo === "ECHEQ" || m.tipo === "CHEQUE_FISICO") {
        const nroStr = m.nroCheque ? `Nro ${m.nroCheque}` : ""
        const bancoStr = m.bancoEmisor ?? ""
        const vencStr = m.fechaPago ? `Vto ${fmtFecha(m.fechaPago)}` : ""
        detalle = [nroStr, bancoStr, vencStr].filter(Boolean).join(" - ")
      }
      return [tipoMedioLabel(m.tipo), detalle, fmt(m.monto)]
    })
    const medSubtotal = ["Total Cobrado", "", fmt(recibo.totalCobrado)]

    y = drawTable(doc, y, medColumns, medRows, { subtotalRow: medSubtotal })
    y += 10

    // ─── Importe en letras ─────────────────────────────────────────────────

    const importeLetras = numeroALetras(Math.floor(recibo.totalCobrado))
    const centavos = Math.round((recibo.totalCobrado % 1) * 100)
    const totalLetras = `${importeLetras} PESOS${centavos > 0 ? ` CON ${centavos}/100` : " CON 00/100"}`

    const letrasBoxH = 30
    drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, letrasBoxH)
    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("SON:", PAGE_MARGIN + 8, y + 5)
    doc.font("Helvetica-Bold").fontSize(FONT_SIZE_NORMAL).fillColor("#000")
      .text(totalLetras, PAGE_MARGIN + 8, y + 15, { width: CONTENT_WIDTH - 16 })
    y += letrasBoxH + 10

    // ─── Totales finales ───────────────────────────────────────────────────

    const totColumns = [
      { label: "Total Comprobantes", width: CONTENT_WIDTH / 3, align: "right" as const },
      { label: "Total Retenciones", width: CONTENT_WIDTH / 3, align: "right" as const },
      { label: "Total Cobrado", width: CONTENT_WIDTH / 3, align: "right" as const },
    ]

    // Dark header
    const totHeaderH = 18
    drawRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, totHeaderH, TOTALES_HEADER_BG)
    drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, totHeaderH, "#000", 2)

    let tcx = PAGE_MARGIN
    for (const col of totColumns) {
      doc.font("Helvetica-Bold").fontSize(FONT_SIZE_SMALL).fillColor("#ffffff")
        .text(col.label, tcx + 4, y + 4, { width: col.width - 8, align: "right" })
      tcx += col.width
    }
    y += totHeaderH

    // Values row
    const totRowH = 22
    drawStrokeRect(doc, PAGE_MARGIN, y, CONTENT_WIDTH, totRowH, "#000", 2)

    const totValues = [fmt(recibo.totalComprobantes), fmt(recibo.totalRetenciones), fmt(recibo.totalCobrado)]
    tcx = PAGE_MARGIN
    for (let i = 0; i < totColumns.length; i++) {
      doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
        .text(totValues[i], tcx + 4, y + 6, { width: totColumns[i].width - 8, align: "right" })
      tcx += totColumns[i].width
    }
    y += totRowH + 30

    // ─── Firmas ────────────────────────────────────────────────────────────

    const firmaLineWidth = 150
    const firmaLeftX = PAGE_MARGIN + 40
    const firmaRightX = A4_WIDTH - PAGE_MARGIN - 40 - firmaLineWidth

    // Ensure enough space for signatures
    if (y + 40 > A4_HEIGHT - PAGE_MARGIN - 40) {
      doc.addPage()
      y = PAGE_MARGIN
    }

    // Left firma line - draw manually to constrain width
    doc.save()
      .moveTo(firmaLeftX, y)
      .lineTo(firmaLeftX + firmaLineWidth, y)
      .lineWidth(0.5)
      .strokeColor("#000")
      .stroke()
      .restore()

    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("Firma autorizada Trans-Magg S.R.L.", firmaLeftX, y + 4, {
        width: firmaLineWidth,
        align: "center",
      })

    // Right firma line
    doc.save()
      .moveTo(firmaRightX, y)
      .lineTo(firmaRightX + firmaLineWidth, y)
      .lineWidth(0.5)
      .strokeColor("#000")
      .stroke()
      .restore()

    doc.font("Helvetica").fontSize(FONT_SIZE_XS).fillColor("#555555")
      .text("Conformidad del receptor", firmaRightX, y + 4, {
        width: firmaLineWidth,
        align: "center",
      })

    y += 30

    // ─── Footer ────────────────────────────────────────────────────────────

    drawHLine(doc, y, "#eeeeee", 0.5)
    doc.font("Helvetica").fontSize(7).fillColor("#aaaaaa")
      .text(
        `Trans-Magg S.R.L. - Recibo generado el ${fmtFecha(new Date())} - Operador: ${recibo.operador.nombre} ${recibo.operador.apellido}`,
        PAGE_MARGIN,
        y + 6,
        { width: CONTENT_WIDTH, align: "center" }
      )

    doc.end()
  })
}

// ─── Funcion principal ───────────────────────────────────────────────────────

/**
 * generarPDFReciboCobranza: (reciboId: string) -> Promise<Buffer>
 *
 * Dado el id de un Recibo de Cobranza, carga todos sus datos desde la DB,
 * y genera el PDF directamente con pdfkit (formato A4).
 * Existe para generar el comprobante que se entrega a la empresa cliente.
 *
 * Ejemplos:
 * const buf = await generarPDFReciboCobranza("uuid-del-recibo")
 * // => Buffer con el PDF del Recibo listo para subir a R2
 */
export async function generarPDFReciboCobranza(reciboId: string): Promise<Buffer> {
  const recibo = await prisma.reciboCobranza.findUnique({
    where: { id: reciboId },
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
      operador: { select: { nombre: true, apellido: true } },
      facturas: { select: { nroComprobante: true, tipoCbte: true, total: true, emitidaEn: true } },
      mediosPago: {
        select: {
          tipo: true,
          monto: true,
          cuentaId: true,
          fechaTransferencia: true,
          referencia: true,
          nroCheque: true,
          bancoEmisor: true,
          fechaEmision: true,
          fechaPago: true,
        },
      },
    },
  })

  if (!recibo) throw new Error(`Recibo ${reciboId} no encontrado`)

  // Cargar cuentas para transferencias
  const cuentaIds = recibo.mediosPago.filter((m) => m.cuentaId).map((m) => m.cuentaId!)
  const cuentas =
    cuentaIds.length > 0
      ? await prisma.cuenta.findMany({
          where: { id: { in: cuentaIds } },
          select: { id: true, nombre: true, bancoOEntidad: true },
        })
      : []
  const cuentaMap = Object.fromEntries(cuentas.map((c) => [c.id, c]))

  return buildPDF(recibo, cuentaMap)
}
