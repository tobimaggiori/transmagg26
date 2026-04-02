/**
 * API Route: GET /api/contabilidad/iva-compras/excel?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el Libro IVA Compras del período como archivo Excel (.xlsx).
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
 * Dado los query params de período, devuelve un archivo .xlsx con el Libro IVA Compras.
 * Existe para exportar el libro contable de IVA Compras en formato compatible con Excel.
 *
 * Ejemplos:
 * GET /api/contabilidad/iva-compras/excel?mes=3&anio=2026 → iva-compras-2026-03.xlsx
 * GET /api/contabilidad/iva-compras/excel (sesión FLETERO) → 403
 */
export async function GET(request: NextRequest): Promise<Response> {
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

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const periodoLabel =
      mes && anio
        ? `${anio}-${String(mes).padStart(2, "0")}`
        : "todos-los-periodos"

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("IVA Compras")

    const headerRow = ws.addRow(["Fecha", "Proveedor / Fletero", "Comprobante", "Neto Gravado", "IVA", "Alícuota %", "CUIT"])
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }

    let totalNeto = 0
    let totalIva = 0

    for (const a of compras) {
      const fp = a.facturaProveedor
      const fs = a.facturaSeguro
      const fecha = fp?.fechaCbte ?? null
      const proveedor = fp?.proveedor.razonSocial ?? fs?.aseguradora.razonSocial ?? "—"
      const cbte = fp ? `${fp.tipoCbte} ${fp.nroComprobante}` : fs ? `Seguro ${fs.nroComprobante}` : "—"
      const cuit = fp?.proveedor.cuit ? fmtCuit(fp.proveedor.cuit) : "—"
      const row = ws.addRow([fecha, proveedor, cbte, a.baseImponible, a.montoIva, a.alicuota, cuit])
      if (fecha) row.getCell(1).numFmt = "dd/mm/yyyy"
      row.getCell(4).numFmt = "#,##0.00"
      row.getCell(5).numFmt = "#,##0.00"
      totalNeto += a.baseImponible
      totalIva += a.montoIva
    }

    const totalsRow = ws.addRow(["", "TOTALES DEL PERÍODO", "", totalNeto, totalIva, "", ""])
    totalsRow.font = { bold: true }
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
    totalsRow.getCell(4).numFmt = "#,##0.00"
    totalsRow.getCell(5).numFmt = "#,##0.00"

    ws.columns = [
      { width: 13 },
      { width: 35 },
      { width: 18 },
      { width: 16 },
      { width: 16 },
      { width: 10 },
      { width: 18 },
    ]

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iva-compras-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-compras/excel", error)
  }
}
