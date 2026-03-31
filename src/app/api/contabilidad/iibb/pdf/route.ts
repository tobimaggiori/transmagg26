/**
 * API Route: GET /api/contabilidad/iibb/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el reporte IIBB "Listado de Viajes por Provincia" en formato HTML imprimible.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
}
function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
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
  const hoy = new Date()
  const m = String(hoy.getMonth() + 1).padStart(2, "0")
  return { periodo: `${hoy.getFullYear()}-${m}` }
}

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params de período, devuelve HTML imprimible del reporte IIBB
 * agrupado por provincia con subtotales y total general.
 * Existe para exportar el listado de viajes por provincia requerido para IIBB.
 *
 * Ejemplos:
 * GET /api/contabilidad/iibb/pdf?mes=3&anio=2026 → HTML agrupado por provincia Marzo 2026
 * GET /api/contabilidad/iibb/pdf (sesión FLETERO) → 403
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const asientos = await prisma.asientoIibb.findMany({
      where: periodoWhere(searchParams),
      include: {
        viajeEnLiquidacion: {
          include: {
            viaje: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
        viajeEnFactura: {
          include: {
            factura: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
      },
      orderBy: [{ provincia: "asc" }, { periodo: "asc" }],
    })

    // Group by province
    const gruposMap = new Map<string, { filas: { fecha: Date | null; empresa: string; mercaderia: string; procedencia: string; subtotal: number }[]; total: number }>()
    for (const a of asientos) {
      const vel = a.viajeEnLiquidacion
      const vef = a.viajeEnFactura
      const fecha = vef?.fechaViaje ?? vel?.fechaViaje ?? null
      const empresa = vef?.factura.empresa.razonSocial ?? vel?.viaje.empresa.razonSocial ?? "—"
      const mercaderia = vef?.mercaderia ?? vel?.mercaderia ?? "—"
      const procedencia = vef?.procedencia ?? vel?.procedencia ?? "—"
      if (!gruposMap.has(a.provincia)) gruposMap.set(a.provincia, { filas: [], total: 0 })
      const g = gruposMap.get(a.provincia)!
      g.filas.push({ fecha, empresa, mercaderia, procedencia, subtotal: a.montoIngreso })
      g.total += a.montoIngreso
    }
    const grupos = Array.from(gruposMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    const totalGeneral = grupos.reduce((acc, [, g]) => acc + g.total, 0)

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const desde = searchParams.get("desde")
    const hasta = searchParams.get("hasta")
    const periodoLabel =
      mes && anio
        ? `${String(mes).padStart(2, "0")}/${anio}`
        : desde && hasta
          ? `${desde} al ${hasta}`
          : `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`

    const seccionesProvincia = grupos
      .map(([provincia, g]) => {
        const filas = g.filas
          .map(
            (f) => `<tr>
              <td>${f.fecha ? fmtFecha(f.fecha) : "—"}</td>
              <td>${f.empresa}</td>
              <td>${f.mercaderia}</td>
              <td>${f.procedencia}</td>
              <td class="right">${fmt(f.subtotal)}</td>
            </tr>`
          )
          .join("")
        return `
          <div class="provincia-header">PROVINCIA: ${provincia}</div>
          <table>
            <thead><tr>
              <th>Fecha</th><th>Empresa</th><th>Mercadería</th><th>Procedencia</th><th class="right">SubTotal</th>
            </tr></thead>
            <tbody>${filas}</tbody>
            <tfoot>
              <tr class="subtotal-row">
                <td colspan="4" class="right">Total de la Provincia</td>
                <td class="right">${fmt(g.total)}</td>
              </tr>
            </tfoot>
          </table>`
      })
      .join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>IIBB — Listado por Provincia — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 12mm; }
    h1 { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #555; margin-bottom: 14px; }
    .provincia-header { font-size: 11px; font-weight: bold; background: #e8e8e8; padding: 5px 6px; margin: 14px 0 4px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    th { background: #f0f0f0; padding: 3px 6px; text-align: left; font-size: 9px; border-bottom: 1px solid #ccc; }
    td { padding: 3px 6px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .subtotal-row { font-weight: bold; background: #f8f8f8; }
    .total-general { margin-top: 16px; padding: 8px 12px; background: #e8e8e8; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Transmagg — IIBB — Listado de Viajes por Provincia</h1>
  <p class="sub">Período: ${periodoLabel} · ${asientos.length} viaje(s) · Generado: ${fmtFecha(new Date())}</p>
  ${grupos.length === 0 ? "<p>Sin asientos de IIBB para el período seleccionado.</p>" : seccionesProvincia}
  ${grupos.length > 0 ? `<div class="total-general"><span>TOTAL GENERAL</span><span>${fmt(totalGeneral)}</span></div>` : ""}
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iibb/pdf", error)
  }
}
