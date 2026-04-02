/**
 * Propósito: Generación del PDF del Líquido Producto (Cuenta de Venta y LP).
 * Replica el layout oficial de Trans-Magg S.R.L. con cabecera, timbre, tabla de viajes y totales.
 * El HTML se convierte a PDF binario con Puppeteer (A4).
 */

import { prisma } from "@/lib/prisma"
import puppeteer from "puppeteer"
import crypto from "crypto"

function fmt(n: number): string {
  return new Intl.NumberFormat("es-AR", {
    style: "currency",
    currency: "ARS",
    minimumFractionDigits: 2,
  }).format(n)
}

function fmtNumero(n: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(n)
}

function fmtKilos(n: number): string {
  return new Intl.NumberFormat("es-AR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n)
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
  const token = crypto.createHmac("sha256", key).update(liquidacionId).digest("hex").slice(0, 32)
  const base = process.env.NEXTAUTH_URL ?? "https://transmagg.com"
  return `${base}/api/liquidaciones/${liquidacionId}/pdf?token=${token}`
}

function generarHTMLLiquidacion(
  liq: {
    id: string
    nroComprobante: number | null
    ptoVenta: number | null
    comisionPct: number
    subtotalBruto: number
    comisionMonto: number
    neto: number
    ivaMonto: number
    total: number
    grabadaEn: Date
    cae: string | null
    caeVto: Date | null
    arcaObservaciones: string | null
    fletero: { razonSocial: string; cuit: string; direccion: string | null }
    viajes: Array<{
      fechaViaje: Date
      remito: string | null
      cupo: string | null
      mercaderia: string | null
      procedencia: string | null
      destino: string | null
      kilos: number | null
      tarifaFletero: number
      subtotal: number
    }>
  }
): string {
  const nroLP = liq.nroComprobante && liq.ptoVenta
    ? fmtNroLP(liq.ptoVenta, liq.nroComprobante)
    : "Borrador"

  const qrUrl = generarQRUrl(liq.id)

  const filasViajes = liq.viajes.map((v, i) => `
    <tr style="background: ${i % 2 === 0 ? "#fff" : "#f8fafc"}">
      <td style="padding:4px 6px">${fmtFecha(v.fechaViaje)}</td>
      <td style="padding:4px 6px">${v.remito ?? "—"}</td>
      <td style="padding:4px 6px">${v.cupo ?? "—"}</td>
      <td style="padding:4px 6px">${v.mercaderia ?? "—"}</td>
      <td style="padding:4px 6px">${v.procedencia ?? "—"}</td>
      <td style="padding:4px 6px">${v.destino ?? "—"}</td>
      <td style="padding:4px 6px; text-align:right">${v.kilos != null ? fmtKilos(v.kilos) : "—"}</td>
      <td style="padding:4px 6px; text-align:right">${fmtNumero(v.tarifaFletero)}</td>
      <td style="padding:4px 6px; text-align:right">${fmtNumero(v.subtotal)}</td>
    </tr>
  `).join("")

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>LP ${nroLP} — ${liq.fletero.razonSocial}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; }
    .page { width: 210mm; min-height: 297mm; padding: 12mm 14mm; position: relative; }
    .blue-line { border: none; height: 1.5px; background: #1e40af; margin: 8px 0; }
    .blue-line-thin { border: none; height: 0.8px; background: #1e40af; margin: 6px 0; }

    /* Cabecera */
    .header { display: flex; justify-content: space-between; align-items: flex-start; }
    .header-left { width: 33%; }
    .header-left .empresa-nombre { font-size: 13px; font-weight: bold; margin-top: 4px; }
    .header-left .empresa-dato { font-size: 9px; color: #333; line-height: 1.5; }
    .header-center { width: 20%; display: flex; justify-content: center; }
    .timbre { border: 2px solid #000; text-align: center; padding: 6px 16px; }
    .timbre .letra { font-size: 28px; font-weight: bold; }
    .timbre .codigo { font-size: 9px; color: #555; }
    .header-right { width: 40%; text-align: right; }
    .header-right .titulo { font-size: 12px; font-weight: bold; }
    .header-right .dato { font-size: 9px; line-height: 1.6; }
    .header-right .dato b { font-weight: 600; }

    /* Datos fletero */
    .fletero-datos { margin: 6px 0; font-size: 10px; line-height: 1.7; }
    .fletero-datos b { font-weight: 600; }

    /* Tabla viajes */
    .tabla-viajes { width: 100%; border-collapse: collapse; font-size: 9px; }
    .tabla-viajes th {
      font-weight: bold;
      text-align: left;
      padding: 4px 6px;
      border-top: 1.5px solid #1e40af;
      border-bottom: 1.5px solid #1e40af;
      background: #fff;
    }
    .tabla-viajes th.right { text-align: right; }

    /* Totales */
    .totales { width: 320px; margin-left: auto; font-size: 10px; margin-top: 8px; }
    .totales td { padding: 2px 0; }
    .totales .label { text-align: left; }
    .totales .valor { text-align: right; font-family: 'Courier New', monospace; }
    .totales .total-final td { font-weight: bold; font-size: 11px; }

    /* Pie */
    .pie { display: flex; justify-content: space-between; align-items: flex-start; margin-top: 12px; font-size: 9px; }
    .pie-izq { width: 40%; line-height: 1.6; }
    .pie-centro { width: 20%; text-align: center; }
    .pie-der { width: 30%; text-align: center; color: #888; font-size: 8px; padding-top: 50px; border-top: 1px solid #ccc; margin-top: 10px; }
  </style>
</head>
<body>
  <div class="page">
    <!-- Cabecera -->
    <div class="header">
      <div class="header-left">
        <div class="empresa-nombre">TRANS-MAGG S.R.L.</div>
        <div class="empresa-dato">
          C.U.I.T. 30-70938168-3<br>
          Belgrano 184, 2109 Acebal (S.F.)<br>
          Tel: (03469) 15695306
        </div>
      </div>
      <div class="header-center">
        <div class="timbre">
          <div class="letra">A</div>
          <div class="codigo">Código 060</div>
        </div>
      </div>
      <div class="header-right">
        <div class="titulo">Cuenta de Venta y Líquido Producto</div>
        <div class="dato">
          <b>Nro:</b> ${nroLP}<br>
          <b>Fecha:</b> ${fmtFecha(liq.grabadaEn)}<br>
          Responsable Inscripto<br>
          <b>C.U.I.T.:</b> 30-70938168-3<br>
          <b>Ing. Brutos Conv. Multi.:</b> 0921-759945-2<br>
          <b>Fecha de Inicio:</b> 18/10/2005
        </div>
      </div>
    </div>

    <hr class="blue-line">

    <!-- Datos fletero -->
    <div class="fletero-datos">
      <b>Sres:</b> ${liq.fletero.razonSocial.toUpperCase()}<br>
      <b>Domicilio:</b> ${liq.fletero.direccion ?? "—"}<br>
      <b>C.U.I.T.:</b> ${fmtCuit(liq.fletero.cuit)}
    </div>

    <hr class="blue-line-thin">

    <!-- Tabla de viajes -->
    <table class="tabla-viajes">
      <thead>
        <tr>
          <th>Fecha</th>
          <th>Remito</th>
          <th>Cupo</th>
          <th>Mercadería</th>
          <th>Procedencia</th>
          <th>Destino</th>
          <th class="right">Kilos</th>
          <th class="right">Tarifa</th>
          <th class="right">STotal</th>
        </tr>
      </thead>
      <tbody>
        ${filasViajes}
      </tbody>
    </table>

    <hr class="blue-line-thin">

    <!-- Totales -->
    <table class="totales">
      <tr>
        <td class="label">Total Viajes</td>
        <td class="valor">${fmt(liq.subtotalBruto)}</td>
      </tr>
      <tr>
        <td class="label">Comisión s/conv. (${liq.comisionPct}%)</td>
        <td class="valor">${fmt(liq.comisionMonto)}</td>
      </tr>
      <tr>
        <td class="label">Total</td>
        <td class="valor">${fmt(liq.neto)}</td>
      </tr>
      <tr><td colspan="2"><hr class="blue-line-thin" style="margin:3px 0"></td></tr>
      <tr>
        <td class="label">IVA (21%)</td>
        <td class="valor">${fmt(liq.ivaMonto)}</td>
      </tr>
      <tr><td colspan="2"><hr class="blue-line-thin" style="margin:3px 0"></td></tr>
      <tr class="total-final">
        <td class="label">Total</td>
        <td class="valor">${fmt(liq.total)}</td>
      </tr>
    </table>

    <hr class="blue-line" style="margin-top:12px">

    <!-- Pie -->
    <div class="pie">
      <div class="pie-izq">
        <b>CAE:</b> ${liq.cae ?? "Pendiente"}<br>
        <b>Vto:</b> ${liq.caeVto ? fmtFecha(liq.caeVto) : "—"}<br>
        ${liq.arcaObservaciones ? `<b>Obs:</b> ${liq.arcaObservaciones}` : ""}
      </div>
      <div class="pie-centro">
        <img src="https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(qrUrl)}" width="80" height="80" />
      </div>
      <div class="pie-der">
        Firma / Sello
      </div>
    </div>
  </div>
</body>
</html>`
}

export async function generarPDFLiquidacion(liquidacionId: string): Promise<Buffer> {
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

  const html = generarHTMLLiquidacion(liq)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      printBackground: true,
      margin: { top: "0", bottom: "0", left: "0", right: "0" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
