/**
 * API Route: GET /api/contabilidad/iva-compras/pdf?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el Libro IVA Compras del período en formato HTML imprimible.
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

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params de período, devuelve HTML imprimible del Libro IVA Compras.
 * Existe para exportar el libro requerido para la declaración impositiva de IVA Compras.
 *
 * Ejemplos:
 * GET /api/contabilidad/iva-compras/pdf?mes=3&anio=2026 → HTML del Libro IVA Compras Marzo 2026
 * GET /api/contabilidad/iva-compras/pdf (sesión FLETERO) → 403
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const compras = await prisma.asientoIva.findMany({
      where: { tipo: "COMPRA", ...periodoWhere(searchParams) },
      include: {
        facturaProveedor: {
          select: {
            nroComprobante: true,
            tipoCbte: true,
            fechaCbte: true,
            proveedor: { select: { razonSocial: true, cuit: true } },
          },
        },
        facturaSeguro: {
          select: {
            id: true,
            nroComprobante: true,
            aseguradora: { select: { razonSocial: true } },
          },
        },
      },
      orderBy: [{ periodo: "asc" }],
    })

    const totalNeto = compras.reduce((acc, a) => acc + a.baseImponible, 0)
    const totalIva = compras.reduce((acc, a) => acc + a.montoIva, 0)

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
        const fp = a.facturaProveedor
        const fs = a.facturaSeguro
        const fecha = fp?.fechaCbte ? fmtFecha(fp.fechaCbte) : a.periodo
        const proveedor = fp?.proveedor.razonSocial ?? fs?.aseguradora.razonSocial ?? "—"
        const cbte = fp ? `${fp.tipoCbte} ${fp.nroComprobante}` : fs ? `Seguro ${fs.nroComprobante}` : "—"
        const cuit = fp?.proveedor.cuit ? fmtCuit(fp.proveedor.cuit) : "—"
        return `<tr>
          <td>${fecha}</td>
          <td>${proveedor}</td>
          <td class="mono">${cbte}</td>
          <td class="right">${fmt(a.baseImponible)}</td>
          <td class="right">${fmt(a.montoIva)} <small>(${a.alicuota}%)</small></td>
          <td class="mono">${cuit}</td>
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
  <h1>Transmagg — LIBRO IVA COMPRAS</h1>
  <p class="sub">Período: ${periodoLabel} · ${compras.length} asiento(s) · Generado: ${fmtFecha(new Date())}</p>
  ${
    compras.length === 0
      ? "<p>Sin asientos de IVA Compras para el período seleccionado.</p>"
      : `<table>
    <thead><tr>
      <th>Fecha</th><th>Proveedor / Fletero</th><th>Comprobante</th>
      <th class="right">Neto Gravado</th><th class="right">IVA</th><th>CUIT</th>
    </tr></thead>
    <tbody>${filas}</tbody>
    <tfoot>
      <tr class="total-row">
        <td colspan="3" class="right">TOTALES DEL PERÍODO</td>
        <td class="right">${fmt(totalNeto)}</td>
        <td class="right">${fmt(totalIva)}</td>
        <td></td>
      </tr>
    </tfoot>
  </table>`
  }
  <p class="footer">Transmagg — Sistema de gestión de transporte</p>
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
