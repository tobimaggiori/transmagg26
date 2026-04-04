/**
 * API Route: GET /api/contabilidad/gastos/pdf
 * Genera el reporte de Detalle de Gastos por Concepto en formato HTML imprimible.
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

function periodoFilter(params: URLSearchParams) {
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) {
    const inicio = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const fin = new Date(inicio)
    fin.setMonth(fin.getMonth() + 1)
    return { desde: inicio, hasta: fin }
  }
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  if (desde || hasta) {
    return {
      desde: desde ? new Date(`${desde}T00:00:00.000Z`) : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59.999Z`) : undefined,
    }
  }
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde: inicio, hasta: fin }
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = periodoFilter(searchParams)

  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const desdeParam = searchParams.get("desde")
  const hastaParam = searchParams.get("hasta")
  const periodoLabel =
    mes && anio
      ? `${String(mes).padStart(2, "0")}/${anio}`
      : desdeParam && hastaParam
        ? `${desdeParam} al ${hastaParam}`
        : `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`

  try {
    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        fechaCbte: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { proveedor: { select: { razonSocial: true } } },
      orderBy: { fechaCbte: "asc" },
    })

    const liquidaciones = await prisma.liquidacion.findMany({
      where: {
        estado: "EMITIDA",
        grabadaEn: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { fletero: { select: { razonSocial: true } } },
      orderBy: { grabadaEn: "asc" },
    })

    const rubrosMap = new Map<string, { descripcion: string; monto: number; fecha: Date | null }[]>()

    for (const f of facturas) {
      const rubro = f.concepto ?? "SIN CLASIFICAR"
      if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
      rubrosMap.get(rubro)!.push({
        descripcion: `${f.proveedor.razonSocial} — ${f.tipoCbte} ${f.nroComprobante}`,
        monto: f.total,
        fecha: f.fechaCbte,
      })
    }

    for (const liq of liquidaciones) {
      const rubro = "VIAJES CONTRATADOS"
      if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
      rubrosMap.get(rubro)!.push({
        descripcion: `Liquidación ${liq.nroComprobante ? String(liq.nroComprobante).padStart(8, "0") : "s/n"} — ${liq.fletero.razonSocial}`,
        monto: liq.total,
        fecha: liq.grabadaEn,
      })
    }

    const rubros = Array.from(rubrosMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    const totalGeneral = sumarImportes(rubros.map(([, items]) => sumarImportes(items.map(i => i.monto))))
    const totalItems = facturas.length + liquidaciones.length

    const seccionesHtml = rubros.map(([nombre, items]) => {
      const subtotal = sumarImportes(items.map(i => i.monto))
      const filas = items.map((i) => `<tr>
        <td>${i.fecha ? fmtFecha(i.fecha) : "—"}</td>
        <td>${i.descripcion}</td>
        <td class="right">${fmt(i.monto)}</td>
      </tr>`).join("")
      return `
        <div class="rubro-header">${nombre.replace(/_/g, " ")}</div>
        <table>
          <thead><tr>
            <th>Fecha</th><th>Descripción</th><th class="right">Monto</th>
          </tr></thead>
          <tbody>${filas}</tbody>
          <tfoot>
            <tr class="subtotal-row">
              <td colspan="2" class="right">Total ${nombre.replace(/_/g, " ")}</td>
              <td class="right">${fmt(subtotal)}</td>
            </tr>
          </tfoot>
        </table>`
    }).join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Detalle de Gastos — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 12mm; }
    h1 { font-size: 14px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 10px; color: #555; margin-bottom: 12px; }
    .rubro-header { font-size: 11px; font-weight: bold; background: #e8e8e8; padding: 5px 6px; margin: 12px 0 3px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #f0f0f0; padding: 3px 6px; text-align: left; font-size: 9px; border-bottom: 1px solid #ccc; }
    td { padding: 3px 6px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .subtotal-row { font-weight: bold; background: #f8f8f8; }
    .total-general { margin-top: 14px; padding: 8px 10px; background: #e8e8e8; font-weight: bold; font-size: 12px; display: flex; justify-content: space-between; }
    .footer { margin-top: 18px; text-align: center; font-size: 9px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Transmagg — Detalle de Gastos por Concepto</h1>
  <p class="sub">Período: ${periodoLabel} · ${totalItems} ítem(s) · Generado: ${fmtFecha(new Date())}</p>
  ${rubros.length === 0 ? "<p>Sin gastos para el período seleccionado.</p>" : seccionesHtml}
  ${rubros.length > 0 ? `<div class="total-general"><span>TOTAL GENERAL</span><span>${fmt(totalGeneral)}</span></div>` : ""}
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/gastos/pdf", error)
  }
}
