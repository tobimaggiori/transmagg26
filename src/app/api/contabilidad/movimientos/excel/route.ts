/**
 * API Route: GET /api/contabilidad/movimientos/excel
 * Exporta movimientos sin factura filtrados a Excel.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId") ?? undefined
    const tipo = searchParams.get("tipo") ?? undefined
    const categoria = searchParams.get("categoria") ?? undefined
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined

    const where = {
      ...(cuentaId ? { cuentaId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(categoria ? { categoria } : {}),
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
        },
      } : {}),
    }

    const movimientos = await prisma.movimientoSinFactura.findMany({
      where,
      include: {
        cuenta: { select: { nombre: true } },
        cuentaDestino: { select: { nombre: true } },
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Transmagg"
    const sheet = workbook.addWorksheet("Movimientos")

    sheet.columns = [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Cuenta", key: "cuenta", width: 22 },
      { header: "Tipo", key: "tipo", width: 10 },
      { header: "Categoría", key: "categoria", width: 28 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Referencia", key: "referencia", width: 20 },
      { header: "Ingreso", key: "ingreso", width: 16 },
      { header: "Egreso", key: "egreso", width: 16 },
      { header: "Cuenta Destino", key: "cuentaDestino", width: 22 },
      { header: "Operador", key: "operador", width: 22 },
    ]

    const headerRow = sheet.getRow(1)
    headerRow.font = { bold: true }
    headerRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFE2E8F0" } }

    let totalIngresos = 0
    let totalEgresos = 0

    for (const m of movimientos) {
      const ingreso = m.tipo === "INGRESO" ? m.monto : null
      const egreso = m.tipo === "EGRESO" ? m.monto : null
      totalIngresos += ingreso ?? 0
      totalEgresos += egreso ?? 0

      const row = sheet.addRow({
        fecha: formatearFecha(m.fecha.toISOString()),
        cuenta: m.cuenta.nombre,
        tipo: m.tipo,
        categoria: m.categoria,
        descripcion: m.descripcion,
        referencia: m.referencia ?? "",
        ingreso: ingreso != null ? formatearMoneda(ingreso) : "",
        egreso: egreso != null ? formatearMoneda(egreso) : "",
        cuentaDestino: m.cuentaDestino?.nombre ?? "",
        operador: `${m.operador.nombre} ${m.operador.apellido}`,
      })

      if (m.tipo === "INGRESO") {
        row.getCell("ingreso").font = { color: { argb: "FF16A34A" } }
      } else {
        row.getCell("egreso").font = { color: { argb: "FFDC2626" } }
      }
    }

    // Totals row
    const totalRow = sheet.addRow({
      fecha: "TOTALES",
      cuenta: "",
      tipo: "",
      categoria: "",
      descripcion: "",
      referencia: "",
      ingreso: formatearMoneda(totalIngresos),
      egreso: formatearMoneda(totalEgresos),
      cuentaDestino: `Neto: ${formatearMoneda(totalIngresos - totalEgresos)}`,
      operador: "",
    })
    totalRow.font = { bold: true }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }

    const buffer = await workbook.xlsx.writeBuffer()
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="movimientos-${desde ?? "todos"}-${hasta ?? "todos"}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/movimientos/excel", error)
  }
}
