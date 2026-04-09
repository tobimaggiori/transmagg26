/**
 * Propósito: Generación del PDF y HTML de la Orden de Pago a Fletero.
 * Diseño navy/celeste consistente con pdf-factura.ts y pdf-liquidacion.ts.
 * Usa pdfkit para generación directa de PDF (sin Puppeteer).
 *
 * Secciones del PDF:
 * 1. Encabezado con logo y datos del emisor (idéntico a factura)
 * 2. Datos del destinatario (fletero)
 * 3. Comprobantes Cancelados (liquidaciones pagadas)
 * 4. Descuentos por Adelantos:
 *    a) Estado de Cta Cte de Adelantos de Combustible
 *    b) Otros adelantos
 * 5. Detalle del Pago (solo métodos usados):
 *    - Transferencia Bancaria
 *    - Efectivo
 *    - E-Cheqs (propios electrónicos + tercero electrónicos)
 *    - Cheques (tercero físicos)
 * 6. Total de Pago
 * 7. Firma y footer
 */

import { prisma } from "@/lib/prisma"
import { obtenerDatosEmisor } from "@/lib/pdf-common"
import { sumarImportes } from "@/lib/money"
import PDFDocument from "pdfkit"
import QRCode from "qrcode"

/* ── Paleta (consistente con pdf-factura.ts) ───────────────────────────── */

const NAVY = "#1e3a5f"
const BG_LIGHT = "#edf1f7"
const BORDER = "#c8d1dc"
const TEXT = "#1a1a1a"
const HEADER_BG = "#dce3ed"
const SECTION_BG = "#f0f0f0"
const DARK_BG = "#1a1a1a"

/* ── Helpers de formato ─────────────────────────────────────────────────── */

function fmt(n: number): string {
  const parts = Math.abs(n).toFixed(2).split(".")
  const entero = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ".")
  return `${n < 0 ? "-" : ""}$ ${entero},${parts[1]}`
}

function fmtFecha(fecha: Date): string {
  const dd = String(fecha.getDate()).padStart(2, "0")
  const mm = String(fecha.getMonth() + 1).padStart(2, "0")
  const yyyy = fecha.getFullYear()
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

/* ── Constantes de layout ───────────────────────────────────────────────── */

const MARGIN = 42.52 // ~15mm
const PAGE_W = 595.28
const LEFT = MARGIN
const RIGHT = PAGE_W - MARGIN
const CONTENT_W = RIGHT - LEFT

/* ── Tipos internos ─────────────────────────────────────────────────────── */

interface LiquidacionRow {
  fecha: Date
  ptoVenta: number | null
  nro: number | null
  total: number
}

interface GastoCombustibleCCRow {
  gastoId: string
  fechaFactura: Date
  emisor: string
  nroFactura: string
  totalFactura: number
  seDescuentan: number
  saldo: number
}

interface OtroAdelantoRow {
  adelantoId: string
  fecha: Date
  concepto: string
  total: number
  seDescuentan: number
  saldo: number
}

interface EcheqRow {
  banco: string
  nro: string
  fechaEmision: Date
  fechaPago: Date
  emisor: string
  monto: number
}

interface ChequeFisicoRow {
  banco: string
  nro: string
  fechaEmision: Date
  fechaPago: Date
  emisor: string
  monto: number
}

/* ── Carga de datos ─────────────────────────────────────────────────────── */

/**
 * loadOP: string -> Promise<OPData>
 *
 * Propósito: Carga todos los datos necesarios para generar el PDF/HTML de una OP.
 * Incluye comprobantes cancelados, estado de cta cte de combustible, adelantos,
 * E-Cheqs y cheques físicos.
 */
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
          chequeEmitido: {
            select: {
              nroCheque: true,
              fechaEmision: true,
              fechaPago: true,
              monto: true,
              esElectronico: true,
              cuenta: { select: { nombre: true, bancoOEntidad: true } },
            },
          },
          chequeRecibido: {
            select: {
              nroCheque: true,
              bancoEmisor: true,
              fechaEmision: true,
              fechaCobro: true,
              monto: true,
              esElectronico: true,
              empresa: { select: { razonSocial: true } },
              proveedorOrigen: { select: { razonSocial: true } },
            },
          },
        },
      },
    },
  })

  if (!op) throw new Error(`OrdenPago ${ordenPagoId} no encontrada`)

  // ── Liquidaciones únicas (comprobantes cancelados) ──────────────────
  const liqMap = new Map<string, LiquidacionRow>()
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
  const totalFacturas = sumarImportes(facturas.map(f => f.total))

  // IDs de liquidaciones de esta OP (para filtrar descuentos)
  const liqIds = Array.from(liqMap.keys())

  // ── Gastos de combustible: estado de cta cte ────────────────────────
  const gastosCombustibleDB = await prisma.gastoFletero.findMany({
    where: {
      fleteroId: op.fletero.id,
      tipo: "COMBUSTIBLE",
      estado: { not: "DESCONTADO_TOTAL" },
    },
    include: {
      facturaProveedor: {
        select: {
          ptoVenta: true,
          nroComprobante: true,
          proveedor: { select: { razonSocial: true } },
        },
      },
      descuentos: true,
    },
    orderBy: { creadoEn: "asc" },
  })

  // También traer gastos ya DESCONTADO_TOTAL que tengan descuento en esta OP
  const gastosTotalDescontadosEnOP = await prisma.gastoFletero.findMany({
    where: {
      fleteroId: op.fletero.id,
      tipo: "COMBUSTIBLE",
      estado: "DESCONTADO_TOTAL",
      descuentos: { some: { liquidacionId: { in: liqIds } } },
    },
    include: {
      facturaProveedor: {
        select: {
          ptoVenta: true,
          nroComprobante: true,
          proveedor: { select: { razonSocial: true } },
        },
      },
      descuentos: true,
    },
    orderBy: { creadoEn: "asc" },
  })

  const todosGastosCombustible = [...gastosCombustibleDB, ...gastosTotalDescontadosEnOP]
  // Deduplicar por id
  const gastosUnicos = new Map(todosGastosCombustible.map(g => [g.id, g]))

  const gastosCombustibleCC: GastoCombustibleCCRow[] = []
  let totalDescontadoCombustible = 0

  for (const gasto of Array.from(gastosUnicos.values())) {
    const fp = gasto.facturaProveedor
    const nroFact = fp
      ? `${String(fp.ptoVenta ?? 0).padStart(4, "0")}-${String(fp.nroComprobante ?? "s/n")}`
      : "Sin factura"
    const emisor = fp?.proveedor?.razonSocial ?? (gasto.descripcion ?? "Combustible")

    const descEnEstaOP = sumarImportes(
      gasto.descuentos
        .filter((desc: { liquidacionId: string }) => liqIds.includes(desc.liquidacionId))
        .map((desc: { montoDescontado: number }) => desc.montoDescontado)
    )
    const totalDescontadoAcum = sumarImportes(gasto.descuentos.map((desc: { montoDescontado: number }) => desc.montoDescontado))
    const saldo = Math.max(0, gasto.montoPagado - totalDescontadoAcum)

    gastosCombustibleCC.push({
      gastoId: gasto.id,
      fechaFactura: gasto.creadoEn,
      emisor,
      nroFactura: nroFact,
      totalFactura: gasto.montoPagado,
      seDescuentan: descEnEstaOP,
      saldo,
    })

    totalDescontadoCombustible = sumarImportes([totalDescontadoCombustible, descEnEstaOP])
  }

  // ── Adelantos no-combustible descontados en esta OP ─────────────────
  const adelantoDescuentosOP = await prisma.adelantoDescuento.findMany({
    where: { liquidacionId: { in: liqIds } },
    include: {
      adelanto: {
        select: {
          id: true,
          tipo: true,
          monto: true,
          fecha: true,
          descripcion: true,
          montoDescontado: true,
        },
      },
    },
  })

  // Agrupar por adelantoId, excluir COMBUSTIBLE
  const otrosAdelantosMap = new Map<string, OtroAdelantoRow>()
  for (const desc of adelantoDescuentosOP) {
    if (desc.adelanto.tipo === "COMBUSTIBLE") continue
    const key = desc.adelanto.id
    if (!otrosAdelantosMap.has(key)) {
      otrosAdelantosMap.set(key, {
        adelantoId: key,
        fecha: desc.adelanto.fecha,
        concepto: desc.adelanto.descripcion ?? "Adelanto",
        total: desc.adelanto.monto,
        seDescuentan: 0,
        saldo: Math.max(0, desc.adelanto.monto - desc.adelanto.montoDescontado),
      })
    }
    const row = otrosAdelantosMap.get(key)!
    row.seDescuentan = sumarImportes([row.seDescuentan, desc.montoDescontado])
  }
  const otrosAdelantos = Array.from(otrosAdelantosMap.values())
  const totalOtrosAdelantos = sumarImportes(otrosAdelantos.map(a => a.seDescuentan))

  // ── Transferencias y efectivo ───────────────────────────────────────
  const totalTransferencia = sumarImportes(
    op.pagos.filter(p => p.tipoPago === "TRANSFERENCIA").map(p => p.monto)
  )
  const totalEfectivo = sumarImportes(
    op.pagos.filter(p => p.tipoPago === "EFECTIVO").map(p => p.monto)
  )

  // ── E-Cheqs (propios + tercero electrónicos) ────────────────────────
  const echeqs: EcheqRow[] = []
  const chequesFisicos: ChequeFisicoRow[] = []

  // Cheques propios — deduplicar por chequeEmitidoId
  const chPropiosVistos = new Set<string>()
  for (const p of op.pagos) {
    if (p.tipoPago === "CHEQUE_PROPIO" && p.chequeEmitido && p.chequeEmitidoId) {
      if (chPropiosVistos.has(p.chequeEmitidoId)) continue
      chPropiosVistos.add(p.chequeEmitidoId)
      echeqs.push({
        banco: p.chequeEmitido.cuenta?.bancoOEntidad ?? p.chequeEmitido.cuenta?.nombre ?? "—",
        nro: p.chequeEmitido.nroCheque ?? "—",
        fechaEmision: p.chequeEmitido.fechaEmision,
        fechaPago: p.chequeEmitido.fechaPago,
        emisor: "Trans-Magg S.R.L.",
        monto: p.chequeEmitido.monto,
      })
    }
  }

  // Cheques de tercero — deduplicar por chequeRecibidoId, separar por esElectronico
  const chTercerosVistos = new Set<string>()
  for (const p of op.pagos) {
    if (p.tipoPago === "CHEQUE_TERCERO" && p.chequeRecibido && p.chequeRecibidoId) {
      if (chTercerosVistos.has(p.chequeRecibidoId)) continue
      chTercerosVistos.add(p.chequeRecibidoId)

      const ch = p.chequeRecibido
      const emisorLabel = ch.empresa?.razonSocial ?? ch.proveedorOrigen?.razonSocial ?? "—"
      const row = {
        banco: ch.bancoEmisor,
        nro: ch.nroCheque,
        fechaEmision: ch.fechaEmision,
        fechaPago: ch.fechaCobro,
        emisor: emisorLabel,
        monto: ch.monto,
      }

      if (ch.esElectronico) {
        echeqs.push(row)
      } else {
        chequesFisicos.push(row)
      }
    }
  }

  const totalEcheqs = sumarImportes(echeqs.map(e => e.monto))
  const totalChequesFisicos = sumarImportes(chequesFisicos.map(c => c.monto))

  const condicionIva = condicionIvaLabel[op.fletero.condicionIva] ?? op.fletero.condicionIva

  return {
    op,
    facturas,
    totalFacturas,
    gastosCombustibleCC,
    totalDescontadoCombustible,
    otrosAdelantos,
    totalOtrosAdelantos,
    totalTransferencia,
    totalEfectivo,
    echeqs,
    totalEcheqs,
    chequesFisicos,
    totalChequesFisicos,
    condicionIva,
  }
}

/* ── PDF helpers ────────────────────────────────────────────────────────── */

function sectionTitle(doc: PDFKit.PDFDocument, title: string) {
  const h = 18
  const startY = doc.y
  doc.rect(LEFT, startY, CONTENT_W, h).fill(SECTION_BG)
  doc.fillColor(TEXT).fontSize(8).font("Helvetica-Bold")
    .text(title.toUpperCase(), LEFT + 8, startY + 5, { width: CONTENT_W - 16 })
  doc.y = startY + h + 2
}

function drawTable(
  doc: PDFKit.PDFDocument,
  cols: { label: string; width: number; align?: "left" | "center" | "right" }[],
  rows: string[][],
  subtotalRow?: string[],
) {
  const ROW_H = 16
  const FONT_SIZE = 7.5
  const PAD = 5

  // Header
  let x = LEFT
  const headerY = doc.y
  for (const col of cols) {
    doc.rect(x, headerY, col.width, ROW_H).fill(HEADER_BG)
    doc.fillColor(TEXT).fontSize(FONT_SIZE).font("Helvetica-Bold")
      .text(col.label, x + PAD, headerY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
    x += col.width
  }
  doc.y = headerY + ROW_H

  // Data rows
  for (const row of rows) {
    // Page break check
    if (doc.y + ROW_H > 780) {
      doc.addPage()
      doc.y = MARGIN
    }
    x = LEFT
    const startY = doc.y
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      const val = row[i] ?? ""
      doc.fontSize(FONT_SIZE).font("Helvetica").fillColor(TEXT)
        .text(val, x + PAD, startY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
      doc.y = startY
      x += col.width
    }
    doc.y = startY + ROW_H
  }

  // Empty-state
  if (rows.length === 0) {
    doc.fontSize(FONT_SIZE).font("Helvetica-Oblique").fillColor("#999999")
    doc.text("— Sin registros —", LEFT + PAD, doc.y + 4, { width: CONTENT_W - PAD * 2, align: "center" })
    doc.y += ROW_H
    doc.fillColor(TEXT).font("Helvetica")
  }

  // Subtotal row
  if (subtotalRow) {
    x = LEFT
    const subY = doc.y
    doc.rect(LEFT, subY, CONTENT_W, ROW_H).fill("#f5f7fa")
    for (let i = 0; i < cols.length; i++) {
      const col = cols[i]
      const val = subtotalRow[i] ?? ""
      doc.fontSize(FONT_SIZE).font("Helvetica-Bold").fillColor(TEXT)
        .text(val, x + PAD, subY + 4, { width: col.width - PAD * 2, align: col.align ?? "left" })
      x += col.width
    }
    doc.y = subY + ROW_H
  }

  doc.moveDown(0.4)
}

/* ── generarHTMLOrdenPago ───────────────────────────────────────────────── */

/**
 * generarHTMLOrdenPago: string -> Promise<string>
 *
 * Propósito: Genera el HTML imprimible de la Orden de Pago con formato nro-anio.
 */
export async function generarHTMLOrdenPago(ordenPagoId: string): Promise<string> {
  const d = await loadOP(ordenPagoId)
  const { op } = d
  const nroDisplay = `${op.nro}-${op.anio}`

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
      <td>${fmtNroComprobante(f.ptoVenta, f.nro)}</td>
      <td class="right">${fmtHtml(f.total)}</td>
    </tr>
  `).join("")

  const filasCombustibleCC = d.gastosCombustibleCC.length > 0
    ? d.gastosCombustibleCC.map((g) => `
      <tr>
        <td>${fmtFecha(g.fechaFactura)}</td>
        <td>${g.emisor}</td>
        <td>${g.nroFactura}</td>
        <td class="right">${fmtHtml(g.totalFactura)}</td>
        <td class="right">${fmtHtml(g.seDescuentan)}</td>
        <td class="right">${fmtHtml(g.saldo)}</td>
      </tr>
    `).join("")
    : ""

  const filasOtrosAdelantos = d.otrosAdelantos.length > 0
    ? d.otrosAdelantos.map((a) => `
      <tr>
        <td>${fmtFecha(a.fecha)}</td>
        <td>${a.concepto}</td>
        <td class="right">${fmtHtml(a.total)}</td>
        <td class="right">${fmtHtml(a.seDescuentan)}</td>
        <td class="right">${fmtHtml(a.saldo)}</td>
      </tr>
    `).join("")
    : ""

  const filasEcheqs = d.echeqs.length > 0
    ? d.echeqs.map((e) => `
      <tr>
        <td>${e.banco}</td>
        <td>${e.nro}</td>
        <td>${fmtFecha(e.fechaEmision)}</td>
        <td>${fmtFecha(e.fechaPago)}</td>
        <td>${e.emisor}</td>
        <td class="right">${fmtHtml(e.monto)}</td>
      </tr>
    `).join("")
    : ""

  const filasChequesFisicos = d.chequesFisicos.length > 0
    ? d.chequesFisicos.map((c) => `
      <tr>
        <td>${c.banco}</td>
        <td>${c.nro}</td>
        <td>${fmtFecha(c.fechaEmision)}</td>
        <td>${fmtFecha(c.fechaPago)}</td>
        <td>${c.emisor}</td>
        <td class="right">${fmtHtml(c.monto)}</td>
      </tr>
    `).join("")
    : ""

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Orden de Pago Nro ${nroDisplay} — Trans-Magg S.R.L.</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm 18mm; }
    .encabezado { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 12px; border-bottom: 2px solid ${NAVY}; padding-bottom: 10px; }
    .encabezado-empresa .nombre { font-size: 16px; font-weight: bold; }
    .encabezado-empresa .datos { font-size: 10px; color: #333; margin-top: 2px; }
    .encabezado-op { text-align: right; }
    .encabezado-op .label { font-size: 13px; font-weight: bold; color: ${NAVY}; }
    .encabezado-op .nro { font-size: 18px; font-weight: bold; }
    .encabezado-op .fecha { font-size: 11px; margin-top: 2px; }
    .fletero-box { border: 1px solid ${BORDER}; padding: 8px 12px; margin-bottom: 12px; background: ${BG_LIGHT}; }
    .fletero-box .lbl { color: #555; font-size: 10px; text-transform: uppercase; }
    .fletero-box .val { font-weight: bold; }
    .seccion { margin-bottom: 12px; }
    .seccion-titulo { font-size: 10px; font-weight: bold; text-transform: uppercase; background: ${SECTION_BG}; padding: 4px 8px; border: 1px solid #ccc; border-bottom: none; letter-spacing: 0.5px; }
    .sub-titulo { font-size: 10px; font-weight: bold; font-style: italic; padding: 4px 8px; background: #fafafa; border: 1px solid #ddd; border-bottom: none; }
    table { width: 100%; border-collapse: collapse; font-size: 11px; }
    th { background: ${HEADER_BG}; padding: 4px 8px; text-align: left; font-size: 10px; border: 1px solid #ccc; }
    td { padding: 4px 8px; border: 1px solid #ddd; }
    tr.subtotal { background: #f5f7fa; font-weight: bold; }
    .right { text-align: right; }
    .center { text-align: center; }
    .muted { color: #999; font-style: italic; font-size: 10px; }
    .total-box { border: 2px solid ${NAVY}; margin-top: 12px; background: ${DARK_BG}; color: #fff; padding: 10px 16px; display: flex; justify-content: space-between; font-size: 14px; font-weight: bold; }
    .firma { margin-top: 40px; display: flex; justify-content: flex-end; }
    .firma-linea { text-align: center; }
    .firma-linea .linea { border-top: 1px solid #000; width: 200px; margin-bottom: 4px; }
    .firma-linea .texto { font-size: 10px; color: #555; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #aaa; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { padding: 10mm 14mm; } @page { margin: 10mm; } }
  </style>
</head>
<body>

  <div class="encabezado">
    <div class="encabezado-empresa">
      <div class="nombre">TRANS-MAGG S.R.L.</div>
      <div class="datos">C.U.I.T. ${fmtCuit(op.fletero.cuit.length > 5 ? "30709381683" : "30709381683")}</div>
      <div class="datos">Belgrano 184 — 2109 Acebal (S.F.)</div>
    </div>
    <div class="encabezado-op">
      <div class="label">Orden de Pago</div>
      <div class="nro">${nroDisplay}</div>
      <div class="fecha">Fecha: ${fmtFecha(op.fecha)}</div>
    </div>
  </div>

  <div class="fletero-box">
    <div><span class="lbl">Sres: </span><span class="val">${op.fletero.razonSocial}</span>
      <span style="margin-left:20px" class="lbl">CUIT: </span><span class="val">${fmtCuit(op.fletero.cuit)}</span></div>
    <div><span class="lbl">Domicilio: </span><span class="val">${op.fletero.direccion ?? "—"}</span></div>
    <div><span class="lbl">Situación IVA: </span><span class="val">${d.condicionIva}</span></div>
  </div>

  <div class="seccion">
    <div class="seccion-titulo">Comprobantes Cancelados</div>
    <table>
      <thead><tr><th>Fecha</th><th>Nro</th><th class="right">Total</th></tr></thead>
      <tbody>
        ${filaFacturas}
        <tr class="subtotal"><td colspan="2">Total</td><td class="right">${fmtHtml(d.totalFacturas)}</td></tr>
      </tbody>
    </table>
  </div>

  ${d.gastosCombustibleCC.length > 0 ? `
  <div class="seccion">
    <div class="seccion-titulo">Descuentos por Adelantos</div>
    <div class="sub-titulo">Estado de Cta Cte de Adelantos de Combustible</div>
    <table>
      <thead><tr><th>Fecha</th><th>Emisor</th><th>Nro</th><th class="right">Total</th><th class="right">Se descuentan</th><th class="right">Saldo</th></tr></thead>
      <tbody>
        ${filasCombustibleCC}
        <tr class="subtotal"><td colspan="4">Total descuento por adelanto de combustible</td><td class="right">${fmtHtml(d.totalDescontadoCombustible)}</td><td></td></tr>
      </tbody>
    </table>
  </div>` : ""}

  ${d.otrosAdelantos.length > 0 ? `
  <div class="seccion">
    <div class="sub-titulo">Otros adelantos</div>
    <table>
      <thead><tr><th>Fecha</th><th>Concepto</th><th class="right">Total</th><th class="right">Se descuentan</th><th class="right">Saldo</th></tr></thead>
      <tbody>
        ${filasOtrosAdelantos}
        <tr class="subtotal"><td colspan="3">Total otros adelantos</td><td class="right">${fmtHtml(d.totalOtrosAdelantos)}</td><td></td></tr>
      </tbody>
    </table>
  </div>` : ""}

  <div class="seccion">
    <div class="seccion-titulo">Detalle del Pago</div>
    ${d.totalTransferencia > 0 ? `<p style="padding:4px 8px;font-weight:bold;">Transferencia Bancaria: ${fmtHtml(d.totalTransferencia)}</p>` : ""}
    ${d.totalEfectivo > 0 ? `<p style="padding:4px 8px;font-weight:bold;">Efectivo: ${fmtHtml(d.totalEfectivo)}</p>` : ""}
    ${d.echeqs.length > 0 ? `
    <div class="sub-titulo">E-Cheqs</div>
    <table>
      <thead><tr><th>Banco</th><th>Nro</th><th>Fecha Emisión</th><th>Fecha Pago</th><th>Emisor</th><th class="right">Monto</th></tr></thead>
      <tbody>
        ${filasEcheqs}
        <tr class="subtotal"><td colspan="5">Total pago en E-Cheq</td><td class="right">${fmtHtml(d.totalEcheqs)}</td></tr>
      </tbody>
    </table>` : ""}
    ${d.chequesFisicos.length > 0 ? `
    <div class="sub-titulo">Cheques</div>
    <table>
      <thead><tr><th>Banco</th><th>Nro</th><th>Fecha Emisión</th><th>Fecha Pago</th><th>Emisor</th><th class="right">Monto</th></tr></thead>
      <tbody>
        ${filasChequesFisicos}
        <tr class="subtotal"><td colspan="5">Total pago en Cheques</td><td class="right">${fmtHtml(d.totalChequesFisicos)}</td></tr>
      </tbody>
    </table>` : ""}
  </div>

  <div class="total-box">
    <span>Total</span>
    <span>${fmtHtml(d.totalFacturas)}</span>
  </div>

  <div class="firma">
    <div class="firma-linea">
      <div class="linea"></div>
      <div class="texto">Firma y aclaración del receptor</div>
    </div>
  </div>

  <div class="footer">
    Trans-Magg S.R.L. — Orden de Pago generada el ${fmtFecha(new Date())} — Operador: ${op.operador.nombre} ${op.operador.apellido}
  </div>

</body>
</html>`

  return html
}

/* ── generarPDFOrdenPago (pdfkit) ───────────────────────────────────────── */

/**
 * generarPDFOrdenPago: string -> Promise<Buffer>
 *
 * Propósito: Genera el PDF de la Orden de Pago con diseño navy/celeste
 * consistente con factura y liquidación.
 */
export async function generarPDFOrdenPago(ordenPagoId: string): Promise<Buffer> {
  const d = await loadOP(ordenPagoId)
  const { op } = d
  const nroDisplay = `${op.nro}-${op.anio}`

  const emisor = await obtenerDatosEmisor()

  // QR con link a la OP
  const qrUrl = `${process.env.NEXT_PUBLIC_APP_URL ?? "https://transmagg.com"}/ordenes-pago/${ordenPagoId}`
  const qrBuffer = await QRCode.toBuffer(qrUrl, { width: 80 })

  const doc = new PDFDocument({ size: "A4", margin: MARGIN })
  const chunks: Buffer[] = []
  doc.on("data", (c: Buffer) => chunks.push(c))

  const finished = new Promise<Buffer>((resolve, reject) => {
    doc.on("end", () => resolve(Buffer.concat(chunks)))
    doc.on("error", reject)
  })

  // ─── 1. LÍNEA DECORATIVA SUPERIOR ──────────────────────────────────
  doc.save()
  doc.strokeColor(NAVY).lineWidth(2.5)
  doc.moveTo(LEFT, MARGIN).lineTo(RIGHT, MARGIN).stroke()
  doc.restore()

  let cursorY = MARGIN + 10

  // ─── 2. ENCABEZADO ─────────────────────────────────────────────────
  const headerLeftW = CONTENT_W * 0.48
  const headerRightW = 220
  const headerRightX = RIGHT - headerRightW

  // Izquierda: logo + datos emisor
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
  doc.text(`CUIT: ${fmtCuit(emisor.cuit)}`, LEFT, leftY, { width: headerLeftW })
  leftY = doc.y + 1
  doc.text(`Condición IVA: ${emisor.condicionIva}`, LEFT, leftY, { width: headerLeftW })

  // Derecha: recuadro redondeado con "Orden de Pago" + nro
  const rightBoxH = 90
  const rightBoxY = cursorY
  const pad = 18
  const innerW = headerRightW - pad * 2

  doc.save()
  doc.strokeColor(BORDER).lineWidth(1)
  doc.roundedRect(headerRightX, rightBoxY, headerRightW, rightBoxH, 6).stroke()
  doc.restore()

  // Título
  doc.font("Helvetica-Bold").fontSize(13).fillColor(NAVY)
    .text("Orden de Pago", headerRightX + pad, rightBoxY + pad, { width: innerW })

  // Número
  doc.font("Helvetica-Bold").fontSize(16).fillColor(TEXT)
    .text(nroDisplay, headerRightX + pad, doc.y + 4, { width: innerW })

  // Fecha
  doc.font("Helvetica").fontSize(9).fillColor(TEXT)
    .text(`Fecha: ${fmtFecha(op.fecha)}`, headerRightX + pad, doc.y + 4, { width: innerW })

  cursorY = Math.max(doc.y + 4, rightBoxY + rightBoxH) + 12

  // ─── 3. DATOS DEL DESTINATARIO ──────────────────────────────────────

  const clientBoxPadX = 12
  const clientBoxPadY = 10
  const clientLineH = 16
  const clientBoxH = clientBoxPadY * 2 + clientLineH * 3

  doc.save()
  doc.fillColor(BG_LIGHT)
  doc.roundedRect(LEFT, cursorY, CONTENT_W, clientBoxH, 6).fill()
  doc.restore()

  let cLineY = cursorY + clientBoxPadY
  const labelX = LEFT + clientBoxPadX
  const valueX = LEFT + clientBoxPadX + 60
  const col2LabelX = LEFT + CONTENT_W * 0.55
  const col2ValueX = col2LabelX + 40

  // Fila 1: Sres + CUIT
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("Sres:", labelX, cLineY + 3, { continued: false })
  doc.font("Helvetica-Bold").fontSize(9).fillColor(TEXT)
    .text(op.fletero.razonSocial, valueX, cLineY + 2)
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("CUIT:", col2LabelX, cLineY + 3)
  doc.font("Helvetica").fontSize(9).fillColor(TEXT)
    .text(fmtCuit(op.fletero.cuit), col2ValueX, cLineY + 2)

  cLineY += clientLineH

  // Fila 2: Domicilio
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("Domicilio:", labelX, cLineY + 3)
  doc.font("Helvetica").fontSize(9).fillColor(TEXT)
    .text(op.fletero.direccion ?? "—", valueX + 10, cLineY + 2)

  cLineY += clientLineH

  // Fila 3: Situación IVA
  doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
    .text("Situación IVA:", labelX, cLineY + 3)
  doc.font("Helvetica").fontSize(9).fillColor(TEXT)
    .text(d.condicionIva, valueX + 20, cLineY + 2)

  cursorY = cursorY + clientBoxH + 12
  doc.y = cursorY

  // ─── 4. COMPROBANTES CANCELADOS ─────────────────────────────────────

  sectionTitle(doc, "Comprobantes Cancelados")
  drawTable(
    doc,
    [
      { label: "Fecha", width: 130 },
      { label: "Nro", width: 200 },
      { label: "Total", width: CONTENT_W - 330, align: "right" },
    ],
    d.facturas.map((f) => [
      fmtFecha(f.fecha),
      fmtNroComprobante(f.ptoVenta, f.nro),
      fmt(f.total),
    ]),
    ["Total", "", fmt(d.totalFacturas)],
  )

  // ─── 5. DESCUENTOS POR ADELANTOS ───────────────────────────────────

  // 5a. Estado de Cta Cte de Adelantos de Combustible
  if (d.gastosCombustibleCC.length > 0) {
    sectionTitle(doc, "Estado de Cta Cte de Adelantos de Combustible")
    drawTable(
      doc,
      [
        { label: "Fecha", width: 70 },
        { label: "Emisor", width: 110 },
        { label: "Nro", width: 80 },
        { label: "Total", width: 75, align: "right" },
        { label: "Se descuentan", width: 85, align: "right" },
        { label: "Saldo", width: CONTENT_W - 420, align: "right" },
      ],
      d.gastosCombustibleCC.map((g) => [
        fmtFecha(g.fechaFactura),
        g.emisor,
        g.nroFactura,
        fmt(g.totalFactura),
        fmt(g.seDescuentan),
        fmt(g.saldo),
      ]),
      ["Total descuento por adelanto de combustible", "", "", "", fmt(d.totalDescontadoCombustible), ""],
    )
  }

  // 5b. Otros adelantos
  if (d.otrosAdelantos.length > 0) {
    sectionTitle(doc, "Otros Adelantos")
    drawTable(
      doc,
      [
        { label: "Fecha", width: 85 },
        { label: "Concepto", width: 140 },
        { label: "Total", width: 90, align: "right" },
        { label: "Se descuentan", width: 95, align: "right" },
        { label: "Saldo", width: CONTENT_W - 410, align: "right" },
      ],
      d.otrosAdelantos.map((a) => [
        fmtFecha(a.fecha),
        a.concepto,
        fmt(a.total),
        fmt(a.seDescuentan),
        fmt(a.saldo),
      ]),
      ["Total otros adelantos", "", "", fmt(d.totalOtrosAdelantos), ""],
    )
  }

  // ─── 6. DETALLE DEL PAGO ───────────────────────────────────────────

  sectionTitle(doc, "Detalle del Pago")

  // 6a. Transferencia
  if (d.totalTransferencia > 0) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
      .text(`Transferencia Bancaria:   ${fmt(d.totalTransferencia)}`, LEFT + 8, doc.y + 2)
    doc.moveDown(0.5)
  }

  // 6b. Efectivo
  if (d.totalEfectivo > 0) {
    doc.font("Helvetica-Bold").fontSize(8).fillColor(TEXT)
      .text(`Efectivo:   ${fmt(d.totalEfectivo)}`, LEFT + 8, doc.y + 2)
    doc.moveDown(0.5)
  }

  // 6c. E-Cheqs
  if (d.echeqs.length > 0) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(NAVY)
      .text("E-Cheqs", LEFT + 8, doc.y + 2)
    doc.moveDown(0.2)

    drawTable(
      doc,
      [
        { label: "Banco", width: 100 },
        { label: "Nro", width: 80 },
        { label: "F. Emisión", width: 70, align: "center" },
        { label: "F. Pago", width: 70, align: "center" },
        { label: "Emisor", width: 100 },
        { label: "Monto", width: CONTENT_W - 420, align: "right" },
      ],
      d.echeqs.map((e) => [
        e.banco,
        e.nro,
        fmtFecha(e.fechaEmision),
        fmtFecha(e.fechaPago),
        e.emisor,
        fmt(e.monto),
      ]),
      ["Total pago en E-Cheq", "", "", "", "", fmt(d.totalEcheqs)],
    )
  }

  // 6d. Cheques físicos
  if (d.chequesFisicos.length > 0) {
    doc.font("Helvetica-Bold").fontSize(7.5).fillColor(NAVY)
      .text("Cheques", LEFT + 8, doc.y + 2)
    doc.moveDown(0.2)

    drawTable(
      doc,
      [
        { label: "Banco", width: 100 },
        { label: "Nro", width: 80 },
        { label: "F. Emisión", width: 70, align: "center" },
        { label: "F. Pago", width: 70, align: "center" },
        { label: "Emisor", width: 100 },
        { label: "Monto", width: CONTENT_W - 420, align: "right" },
      ],
      d.chequesFisicos.map((c) => [
        c.banco,
        c.nro,
        fmtFecha(c.fechaEmision),
        fmtFecha(c.fechaPago),
        c.emisor,
        fmt(c.monto),
      ]),
      ["Total pago en Cheques", "", "", "", "", fmt(d.totalChequesFisicos)],
    )
  }

  // ─── 7. TOTAL DE PAGO ─────────────────────────────────────────────

  const totY = doc.y + 4
  const TOT_H = 28

  doc.rect(LEFT, totY, CONTENT_W, TOT_H).fill(DARK_BG)

  doc.font("Helvetica-Bold").fontSize(11).fillColor("#ffffff")
    .text("Total:", LEFT + 16, totY + 8)
  doc.font("Helvetica-Bold").fontSize(12).fillColor("#ffffff")
    .text(fmt(d.totalFacturas), LEFT + 16, totY + 8, { width: CONTENT_W - 32, align: "right" })

  doc.y = totY + TOT_H

  // ─── 8. FIRMA ─────────────────────────────────────────────────────

  doc.y += 30
  const firmaX = RIGHT - 200
  doc.moveTo(firmaX, doc.y).lineTo(RIGHT, doc.y).strokeColor("#000").lineWidth(0.5).stroke()
  doc.font("Helvetica").fontSize(8).fillColor("#555")
    .text("Firma y aclaración del receptor", firmaX, doc.y + 4, { width: 200, align: "center" })

  // ─── 9. FOOTER ────────────────────────────────────────────────────

  doc.y += 20
  doc.moveTo(LEFT, doc.y).lineTo(RIGHT, doc.y).strokeColor("#eeeeee").lineWidth(0.5).stroke()
  doc.font("Helvetica").fontSize(7).fillColor("#aaaaaa")
    .text(
      `Trans-Magg S.R.L. — Orden de Pago generada el ${fmtFecha(new Date())} — Operador: ${op.operador.nombre} ${op.operador.apellido}`,
      LEFT,
      doc.y + 4,
      { width: CONTENT_W, align: "center" },
    )

  // QR en la esquina inferior
  try {
    doc.image(qrBuffer, LEFT, doc.y + 10, { width: 50 })
  } catch { /* skip */ }

  doc.end()
  return finished
}
