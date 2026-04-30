/**
 * API Route: GET /api/contabilidad/iva-compras/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el Libro IVA Compras del período en formato HTML imprimible.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 *
 * Usa los mismos helpers (datosAsientoCompra) que la pantalla del Libro IVA
 * para que el PDF muestre exactamente lo mismo que ve el operador.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes } from "@/lib/money"
import { datosAsientoCompra } from "@/lib/iva-portal/display-asientos"

function fmt(n: number) {
  return new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(n)
}
function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}
function fmtCuit(cuit: string) {
  if (cuit.length === 11) return `${cuit.slice(0, 2)}-${cuit.slice(2, 10)}-${cuit.slice(10)}`
  return cuit
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

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const compras = await prisma.asientoIva.findMany({
      where: { tipo: "COMPRA", ...periodoWhere(searchParams) },
      include: {
        facturaEmitida: {
          select: {
            nroComprobante: true,
            tipoCbte: true,
            ptoVenta: true,
            emitidaEn: true,
            empresa: { select: { razonSocial: true, cuit: true } },
          },
        },
        facturaProveedor: {
          select: {
            nroComprobante: true,
            ptoVenta: true,
            tipoCbte: true,
            fechaCbte: true,
            proveedor: { select: { razonSocial: true, cuit: true } },
          },
        },
        liquidacion: {
          select: {
            nroComprobante: true,
            ptoVenta: true,
            grabadaEn: true,
            fletero: { select: { razonSocial: true, cuit: true } },
          },
        },
        notaCreditoDebito: {
          select: {
            tipo: true,
            tipoCbte: true,
            ptoVenta: true,
            nroComprobante: true,
            nroComprobanteExterno: true,
            fechaComprobanteExterno: true,
            emisorExterno: true,
            creadoEn: true,
            factura: { select: { empresa: { select: { razonSocial: true, cuit: true } } } },
            facturaProveedor: { select: { proveedor: { select: { razonSocial: true, cuit: true } } } },
            liquidacion: { select: { fletero: { select: { razonSocial: true, cuit: true } } } },
          },
        },
        facturaSeguro: {
          select: {
            nroComprobante: true,
            tipoComprobante: true,
            fecha: true,
            aseguradora: { select: { razonSocial: true, cuit: true } },
          },
        },
      },
      orderBy: [{ periodo: "asc" }],
    })

    const totalNeto = sumarImportes(compras.map(a => a.baseImponible))
    const totalIva = sumarImportes(compras.map(a => a.montoIva))

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

    const filas = compras
      .map((a) => {
        const d = datosAsientoCompra(a)
        const fechaStr = d.fecha ? fmtFecha(d.fecha) : a.periodo
        const cuitStr = d.cuit ? fmtCuit(d.cuit) : "—"
        return `<tr>
          <td>${fechaStr}</td>
          <td>${d.empresa}</td>
          <td class="mono">${cuitStr}</td>
          <td>${d.tipoCbte}</td>
          <td class="mono">${d.nroCbte}</td>
          <td class="right">${fmt(a.baseImponible)}</td>
          <td class="right">${fmt(a.montoIva)} <small>(${a.alicuota}%)</small></td>
        </tr>`
      })
      .join("")

    const html = `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Libro IVA Compras — ${periodoLabel}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: Arial, sans-serif; font-size: 10px; color: #000; padding: 12mm; }
    h1 { font-size: 15px; font-weight: bold; margin-bottom: 2px; }
    .sub { font-size: 11px; color: #555; margin-bottom: 14px; }
    table { width: 100%; border-collapse: collapse; }
    th { background: #e8e8e8; padding: 4px 6px; text-align: left; font-size: 9px; border-bottom: 2px solid #ccc; }
    td { padding: 3px 6px; border-bottom: 1px solid #eee; }
    .right { text-align: right; }
    .mono { font-family: monospace; }
    .total-row { font-weight: bold; background: #f8f8f8; }
    small { color: #777; }
    .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #888; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <h1>Libro de IVA Trans-Magg S.R.L. — COMPRAS</h1>
  <p class="sub">Período: ${periodoLabel} · ${compras.length} asiento(s) · Generado: ${fmtFecha(new Date())}</p>
  ${
    compras.length === 0
      ? "<p>Sin asientos de IVA Compras para el período seleccionado.</p>"
      : `<table>
    <thead><tr>
      <th>Fecha</th><th>Proveedor</th><th>CUIT</th>
      <th>Tipo cbte.</th><th>Número</th>
      <th class="right">Neto Gravado</th><th class="right">IVA</th>
    </tr></thead>
    <tbody>${filas}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="5" class="right">TOTALES DEL PERÍODO</td>
        <td class="right">${fmt(totalNeto)}</td>
        <td class="right">${fmt(totalIva)}</td>
      </tr>
    </tfoot>
  </table>`
  }
  <p class="footer">Trans-Magg S.R.L. — Sistema de gestión</p>
  <script>window.onload = function() { window.print() }</script>
</body>
</html>`

    return new NextResponse(html, {
      headers: { "Content-Type": "text/html; charset=utf-8" },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-compras/pdf", error)
  }
}
