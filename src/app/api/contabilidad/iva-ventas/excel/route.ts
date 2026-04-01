/**
 * API Route: GET /api/contabilidad/iva-ventas/excel?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el Libro IVA Ventas del período como archivo Excel (.xlsx).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

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
 * GET: NextRequest -> Promise<Response>
 *
 * Dado los query params de período, devuelve un archivo .xlsx con el Libro IVA Ventas.
 * Existe para exportar el libro contable de IVA Ventas en formato compatible con Excel.
 *
 * Ejemplos:
 * GET /api/contabilidad/iva-ventas/excel?mes=3&anio=2026 → iva-ventas-2026-03.xlsx
 * GET /api/contabilidad/iva-ventas/excel (sesión FLETERO) → 403
 */
export async function GET(request: NextRequest): Promise<Response> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const ventas = await prisma.asientoIva.findMany({
      where: { tipo: "VENTA", ...periodoWhere(searchParams) },
      include: {
        facturaEmitida: {
          select: {
            nroComprobante: true,
            tipoCbte: true,
            emitidaEn: true,
            empresa: { select: { razonSocial: true, cuit: true } },
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
      },
      orderBy: [{ periodo: "asc" }],
    })

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const periodoLabel =
      mes && anio
        ? `${anio}-${String(mes).padStart(2, "0")}`
        : "todos-los-periodos"

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("IVA Ventas")

    // Header row
    const headerRow = ws.addRow(["Fecha", "Empresa", "Comprobante", "Neto Gravado", "IVA", "Alícuota %", "CUIT"])
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }

    let totalNeto = 0
    let totalIva = 0

    for (const a of ventas) {
      const esLP = a.tipoReferencia === "LIQUIDACION"
      const fe = a.facturaEmitida
      const liq = a.liquidacion
      const fecha = esLP ? (liq?.grabadaEn ?? null) : (fe?.emitidaEn ?? null)
      const empresa = esLP ? (liq?.fletero.razonSocial ?? "—") : (fe?.empresa.razonSocial ?? "—")
      const cbte = esLP
        ? (liq?.ptoVenta != null && liq?.nroComprobante != null
            ? `LP ${String(liq.ptoVenta).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
            : "LP s/n")
        : (fe ? `${fe.tipoCbte} ${fe.nroComprobante ?? "s/n"}` : "—")
      const cuit = esLP
        ? (liq?.fletero.cuit ? fmtCuit(liq.fletero.cuit) : "—")
        : (fe?.empresa.cuit ? fmtCuit(fe.empresa.cuit) : "—")
      const row = ws.addRow([fecha, empresa, cbte, a.baseImponible, a.montoIva, a.alicuota, cuit])
      if (fecha) row.getCell(1).numFmt = "dd/mm/yyyy"
      row.getCell(4).numFmt = "#,##0.00"
      row.getCell(5).numFmt = "#,##0.00"
      totalNeto += a.baseImponible
      totalIva += a.montoIva
    }

    // Totals row
    const totalsRow = ws.addRow(["", "TOTALES DEL PERÍODO", "", totalNeto, totalIva, "", ""])
    totalsRow.font = { bold: true }
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
    totalsRow.getCell(4).numFmt = "#,##0.00"
    totalsRow.getCell(5).numFmt = "#,##0.00"

    ws.columns = [
      { width: 13 }, // Fecha
      { width: 35 }, // Empresa
      { width: 18 }, // Comprobante
      { width: 16 }, // Neto
      { width: 16 }, // IVA
      { width: 10 }, // Alícuota
      { width: 18 }, // CUIT
    ]

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iva-ventas-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-ventas/excel", error)
  }
}
