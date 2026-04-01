/**
 * API Route: GET /api/contabilidad/iva-ventas-alicuota/pdf
 * Genera el reporte IVA Ventas agrupado por Punto de Venta → Tipo Cbte → Alícuota en HTML imprimible.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
}

function periodoWhere(params: URLSearchParams): Record<string, unknown> {
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) return { periodo: `${anio}-${String(mes).padStart(2, "0")}` }
  if (desde || hasta) {
    const w: Record<string, string> = {}
    if (desde) w.gte = desde.slice(0, 7)
    if (hasta) w.lte = hasta.slice(0, 7)
    return { periodo: w }
  }
  return {}
}

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve HTML imprimible con IVA Ventas agrupado por ptoVenta → tipoCbte → alícuota.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const asientos = await prisma.asientoIva.findMany({
      where: { tipo: "VENTA", ...periodoWhere(searchParams) },
      include: {
        facturaEmitida: { select: { tipoCbte: true } },
      },
      orderBy: [{ periodo: "asc" }],
    })

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const periodoLabel =
      mes && anio
        ? `${String(mes).padStart(2, "0")}/${anio}`
        : desde && hasta
          ? `${desde} al ${hasta}`
          : "Todos los períodos"

    // Group: tipoCbte → alicuota
    const grupoMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
    for (const a of asientos) {
      const tipoCbte = a.tipoReferencia === "LIQUIDACION" ? "Cta Vta Liq Prod" : (a.facturaEmitida?.tipoCbte ?? "—")
      if (!grupoMap.has(tipoCbte)) grupoMap.set(tipoCbte, new Map())
      const byAlic = grupoMap.get(tipoCbte)!
      const prev = byAlic.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
      byAlic.set(a.alicuota, { neto: prev.neto + a.baseImponible, iva: prev.iva + a.montoIva, count: prev.count + 1 })
    }

    let totalNetoGeneral = 0
    let totalIvaGeneral = 0

    const secciones = Array.from(grupoMap.entries()).sort(([a], [b]) => a.localeCompare(b)).map(([tipoCbte, byAlic]) => {
        const filas = Array.from(byAlic.entries()).sort(([a], [b]) => a - b)
        const subtotalNeto = filas.reduce((acc, [, v]) => acc + v.neto, 0)
        const subtotalIva = filas.reduce((acc, [, v]) => acc + v.iva, 0)
        totalNetoGeneral += subtotalNeto
        totalIvaGeneral += subtotalIva
        const rows = filas.map(([alic, v]) => `<tr>
          <td class="indent">${alic}%</td>
          <td class="right">${v.count}</td>
          <td class="right">${fmt(v.neto)}</td>
          <td class="right">${fmt(v.iva)}</td>
        </tr>`).join("")
        return `
          <tr class="header"><td colspan="4">Tipo ${tipoCbte}</td></tr>
          ${rows}
          <tr class="subtotal"><td colspan="2" class="right">Subtotal ${tipoCbte}</td><td class="right">${fmt(subtotalNeto)}</td><td class="right">${fmt(subtotalIva)}</td></tr>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>IVA Ventas por Alícuota — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 12mm; }
    h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 10px; color: #555; margin-bottom: 12px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #e8e8e8; padding: 4px 6px; text-align: left; font-size: 9px; border-bottom: 2px solid #ccc; }
    td { padding: 3px 6px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .indent { padding-left: 24px; }
    .header td { font-weight: bold; background: #d1d5db; padding: 5px 6px; }
    .subheader td { font-style: italic; background: #f3f4f6; padding: 3px 12px; font-size: 9px; }
    .subtotal td { font-weight: bold; background: #f8f8f8; }
    .total-general { margin-top: 14px; padding: 8px 10px; background: #d1d5db; font-weight: bold; font-size: 11px; display: flex; justify-content: space-between; }
    .footer { margin-top: 18px; text-align: center; font-size: 9px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Transmagg — IVA Ventas por Alícuota</h1>
  <p class="sub">Período: ${periodoLabel} · ${asientos.length} asiento(s) · Generado: ${new Date().toLocaleDateString("es-AR")}</p>
  ${asientos.length === 0 ? "<p>Sin asientos para el período.</p>" : `
  <table>
    <thead><tr>
      <th>Alícuota / Tipo</th><th class="right">Cant.</th><th class="right">Neto Gravado</th><th class="right">IVA</th>
    </tr></thead>
    <tbody>${secciones}</tbody>
  </table>
  <div class="total-general"><span>TOTAL GENERAL</span><span>${fmt(totalNetoGeneral)} neto · ${fmt(totalIvaGeneral)} IVA</span></div>`}
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-ventas-alicuota/pdf", error)
  }
}
