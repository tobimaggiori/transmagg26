/**
 * Propósito: Generación del PDF de la Orden de Pago a Fletero.
 * Replica fielmente el layout del documento real de Transmagg
 * usando pdfkit para generación directa de PDF (sin Puppeteer).
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"

/* ── Helpers de formato ─────────────────────────────────────────────────── */

function fmt(n: number): string {
  return "$ " + n.toLocaleString("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function fmtFecha(fecha: Date): string {
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(fecha)
}

function fmtNro(nro: number): string {
  return new Intl.NumberFormat("es-AR").format(nro)
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

/* ── Constantes de layout ───────────────────────────────────────────────── */

const LEFT = 40
const RIGHT = 555
const PAGE_W = RIGHT - LEFT // 515
const BLUE = "#1e40af"
const GREY_BG = "#f0f0f0"
const HEADER_BG = "#e8e8e8"
const DARK_BG = "#1a1a1a"
const MUTED = "#999999"

/* ── Carga de datos (compartida) ────────────────────────────────────────── */

async function loadOP(ordenPagoId: string) {
  const op = await prisma.ordenPago.findUnique({
    where: { id: ordenPagoId },
    include: {
      fletero: {
        select: {
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
              nroComprobante: true,
              ptoVenta: true,
              grabadaEn: true,
              total: true,
              adelantoDescuentos: {
                include: {
                  adelanto: {
                    select: { tipo: true, descripcion: true, monto: true },
                  },
                },
              },
              gastoDescuentos: {
                include: {
                  gasto: {
                    select: {
                      montoPagado: true,
                      descripcion: true,
                      facturaProveedor: {
                        select: {
                          tipoCbte: true,
                          nroComprobante: true,
                          proveedor: { select: { razonSocial: true } },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          chequeEmitido: {
            select: {
              nroCheque: true,
              fechaPago: true,
              monto: true,
              cuenta: { select: { nombre: true, bancoOEntidad: true } },
            },
          },
          chequeRecibido: {
            select: {
              nroCheque: true,
              fechaCobro: true,
              monto: true,
              bancoEmisor: true,
            },
          },
        },
      },
    },
  })

  if (!op) throw new Error(`OrdenPago ${ordenPagoId} no encontrada`)

  // ── Estructurar secciones ──────────────────────────────────────────

  // Facturas aplicadas (una fila por liquidación única)
  const liquidacionesUnicas = new Map<string, { fecha: Date; ptoVenta: number | null; nro: number | null; total: number }>()
  for (const pago of op.pagos) {
    if (pago.liquidacion && !liquidacionesUnicas.has(pago.liquidacionId ?? "")) {
      liquidacionesUnicas.set(pago.liquidacionId ?? "", {
        fecha: pago.liquidacion.grabadaEn,
        ptoVenta: pago.liquidacion.ptoVenta,
        nro: pago.liquidacion.nroComprobante,
        total: pago.liquidacion.total,
      })
    }
  }
  const facturas = Array.from(liquidacionesUnicas.values())
  const totalFacturas = sumarImportes(facturas.map(f => f.total))

  // Cheques propios — deduplicar por chequeEmitidoId
  type ChequePropioRow = { cuenta: string; vencimiento: Date; nro: string; monto: number }
  const chequesPropiosMap = new Map<string, ChequePropioRow>()
  for (const p of op.pagos) {
    if (p.tipoPago === "CHEQUE_PROPIO" && p.chequeEmitido && p.chequeEmitidoId) {
      if (!chequesPropiosMap.has(p.chequeEmitidoId)) {
        chequesPropiosMap.set(p.chequeEmitidoId, {
          cuenta: p.chequeEmitido.cuenta?.nombre ?? p.chequeEmitido.cuenta?.bancoOEntidad ?? "-",
          vencimiento: p.chequeEmitido.fechaPago,
          nro: p.chequeEmitido.nroCheque ?? "-",
          monto: p.chequeEmitido.monto,
        })
      }
    }
  }
  const chequesPropios = Array.from(chequesPropiosMap.values())
  const totalChequesPropios = sumarImportes(chequesPropios.map(c => c.monto))

  // Cheques de tercero — deduplicar por chequeRecibidoId
  type ChequeTerceroRow = { banco: string; vencimiento: Date; nro: string; monto: number }
  const chequesTerceroMap = new Map<string, ChequeTerceroRow>()
  for (const p of op.pagos) {
    if (p.tipoPago === "CHEQUE_TERCERO" && p.chequeRecibido && p.chequeRecibidoId) {
      if (!chequesTerceroMap.has(p.chequeRecibidoId)) {
        chequesTerceroMap.set(p.chequeRecibidoId, {
          banco: p.chequeRecibido.bancoEmisor,
          vencimiento: p.chequeRecibido.fechaCobro,
          nro: p.chequeRecibido.nroCheque,
          monto: p.chequeRecibido.monto,
        })
      }
    }
  }
  const chequesTercero = Array.from(chequesTerceroMap.values())
  const totalChequesTercero = sumarImportes(chequesTercero.map(c => c.monto))

  // Transferencias y efectivo
  const totalTransferencia = sumarImportes(
    op.pagos.filter((p) => p.tipoPago === "TRANSFERENCIA").map(p => p.monto)
  )
  const totalEfectivo = sumarImportes(
    op.pagos.filter((p) => p.tipoPago === "EFECTIVO").map(p => p.monto)
  )

  // Adelantos descontados (deduplicados por liquidacion)
  type AdelantoRow = { descripcion: string; efectivo: number; gasOil: number; faltante: number }
  const adelantosMap = new Map<string, AdelantoRow>()
  for (const pago of op.pagos) {
    if (!pago.liquidacion) continue
    for (const desc of pago.liquidacion.adelantoDescuentos) {
      const key = desc.adelantoId
      if (!adelantosMap.has(key)) {
        adelantosMap.set(key, { descripcion: desc.adelanto.descripcion ?? `AD-${key.slice(0, 6)}`, efectivo: 0, gasOil: 0, faltante: 0 })
      }
      const row = adelantosMap.get(key)!
      const tipo = desc.adelanto.tipo
      const monto = desc.montoDescontado
      if (tipo === "EFECTIVO") row.efectivo += monto
      else if (tipo === "COMBUSTIBLE") row.gasOil += monto
      else row.faltante += monto
    }
  }
  const adelantos = Array.from(adelantosMap.values())
  const totalAdelantosEfectivo = sumarImportes(adelantos.map(a => a.efectivo))
  const totalAdelantosGasOil = sumarImportes(adelantos.map(a => a.gasOil))
  const totalAdelantosFaltante = sumarImportes(adelantos.map(a => a.faltante))
  const totalAdelantosGeneral = sumarImportes([totalAdelantosEfectivo, totalAdelantosGasOil, totalAdelantosFaltante])

  // Gastos descontados (deduplicados por gastoId x liquidacion)
  type GastoRow = { proveedor: string; cbte: string; montoDescontado: number }
  const gastosMap = new Map<string, GastoRow>()
  for (const pago of op.pagos) {
    if (!pago.liquidacion) continue
    for (const desc of pago.liquidacion.gastoDescuentos) {
      const key = `${desc.gastoId}-${desc.liquidacionId}`
      if (!gastosMap.has(key)) {
        const fp = desc.gasto.facturaProveedor
        const cbte = fp ? [fp.tipoCbte, fp.nroComprobante ?? "s/n"].filter(Boolean).join(" ") : "Sin factura"
        const proveedor = fp ? fp.proveedor.razonSocial : (desc.gasto.descripcion ?? "Gasto sin factura")
        gastosMap.set(key, { proveedor, cbte, montoDescontado: desc.montoDescontado })
      }
    }
  }
  const gastos = Array.from(gastosMap.values())
  const totalGastosDescontados = sumarImportes(gastos.map(g => g.montoDescontado))

  const condicionIva = condicionIvaLabel[op.fletero.condicionIva] ?? op.fletero.condicionIva

  return {
    op,
    facturas,
    totalFacturas,
    chequesPropios,
    totalChequesPropios,
    chequesTercero,
    totalChequesTercero,
    totalTransferencia,
    totalEfectivo,
    adelantos,
    totalAdelantosEfectivo,
    totalAdelantosGasOil,
    totalAdelantosFaltante,
    totalAdelantosGeneral,
    gastos,
    totalGastosDescontados,
    condicionIva,
  }
}

/* ── PDF helpers ────────────────────────────────────────────────────────── */

function blueLine(doc: PDFKit.PDFDocument) {
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).strokeColor(BLUE).lineWidth(1.5).stroke()
  doc.moveDown(0.3)
}

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  const h = 16
  const startY = doc.y
  doc.rect(LEFT, startY, PAGE_W, h).fill(GREY_BG)
  doc.fillColor("#000").fontSize(8).font("Helvetica-Bold")
    .text(title.toUpperCase(), LEFT + 8, startY + 4, { width: PAGE_W - 16 })
  doc.y = startY + h
}

/**
 * Draws a table with header row and data rows.
 * cols: array of { label, width, align }
 * rows: array of arrays of strings (one per col)
 * subtotalRow: optional subtotal row (array of strings, same length as cols)
 */
function drawTable(
  doc: PDFKit.PDFDocument,
  cols: { label: string; width: number; align?: "left" | "center" | "right" }[],
  rows: string[][],
  subtotalRow?: string[],
) {
  const ROW_H = 16
  const FONT_SIZE = 8
  const PAD = 6

  // Header
  let x = LEFT
  const headerY = doc.y
  for (const col of cols) {
    doc.rect(x, headerY, col.width, ROW_H).fill(HEADER_BG)
    doc.fillColor("#000").fontSize(FONT_SIZE).font("Helvetica-Bold")
      .text(col.label, x + PAD, headerY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
    x += col.width
  }
  doc.y = headerY + ROW_H

  // Data rows
  for (const row of rows) {
    x = LEFT
    const startY = doc.y
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      const val = row[i] ?? ""
      doc.fontSize(FONT_SIZE).font("Helvetica").fillColor("#000")
        .text(val, x + PAD, startY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
      doc.y = startY // keep alignment
      x += col.width
    }
    doc.y = startY + ROW_H
  }

  // Empty-state row
  if (rows.length === 0) {
    doc.fontSize(FONT_SIZE).font("Helvetica-Oblique").fillColor(MUTED)
    doc.text("-- Sin registros --", LEFT + PAD, doc.y + 4, { width: PAGE_W - PAD * 2, align: "center" })
    doc.y += ROW_H
    doc.fillColor("#000").font("Helvetica")
  }

  // Subtotal row
  if (subtotalRow) {
    x = LEFT
    const subY = doc.y
    doc.rect(LEFT, subY, PAGE_W, ROW_H).fill("#f9f9f9")
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      const val = subtotalRow[i] ?? ""
      doc.fontSize(FONT_SIZE).font("Helvetica-Bold").fillColor("#000")
        .text(val, x + PAD, subY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
      x += col.width
    }
    doc.y = subY + ROW_H
  }

  doc.moveDown(0.5)
}

/* ── generarHTMLOrdenPago (conservada para rutas que sirven HTML) ──────── */

/**
 * generarHTMLOrdenPago: (ordenPagoId: string) -> Promise<string>
 *
 * Dado el id de una Orden de Pago, carga todos los datos necesarios y genera
 * el HTML imprimible que replica el documento real de Trans-Magg S.R.L.
 * Incluye: datos del emisor, datos del fletero, facturas aplicadas,
 * cheques propios, cheques de tercero, adelantos y totales del pago.
 */
export async function generarHTMLOrdenPago(ordenPagoId: string): Promise<string> {
  const d = await loadOP(ordenPagoId)
  const { op } = d

  function fmtHtml(n: number): string {
    return new Intl.NumberFormat("es-AR", {
      style: "currency",
      currency: "ARS",
      minimumFractionDigits: 2,
    }).format(n)
  }

  const filaFacturas = d.facturas.map((f) => `
    <tr>
      <td>${fmtFecha(f.fecha)}</td>
      <td class="center">${f.ptoVenta ?? "-"}</td>
      <td>${fmtNroComprobante(f.ptoVenta, f.nro)}</td>
      <td class="right">${fmtHtml(f.total)}</td>
    </tr>
  `).join("")

  const filasChequesPropios = d.chequesPropios.length > 0
    ? d.chequesPropios.map((c) => `
      <tr>
        <td>${c.cuenta}</td>
        <td class="center">${fmtFecha(c.vencimiento)}</td>
        <td>${c.nro}</td>
        <td class="right">${fmtHtml(c.monto)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin cheques propios —</td></tr>`

  const filasChequesTercero = d.chequesTercero.length > 0
    ? d.chequesTercero.map((c) => `
      <tr>
        <td>${c.banco}</td>
        <td class="center">${fmtFecha(c.vencimiento)}</td>
        <td>${c.nro}</td>
        <td class="right">${fmtHtml(c.monto)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin cheques de tercero —</td></tr>`

  const filasAdelantos = d.adelantos.length > 0
    ? d.adelantos.map((a) => `
      <tr>
        <td>${a.descripcion}</td>
        <td class="right">${fmtHtml(a.efectivo)}</td>
        <td class="right">${fmtHtml(a.gasOil)}</td>
        <td class="right">${fmtHtml(a.faltante)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="4" class="center muted">— Sin adelantos descontados —</td></tr>`

  const filasGastos = d.gastos.length > 0
    ? d.gastos.map((g) => `
      <tr>
        <td>${g.proveedor}</td>
        <td>${g.cbte}</td>
        <td class="right">${fmtHtml(g.montoDescontado)}</td>
      </tr>
    `).join("")
    : `<tr><td colspan="3" class="center muted">— Sin gastos descontados —</td></tr>`

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Pago Nro ${fmtNro(op.nro)} — Trans-Magg S.R.L.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm 18mm; }

    .encabezado { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid #000; padding-bottom: 10px; }
    .encabezado-empresa .nombre { font-size: 16px; font-weight: bold; }
    .encabezado-empresa .datos { font-size: 10px; color: #333; margin-top: 2px; }
    .encabezado-op { text-align: right; }
    .encabezado-op .label { font-size: 10px; color: #555; text-transform: uppercase; }
    .encabezado-op .nro { font-size: 20px; font-weight: bold; }
    .encabezado-op .fecha { font-size: 11px; margin-top: 2px; }

    .fletero-box { border: 1px solid #ccc; padding: 8px 12px; margin-bottom: 12px; display: grid; grid-template-columns: 1fr 1fr; gap: 4px; }
    .fletero-box .lbl { color: #555; font-size: 10px; text-transform: uppercase; }
    .fletero-box .val { font-weight: bold; }

    .seccion { margin-bottom: 12px; }
    .seccion-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; background: #f0f0f0; padding: 4px 8px; border: 1px solid #ccc; border-bottom: none; letter-spacing: 0.5px; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: #e8e8e8; padding: 4px 8px; text-align: left; font-size: 10px; border: 1px solid #ccc; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr.subtotal { background: #f9f9f9; font-weight: bold; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #999; font-style: italic; font-size: 10px; }

    .totales-finales { border: 2px solid #000; margin-top: 12px; }
    .totales-finales thead th { background: #1a1a1a; color: #fff; font-size: 10px; padding: 5px 8px; }
    .totales-finales tbody td { padding: 6px 8px; font-weight: bold; font-size: 12px; }

    .firma { margin-top: 40px; display: flex; justify-content: flex-end; }
    .firma-linea { text-align: center; }
    .firma-linea .linea { border-top: 1px solid #000; width: 200px; margin-bottom: 4px; }
    .firma-linea .texto { font-size: 10px; color: #555; }

    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }

    @media print {
      body { padding: 10mm 14mm; }
      @page { margin: 10mm; }
    }
  </style>
</head>
<body>

  <div class="encabezado">
    <div class="encabezado-empresa">
      <div class="nombre">TRANS-MAGG S.R.L.</div>
      <div class="datos">C.U.I.T. 30-70938168-3</div>
      <div class="datos">Belgrano 184 — 2109 Acebal (S.F.)</div>
    </div>
    <div class="encabezado-op">
      <div class="label">Orden de Pago Nro:</div>
      <div class="nro">${fmtNro(op.nro)}</div>
      <div class="fecha">Fecha: ${fmtFecha(op.fecha)}</div>
    </div>
  </div>

  <div class="fletero-box">
    <div class="lbl">Fletero</div>
    <div class="val">${op.fletero.razonSocial}</div>
    <div class="lbl">Direccion</div>
    <div class="val">${op.fletero.direccion ?? "—"}</div>
    <div class="lbl">Cond. IVA</div>
    <div class="val">${d.condicionIva}</div>
    <div class="lbl">CUIT</div>
    <div class="val">${fmtCuit(op.fletero.cuit)}</div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Facturas Aplicadas</div>
    <table>
      <thead><tr>
        <th>Fecha</th>
        <th class="center">Pto. Vta.</th>
        <th>Nro. Fact.</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filaFacturas}
        <tr class="subtotal">
          <td colspan="3">Total Facturas Aplicadas</td>
          <td class="right">${fmtHtml(d.totalFacturas)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Detalle de Cheques Propios</div>
    <table>
      <thead><tr>
        <th>Cuenta</th>
        <th class="center">Vencimiento</th>
        <th>Nro. Cheque</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasChequesPropios}
        <tr class="subtotal">
          <td colspan="3">Total Cheques Propios</td>
          <td class="right">${fmtHtml(d.totalChequesPropios)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Detalle de Cheques de Tercero</div>
    <table>
      <thead><tr>
        <th>Banco</th>
        <th class="center">Vencimiento</th>
        <th>Nro. Cheque</th>
        <th class="right">Importe</th>
      </tr></thead>
      <tbody>
        ${filasChequesTercero}
        <tr class="subtotal">
          <td colspan="3">Total Cheques de Tercero</td>
          <td class="right">${fmtHtml(d.totalChequesTercero)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Detalle de Adelantos</div>
    <table>
      <thead><tr>
        <th>Concepto</th>
        <th class="right">Efectivo</th>
        <th class="right">Gas-Oil</th>
        <th class="right">Faltante</th>
      </tr></thead>
      <tbody>
        ${filasAdelantos}
        <tr class="subtotal">
          <td>Total Adelantos</td>
          <td class="right">${fmtHtml(d.totalAdelantosEfectivo)}</td>
          <td class="right">${fmtHtml(d.totalAdelantosGasOil)}</td>
          <td class="right">${fmtHtml(d.totalAdelantosFaltante)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Gastos Descontados</div>
    <table>
      <thead><tr>
        <th>Proveedor</th>
        <th>Comprobante</th>
        <th class="right">Monto Descontado</th>
      </tr></thead>
      <tbody>
        ${filasGastos}
        <tr class="subtotal">
          <td colspan="2">Total Gastos Descontados</td>
          <td class="right">${fmtHtml(d.totalGastosDescontados)}</td>
        </tr>
      </tbody>
    </table>
  </div>

  <div class="seccion">
    <table class="totales-finales">
      <thead><tr>
        <th class="right">Efectivo</th>
        <th class="right">Transferencias</th>
        <th class="right">Cheques Propios</th>
        <th class="right">Cheques de Terc.</th>
        <th class="right">Adelantos</th>
        <th class="right">Gas-Oil</th>
        <th class="right">Faltantes</th>
        <th class="right">Gastos Desc.</th>
      </tr></thead>
      <tbody><tr>
        <td class="right">${fmtHtml(d.totalEfectivo)}</td>
        <td class="right">${fmtHtml(d.totalTransferencia)}</td>
        <td class="right">${fmtHtml(d.totalChequesPropios)}</td>
        <td class="right">${fmtHtml(d.totalChequesTercero)}</td>
        <td class="right">${fmtHtml(d.totalAdelantosGeneral)}</td>
        <td class="right">${fmtHtml(d.totalAdelantosGasOil)}</td>
        <td class="right">${fmtHtml(d.totalAdelantosFaltante)}</td>
        <td class="right">${fmtHtml(d.totalGastosDescontados)}</td>
      </tr></tbody>
    </table>
  </div>

  <div class="firma">
    <div class="firma-linea">
      <div class="linea"></div>
      <div class="texto">Firma y aclaracion del receptor</div>
    </div>
  </div>

  <div class="footer">
    Trans-Magg S.R.L. — Orden de Pago generada el ${fmtFecha(new Date())} — Operador: ${op.operador.nombre} ${op.operador.apellido}
  </div>

</body>
</html>`

  return html
}

/* ── generarPDFOrdenPago (pdfkit, sin Puppeteer) ────────────────────────── */

/**
 * generarPDFOrdenPago: (ordenPagoId: string) -> Promise<Buffer>
 *
 * Dado el id de una Orden de Pago, genera el PDF directamente con pdfkit.
 * Replica la estructura visual del documento real de Trans-Magg S.R.L.
 */
export async function generarPDFOrdenPago(ordenPagoId: string): Promise<Buffer> {
  const d = await loadOP(ordenPagoId)
  const { op } = d

  // QR con link a la OP
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://transmagg.com"}/ordenes-pago/${ordenPagoId}`
  const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 80 })

  const doc = new PDFDocument({ size: "A4", margin: 40 })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  // ── Encabezado ────────────────────────────────────────────────────────

  doc.font("Helvetica-Bold").fontSize(16).fillColor("#000")
    .text("TRANS-MAGG S.R.L.", LEFT, 40)
  doc.font("Helvetica").fontSize(9).fillColor("#333")
    .text("C.U.I.T. 30-70938168-3", LEFT, doc.y + 2)
    .text("Belgrano 184 — 2109 Acebal (S.F.)")

  // OP number — right aligned
  const opY = 40
  doc.font("Helvetica").fontSize(8).fillColor("#555")
    .text("ORDEN DE PAGO NRO:", RIGHT - 160, opY, { width: 160, align: "right" })
  doc.font("Helvetica-Bold").fontSize(18).fillColor("#000")
    .text(fmtNro(op.nro), RIGHT - 160, opY + 10, { width: 160, align: "right" })
  doc.font("Helvetica").fontSize(9).fillColor("#000")
    .text(`Fecha: ${fmtFecha(op.fecha)}`, RIGHT - 160, opY + 30, { width: 160, align: "right" })

  // QR
  doc.image(qrBuffer, RIGHT - 80, opY + 44, { width: 60 })

  doc.y = Math.max(doc.y, opY + 106)

  // Blue separator
  blueLine(doc)

  // ── Datos del fletero ─────────────────────────────────────────────────

  const fleteroY = doc.y
  const col1 = LEFT
  const col2 = LEFT + 80
  const col3 = LEFT + PAGE_W / 2
  const col4 = col3 + 80
  const LBL_SIZE = 7
  const VAL_SIZE = 9

  doc.font("Helvetica").fontSize(LBL_SIZE).fillColor("#555")
    .text("FLETERO", col1, fleteroY)
  doc.font("Helvetica-Bold").fontSize(VAL_SIZE).fillColor("#000")
    .text(op.fletero.razonSocial, col2, fleteroY)

  doc.font("Helvetica").fontSize(LBL_SIZE).fillColor("#555")
    .text("CUIT", col3, fleteroY)
  doc.font("Helvetica-Bold").fontSize(VAL_SIZE).fillColor("#000")
    .text(fmtCuit(op.fletero.cuit), col4, fleteroY)

  const row2Y = fleteroY + 14
  doc.font("Helvetica").fontSize(LBL_SIZE).fillColor("#555")
    .text("DIRECCION", col1, row2Y)
  doc.font("Helvetica-Bold").fontSize(VAL_SIZE).fillColor("#000")
    .text(op.fletero.direccion ?? "—", col2, row2Y)

  doc.font("Helvetica").fontSize(LBL_SIZE).fillColor("#555")
    .text("COND. IVA", col3, row2Y)
  doc.font("Helvetica-Bold").fontSize(VAL_SIZE).fillColor("#000")
    .text(d.condicionIva, col4, row2Y)

  doc.y = row2Y + 18
  blueLine(doc)

  // ── Facturas Aplicadas ────────────────────────────────────────────────

  sectionTitle(doc, "Facturas Aplicadas")
  drawTable(
    doc,
    [
      { label: "Fecha", width: 100 },
      { label: "Pto. Vta.", width: 80, align: "center" },
      { label: "Nro. Fact.", width: 170 },
      { label: "Importe", width: 165, align: "right" },
    ],
    d.facturas.map((f) => [
      fmtFecha(f.fecha),
      String(f.ptoVenta ?? "-"),
      fmtNroComprobante(f.ptoVenta, f.nro),
      fmt(f.total),
    ]),
    ["Total Facturas Aplicadas", "", "", fmt(d.totalFacturas)],
  )

  // ── Cheques Propios ───────────────────────────────────────────────────

  sectionTitle(doc, "Detalle de Cheques Propios")
  drawTable(
    doc,
    [
      { label: "Cuenta", width: 170 },
      { label: "Vencimiento", width: 100, align: "center" },
      { label: "Nro. Cheque", width: 120 },
      { label: "Importe", width: 125, align: "right" },
    ],
    d.chequesPropios.map((c) => [
      c.cuenta,
      fmtFecha(c.vencimiento),
      c.nro,
      fmt(c.monto),
    ]),
    ["Total Cheques Propios", "", "", fmt(d.totalChequesPropios)],
  )

  // ── Cheques de Tercero ────────────────────────────────────────────────

  sectionTitle(doc, "Detalle de Cheques de Tercero")
  drawTable(
    doc,
    [
      { label: "Banco", width: 170 },
      { label: "Vencimiento", width: 100, align: "center" },
      { label: "Nro. Cheque", width: 120 },
      { label: "Importe", width: 125, align: "right" },
    ],
    d.chequesTercero.map((c) => [
      c.banco,
      fmtFecha(c.vencimiento),
      c.nro,
      fmt(c.monto),
    ]),
    ["Total Cheques de Tercero", "", "", fmt(d.totalChequesTercero)],
  )

  // ── Adelantos ─────────────────────────────────────────────────────────

  sectionTitle(doc, "Detalle de Adelantos")
  drawTable(
    doc,
    [
      { label: "Concepto", width: 215 },
      { label: "Efectivo", width: 100, align: "right" },
      { label: "Gas-Oil", width: 100, align: "right" },
      { label: "Faltante", width: 100, align: "right" },
    ],
    d.adelantos.map((a) => [
      a.descripcion,
      fmt(a.efectivo),
      fmt(a.gasOil),
      fmt(a.faltante),
    ]),
    ["Total Adelantos", fmt(d.totalAdelantosEfectivo), fmt(d.totalAdelantosGasOil), fmt(d.totalAdelantosFaltante)],
  )

  // ── Gastos Descontados ────────────────────────────────────────────────

  sectionTitle(doc, "Gastos Descontados")
  drawTable(
    doc,
    [
      { label: "Proveedor", width: 215 },
      { label: "Comprobante", width: 170 },
      { label: "Monto Descontado", width: 130, align: "right" },
    ],
    d.gastos.map((g) => [
      g.proveedor,
      g.cbte,
      fmt(g.montoDescontado),
    ]),
    ["Total Gastos Descontados", "", fmt(d.totalGastosDescontados)],
  )

  // ── Totales del Pago ──────────────────────────────────────────────────

  const totCols = [
    { label: "Efectivo", width: 64, align: "right" as const },
    { label: "Transf.", width: 64, align: "right" as const },
    { label: "Ch. Propios", width: 66, align: "right" as const },
    { label: "Ch. Terc.", width: 66, align: "right" as const },
    { label: "Adelantos", width: 64, align: "right" as const },
    { label: "Gas-Oil", width: 64, align: "right" as const },
    { label: "Faltantes", width: 64, align: "right" as const },
    { label: "Gastos Desc.", width: 63, align: "right" as const },
  ]
  const TOT_ROW_H = 18
  const TOT_PAD = 4

  // Dark header
  let tx = LEFT
  const thY = doc.y
  for (const col of totCols) {
    doc.rect(tx, thY, col.width, TOT_ROW_H).fill(DARK_BG)
    doc.font("Helvetica-Bold").fontSize(7).fillColor("#ffffff")
      .text(col.label, tx + TOT_PAD, thY + 5, { width: col.width - TOT_PAD * 2, align: "right" })
    tx += col.width
  }
  doc.y = thY + TOT_ROW_H

  // Values row
  const totValues = [
    fmt(d.totalEfectivo),
    fmt(d.totalTransferencia),
    fmt(d.totalChequesPropios),
    fmt(d.totalChequesTercero),
    fmt(d.totalAdelantosGeneral),
    fmt(d.totalAdelantosGasOil),
    fmt(d.totalAdelantosFaltante),
    fmt(d.totalGastosDescontados),
  ]
  tx = LEFT
  const tvY = doc.y
  for (let i = 0; i < totCols.length; i++) {
    const col = totCols[i]
    doc.font("Helvetica-Bold").fontSize(8).fillColor("#000")
      .text(totValues[i], tx + TOT_PAD, tvY + 5, { width: col.width - TOT_PAD * 2, align: "right" })
    doc.y = tvY
    tx += col.width
  }
  doc.y = tvY + TOT_ROW_H + 4

  // Border around totals
  doc.rect(LEFT, thY, PAGE_W, TOT_ROW_H * 2).strokeColor("#000").lineWidth(1.5).stroke()

  // ── Firma ─────────────────────────────────────────────────────────────

  doc.y += 30
  const firmaX = RIGHT - 200
  doc.moveTo(firmaX, doc.y).lineTo(RIGHT, doc.y).strokeColor("#000").lineWidth(0.5).stroke()
  doc.font("Helvetica").fontSize(8).fillColor("#555")
    .text("Firma y aclaracion del receptor", firmaX, doc.y + 4, { width: 200, align: "center" })

  // ── Footer ────────────────────────────────────────────────────────────

  doc.y += 20
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).strokeColor("#eeeeee").lineWidth(0.5).stroke()
  doc.font("Helvetica").fontSize(7).fillColor("#aaaaaa")
    .text(
      `Trans-Magg S.R.L. — Orden de Pago generada el ${fmtFecha(new Date())} — Operador: ${op.operador.nombre} ${op.operador.apellido}`,
      LEFT,
      doc.y + 4,
      { width: PAGE_W, align: "center" },
    )

  doc.end()
  return finished
}
