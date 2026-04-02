/**
 * Propósito: Generación del PDF del Libro de IVA mensual con Puppeteer.
 * Incluye secciones IVA Ventas, IVA Compras y posición neta.
 */

import puppeteer from "puppeteer"

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
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS", minimumFractionDigits: 2 }).format(n)
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

function nombreMes(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const meses = [
    "ENERO", "FEBRERO", "MARZO", "ABRIL", "MAYO", "JUNIO",
    "JULIO", "AGOSTO", "SEPTIEMBRE", "OCTUBRE", "NOVIEMBRE", "DICIEMBRE",
  ]
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`
}

function filaVenta(a: AsientoConRelaciones): string {
  const esLP = a.tipoReferencia === "LIQUIDACION"
  const fecha = esLP ? a.liquidacion?.grabadaEn : a.facturaEmitida?.emitidaEn
  const contraparte = esLP
    ? (a.liquidacion?.fletero.razonSocial ?? "—")
    : (a.facturaEmitida?.empresa.razonSocial ?? "—")
  const cbte = esLP
    ? (a.liquidacion?.ptoVenta != null && a.liquidacion?.nroComprobante != null
        ? `LP ${String(a.liquidacion.ptoVenta).padStart(4, "0")}-${String(a.liquidacion.nroComprobante).padStart(8, "0")}`
        : "LP s/n")
    : (a.facturaEmitida
        ? `${a.facturaEmitida.tipoCbte ?? ""} ${a.facturaEmitida.nroComprobante ?? "s/n"}`
        : "—")
  const cuit = esLP ? a.liquidacion?.fletero.cuit : a.facturaEmitida?.empresa.cuit
  return `
    <tr>
      <td>${fmtFecha(fecha)}</td>
      <td>${esLP ? "Liq. Productor" : "Factura"}</td>
      <td class="mono">${cbte}</td>
      <td>${contraparte}</td>
      <td class="r">${fmt(a.baseImponible)}</td>
      <td class="r">${a.alicuota}%</td>
      <td class="r bold">${fmt(a.montoIva)}</td>
      <td class="mono small">${cuit ? fmtCuit(cuit) : "—"}</td>
    </tr>`
}

function filaCompra(a: AsientoConRelaciones): string {
  const esSeguro = a.tipoReferencia.startsWith("FACTURA_SEGURO")
  const fecha = esSeguro ? a.facturaSeguro?.fecha : a.facturaProveedor?.fechaCbte
  const proveedor = esSeguro
    ? (a.facturaSeguro?.aseguradora?.razonSocial ?? "—")
    : (a.facturaProveedor?.proveedor.razonSocial ?? "—")
  const cbte = esSeguro
    ? (a.facturaSeguro?.nroComprobante ?? "—")
    : (a.facturaProveedor ? `${a.facturaProveedor.tipoCbte} ${a.facturaProveedor.nroComprobante}` : "—")
  const cuit = esSeguro
    ? a.facturaSeguro?.aseguradora?.cuit
    : a.facturaProveedor?.proveedor.cuit
  const tipo = a.tipoReferencia === "PERCEPCION_IVA"
    ? "Percepción IVA"
    : a.tipoReferencia === "PERCEPCION_IIBB"
      ? "Percepción IIBB"
      : esSeguro ? "Seguro" : "Factura"
  return `
    <tr>
      <td>${fmtFecha(fecha)}</td>
      <td>${tipo}</td>
      <td class="mono">${cbte}</td>
      <td>${proveedor}</td>
      <td class="r">${fmt(a.baseImponible)}</td>
      <td class="r">${a.alicuota}%</td>
      <td class="r bold">${fmt(a.montoIva)}</td>
      <td class="mono small">${cuit ? fmtCuit(cuit) : "—"}</td>
    </tr>`
}

function generarHTML(asientos: AsientoConRelaciones[], mesAnio: string): string {
  const ventas = asientos.filter((a) => a.tipo === "VENTA")
  const compras = asientos.filter((a) => a.tipo === "COMPRA")
  const totalBaseVentas = ventas.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaVentas = ventas.reduce((acc, a) => acc + a.montoIva, 0)
  const totalBaseCompras = compras.reduce((acc, a) => acc + a.baseImponible, 0)
  const totalIvaCompras = compras.reduce((acc, a) => acc + a.montoIva, 0)
  const posicion = totalIvaVentas - totalIvaCompras

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro IVA — ${nombreMes(mesAnio)}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 12mm; }
    .header { margin-bottom: 14px; }
    .empresa { font-size: 14px; font-weight: bold; }
    .cuit { font-size: 10px; color: #555; }
    .titulo { font-size: 12px; font-weight: bold; margin-top: 4px; text-transform: uppercase; letter-spacing: 1px; }
    .separador { border-top: 2px solid #000; margin: 8px 0; }
    h2 { font-size: 11px; font-weight: bold; background: #e8e8e8; padding: 4px 6px; margin: 16px 0 6px; text-transform: uppercase; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 4px; }
    thead th { background: #f0f0f0; padding: 4px 5px; text-align: left; font-size: 9px; border-bottom: 1px solid #ccc; }
    td { padding: 3px 5px; border-bottom: 1px solid #eee; font-size: 9.5px; }
    .r { text-align: right; }
    .mono { font-family: monospace; }
    .small { font-size: 8.5px; }
    .bold { font-weight: bold; }
    .totales-row td { background: #f0f0f0; font-weight: bold; border-top: 2px solid #aaa; padding: 5px; }
    .posicion { margin-top: 20px; border: 2px solid #000; padding: 12px; display: flex; gap: 30px; }
    .pos-item { flex: 1; }
    .pos-label { font-size: 9px; color: #555; text-transform: uppercase; }
    .pos-valor { font-size: 13px; font-weight: bold; }
    .deudor { color: #dc2626; }
    .acreedor { color: #16a34a; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #888; border-top: 1px solid #eee; padding-top: 8px; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    <div class="empresa">TRANS-MAGG S.R.L.</div>
    <div class="cuit">C.U.I.T. 30-70938168-3</div>
    <div class="titulo">Libro de IVA — ${nombreMes(mesAnio)}</div>
  </div>
  <div class="separador"></div>

  <h2>IVA Ventas (${ventas.length} asiento${ventas.length !== 1 ? "s" : ""})</h2>
  ${ventas.length === 0
    ? `<p style="padding: 6px; color: #888;">Sin asientos de IVA Ventas en el período.</p>`
    : `<table>
      <thead>
        <tr>
          <th>Fecha</th><th>Tipo</th><th>Comprobante</th><th>Empresa / Fletero</th>
          <th class="r">Base Imp.</th><th class="r">Alíc.</th><th class="r">IVA</th><th>CUIT</th>
        </tr>
      </thead>
      <tbody>
        ${ventas.map(filaVenta).join("")}
        <tr class="totales-row">
          <td colspan="4" class="r">TOTAL IVA VENTAS</td>
          <td class="r">${fmt(totalBaseVentas)}</td>
          <td></td>
          <td class="r">${fmt(totalIvaVentas)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>`}

  <h2>IVA Compras (${compras.length} asiento${compras.length !== 1 ? "s" : ""})</h2>
  ${compras.length === 0
    ? `<p style="padding: 6px; color: #888;">Sin asientos de IVA Compras en el período.</p>`
    : `<table>
      <thead>
        <tr>
          <th>Fecha</th><th>Tipo</th><th>Comprobante</th><th>Proveedor</th>
          <th class="r">Base Imp.</th><th class="r">Alíc.</th><th class="r">IVA</th><th>CUIT</th>
        </tr>
      </thead>
      <tbody>
        ${compras.map(filaCompra).join("")}
        <tr class="totales-row">
          <td colspan="4" class="r">TOTAL IVA COMPRAS</td>
          <td class="r">${fmt(totalBaseCompras)}</td>
          <td></td>
          <td class="r">${fmt(totalIvaCompras)}</td>
          <td></td>
        </tr>
      </tbody>
    </table>`}

  <div class="posicion">
    <div class="pos-item">
      <div class="pos-label">IVA Ventas</div>
      <div class="pos-valor">${fmt(totalIvaVentas)}</div>
    </div>
    <div class="pos-item">
      <div class="pos-label">IVA Compras</div>
      <div class="pos-valor">${fmt(totalIvaCompras)}</div>
    </div>
    <div class="pos-item">
      <div class="pos-label">Posición Neta de IVA</div>
      <div class="pos-valor ${posicion >= 0 ? "deudor" : "acreedor"}">
        ${fmt(Math.abs(posicion))} ${posicion >= 0 ? "A PAGAR" : "A FAVOR"}
      </div>
    </div>
  </div>

  <div class="footer">
    Trans-Magg S.R.L. — Libro IVA ${nombreMes(mesAnio)} — Generado el ${fmtFecha(new Date())}
  </div>
</body>
</html>`
}

/**
 * generarPDFLibroIva: (asientos, mesAnio) -> Promise<Buffer>
 *
 * Dado los asientos IVA del período y el string YYYY-MM, genera el PDF del libro
 * usando Puppeteer y devuelve el buffer.
 *
 * Ejemplos:
 * generarPDFLibroIva(asientos, "2026-03") => Buffer (PDF A4)
 */
export async function generarPDFLibroIva(
  asientos: AsientoConRelaciones[],
  mesAnio: string
): Promise<Buffer> {
  const html = generarHTML(asientos, mesAnio)

  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  })

  try {
    const page = await browser.newPage()
    await page.setContent(html, { waitUntil: "networkidle0" })
    const pdf = await page.pdf({
      format: "A4",
      landscape: true,
      printBackground: true,
      margin: { top: "10mm", bottom: "10mm", left: "12mm", right: "12mm" },
    })
    return Buffer.from(pdf)
  } finally {
    await browser.close()
  }
}
