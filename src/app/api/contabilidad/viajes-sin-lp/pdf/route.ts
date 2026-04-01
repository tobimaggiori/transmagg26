/**
 * API Route: GET /api/contabilidad/viajes-sin-lp/pdf
 * Genera el reporte de Viajes Facturados sin LP en HTML portrait imprimible.
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

function labelTipoCbte(tipoCbte: number): string {
  const map: Record<number, string> = {
    1: "Factura A",
    6: "Factura B",
    201: "Factura A MiPyme",



  }
  return map[tipoCbte] ?? `Tipo ${tipoCbte}`
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
    const registros = await prisma.viajeEnFactura.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        factura: { estado: { notIn: ["ANULADA", "BORRADOR"] } },
        viaje: {
          enLiquidaciones: {
            none: { liquidacion: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
          },
        },
      },
      include: {
        viaje: { include: { empresa: { select: { razonSocial: true } } } },
        factura: { select: { nroComprobante: true, tipoCbte: true } },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type Row = { fecha: Date; empresa: string; remito: string; nroComp: string; tipoComprobante: string; subtotal: number }
    const provinciasMap = new Map<string, Row[]>()

    for (const r of registros) {
      const provincia = r.provinciaOrigen ?? "SIN PROVINCIA"
      if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
      provinciasMap.get(provincia)!.push({
        fecha: r.fechaViaje,
        empresa: r.viaje.empresa.razonSocial,
        remito: r.remito ?? "—",
        nroComp: r.factura.nroComprobante ?? "—",
        tipoComprobante: labelTipoCbte(r.factura.tipoCbte),
        subtotal: r.subtotal,
      })
    }

    const provincias = Array.from(provinciasMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    let totalGeneral = 0

    const seccionesHtml = provincias.map(([nombre, rows]) => {
      const subtotalProv = rows.reduce((acc, r) => acc + r.subtotal, 0)
      totalGeneral += subtotalProv
      const filas = rows.map((r) => `<tr>
        <td class="nowrap">${fmtFecha(r.fecha)}</td>
        <td>${r.empresa}</td>
        <td>${r.remito}</td>
        <td class="right">${r.nroComp}</td>
        <td>${r.tipoComprobante}</td>
        <td class="right">${fmt(r.subtotal)}</td>
      </tr>`).join("")
      return `
        <div class="prov-header">PROVINCIA: ${nombre}</div>
        <table>
          <thead><tr>
            <th>Fecha</th><th>Empresa</th><th>Remito</th>
            <th class="right">Nro Comp.</th><th>Tipo</th><th class="right">S.Total</th>
          </tr></thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="subtotal">
              <td colspan="5" class="right">Total de la Provincia</td>
              <td class="right">${fmt(subtotalProv)}</td>
            </tr>
          </tfoot>
        </table>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Viajes sin LP — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 9px; color: #000; padding: 12mm; }
    h1 { font-size: 13px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 9px; color: #555; margin-bottom: 10px; }
    .prov-header { font-size: 10px; font-weight: bold; background: #d1d5db; padding: 4px 6px; margin: 10px 0 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; padding: 3px 5px; text-align: left; font-size: 8px; border-bottom: 1px solid #ccc; }
    td { padding: 2px 5px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .nowrap { white-space: nowrap; }
    .subtotal { font-weight: bold; background: #f8f8f8; }
    .total-general { margin-top: 12px; padding: 6px 8px; background: #d1d5db; font-weight: bold; font-size: 10px; display: flex; justify-content: space-between; }
    .footer { margin-top: 14px; text-align: center; font-size: 8px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Transmagg — Viajes Facturados sin Líquido Producto</h1>
  <p class="sub">Período: ${periodoLabel} · ${registros.length} viaje(s) · Generado: ${fmtFecha(new Date())}</p>
  ${provincias.length === 0 ? "<p>Sin viajes para el período seleccionado.</p>" : seccionesHtml}
  ${provincias.length > 0 ? `<div class="total-general"><span>TOTAL GENERAL</span><span>${fmt(totalGeneral)}</span></div>` : ""}
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/viajes-sin-lp/pdf", error)
  }
}
