/**
 * API Route: GET /api/contabilidad/iva-ventas-alicuota/excel
 * Genera IVA Ventas agrupado por Punto de Venta → Tipo Cbte → Alícuota como Excel.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

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

export async function GET(request: NextRequest): Promise<Response> {
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
    const periodoLabel = mes && anio ? `${anio}-${String(mes).padStart(2, "0")}` : "todos"

    // Group: tipoCbte → alicuota
    const grupoMap = new Map<string, Map<number, { neto: number; iva: number; count: number }>>()
    for (const a of asientos) {
      const tipoCbte = a.tipoReferencia === "LIQUIDACION" ? "Cta Vta Liq Prod" : (a.facturaEmitida?.tipoCbte ?? "—")
      if (!grupoMap.has(tipoCbte)) grupoMap.set(tipoCbte, new Map())
      const byAlic = grupoMap.get(tipoCbte)!
      const prev = byAlic.get(a.alicuota) ?? { neto: 0, iva: 0, count: 0 }
      byAlic.set(a.alicuota, { neto: prev.neto + a.baseImponible, iva: prev.iva + a.montoIva, count: prev.count + 1 })
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("Ventas por Alícuota")
    ws.columns = [{ width: 28 }, { width: 12 }, { width: 18 }, { width: 18 }]

    const headerRow = ws.addRow(["Agrupación", "Cant.", "Neto Gravado", "IVA"])
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }

    let totalNeto = 0
    let totalIva = 0

    for (const [tipoCbte, byAlic] of Array.from(grupoMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const tipoRow = ws.addRow([`Tipo comprobante: ${tipoCbte}`, "", "", ""])
      tipoRow.font = { bold: true }
      tipoRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }

      let subNeto = 0
      let subIva = 0

      for (const [alic, v] of Array.from(byAlic.entries()).sort(([a], [b]) => a - b)) {
        const row = ws.addRow([`  ${alic}%`, v.count, v.neto, v.iva])
        row.getCell(3).numFmt = "#,##0.00"
        row.getCell(4).numFmt = "#,##0.00"
        subNeto += v.neto
        subIva += v.iva
      }

      const subRow = ws.addRow([`Subtotal ${tipoCbte}`, "", subNeto, subIva])
      subRow.font = { bold: true }
      subRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
      subRow.getCell(3).numFmt = "#,##0.00"
      subRow.getCell(4).numFmt = "#,##0.00"
      ws.addRow([])
      totalNeto += subNeto
      totalIva += subIva
    }

    const totalRow = ws.addRow(["TOTAL GENERAL", "", totalNeto, totalIva])
    totalRow.font = { bold: true, size: 12 }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
    totalRow.getCell(3).numFmt = "#,##0.00"
    totalRow.getCell(4).numFmt = "#,##0.00"

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iva-ventas-alicuota-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-ventas-alicuota/excel", error)
  }
}
