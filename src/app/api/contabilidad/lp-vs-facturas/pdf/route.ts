/**
 * API Route: GET /api/contabilidad/lp-vs-facturas/pdf
 * Genera el reporte LP vs Facturas en formato HTML landscape imprimible.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes } from "@/lib/money"

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
}
function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

function parsePeriodo(params: URLSearchParams): { desde: Date; hasta: Date } {
  const mes = params.get("mes")
  const anio = params.get("anio")
  const desdeParam = params.get("desde")
  const hastaParam = params.get("hasta")

  if (mes && anio) {
    const desde = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const hasta = new Date(desde)
    hasta.setMonth(hasta.getMonth() + 1)
    return { desde, hasta }
  }
  if (desdeParam || hastaParam) {
    const desde = desdeParam ? new Date(`${desdeParam}T00:00:00.000Z`) : new Date("2000-01-01")
    const hasta = hastaParam ? new Date(`${hastaParam}T23:59:59.999Z`) : new Date("2099-12-31")
    return { desde, hasta }
  }
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde, hasta }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const desdeParam = searchParams.get("desde")
  const hastaParam = searchParams.get("hasta")
  const periodoLabel =
    mes && anio
      ? `01/${String(mes).padStart(2, "0")}/${anio} al ${new Date(Number(anio), Number(mes), 0).getDate().toString().padStart(2, "0")}/${String(mes).padStart(2, "0")}/${anio}`
      : desdeParam && hastaParam
        ? `${desdeParam} al ${hastaParam}`
        : `${fmtFecha(desde)} al ${fmtFecha(new Date(hasta.getTime() - 1))}`

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        enLiquidaciones: {
          some: {},
        },
        enFacturas: {
          some: {},
        },
      },
      include: {
        empresa: { select: { razonSocial: true } },
        enLiquidaciones: {
          include: { liquidacion: { select: { nroComprobante: true } } },
          orderBy: { liquidacion: { grabadaEn: "asc" } },
          take: 1,
        },
        enFacturas: {
          include: { factura: { select: { nroComprobante: true } } },
          orderBy: { factura: { emitidaEn: "asc" } },
          take: 1,
        },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type Row = { remito: string; nroLP: string; netoLP: number; nroFact: string; netoFact: number; diferencia: number; empresa: string }
    const provinciasMap = new Map<string, Row[]>()

    for (const v of viajes) {
      const vel = v.enLiquidaciones[0]
      const vef = v.enFacturas[0]
      if (!vel || !vef) continue
      const provincia = v.provinciaOrigen ?? "SIN PROVINCIA"
      if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
      const netoLP = vel.subtotal
      const netoFact = vef.subtotal
      provinciasMap.get(provincia)!.push({
        remito: v.remito ?? "—",
        nroLP: vel.liquidacion.nroComprobante ? String(vel.liquidacion.nroComprobante) : "—",
        netoLP,
        nroFact: vef.factura.nroComprobante ?? "—",
        netoFact,
        diferencia: netoFact - netoLP,
        empresa: v.empresa.razonSocial,
      })
    }

    const provincias = Array.from(provinciasMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    let totalDiferenciaGeneral = 0
    let totalNetoLPGeneral = 0
    let totalNetoFactGeneral = 0

    const seccionesHtml = provincias.map(([nombre, rows]) => {
      const totalLP = sumarImportes(rows.map(r => r.netoLP))
      const totalFact = sumarImportes(rows.map(r => r.netoFact))
      const totalDif = sumarImportes(rows.map(r => r.diferencia))
      totalNetoLPGeneral += totalLP
      totalNetoFactGeneral += totalFact
      totalDiferenciaGeneral += totalDif

      const filas = rows.map((r) => `<tr>
        <td>${r.remito}</td>
        <td class="right">${r.nroLP}</td>
        <td class="right">${fmt(r.netoLP)}</td>
        <td class="right">${r.nroFact}</td>
        <td class="right">${fmt(r.netoFact)}</td>
        <td class="right ${r.diferencia !== 0 ? "dif" : ""}">${fmt(r.diferencia)}</td>
        <td>${r.empresa}</td>
      </tr>`).join("")

      return `
        <div class="prov-header">PROVINCIA: ${nombre}</div>
        <table>
          <thead><tr>
            <th>Remito</th><th class="right">Nro LP</th><th class="right">Neto LP</th>
            <th class="right">Nro Fact</th><th class="right">Neto Fact</th>
            <th class="right">Diferencia</th><th>Empresa</th>
          </tr></thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="subtotal">
              <td colspan="2" class="right">Total Provincia</td>
              <td class="right">${fmt(totalLP)}</td>
              <td></td>
              <td class="right">${fmt(totalFact)}</td>
              <td class="right ${totalDif !== 0 ? "dif" : ""}">${fmt(totalDif)}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Conciliación de Viajes — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    @page { size: A4 landscape; margin: 10mm; }
    body { font-family: Arial, sans-serif; font-size: 9px; color: #000; padding: 0; }
    h1 { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 9px; color: #555; margin-bottom: 10px; }
    .prov-header { font-size: 10px; font-weight: bold; background: #d1d5db; padding: 4px 6px; margin: 10px 0 3px; }
    table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
    th { background: #f0f0f0; padding: 3px 5px; text-align: left; font-size: 8px; border-bottom: 1px solid #ccc; }
    td { padding: 2px 5px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .subtotal { font-weight: bold; background: #f8f8f8; }
    .dif { color: #b91c1c; }
    .total-general { margin-top: 12px; padding: 6px 8px; background: #d1d5db; font-weight: bold; font-size: 10px; }
    .footer { margin-top: 14px; text-align: center; font-size: 8px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Transmagg — Compara Viajes Líquido Producto vs Facturas</h1>
  <p class="sub">Período: ${periodoLabel} · ${viajes.length} viaje(s) · Generado: ${fmtFecha(new Date())}</p>
  ${provincias.length === 0 ? "<p>Sin datos para el período seleccionado.</p>" : seccionesHtml}
  ${provincias.length > 0 ? `
  <div class="total-general">
    TOTAL GENERAL — Neto LP: ${fmt(totalNetoLPGeneral)} &nbsp;|&nbsp;
    Neto Fact: ${fmt(totalNetoFactGeneral)} &nbsp;|&nbsp;
    Diferencia: ${fmt(totalDiferenciaGeneral)}
  </div>` : ""}
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/lp-vs-facturas/pdf", error)
  }
}
