/**
 * pdf-orden-pago.ts
 *
 * Genera el PDF de una Orden de Pago con la estética del Líquido Producto
 * (paleta navy/celeste, recuadros redondeados, tablas con bordes suaves)
 * pero SIN elementos fiscales (letra A/B/C, QR ARCA, CAE, "Comprobante Autorizado").
 *
 * Estructura:
 * 1. Encabezado (logo emisor + recuadro "Orden de Pago Nº X-AAAA / Fecha")
 * 2. Caja del fletero (Sres / CUIT / Domicilio / Situación IVA)
 * 3. Comprobantes Cancelados (LPs pagadas en esta OP)
 * 4. Aplicaciones — solo si hay alguna (NC + Adlto Combustible/Cheque/Transferencia/Efectivo/Otros, en negativo)
 * 5. Neto a Pagar = Comprobantes Cancelados + Aplicaciones
 * 6. Medios de Pago (Cheque, Transferencia, Efectivo)
 * 7. Total de Pago
 */

import { prisma } from "@/lib/prisma"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import { sumarImportes } from "@/lib/money"
import { mergePDFsMixto } from "@/lib/pdf-merge"
import PDFDocument from "pdfkit"

/* ── Paleta (igual que pdf-liquidacion) ────────────────────────────────── */

const NAVY = "#1e3a5f"
const BG_LIGHT = "#edf1f7"
const BORDER = "#c8d1dc"
const TEXT = "#1a1a1a"
const HEADER_BG = "#dce3ed"

/* ── Helpers de formato ────────────────────────────────────────────────── */

function fmtMoneda(n: number): string {
  const parts = Math.abs(n).toFixed(2).split(".")
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${n < 0 ? "-" : ""}$ ${entero},${parts[1]}`
}

function fmtFecha(d: Date): string {
  const dd = String(d.getDate()).padStart(2, "0")
  const mm = String(d.getMonth() + 1).padStart(2, "0")
  const yyyy = d.getFullYear()
  return `${dd}/${mm}/${yyyy}`
}

function fmtNroComprobante(ptoVenta: number | null, nro: number | null): string {
  if (ptoVenta == null || nro == null) return "s/n"
  return `${String(ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`
}

function fmtCuit(cuit: string): string {
  const c = cuit.replace(/\D/g, "")
  if (c.length !== 11) return cuit
  return `${c.slice(0, 2)}-${c.slice(2, 10)}-${c.slice(10)}`
}

const condicionIvaLabel: Record<string, string> = {
  RESPONSABLE_INSCRIPTO: "Responsable Inscripto",
  MONOTRIBUTISTA: "Monotributista",
  EXENTO: "Exento",
  CONSUMIDOR_FINAL: "Consumidor Final",
}

/* ── Layout ────────────────────────────────────────────────────────────── */

const MARGIN = 42.52 // ~15mm
const PAGE_W = 595.28
const PAGE_H = 841.89
const LEFT = MARGIN
const RIGHT = PAGE_W - MARGIN
const CONTENT_W = RIGHT - LEFT
const FOOTER_RESERVE = 40

/* ── Tipos internos ────────────────────────────────────────────────────── */

interface FacturaCanceladaRow {
  fecha: Date
  ptoVenta: number | null
  nro: number | null
  total: number
}

interface AplicacionRow {
  fecha: Date
  tipo: string         // "NC" | "Adlto Combustible" | "Adlto Cheque" | ...
  comprobante: string  // nro NC / nro factura / nro cheque / "--"
  detalle: string      // descripción / razón social / "Comprobante adjunto" / "--"
  importe: number      // siempre negativo en el PDF
}

interface MedioPagoRow {
  tipo: string         // "Cheque" | "Transferencia" | "Efectivo"
  detalle: string      // "Comprobante adjunto" o ""
  importe: number      // positivo
}

/* ── Carga de datos ────────────────────────────────────────────────────── */

async function loadOP(ordenPagoId: string) {
  const op = await prisma.ordenPago.findUnique({
    where: { id: ordenPagoId },
    include: {
      fletero: {
        select: {
          id: true,
          razonSocial: true,
          cuit: true,
          condicionIva: true,
          direccion: true,
        },
      },
      operador: { select: { nombre: true, apellido: true } },
      pagos: {
        where: { anulado: false },
        include: {
          liquidacion: {
            select: {
              id: true,
              nroComprobante: true,
              ptoVenta: true,
              grabadaEn: true,
              total: true,
            },
          },
          chequeEmitido: { select: { nroCheque: true } },
          chequeRecibido: { select: { nroCheque: true, bancoEmisor: true } },
        },
        orderBy: { creadoEn: "asc" },
      },
    },
  })

  if (!op) throw new Error(`OrdenPago ${ordenPagoId} no encontrada`)

  // ── Comprobantes cancelados (LPs únicas) ─────────────────────────────
  const liqMap = new Map<string, FacturaCanceladaRow>()
  for (const pago of op.pagos) {
    if (pago.liquidacion && pago.liquidacionId && !liqMap.has(pago.liquidacionId)) {
      liqMap.set(pago.liquidacionId, {
        fecha: pago.liquidacion.grabadaEn,
        ptoVenta: pago.liquidacion.ptoVenta,
        nro: pago.liquidacion.nroComprobante,
        total: pago.liquidacion.total,
      })
    }
  }
  const facturas = Array.from(liqMap.values())
  const totalFacturas = sumarImportes(facturas.map((f) => f.total))
  const liqIds = Array.from(liqMap.keys())

  // ── Aplicaciones ──────────────────────────────────────────────────────
  const aplicaciones: AplicacionRow[] = []

  // 1. NC descontadas en esta OP (filtra por LPs de la OP)
  const ncDescuentos = await prisma.nCDescuento.findMany({
    where: { liquidacionId: { in: liqIds } },
    include: {
      nc: {
        select: {
          ptoVenta: true,
          nroComprobante: true,
          descripcion: true,
          subtipo: true,
        },
      },
    },
    orderBy: { fecha: "asc" },
  })
  for (const ncd of ncDescuentos) {
    const nro = fmtNroComprobante(ncd.nc.ptoVenta, ncd.nc.nroComprobante)
    aplicaciones.push({
      fecha: ncd.fecha,
      tipo: "NC",
      comprobante: nro,
      detalle: ncd.nc.descripcion ?? ncd.nc.subtipo ?? "—",
      importe: -ncd.montoDescontado,
    })
  }

  // 2. GastoFletero (COMBUSTIBLE | OTRO) descontados en esta OP
  const gastoDescuentos = await prisma.gastoDescuento.findMany({
    where: { liquidacionId: { in: liqIds } },
    include: {
      gasto: {
        select: {
          tipo: true,
          descripcion: true,
          sinFactura: true,
          facturaProveedor: {
            select: {
              ptoVenta: true,
              nroComprobante: true,
              proveedor: { select: { razonSocial: true } },
            },
          },
        },
      },
    },
    orderBy: { fecha: "asc" },
  })
  for (const gd of gastoDescuentos) {
    const esCombustible = gd.gasto.tipo === "COMBUSTIBLE"
    const fp = gd.gasto.facturaProveedor
    if (esCombustible) {
      const nroFactura = fp
        ? `${String(fp.ptoVenta ?? 0).padStart(4, "0")}-${fp.nroComprobante ?? "s/n"}`
        : "Sin factura"
      aplicaciones.push({
        fecha: gd.fecha,
        tipo: "Adlto Combustible",
        comprobante: nroFactura,
        detalle: fp?.proveedor?.razonSocial ?? gd.gasto.descripcion ?? "Combustible",
        importe: -gd.montoDescontado,
      })
    } else {
      aplicaciones.push({
        fecha: gd.fecha,
        tipo: "Adlto",
        comprobante: "--",
        detalle: gd.gasto.descripcion ?? "Gasto",
        importe: -gd.montoDescontado,
      })
    }
  }

  // 3. AdelantoFletero descontados en esta OP (CHEQUE_*, TRANSFERENCIA, EFECTIVO)
  const adelantoDescuentos = await prisma.adelantoDescuento.findMany({
    where: { liquidacionId: { in: liqIds } },
    include: {
      adelanto: {
        select: {
          tipo: true,
          descripcion: true,
          comprobanteS3Key: true,
          chequeEmitido: { select: { nroCheque: true } },
          chequeRecibido: { select: { nroCheque: true } },
        },
      },
    },
    orderBy: { fecha: "asc" },
  })
  for (const ad of adelantoDescuentos) {
    const tipo = ad.adelanto.tipo
    const nroCh = ad.adelanto.chequeEmitido?.nroCheque ?? ad.adelanto.chequeRecibido?.nroCheque ?? null
    if (tipo === "CHEQUE_PROPIO" || tipo === "CHEQUE_TERCERO") {
      aplicaciones.push({
        fecha: ad.fecha,
        tipo: "Adlto Cheque",
        comprobante: nroCh ? `Nº ${nroCh}` : "--",
        detalle: "Comprobante adjunto",
        importe: -ad.montoDescontado,
      })
    } else if (tipo === "TRANSFERENCIA") {
      aplicaciones.push({
        fecha: ad.fecha,
        tipo: "Adlto Transferencia",
        comprobante: "--",
        detalle: "Comprobante adjunto",
        importe: -ad.montoDescontado,
      })
    } else if (tipo === "EFECTIVO") {
      aplicaciones.push({
        fecha: ad.fecha,
        tipo: "Adlto Efectivo",
        comprobante: "--",
        detalle: ad.adelanto.descripcion ?? "--",
        importe: -ad.montoDescontado,
      })
    }
  }

  const totalAplicaciones = sumarImportes(aplicaciones.map((a) => a.importe))
  const netoAPagar = sumarImportes([totalFacturas, totalAplicaciones])

  // ── Medios de Pago ───────────────────────────────────────────────────
  const mediosDePago: MedioPagoRow[] = []
  const chequesVistos = new Set<string>()

  for (const p of op.pagos) {
    if (p.tipoPago === "CHEQUE_PROPIO") {
      const key = p.chequeEmitidoId ?? `propio:${p.id}`
      if (chequesVistos.has(key)) continue
      chequesVistos.add(key)
      mediosDePago.push({
        tipo: "Cheque",
        detalle: p.chequeEmitido?.nroCheque
          ? `Nº ${p.chequeEmitido.nroCheque} · Comprobante adjunto`
          : "Comprobante adjunto",
        importe: p.monto,
      })
    } else if (p.tipoPago === "CHEQUE_TERCERO") {
      const key = p.chequeRecibidoId ?? `tercero:${p.id}`
      if (chequesVistos.has(key)) continue
      chequesVistos.add(key)
      const detalleCh = p.chequeRecibido
        ? `${p.chequeRecibido.bancoEmisor} · Nº ${p.chequeRecibido.nroCheque} · Comprobante adjunto`
        : "Comprobante adjunto"
      mediosDePago.push({ tipo: "Cheque", detalle: detalleCh, importe: p.monto })
    } else if (p.tipoPago === "TRANSFERENCIA") {
      mediosDePago.push({ tipo: "Transferencia", detalle: "Comprobante adjunto", importe: p.monto })
    } else if (p.tipoPago === "EFECTIVO") {
      mediosDePago.push({ tipo: "Efectivo", detalle: "", importe: p.monto })
    } else if (p.tipoPago === "SALDO_A_FAVOR") {
      mediosDePago.push({ tipo: "Saldo a favor", detalle: "", importe: p.monto })
    }
  }
  const totalMediosDePago = sumarImportes(mediosDePago.map((m) => m.importe))

  const condicionIva = condicionIvaLabel[op.fletero.condicionIva] ?? op.fletero.condicionIva

  // ── Adjuntos a anexar al PDF ──────────────────────────────────────────
  // Orden requerido: Cheques Propios → Cheques Tercero → Transferencias.
  // Dentro de cada bloque van primero los adelantos descontados (en el
  // orden en que se aplicaron) y después los medios de pago de esta OP.
  const propios: string[] = []
  const terceros: string[] = []
  const transferencias: string[] = []

  for (const ad of adelantoDescuentos) {
    const key = ad.adelanto.comprobanteS3Key
    if (!key) continue
    if (ad.adelanto.tipo === "CHEQUE_PROPIO") propios.push(key)
    else if (ad.adelanto.tipo === "CHEQUE_TERCERO") terceros.push(key)
    else if (ad.adelanto.tipo === "TRANSFERENCIA") transferencias.push(key)
  }

  for (const p of op.pagos) {
    if (!p.comprobanteS3Key) continue
    if (p.tipoPago === "CHEQUE_PROPIO") propios.push(p.comprobanteS3Key)
    else if (p.tipoPago === "CHEQUE_TERCERO") terceros.push(p.comprobanteS3Key)
    else if (p.tipoPago === "TRANSFERENCIA") transferencias.push(p.comprobanteS3Key)
  }

  // Dedupe preservando orden — un mismo cheque puede aparecer en varios
  // PagoAFletero si se distribuyó entre LPs.
  const adjuntosKeys = Array.from(new Set([...propios, ...terceros, ...transferencias]))

  return {
    op,
    facturas,
    totalFacturas,
    aplicaciones,
    totalAplicaciones,
    netoAPagar,
    mediosDePago,
    totalMediosDePago,
    condicionIva,
    adjuntosKeys,
  }
}

/* ── PDF ────────────────────────────────────────────────────────────────── */

/**
 * generarPDFOrdenPago: string -> Promise<Buffer>
 *
 * Genera el PDF de la Orden de Pago y le anexa los comprobantes
 * (cheques propios → cheques tercero → transferencias) que estén
 * cargados en R2 sobre los AdelantoFletero descontados y los PagoAFletero
 * de esta OP.
 *
 * Si la fusión de adjuntos falla (key faltante o no es PDF), igual se
 * devuelve la OP sola — no es bloqueante.
 */
export async function generarPDFOrdenPago(ordenPagoId: string): Promise<Buffer> {
  const d = await loadOP(ordenPagoId)
  const opBuffer = await renderOPPDF(ordenPagoId, d)

  if (d.adjuntosKeys.length === 0) return opBuffer

  try {
    return await mergePDFsMixto({ buffers: [opBuffer], keys: d.adjuntosKeys })
  } catch (err) {
    console.warn(
      `[pdf-orden-pago] No se pudieron anexar adjuntos a la OP ${ordenPagoId}: ${
        err instanceof Error ? err.message : String(err)
      }`,
    )
    return opBuffer
  }
}

async function renderOPPDF(
  ordenPagoId: string,
  d: Awaited<ReturnType<typeof loadOP>>,
): Promise<Buffer> {
  void ordenPagoId
  const { op } = d
  const nroDisplay = `${op.nro}-${op.anio}`

  const emisor = await obtenerDatosEmisor()

  return new Promise<Buffer>((resolve, reject) => {
    const doc = new PDFDocument({ size: "A4", margin: MARGIN, bufferPages: true })
    const chunks: Buffer[] = []
    doc.on("data", (c: Buffer) => chunks.push(c))
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)

    const footerLineY = PAGE_H - MARGIN - FOOTER_RESERVE

    // ── 1. Línea decorativa superior ────────────────────────────────────
    doc.save()
    doc.strokeColor(NAVY).lineWidth(2.5)
    doc.moveTo(LEFT, MARGIN).lineTo(RIGHT, MARGIN).stroke()
    doc.restore()

    let cursorY = MARGIN + 10

    // ── 2. Encabezado ───────────────────────────────────────────────────
    const headerLeftW = CONTENT_W * 0.48
    const headerRightW = 220
    const headerRightX = RIGHT - headerRightW

    let leftY = cursorY
    if (emisor.logoComprobante) {
      try {
        doc.image(emisor.logoComprobante, LEFT, leftY, { fit: [180, 50] })
        leftY += 54
      } catch {
        doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT)
          .text(emisor.razonSocial, LEFT, leftY, { width: headerLeftW })
        leftY = doc.y + 4
      }
    } else {
      doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT)
        .text(emisor.razonSocial, LEFT, leftY, { width: headerLeftW })
      leftY = doc.y + 4
    }

    doc.font("Helvetica").fontSize(10).fillColor(TEXT)
    doc.text(emisor.domicilio, LEFT, leftY, { width: headerLeftW })
    leftY = doc.y + 1
    doc.text(`CUIT: ${emisor.cuit}`, LEFT, leftY, { width: headerLeftW })
    leftY = doc.y + 1
    doc.text(`Condición IVA: ${emisor.condicionIva}`, LEFT, leftY, { width: headerLeftW })

    // Recuadro derecho: "Orden de Pago" + Nº + Fecha
    const rightBoxH = 90
    const rightBoxY = cursorY
    const pad = 18
    const innerW = headerRightW - pad * 2

    doc.save()
    doc.strokeColor(BORDER).lineWidth(1)
    doc.roundedRect(headerRightX, rightBoxY, headerRightW, rightBoxH, 6).stroke()
    doc.restore()

    doc.font("Helvetica-Bold").fontSize(15).fillColor(NAVY)
      .text("Orden de Pago", headerRightX + pad, rightBoxY + pad, { width: innerW, align: "left" })

    doc.font("Helvetica-Bold").fontSize(13).fillColor(TEXT)
      .text(`Nº ${nroDisplay}`, headerRightX + pad, doc.y + 4, { width: innerW, align: "left" })

    doc.font("Helvetica").fontSize(9.5).fillColor(TEXT)
      .text(`Fecha: ${fmtFecha(op.fecha)}`, headerRightX + pad, doc.y + 4, { width: innerW, align: "left" })

    cursorY = Math.max(doc.y + 4, rightBoxY + rightBoxH) + 14

    // ── 3. Caja del fletero ─────────────────────────────────────────────
    const clientLines = [
      [
        { text: "Sres: ", bold: true },
        { text: op.fletero.razonSocial, bold: true },
        { text: `   |   CUIT: ${fmtCuit(op.fletero.cuit)}`, bold: false },
      ],
      [
        { text: "Domicilio: ", bold: true },
        { text: op.fletero.direccion ?? "—", bold: false },
      ],
      [
        { text: "Situación IVA: ", bold: true },
        { text: d.condicionIva, bold: false },
      ],
    ]

    const clientBoxPadX = 14
    const clientBoxPadY = 10
    const clientLineH = 16
    const clientBoxH = clientBoxPadY * 2 + clientLines.length * clientLineH

    doc.save()
    doc.fillColor(BG_LIGHT)
    doc.roundedRect(LEFT, cursorY, CONTENT_W, clientBoxH, 8).fill()
    doc.strokeColor(BORDER).lineWidth(0.5)
    doc.roundedRect(LEFT, cursorY, CONTENT_W, clientBoxH, 8).stroke()
    doc.restore()

    const clientFontSize = 9.5
    const textOffsetInLine = (clientLineH - clientFontSize) / 2
    let clientY = cursorY + clientBoxPadY
    for (const line of clientLines) {
      let textX = LEFT + clientBoxPadX
      for (const part of line) {
        doc.font(part.bold ? "Helvetica-Bold" : "Helvetica").fontSize(clientFontSize).fillColor(TEXT)
        const w = doc.widthOfString(part.text)
        doc.text(part.text, textX, clientY + textOffsetInLine, { lineBreak: false })
        textX += w
      }
      clientY += clientLineH
    }

    cursorY = cursorY + clientBoxH + 14

    // ── 4. Helper para tablas ───────────────────────────────────────────
    type ColDef = { header: string; w: number; align?: "left" | "center" | "right" }

    function ensureSpace(needed: number) {
      if (cursorY + needed > footerLineY) {
        doc.addPage()
        doc.save()
        doc.strokeColor(NAVY).lineWidth(2.5)
        doc.moveTo(LEFT, MARGIN).lineTo(RIGHT, MARGIN).stroke()
        doc.restore()
        cursorY = MARGIN + 10
      }
    }

    function drawSectionTitle(title: string) {
      ensureSpace(26)
      doc.font("Helvetica-Bold").fontSize(11).fillColor(NAVY)
        .text(title, LEFT, cursorY)
      cursorY = doc.y + 4
      doc.save()
      doc.strokeColor(NAVY).lineWidth(0.8)
      doc.moveTo(LEFT, cursorY).lineTo(RIGHT, cursorY).stroke()
      doc.restore()
      cursorY += 6
    }

    function drawTableHeader(cols: ColDef[]) {
      const headerH = 20
      const tableW = cols.reduce((s, c) => s + c.w, 0)
      doc.save()
      doc.fillColor(HEADER_BG)
      doc.roundedRect(LEFT, cursorY, tableW, headerH, 4).fill()
      doc.restore()
      doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
      let x = LEFT
      for (const col of cols) {
        doc.text(col.header, x + 6, cursorY + (headerH - 9) / 2, {
          width: col.w - 12,
          align: col.align ?? "left",
          lineBreak: false,
        })
        x += col.w
      }
      cursorY += headerH + 2
    }

    function drawTableRow(cols: ColDef[], values: string[], opts?: { bold?: boolean }) {
      const rowH = 18
      ensureSpace(rowH)
      const font = opts?.bold ? "Helvetica-Bold" : "Helvetica"
      doc.font(font).fontSize(9).fillColor(TEXT)
      let x = LEFT
      const startY = cursorY
      for (let i = 0; i < cols.length; i++) {
        const col = cols[i]
        doc.text(values[i] ?? "", x + 6, startY + (rowH - 9) / 2, {
          width: col.w - 12,
          align: col.align ?? "left",
          lineBreak: false,
        })
        x += col.w
      }
      cursorY = startY + rowH
      const tableW = cols.reduce((s, c) => s + c.w, 0)
      doc.save()
      doc.strokeColor(BORDER).lineWidth(0.3)
      doc.moveTo(LEFT, cursorY).lineTo(LEFT + tableW, cursorY).stroke()
      doc.restore()
    }

    function drawTotalRow(label: string, valor: number, tableW: number) {
      const rowH = 20
      ensureSpace(rowH)
      doc.save()
      doc.fillColor("#f5f7fa")
      doc.rect(LEFT, cursorY, tableW, rowH).fill()
      doc.restore()
      doc.font("Helvetica-Bold").fontSize(9.5).fillColor(TEXT)
      doc.text(label, LEFT + 6, cursorY + (rowH - 9.5) / 2, { width: tableW - 110, align: "left", lineBreak: false })
      doc.text(fmtMoneda(valor), LEFT + tableW - 110, cursorY + (rowH - 9.5) / 2, { width: 100, align: "right", lineBreak: false })
      cursorY += rowH + 4
    }

    // ── 5. COMPROBANTES CANCELADOS ──────────────────────────────────────
    drawSectionTitle("Comprobantes Cancelados")

    const colsFacturas: ColDef[] = [
      { header: "Fecha", w: 80 },
      { header: "Comprobante", w: 130 },
      { header: "Nº", w: 130 },
      { header: "Total", w: CONTENT_W - 340, align: "right" },
    ]
    drawTableHeader(colsFacturas)
    for (const f of d.facturas) {
      drawTableRow(colsFacturas, [
        fmtFecha(f.fecha),
        "Líquido Producto",
        fmtNroComprobante(f.ptoVenta, f.nro),
        fmtMoneda(f.total),
      ])
    }
    drawTotalRow("Total Comprobantes Cancelados", d.totalFacturas, CONTENT_W)

    // ── 6. APLICACIONES (solo si hay alguna) ────────────────────────────
    if (d.aplicaciones.length > 0) {
      cursorY += 6
      drawSectionTitle("Aplicaciones")

      const colsApl: ColDef[] = [
        { header: "Fecha", w: 70 },
        { header: "Tipo", w: 110 },
        { header: "Comprobante", w: 100 },
        { header: "Detalle", w: CONTENT_W - 380, align: "left" },
        { header: "Importe", w: 100, align: "right" },
      ]
      drawTableHeader(colsApl)
      for (const a of d.aplicaciones) {
        drawTableRow(colsApl, [
          fmtFecha(a.fecha),
          a.tipo,
          a.comprobante,
          a.detalle,
          fmtMoneda(a.importe),
        ])
      }
      drawTotalRow("Total Aplicaciones", d.totalAplicaciones, CONTENT_W)
    }

    // ── 7. NETO A PAGAR ─────────────────────────────────────────────────
    cursorY += 8
    ensureSpace(34)
    const netoBoxH = 28
    doc.save()
    doc.fillColor(BG_LIGHT)
    doc.roundedRect(LEFT, cursorY, CONTENT_W, netoBoxH, 6).fill()
    doc.strokeColor(NAVY).lineWidth(0.8)
    doc.roundedRect(LEFT, cursorY, CONTENT_W, netoBoxH, 6).stroke()
    doc.restore()
    doc.font("Helvetica-Bold").fontSize(12).fillColor(NAVY)
      .text("Neto a Pagar", LEFT + 14, cursorY + (netoBoxH - 12) / 2, { width: CONTENT_W - 200, align: "left", lineBreak: false })
    doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY)
      .text(fmtMoneda(d.netoAPagar), LEFT + CONTENT_W - 200, cursorY + (netoBoxH - 13) / 2, { width: 186, align: "right", lineBreak: false })
    cursorY += netoBoxH + 14

    // ── 8. MEDIOS DE PAGO ───────────────────────────────────────────────
    if (d.mediosDePago.length > 0) {
      drawSectionTitle("Medios de Pago")

      const colsMP: ColDef[] = [
        { header: "Tipo", w: 130 },
        { header: "Detalle", w: CONTENT_W - 240, align: "left" },
        { header: "Importe", w: 110, align: "right" },
      ]
      drawTableHeader(colsMP)
      for (const m of d.mediosDePago) {
        drawTableRow(colsMP, [m.tipo, m.detalle, fmtMoneda(m.importe)])
      }
      drawTotalRow("Total Medios de Pago", d.totalMediosDePago, CONTENT_W)
    }

    // ── 9. Pie con paginación (sin firma) ───────────────────────────────
    const range = doc.bufferedPageRange()
    const totalPages = range.count
    for (let i = 0; i < totalPages; i++) {
      doc.switchToPage(range.start + i)
      const fY = PAGE_H - MARGIN - 14
      doc.font("Helvetica").fontSize(8).fillColor("#888")
        .text(
          `Trans-Magg S.R.L. · Orden de Pago Nº ${nroDisplay} · Generada ${fmtFecha(new Date())} · ${op.operador.nombre} ${op.operador.apellido}`,
          LEFT,
          fY,
          { width: CONTENT_W - 60, align: "left", lineBreak: false },
        )
      doc.text(`Pág. ${i + 1}/${totalPages}`, RIGHT - 60, fY, { width: 60, align: "right", lineBreak: false })
    }

    doc.flushPages()
    doc.end()
  })
}
