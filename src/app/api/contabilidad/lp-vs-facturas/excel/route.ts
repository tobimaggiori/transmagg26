/**
 * API Route: GET /api/contabilidad/lp-vs-facturas/excel
 * Genera el reporte LP vs Facturas como archivo Excel.
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

export async function GET(request: NextRequest): Promise<Response> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const periodoLabel = mes && anio ? `${anio}-${String(mes).padStart(2, "0")}` : "todos"

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        enLiquidaciones: {
          some: { liquidacion: { estado: { notIn: ["ANULADA"] } } },
        },
        enFacturas: {
          some: { factura: { estado: { notIn: ["ANULADA"] } } },
        },
      },
      include: {
        empresa: { select: { razonSocial: true } },
        enLiquidaciones: {
          where: { liquidacion: { estado: { notIn: ["ANULADA"] } } },
          include: { liquidacion: { select: { nroComprobante: true } } },
          orderBy: { liquidacion: { grabadaEn: "asc" } },
          take: 1,
        },
        enFacturas: {
          where: { factura: { estado: { notIn: ["ANULADA"] } } },
          include: { factura: { select: { nroComprobante: true } } },
          orderBy: { factura: { emitidaEn: "asc" } },
          take: 1,
        },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type Row = { remito: string; nroLP: string; netoLP: number; nroFact: string; netoFact: number; diferencia: number; empresa: string }
    const provinciasMap = new Map<string, Row[]>()

    for (const v of viajes) {
      const vel = v.enLiquidaciones[0]
      const vef = v.enFacturas[0]
      if (!vel || !vef) continue
      const provincia = v.provinciaOrigen ?? "SIN PROVINCIA"
      if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
      const netoLP = vel.subtotal
      const netoFact = vef.subtotal
      provinciasMap.get(provincia)!.push({
        remito: v.remito ?? "—",
        nroLP: vel.liquidacion.nroComprobante ? String(vel.liquidacion.nroComprobante) : "—",
        netoLP,
        nroFact: vef.factura.nroComprobante ?? "—",
        netoFact,
        diferencia: netoFact - netoLP,
        empresa: v.empresa.razonSocial,
      })
    }

    const wb = new ExcelJS.Workbook()
    wb.creator = "Transmagg"
    const ws = wb.addWorksheet("Conciliación de Viajes")
    ws.columns = [
      { width: 14 }, // Remito
      { width: 10 }, // Nro LP
      { width: 18 }, // Neto LP
      { width: 14 }, // Nro Fact
      { width: 18 }, // Neto Fact
      { width: 18 }, // Diferencia
      { width: 35 }, // Empresa
    ]

    let totalNetoLP = 0
    let totalNetoFact = 0
    let totalDif = 0

    for (const [provincia, rows] of Array.from(provinciasMap.entries()).sort(([a], [b]) => a.localeCompare(b))) {
      const provRow = ws.addRow([`PROVINCIA: ${provincia}`, "", "", "", "", "", ""])
      provRow.font = { bold: true }
      provRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }

      const hRow = ws.addRow(["Remito", "Nro LP", "Neto LP", "Nro Fact", "Neto Fact", "Diferencia", "Empresa"])
      hRow.font = { bold: true, italic: true }
      hRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF3F4F6" } }

      let subLP = 0
      let subFact = 0
      let subDif = 0

      for (const r of rows) {
        const row = ws.addRow([r.remito, r.nroLP, r.netoLP, r.nroFact, r.netoFact, r.diferencia, r.empresa])
        row.getCell(3).numFmt = "#,##0.00"
        row.getCell(5).numFmt = "#,##0.00"
        row.getCell(6).numFmt = "#,##0.00"
        subLP += r.netoLP
        subFact += r.netoFact
        subDif += r.diferencia
      }

      const subRow = ws.addRow(["", "Total Provincia", subLP, "", subFact, subDif, ""])
      subRow.font = { bold: true }
      subRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE5E7EB" } }
      subRow.getCell(3).numFmt = "#,##0.00"
      subRow.getCell(5).numFmt = "#,##0.00"
      subRow.getCell(6).numFmt = "#,##0.00"

      ws.addRow([])
      totalNetoLP += subLP
      totalNetoFact += subFact
      totalDif += subDif
    }

    const totalRow = ws.addRow(["", "TOTAL GENERAL", totalNetoLP, "", totalNetoFact, totalDif, ""])
    totalRow.font = { bold: true, size: 11 }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD1D5DB" } }
    totalRow.getCell(3).numFmt = "#,##0.00"
    totalRow.getCell(5).numFmt = "#,##0.00"
    totalRow.getCell(6).numFmt = "#,##0.00"

    const buf = await wb.xlsx.writeBuffer()
    const ab = new ArrayBuffer(buf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(buf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="lp-vs-facturas-${periodoLabel}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/lp-vs-facturas/excel", error)
  }
}
