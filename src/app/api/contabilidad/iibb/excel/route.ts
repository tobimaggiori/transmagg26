/**
 * API Route: GET /api/contabilidad/iibb/excel?desde=YYYY-MM-DD&hasta=YYYY-MM-DD
 * Genera el reporte IIBB "Listado de Viajes por Provincia" como archivo Excel (.xlsx).
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
  const hoy = new Date()
  const m = String(hoy.getMonth() + 1).padStart(2, "0")
  return { periodo: `${hoy.getFullYear()}-${m}` }
}

/**
 * GET: NextRequest -> Promise<Response>
 *
 * Dado los query params de período, devuelve un archivo .xlsx con el reporte IIBB
 * agrupado por provincia con subtotales por provincia y total general.
 * Existe para exportar el listado de IIBB en formato compatible con Excel.
 *
 * Ejemplos:
 * GET /api/contabilidad/iibb/excel?mes=3&anio=2026 → iibb-2026-03.xlsx
 * GET /api/contabilidad/iibb/excel (sesión FLETERO) → 403
 */
export async function GET(request: NextRequest): Promise<Response> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const asientos = await prisma.asientoIibb.findMany({
      where: periodoWhere(searchParams),
      include: {
        viajeEnLiquidacion: {
          include: {
            viaje: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
        viajeEnFactura: {
          include: {
            factura: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
      },
      orderBy: [{ provincia: "asc" }, { periodo: "asc" }],
    })

    const mes = searchParams.get("mes")
    const anio = searchParams.get("anio")
    const periodoLabel =
      mes && anio
        ? `${anio}-${String(mes).padStart(2, "0")}`
        : "todos-los-periodos"

    // Group by province
    const gruposMap = new Map<string, { filas: { fecha: Date | null; empresa: string; mercaderia: string; procedencia: string; subtotal: number }[]; total: number }>()
    for (const a of asientos) {
      const vel = a.viajeEnLiquidacion
      const vef = a.viajeEnFactura
      const fecha = vef?.fechaViaje ?? vel?.fechaViaje ?? null
      const empresa = vef?.factura.empresa.razonSocial ?? vel?.viaje.empresa.razonSocial ?? "—"
      const mercaderia = vef?.mercaderia ?? vel?.mercaderia ?? "—"
      const procedencia = vef?.procedencia ?? vel?.procedencia ?? "—"
      if (!gruposMap.has(a.provincia)) gruposMap.set(a.provincia, { filas: [], total: 0 })
      const g = gruposMap.get(a.provincia)!
      g.filas.push({ fecha, empresa, mercaderia, procedencia, subtotal: a.montoIngreso })
      g.total += a.montoIngreso
    }
    const grupos = Array.from(gruposMap.entries()).sort(([a], [b]) => a.localeCompare(b))
    const totalGeneral = grupos.reduce((acc, [, g]) => acc + g.total, 0)

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("IIBB por Provincia")

    // Column definitions
    ws.columns = [
      { width: 13 }, // Fecha
      { width: 35 }, // Empresa
      { width: 25 }, // Mercadería
      { width: 25 }, // Procedencia
      { width: 16 }, // SubTotal
    ]

    for (const [provincia, g] of grupos) {
      // Province header row
      const provRow = ws.addRow([`PROVINCIA: ${provincia}`, "", "", "", g.total])
      provRow.font = { bold: true }
      provRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
      provRow.getCell(5).numFmt = "#,##0.00"

      // Column headers
      const colsRow = ws.addRow(["Fecha", "Empresa", "Mercadería", "Procedencia", "SubTotal"])
      colsRow.font = { bold: true, italic: true }
      colsRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }

      // Data rows
      for (const f of g.filas) {
        const row = ws.addRow([f.fecha, f.empresa, f.mercaderia, f.procedencia, f.subtotal])
        if (f.fecha) row.getCell(1).numFmt = "dd/mm/yyyy"
        row.getCell(5).numFmt = "#,##0.00"
      }

      // Subtotal row
      const subRow = ws.addRow(["", "Total de la Provincia", "", "", g.total])
      subRow.font = { bold: true }
      subRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
      subRow.getCell(5).numFmt = "#,##0.00"

      // Blank separator
      ws.addRow([])
    }

    // Total general
    const totalRow = ws.addRow(["", "TOTAL GENERAL", "", "", totalGeneral])
    totalRow.font = { bold: true, size: 12 }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
    totalRow.getCell(5).numFmt = "#,##0.00"

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="iibb-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iibb/excel", error)
  }
}
