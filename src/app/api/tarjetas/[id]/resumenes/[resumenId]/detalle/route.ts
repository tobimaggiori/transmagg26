/**
 * GET /api/tarjetas/[id]/resumenes/[resumenId]/detalle
 *
 * Devuelve el resumen + días conciliados + gastos/movimientos del período
 * agrupados por día (solo GastoTarjeta por ahora).
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { sumarImportes } from "@/lib/money"

function ymdUTC(d: Date): string {
  return d.toISOString().slice(0, 10)
}

function enumerarDias(desde: Date, hasta: Date): string[] {
  const fechas: string[] = []
  const cursor = new Date(desde)
  cursor.setUTCHours(0, 0, 0, 0)
  const limit = new Date(hasta)
  limit.setUTCHours(0, 0, 0, 0)
  while (cursor <= limit) {
    fechas.push(ymdUTC(cursor))
    cursor.setUTCDate(cursor.getUTCDate() + 1)
  }
  return fechas
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> },
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: tarjetaId, resumenId } = await params

    const resumen = await prisma.resumenTarjeta.findUnique({
      where: { id: resumenId },
      include: {
        tarjeta: {
          select: {
            id: true,
            nombre: true,
            tipo: true,
            banco: true,
            ultimos4: true,
            diaCierre: true,
            diaVencimiento: true,
          },
        },
        diasConciliados: {
          orderBy: { fecha: "asc" },
          include: { operador: { select: { nombre: true, apellido: true } } },
        },
      },
    })
    if (!resumen || resumen.tarjetaId !== tarjetaId) return notFoundResponse("Resumen de tarjeta")

    const fechas =
      resumen.periodoDesde && resumen.periodoHasta
        ? enumerarDias(resumen.periodoDesde, resumen.periodoHasta)
        : []

    const gastos =
      resumen.periodoDesde && resumen.periodoHasta
        ? await prisma.gastoTarjeta.findMany({
            where: {
              tarjetaId,
              fecha: { gte: resumen.periodoDesde, lte: resumen.periodoHasta },
            },
            orderBy: { fecha: "asc" },
          })
        : []

    const gastosPorDia: Record<string, typeof gastos> = {}
    for (const g of gastos) {
      const k = ymdUTC(g.fecha)
      if (!gastosPorDia[k]) gastosPorDia[k] = []
      gastosPorDia[k].push(g)
    }

    const diasConciliadosMap = new Map(
      resumen.diasConciliados.map((d) => [ymdUTC(d.fecha), d]),
    )

    let acum = 0
    const dias = fechas.map((fechaStr) => {
      const gs = gastosPorDia[fechaStr] ?? []
      const totalDia = sumarImportes(gs.map((g) => g.monto))
      acum = sumarImportes([acum, totalDia])
      const diaConc = diasConciliadosMap.get(fechaStr)
      return {
        fecha: fechaStr,
        totalDia,
        totalAcumulado: acum,
        conciliado: !!diaConc,
        saldoResumen: diaConc ? Number(diaConc.saldoResumen) : null,
        conciliadoEn: diaConc?.conciliadoEn?.toISOString() ?? null,
        operador: diaConc
          ? `${diaConc.operador.nombre} ${diaConc.operador.apellido}`
          : null,
        gastos: gs.map((g) => ({
          id: g.id,
          tipoGasto: g.tipoGasto,
          monto: Number(g.monto),
          descripcion: g.descripcion,
        })),
      }
    })

    return NextResponse.json({
      resumen: {
        id: resumen.id,
        periodo: resumen.periodo,
        periodoDesde: resumen.periodoDesde?.toISOString() ?? null,
        periodoHasta: resumen.periodoHasta?.toISOString() ?? null,
        fechaVtoPago: resumen.fechaVtoPago.toISOString(),
        totalARS: Number(resumen.totalARS),
        totalUSD: resumen.totalUSD ? Number(resumen.totalUSD) : null,
        s3Key: resumen.s3Key,
        pagado: resumen.pagado,
        estado: resumen.estado,
        conciliadoEn: resumen.conciliadoEn?.toISOString() ?? null,
        tarjeta: resumen.tarjeta,
      },
      dias,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/tarjetas/[id]/resumenes/[resumenId]/detalle", error)
  }
}
