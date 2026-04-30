/**
 * API Route: GET /api/contabilidad/viajes-sin-lp/excel
 * Genera el reporte de Viajes Facturados sin LP como archivo Excel.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

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

function fmtComprobante(ptoVenta: number | null | undefined, nro: string | null | undefined): string {
  if (!nro) return "—"
  const pv = String(ptoVenta ?? 1).padStart(4, "0")
  const n = String(nro).padStart(8, "0")
  return `${pv}-${n}`
}

export async function GET(request: NextRequest): Promise<Response> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const periodoLabel = mes && anio ? `${anio}-${String(mes).padStart(2, "0")}` : "todos"

  try {
    const registros = await prisma.viajeEnFactura.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        viaje: {
          enLiquidaciones: {
            none: {},
          },
        },
      },
      include: {
        viaje: { include: { empresa: { select: { razonSocial: true } } } },
        factura: { select: { ptoVenta: true, nroComprobante: true } },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type Row = { fecha: Date; empresa: string; comprobante: string; subtotal: number }
    const provinciasMap = new Map<string, Row[]>()

    for (const r of registros) {
      const provincia = r.provinciaOrigen ?? "SIN PROVINCIA"
      if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
      provinciasMap.get(provincia)!.push({
        fecha: r.fechaViaje,
        empresa: r.viaje.empresa.razonSocial,
        comprobante: fmtComprobante(r.factura.ptoVenta, r.factura.nroComprobante),
        subtotal: r.subtotal,
      })
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("Viajes propios")
    ws.columns = [
      { width: 13 }, // Fecha
      { width: 40 }, // Empresa
      { width: 18 }, // Comprobante
      { width: 18 }, // Subtotal
    ]

    let totalGeneral = 0

    for (const [provincia, rows] of Array.from(provinciasMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const provRow = ws.addRow([`PROVINCIA: ${provincia}`, "", "", ""])
      provRow.font = { bold: true }
      provRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }

      const hRow = ws.addRow(["Fecha", "Empresa", "Comprobante", "Subtotal"])
      hRow.font = { bold: true, italic: true }
      hRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }

      let subtotalProv = 0
      for (const r of rows) {
        const row = ws.addRow([r.fecha, r.empresa, r.comprobante, r.subtotal])
        row.getCell(1).numFmt = "dd/mm/yyyy"
        row.getCell(4).numFmt = "#,##0.00"
        subtotalProv += r.subtotal
      }

      const subRow = ws.addRow(["", "", "Total de la Provincia", subtotalProv])
      subRow.font = { bold: true }
      subRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
      subRow.getCell(4).numFmt = "#,##0.00"
      ws.addRow([])
      totalGeneral += subtotalProv
    }

    const totalRow = ws.addRow(["", "", "TOTAL GENERAL", totalGeneral])
    totalRow.font = { bold: true, size: 11 }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
    totalRow.getCell(4).numFmt = "#,##0.00"

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="viajes-propios-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/viajes-sin-lp/excel", error)
  }
}
