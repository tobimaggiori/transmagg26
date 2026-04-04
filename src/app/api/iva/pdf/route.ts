/**
 * API Route: GET /api/iva/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el libro de IVA (Ventas + Compras) del período en formato HTML imprimible.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import type { Rol } from "@/types"

function fmt(monto: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(monto)
}

function fmtFecha(fecha: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(fecha)
}

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los parámetros opcionales ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD (o ?mes=MM&anio=YYYY),
 * devuelve un documento HTML imprimible con el libro de IVA del período,
 * separado en sección IVA Ventas e IVA Compras con totales y posición.
 * Existe para generar el libro IVA mensual requerido para la declaración impositiva.
 *
 * Ejemplos:
 * GET /api/iva/pdf?mes=3&anio=2026 (sesión ADMIN_TRANSMAGG)
 * // => 200 (text/html) Libro IVA Marzo 2026
 * GET /api/iva/pdf?desde=2026-01-01&hasta=2026-03-31
 * // => 200 (text/html) Libro IVA Q1 2026
 * GET /api/iva/pdf (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")

  let periodoWhere: Record<string, unknown> = {}

  if (desde || hasta) {
    const desdeStr = desde ? desde.slice(0, 7) : undefined
    const hastaStr = hasta ? hasta.slice(0, 7) : undefined
    if (desdeStr && hastaStr) {
      periodoWhere = { periodo: { gte: desdeStr, lte: hastaStr } }
    } else if (desdeStr) {
      periodoWhere = { periodo: { gte: desdeStr } }
    } else if (hastaStr) {
      periodoWhere = { periodo: { lte: hastaStr } }
    }
  } else if (mes && anio) {
    const m = String(mes).padStart(2, "0")
    const periodo = `${anio}-${m}`
    periodoWhere = { periodo }
  }

  const asientos = await prisma.asientoIva.findMany({
    where: periodoWhere,
    include: {
      facturaEmitida: {
        select: { nroComprobante: true, emitidaEn: true, empresa: { select: { razonSocial: true } } },
      },
      facturaProveedor: {
        select: { nroComprobante: true, fechaCbte: true, proveedor: { select: { razonSocial: true } } },
      },
      liquidacion: {
        select: { nroComprobante: true, ptoVenta: true, grabadaEn: true, fletero: { select: { razonSocial: true } } },
      },
    },
    orderBy: [{ tipo: "asc" }, { periodo: "asc" }],
  })

  const ventas = asientos.filter((a) => a.tipo === "VENTA")
  const compras = asientos.filter((a) => a.tipo === "COMPRA")
  const totalVentas = sumarImportes(ventas.map(a => a.montoIva))
  const totalCompras = sumarImportes(compras.map(a => a.montoIva))
  const posicion = restarImportes(totalVentas, totalCompras)

  const filaVenta = (a: (typeof ventas)[0]) => {
    const esLP = a.tipoReferencia === "LIQUIDACION"
    const contraparte = esLP
      ? (a.liquidacion?.fletero.razonSocial ?? "—")
      : (a.facturaEmitida?.empresa.razonSocial ?? "—")
    const cbte = esLP
      ? (a.liquidacion?.ptoVenta != null && a.liquidacion?.nroComprobante != null
          ? `LP ${String(a.liquidacion.ptoVenta).padStart(4, "0")}-${String(a.liquidacion.nroComprobante).padStart(8, "0")}`
          : "LP s/n")
      : (a.facturaEmitida?.nroComprobante ?? "—")
    return `<tr>
      <td>${a.periodo}</td>
      <td>${contraparte}</td>
      <td>${cbte}</td>
      <td class="right">${fmt(a.baseImponible)}</td>
      <td class="right">${a.alicuota}%</td>
      <td class="right">${fmt(a.montoIva)}</td>
    </tr>`
  }

  const filaCompra = (a: (typeof compras)[0]) => `
    <tr>
      <td>${a.periodo}</td>
      <td>${a.facturaProveedor?.proveedor.razonSocial ?? "—"}</td>
      <td>${a.facturaProveedor?.nroComprobante ?? "—"}</td>
      <td class="right">${fmt(a.baseImponible)}</td>
      <td class="right">${a.alicuota}%</td>
      <td class="right">${fmt(a.montoIva)}</td>
    </tr>`

  const tituloFiltro = mes && anio
    ? `${String(mes).padStart(2, "0")}/${anio}`
    : desde && hasta
      ? `${desde} al ${hasta}`
      : "Todos los períodos"

  const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro IVA — ${tituloFiltro}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; font-size: 11px; color: #000; padding: 15mm; }
    h1 { font-size: 16px; font-weight: bold; margin-bottom: 2px; }
    .subtitle { font-size: 12px; color: #555; margin-bottom: 16px; }
    h2 { font-size: 13px; font-weight: bold; margin: 20px 0 8px; padding: 4px 8px; background: #f0f0f0; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 8px; }
    th { background: #e8e8e8; padding: 5px 6px; text-align: left; font-size: 10px; border-bottom: 2px solid #ccc; }
    td { padding: 4px 6px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .totales-row { font-weight: bold; background: #f8f8f8; }
    .resumen { display: flex; gap: 24px; margin: 20px 0; }
    .resumen-item { border: 1px solid #ccc; border-radius: 4px; padding: 10px 16px; min-width: 160px; }
    .resumen-label { font-size: 10px; color: #777; text-transform: uppercase; }
    .resumen-valor { font-size: 16px; font-weight: bold; }
    .deudor { color: #dc2626; }
    .acreedor { color: #16a34a; }
    .footer { margin-top: 30px; text-align: center; font-size: 10px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Libro IVA</h1>
  <p class="subtitle">Transmagg — Período: ${tituloFiltro}</p>

  <div class="resumen">
    <div class="resumen-item">
      <div class="resumen-label">IVA Ventas</div>
      <div class="resumen-valor">${fmt(totalVentas)}</div>
    </div>
    <div class="resumen-item">
      <div class="resumen-label">IVA Compras</div>
      <div class="resumen-valor">${fmt(totalCompras)}</div>
    </div>
    <div class="resumen-item">
      <div class="resumen-label">Posición IVA</div>
      <div class="resumen-valor ${posicion >= 0 ? "deudor" : "acreedor"}">${fmt(posicion)}</div>
    </div>
  </div>

  <h2>IVA Ventas (${ventas.length} asientos)</h2>
  ${ventas.length === 0 ? "<p>Sin asientos de ventas en el período.</p>" : `
  <table>
    <thead><tr>
      <th>Período</th><th>Empresa</th><th>Comprobante</th>
      <th class="right">Base</th><th class="right">Alíc.</th><th class="right">IVA</th>
    </tr></thead>
    <tbody>
      ${ventas.map(filaVenta).join("")}
      <tr class="totales-row">
        <td colspan="5">TOTAL IVA VENTAS</td>
        <td class="right">${fmt(totalVentas)}</td>
      </tr>
    </tbody>
  </table>`}

  <h2>IVA Compras (${compras.length} asientos)</h2>
  ${compras.length === 0 ? "<p>Sin asientos de compras en el período.</p>" : `
  <table>
    <thead><tr>
      <th>Período</th><th>Proveedor</th><th>Comprobante</th>
      <th class="right">Base</th><th class="right">Alíc.</th><th class="right">IVA</th>
    </tr></thead>
    <tbody>
      ${compras.map(filaCompra).join("")}
      <tr class="totales-row">
        <td colspan="5">TOTAL IVA COMPRAS</td>
        <td class="right">${fmt(totalCompras)}</td>
      </tr>
    </tbody>
  </table>`}

  <div class="footer">Transmagg — Generado el ${fmtFecha(new Date())}</div>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

  return new NextResponse(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  })
}
