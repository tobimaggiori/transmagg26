/**
 * API Route: GET /api/contabilidad/gastos/excel
 * Genera el reporte de Detalle de Gastos por Concepto como archivo Excel.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

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

export async function GET(request: NextRequest): Promise<Response> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = periodoFilter(searchParams)

  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const periodoLabel = mes && anio ? `${anio}-${String(mes).padStart(2, "0")}` : "todos"

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

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("Gastos por Concepto")
    ws.columns = [{ width: 13 }, { width: 50 }, { width: 18 }]

    let totalGeneral = 0

    for (const [nombre, items] of rubros) {
      const rubroRow = ws.addRow([`${nombre.replace(/_/g, " ")}`, "", ""])
      rubroRow.font = { bold: true }
      rubroRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }

      const colsRow = ws.addRow(["Fecha", "Descripción", "Monto"])
      colsRow.font = { bold: true, italic: true }
      colsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }

      let subtotal = 0
      for (const item of items) {
        const row = ws.addRow([item.fecha, item.descripcion, item.monto])
        if (item.fecha) row.getCell(1).numFmt = "dd/mm/yyyy"
        row.getCell(3).numFmt = "#,##0.00"
        subtotal += item.monto
      }

      const subRow = ws.addRow(["", `Total ${nombre.replace(/_/g, " ")}`, subtotal])
      subRow.font = { bold: true }
      subRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
      subRow.getCell(3).numFmt = "#,##0.00"
      totalGeneral += subtotal

      ws.addRow([])
    }

    const totalRow = ws.addRow(["", "TOTAL GENERAL", totalGeneral])
    totalRow.font = { bold: true, size: 12 }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
    totalRow.getCell(3).numFmt = "#,##0.00"

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="gastos-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/gastos/excel", error)
  }
}
