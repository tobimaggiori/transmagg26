/**
 * Genera el PDF del reporte "Deuda de Empresas" del dashboard.
 * Refleja los mismos datos que el modal: por empresa, listado de facturas
 * pendientes con columnas FECHA | COMPROBANTE | TOTAL y el saldo deudor
 * total por empresa.
 */

import PDFDocument from "pdfkit"

export interface FacturaDeuda {
  nroComprobante: string | null
  ptoVenta: number | null
  tipoCbte: number
  total: number
  emitidaEn: string
}

export interface NotaDeuda {
  tipo: "NC_EMITIDA" | "ND_EMITIDA"
  tipoCbte: number | null
  nroComprobante: number | null
  ptoVenta: number | null
  monto: number
  signo: -1 | 1
  emitidaEn: string
}

export interface EmpresaDeuda {
  razonSocial: string
  cuit: string
  saldoDeudor: number
  facturas: FacturaDeuda[]
  notas?: NotaDeuda[]
}

export interface DatosPDFDeudaEmpresas {
  empresas: EmpresaDeuda[]
  totalGeneral: number
  generadoEn: Date
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

function labelTipoCbte(t: number): string {
  if (t === 1) return "Fact. A"
  if (t === 6) return "Fact. B"
  if (t === 11) return "Fact. C"
  if (t === 201) return "MiPyme A"
  if (t === 206) return "MiPyme B"
  if (t === 211) return "MiPyme C"
  return `Cbte ${t}`
}

function labelTipoNota(tipo: "NC_EMITIDA" | "ND_EMITIDA", tipoCbte: number | null): string {
  const abrev = tipo === "NC_EMITIDA" ? "NC" : "ND"
  if (tipoCbte === 3 || tipoCbte === 2) return `${abrev} A`
  if (tipoCbte === 8 || tipoCbte === 7) return `${abrev} B`
  if (tipoCbte === 13 || tipoCbte === 12) return `${abrev} C`
  return abrev
}

function fmtNroFactura(ptoVenta: number | null, nro: string | null): string {
  if (!nro) return "s/n"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const n = /^\d+$/.test(nro) ? nro.padStart(8, "0") : nro
  return `${pv}-${n}`
}

function fmtNroNota(ptoVenta: number | null, nro: number | null): string {
  if (nro == null) return "s/n"
  return `${String(ptoVenta ?? 1).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

// Layout A4 portrait margen 40, ancho útil 515
const COL_X = [40, 160, 420]
const COL_W = [115, 255, 135]

function drawTableHeader(doc: PDFKit.PDFDocument) {
  if (doc.y > 770) doc.addPage()
  const y = doc.y
  doc.rect(40, y, 515, 20).fill("#f0f0f0")
  doc.fillColor("#000").font("Helvetica-Bold").fontSize(10)
  doc.text("Fecha", COL_X[0], y + 5, { width: COL_W[0] })
  doc.text("Comprobante", COL_X[1], y + 5, { width: COL_W[1] })
  doc.text("Total", COL_X[2], y + 5, { width: COL_W[2], align: "right" })
  doc.font("Helvetica").fontSize(10)
  doc.y = y + 22
}

function drawFacturaRow(doc: PDFKit.PDFDocument, f: FacturaDeuda) {
  if (doc.y > 770) {
    doc.addPage()
    drawTableHeader(doc)
  }
  const y = doc.y
  doc.font("Helvetica").fontSize(10).fillColor("#000")
  doc.text(fmtFecha(f.emitidaEn), COL_X[0], y + 3, { width: COL_W[0], lineBreak: false })
  doc.text(`${labelTipoCbte(f.tipoCbte)}  ${fmtNroFactura(f.ptoVenta, f.nroComprobante)}`, COL_X[1], y + 3, { width: COL_W[1], lineBreak: false })
  doc.text(fmtMoneda(f.total), COL_X[2], y + 3, { width: COL_W[2], align: "right", lineBreak: false })
  doc.y = y + 17
}

function drawNotaRow(doc: PDFKit.PDFDocument, n: NotaDeuda) {
  if (doc.y > 770) {
    doc.addPage()
    drawTableHeader(doc)
  }
  const y = doc.y
  const monto = n.monto * n.signo
  doc.font("Helvetica").fontSize(10).fillColor("#000")
  doc.text(fmtFecha(n.emitidaEn), COL_X[0], y + 3, { width: COL_W[0], lineBreak: false })
  doc.text(`${labelTipoNota(n.tipo, n.tipoCbte)}  ${fmtNroNota(n.ptoVenta, n.nroComprobante)}`, COL_X[1], y + 3, { width: COL_W[1], lineBreak: false })
  doc.text(fmtMoneda(monto), COL_X[2], y + 3, { width: COL_W[2], align: "right", lineBreak: false })
  doc.y = y + 17
}

function drawEmpresaHeader(doc: PDFKit.PDFDocument, e: EmpresaDeuda) {
  if (doc.y > 750) doc.addPage()
  doc.moveDown(0.4)
  const y = doc.y
  // Línea 1: razón social (izq) + saldo deudor (der) — ambos arrancan en la misma y.
  // Se escribe saldo primero para que doc.y quede igualado y la siguiente línea no se pise.
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#b00020")
    .text(`Saldo deudor: ${fmtMoneda(e.saldoDeudor)}`, 40, y, { width: 515, align: "right" })
  const yAfterSaldo = doc.y
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#000")
    .text(e.razonSocial, 40, y, { width: 380 })
  const yAfterRazon = doc.y
  // Avanzar al máximo de ambos para evitar solapamiento
  doc.y = Math.max(yAfterSaldo, yAfterRazon)
  // Línea 2: CUIT
  doc.font("Helvetica").fontSize(10).fillColor("#555")
    .text(`CUIT: ${fmtCuit(e.cuit)}`, 40, doc.y, { width: 515 })
  doc.fillColor("#000").moveDown(0.4)
}

export async function generarPDFDeudaEmpresas(datos: DatosPDFDeudaEmpresas): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 40, size: "A4" })
    const chunks: Buffer[] = []
    doc.on("data", (chunk: Buffer) => chunks.push(chunk))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    // Cabecera
    const LOGO_X = 40, LOGO_Y = 40, LOGO_W = 120, LOGO_H = 55
    let cursorY = LOGO_Y

    if (datos.logo) {
      try {
        doc.image(datos.logo, LOGO_X, LOGO_Y, { fit: [LOGO_W, LOGO_H] })
        cursorY = LOGO_Y + LOGO_H + 12
      } catch { /* ignorar si falla */ }
    }

    doc.font("Helvetica-Bold").fontSize(18).fillColor("#000")
      .text("Deuda de Empresas", 40, cursorY, { width: 515 })
    doc.font("Helvetica").fontSize(10).fillColor("#555")
      .text(`Generado el ${fmtFecha(datos.generadoEn)}`, 40, doc.y, { width: 515 })
    doc.fillColor("#000")

    doc.moveDown(0.3)
    doc.moveTo(40, doc.y).lineTo(555, doc.y).strokeColor("#1e40af").lineWidth(1.2).stroke()
    doc.moveDown(0.5)

    // Total general
    doc.font("Helvetica-Bold").fontSize(13).fillColor("#000")
      .text(`Total general a cobrar: ${fmtMoneda(datos.totalGeneral)}`, 40, doc.y, { width: 515 })
    doc.moveDown(0.4)

    if (datos.empresas.length === 0) {
      doc.font("Helvetica").fontSize(11).fillColor("#888")
        .text("Sin deudas pendientes.", 40, doc.y + 4, { width: 515, align: "center" })
      doc.end()
      return
    }

    // Por empresa
    for (const e of datos.empresas) {
      drawEmpresaHeader(doc, e)
      drawTableHeader(doc)
      const notas = e.notas ?? []
      if (e.facturas.length === 0 && notas.length === 0) {
        doc.font("Helvetica").fontSize(8).fillColor("#888")
          .text("Sin facturas con saldo.", 40, doc.y + 2, { width: 515, align: "center" })
        doc.fillColor("#000").moveDown(0.4)
      } else {
        for (const f of e.facturas) drawFacturaRow(doc, f)
        for (const n of notas) drawNotaRow(doc, n)
      }
      doc.moveDown(0.4)
    }

    doc.end()
  })
}
