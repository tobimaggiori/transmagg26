/**
 * API Route: GET /api/contabilidad/iva-ventas/excel?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el Libro IVA Ventas del período como archivo Excel (.xlsx).
 *
 * Usa los mismos helpers (datosAsientoVenta) que la pantalla y el PDF.
 */

import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { datosAsientoVenta } from "@/lib/iva-portal/display-asientos"

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

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const periodoLabel =
      mes && anio
        ? `${anio}-${String(mes).padStart(2, "0")}`
        : "todos-los-periodos"

    const wb = new ExcelJS.Workbook()
    wb.creator = "Trans-Magg S.R.L."
    const ws = wb.addWorksheet("IVA Ventas")

    const headerRow = ws.addRow(["Fecha", "Empresa", "CUIT", "Tipo cbte.", "Número", "Neto Gravado", "IVA", "Alícuota %"])
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }

    let totalNeto = 0
    let totalIva = 0

    for (const a of ventas) {
      const d = datosAsientoVenta(a)
      const cuit = d.cuit ? fmtCuit(d.cuit) : "—"
      const row = ws.addRow([d.fecha, d.empresa, cuit, d.tipoCbte, d.nroCbte, a.baseImponible, a.montoIva, a.alicuota])
      if (d.fecha) row.getCell(1).numFmt = "dd/mm/yyyy"
      row.getCell(6).numFmt = "#,##0.00"
      row.getCell(7).numFmt = "#,##0.00"
      totalNeto += Number(a.baseImponible)
      totalIva += Number(a.montoIva)
    }

    const totalsRow = ws.addRow(["", "TOTALES DEL PERÍODO", "", "", "", totalNeto, totalIva, ""])
    totalsRow.font = { bold: true }
    totalsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
    totalsRow.getCell(6).numFmt = "#,##0.00"
    totalsRow.getCell(7).numFmt = "#,##0.00"

    ws.columns = [
      { width: 13 }, // Fecha
      { width: 35 }, // Empresa
      { width: 18 }, // CUIT
      { width: 24 }, // Tipo cbte.
      { width: 16 }, // Número
      { width: 16 }, // Neto
      { width: 16 }, // IVA
      { width: 10 }, // Alícuota
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
