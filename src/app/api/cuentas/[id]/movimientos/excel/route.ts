/**
 * GET /api/cuentas/[id]/movimientos/excel — Exporta movimientos de una cuenta a Excel con saldo running.
 * Acepta los mismos filtros que el GET de movimientos (tipo, categoria, desde, hasta).
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import ExcelJS from "exceljs"
import { prisma } from "@/lib/prisma"
import { notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { formatearMoneda, formatearFecha } from "@/lib/utils"

/**
 * GET: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de una cuenta y filtros opcionales (tipo, categoria, desde, hasta),
 * devuelve un archivo Excel con los movimientos filtrados + saldo running real.
 * Ingresos en verde, egresos en rojo, fila de totales al pie.
 *
 * Ejemplos:
 * GET(/api/cuentas/c1/movimientos/excel) === Excel con todos los movimientos
 * GET(...?desde=2026-01-01&hasta=2026-01-31) === Excel filtrado con saldo running real
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") ?? undefined
    const categoria = searchParams.get("categoria") ?? undefined
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined

    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      select: { id: true, nombre: true, saldoInicial: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")

    // Load ALL movements for running saldo
    const todosLosMovimientos = await prisma.movimientoSinFactura.findMany({
      where: { cuentaId: id },
      select: { id: true, tipo: true, monto: true },
      orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    })

    let saldoAcumulado = cuenta.saldoInicial
    const saldoPorId = new Map<string, number>()
    for (const m of todosLosMovimientos) {
      if (m.tipo === "INGRESO") saldoAcumulado += m.monto
      else saldoAcumulado -= m.monto
      saldoPorId.set(m.id, saldoAcumulado)
    }

    const where = {
      cuentaId: id,
      ...(tipo ? { tipo } : {}),
      ...(categoria ? { categoria: { contains: categoria } } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
            },
          }
        : {}),
    }

    const movimientos = await prisma.movimientoSinFactura.findMany({
      where,
      include: {
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    })

    const workbook = new ExcelJS.Workbook()
    workbook.creator = "Transmagg"
    const sheet = workbook.addWorksheet("Movimientos")

    sheet.columns = [
      { header: "Fecha", key: "fecha", width: 14 },
      { header: "Tipo", key: "tipo", width: 10 },
      { header: "Categoría", key: "categoria", width: 28 },
      { header: "Descripción", key: "descripcion", width: 40 },
      { header: "Referencia", key: "referencia", width: 20 },
      { header: "Ingreso", key: "ingreso", width: 16 },
      { header: "Egreso", key: "egreso", width: 16 },
      { header: "Saldo", key: "saldo", width: 16 },
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
      const saldo = saldoPorId.get(m.id) ?? null
      totalIngresos += ingreso ?? 0
      totalEgresos += egreso ?? 0

      const row = sheet.addRow({
        fecha: formatearFecha(m.fecha.toISOString()),
        tipo: m.tipo,
        categoria: m.categoria,
        descripcion: m.descripcion,
        referencia: m.referencia ?? "",
        ingreso: ingreso != null ? formatearMoneda(ingreso) : "",
        egreso: egreso != null ? formatearMoneda(egreso) : "",
        saldo: saldo != null ? formatearMoneda(saldo) : "",
        operador: `${m.operador.nombre} ${m.operador.apellido}`,
      })

      if (m.tipo === "INGRESO") {
        row.getCell("ingreso").font = { color: { argb: "FF16A34A" } }
      } else {
        row.getCell("egreso").font = { color: { argb: "FFDC2626" } }
      }
    }

    const totalRow = sheet.addRow({
      fecha: "TOTALES",
      tipo: "",
      categoria: "",
      descripcion: "",
      referencia: "",
      ingreso: formatearMoneda(totalIngresos),
      egreso: formatearMoneda(totalEgresos),
      saldo: `Neto: ${formatearMoneda(totalIngresos - totalEgresos)}`,
      operador: "",
    })
    totalRow.font = { bold: true }
    totalRow.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFF1F5F9" } }

    const nombreArchivo = `movimientos-${cuenta.nombre.replace(/\s+/g, "-")}-${desde ?? "todos"}-${hasta ?? "todos"}`
    const buffer = await workbook.xlsx.writeBuffer()

    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="${nombreArchivo}.xlsx"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]/movimientos/excel", error)
  }
}
