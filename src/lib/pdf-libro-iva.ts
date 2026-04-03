/**
 * Proposito: Generacion del PDF del Libro de IVA mensual con pdfkit.
 * Incluye secciones IVA Ventas, IVA Compras y posicion neta.
 */

import PDFDocument from "pdfkit"

type AsientoConRelaciones = {
  id: string
  tipo: string
  tipoReferencia: string
  baseImponible: number
  alicuota: number
  montoIva: number
  periodo: string
  facturaEmitida?: {
    nroComprobante: string | null
    tipoCbte: number | null
    emitidaEn: Date | null
    empresa: { razonSocial: string; cuit: string }
  } | null
  facturaProveedor?: {
    nroComprobante: string
    tipoCbte: string
    fechaCbte: Date
    proveedor: { razonSocial: string; cuit: string }
  } | null
  liquidacion?: {
    nroComprobante: number | null
    ptoVenta: number | null
    grabadaEn: Date | null
    fletero: { razonSocial: string; cuit: string }
  } | null
  facturaSeguro?: {
    nroComprobante: string | null
    fecha: Date | null
    aseguradora: { razonSocial: string; cuit: string }
  } | null
}

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(d: Date | string | null | undefined): string {
  if (!d) return "\u2014"
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(new Date(d))
}

function fmtCuit(cuit: string): string {
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

/* -- Helpers para extraer datos de fila ------------------------------------ */

function datosVenta(a: AsientoConRelaciones) {
  const esLP = a.tipoReferencia === "LIQUIDACION"
  const fecha = esLP ? a.liquidacion?.grabadaEn : a.facturaEmitida?.emitidaEn
  const contraparte = esLP
    ? (a.liquidacion?.fletero.razonSocial ?? "\u2014")
    : (a.facturaEmitida?.empresa.razonSocial ?? "\u2014")
  const cbte = esLP
    ? (a.liquidacion?.ptoVenta != null && a.liquidacion?.nroComprobante != null
        ? `LP ${String(a.liquidacion.ptoVenta).padStart(4, "0")}-${String(a.liquidacion.nroComprobante).padStart(8, "0")}`
        : "LP s/n")
    : (a.facturaEmitida
        ? `${a.facturaEmitida.tipoCbte ?? ""} ${a.facturaEmitida.nroComprobante ?? "s/n"}`
        : "\u2014")
  const cuit = esLP ? a.liquidacion?.fletero.cuit : a.facturaEmitida?.empresa.cuit
  const tipo = esLP ? "Liq. Productor" : "Factura"
  return { fecha, tipo, cbte, contraparte, cuit }
}

function datosCompra(a: AsientoConRelaciones) {
  const esSeguro = a.tipoReferencia.startsWith("FACTURA_SEGURO")
  const fecha = esSeguro ? a.facturaSeguro?.fecha : a.facturaProveedor?.fechaCbte
  const proveedor = esSeguro
    ? (a.facturaSeguro?.aseguradora?.razonSocial ?? "\u2014")
    : (a.facturaProveedor?.proveedor.razonSocial ?? "\u2014")
  const cbte = esSeguro
    ? (a.facturaSeguro?.nroComprobante ?? "\u2014")
    : (a.facturaProveedor ? `${a.facturaProveedor.tipoCbte} ${a.facturaProveedor.nroComprobante}` : "\u2014")
  const cuit = esSeguro
    ? a.facturaSeguro?.aseguradora?.cuit
    : a.facturaProveedor?.proveedor.cuit
  const tipo = a.tipoReferencia === "PERCEPCION_IVA"
    ? "Percepcion IVA"
    : a.tipoReferencia === "PERCEPCION_IIBB"
      ? "Percepcion IIBB"
      : esSeguro ? "Seguro" : "Factura"
  return { fecha, tipo, cbte, proveedor, cuit }
}

/* -- Blue separator helper ------------------------------------------------- */

function blueLine(doc: PDFKit.PDFDocument) {
  doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#1e40af").lineWidth(1.5).stroke()
  doc.moveDown(0.3)
}

/* -- Table drawing helpers ------------------------------------------------- */

// Column positions for 8-column IVA table (landscape would be nice, but we keep A4 portrait)
// Fecha | Tipo | Comprobante | Empresa/Prov | Base Imp. | Alic. | IVA | CUIT
const COL_X = [40, 95, 155, 245, 345, 405, 445, 495]
const COL_W = [55, 60, 90, 100, 60, 40, 50, 60]

function drawTableHeader(doc: PDFKit.PDFDocument, headers: string[]) {
  if (doc.y > 750) doc.addPage()
  const y = doc.y
  doc.rect(40, y, 515, 16).fill("#f0f0f0")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  for (let i = 0; i < headers.length; i++) {
    const align = i >= 4 ? "right" : "left"
    const x = COL_X[i]
    const w = COL_W[i]
    if (align === "right") {
      doc.text(headers[i], x, y + 4, { width: w, align: "right" })
    } else {
      doc.text(headers[i], x, y + 4, { width: w })
    }
  }
  doc.font("Helvetica").fontSize(7)
  doc.y = y + 18
}

function drawRow(doc: PDFKit.PDFDocument, cells: string[], bold = false) {
  if (doc.y > 750) doc.addPage()
  const y = doc.y
  doc.font(bold ? "Helvetica-Bold" : "Helvetica").fontSize(7).fillColor("#000")
  for (let i = 0; i < cells.length; i++) {
    const align = i >= 4 ? "right" : "left"
    const x = COL_X[i]
    const w = COL_W[i]
    doc.text(cells[i], x, y + 2, { width: w, align, lineBreak: false })
  }
  doc.y = y + 13
}

function drawTotalsRow(doc: PDFKit.PDFDocument, label: string, totalBase: string, totalIva: string) {
  if (doc.y > 750) doc.addPage()
  const y = doc.y
  doc.rect(40, y, 515, 16).fill("#f0f0f0")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(7)
  doc.text(label, COL_X[0], y + 4, { width: COL_X[4] - COL_X[0], align: "right" })
  doc.text(totalBase, COL_X[4], y + 4, { width: COL_W[4], align: "right" })
  doc.text(totalIva, COL_X[6], y + 4, { width: COL_W[6], align: "right" })
  doc.font("Helvetica")
  doc.y = y + 18
}

/* -- Main export ----------------------------------------------------------- */

/**
 * generarPDFLibroIva: (asientos, mesAnio) -> Promise<Buffer>
 *
 * Dado los asientos IVA del periodo y el string YYYY-MM, genera el PDF del libro
 * usando pdfkit y devuelve el buffer.
 *
 * Ejemplos:
 * generarPDFLibroIva(asientos, "2026-03") => Buffer (PDF A4)
 */
export async function generarPDFLibroIva(
  asientos: AsientoConRelaciones[],
  mesAnio: string
): Promise<Buffer> {
  const ventas = asientos.filter((a) => a.tipo === "VENTA")
  const compras = asientos.filter((a) => a.tipo === "COMPRA")
  const totalBaseVentas = ventas.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaVentas = ventas.reduce((acc, a) => acc + a.montoIva, 0)
  const totalBaseCompras = compras.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaCompras = compras.reduce((acc, a) => acc + a.montoIva, 0)
  const posicion = totalIvaVentas - totalIvaCompras

  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    /* -- Cabecera -- */
    doc.font("Helvetica-Bold").fontSize(14).text("TRANS-MAGG S.R.L.", 40, 40)
    doc.font("Helvetica").fontSize(9).fillColor("#555").text("C.U.I.T. 30-70938168-3")
    doc.fillColor("#000").font("Helvetica-Bold").fontSize(12)
    doc.text(`Libro de IVA \u2014 ${nombreMes(mesAnio)}`, 40, doc.y + 4)
    doc.moveDown(0.5)

    // Separator
    blueLine(doc)
    doc.moveDown(0.3)

    /* -- SECCION: IVA VENTAS -- */
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
    doc.text(`IVA Ventas (${ventas.length} asiento${ventas.length !== 1 ? "s" : ""})`, 40, doc.y)
    doc.moveDown(0.4)

    if (ventas.length === 0) {
      doc.font("Helvetica").fontSize(8).fillColor("#888")
      doc.text("Sin asientos de IVA Ventas en el periodo.", 40, doc.y)
      doc.fillColor("#000").moveDown(0.5)
    } else {
      const headers = ["Fecha", "Tipo", "Comprobante", "Empresa / Fletero", "Base Imp.", "Alic.", "IVA", "CUIT"]
      drawTableHeader(doc, headers)

      for (const a of ventas) {
        const d = datosVenta(a)
        drawRow(doc, [
          fmtFecha(d.fecha),
          d.tipo,
          d.cbte,
          d.contraparte,
          fmt(a.baseImponible),
          `${a.alicuota}%`,
          fmt(a.montoIva),
          d.cuit ? fmtCuit(d.cuit) : "\u2014",
        ])
      }

      drawTotalsRow(doc, "TOTAL IVA VENTAS", fmt(totalBaseVentas), fmt(totalIvaVentas))
    }

    doc.moveDown(0.8)

    /* -- SECCION: IVA COMPRAS -- */
    doc.font("Helvetica-Bold").fontSize(10).fillColor("#000")
    doc.text(`IVA Compras (${compras.length} asiento${compras.length !== 1 ? "s" : ""})`, 40, doc.y)
    doc.moveDown(0.4)

    if (compras.length === 0) {
      doc.font("Helvetica").fontSize(8).fillColor("#888")
      doc.text("Sin asientos de IVA Compras en el periodo.", 40, doc.y)
      doc.fillColor("#000").moveDown(0.5)
    } else {
      const headers = ["Fecha", "Tipo", "Comprobante", "Proveedor", "Base Imp.", "Alic.", "IVA", "CUIT"]
      drawTableHeader(doc, headers)

      for (const a of compras) {
        const d = datosCompra(a)
        drawRow(doc, [
          fmtFecha(d.fecha),
          d.tipo,
          d.cbte,
          d.proveedor,
          fmt(a.baseImponible),
          `${a.alicuota}%`,
          fmt(a.montoIva),
          d.cuit ? fmtCuit(d.cuit) : "\u2014",
        ])
      }

      drawTotalsRow(doc, "TOTAL IVA COMPRAS", fmt(totalBaseCompras), fmt(totalIvaCompras))
    }

    doc.moveDown(1)

    /* -- POSICION NETA -- */
    if (doc.y > 700) doc.addPage()
    const boxY = doc.y
    doc.rect(40, boxY, 515, 50).lineWidth(2).strokeColor("#000").stroke()

    doc.font("Helvetica").fontSize(8).fillColor("#555")
    doc.text("IVA VENTAS", 55, boxY + 8)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
    doc.text(fmt(totalIvaVentas), 55, boxY + 20)

    doc.font("Helvetica").fontSize(8).fillColor("#555")
    doc.text("IVA COMPRAS", 220, boxY + 8)
    doc.font("Helvetica-Bold").fontSize(11).fillColor("#000")
    doc.text(fmt(totalIvaCompras), 220, boxY + 20)

    doc.font("Helvetica").fontSize(8).fillColor("#555")
    doc.text("POSICION NETA DE IVA", 385, boxY + 8)
    const posColor = posicion >= 0 ? "#dc2626" : "#16a34a"
    const posLabel = posicion >= 0 ? "A PAGAR" : "A FAVOR"
    doc.font("Helvetica-Bold").fontSize(11).fillColor(posColor)
    doc.text(`${fmt(Math.abs(posicion))} ${posLabel}`, 385, boxY + 20)

    doc.y = boxY + 56
    doc.fillColor("#000")

    /* -- Footer -- */
    doc.moveDown(1.5)
    doc.font("Helvetica").fontSize(8).fillColor("#888")
    doc.text(
      `Trans-Magg S.R.L. \u2014 Libro IVA ${nombreMes(mesAnio)} \u2014 Generado el ${fmtFecha(new Date())}`,
      40, doc.y, { align: "center", width: 515 }
    )

    doc.end()
  })
}
