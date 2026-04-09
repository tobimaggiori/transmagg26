/**
 * GET /api/fleteros/[id]/cc-lps?estado=&desde=&hasta=
 * Devuelve las liquidaciones de un fletero con su OP asociada y sumas de descuentos.
 * Diseñado para la vista de Cuenta Corriente por LP.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { sumarImportes, restarImportes } from "@/lib/money"
import type { Rol } from "@/types"

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  const fletero = await prisma.fletero.findUnique({
    where: { id },
    select: { id: true, razonSocial: true, cuit: true },
  })
  if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

  const { searchParams } = new URL(request.url)
  const estadoFiltro = searchParams.get("estado") ?? ""
  const desdeParam = searchParams.get("desde")
  const hastaParam = searchParams.get("hasta")

  const desdeDate = desdeParam ? new Date(desdeParam) : undefined
  const hastaDate = hastaParam ? new Date(hastaParam + "T23:59:59") : undefined

  const estadoWhere =
    estadoFiltro === "pendientes"
      ? { in: ["EMITIDA", "PARCIALMENTE_PAGADA"] }
      : estadoFiltro === "pagados"
      ? { equals: "PAGADA" }
      : undefined

  try {
    const liquidaciones = await prisma.liquidacion.findMany({
      where: {
        fleteroId: id,
        estado: estadoWhere,
        ...(desdeDate || hastaDate
          ? { grabadaEn: { ...(desdeDate ? { gte: desdeDate } : {}), ...(hastaDate ? { lte: hastaDate } : {}) } }
          : {}),
      },
      include: {
        pagos: {
          where: { anulado: false },
          include: {
            ordenPago: {
              select: { id: true, nro: true, anio: true, fecha: true, pdfS3Key: true },
            },
          },
        },
        adelantoDescuentos: { select: { montoDescontado: true } },
        gastoDescuentos: { select: { montoDescontado: true } },
      },
      orderBy: { grabadaEn: "asc" },
    })

    const rows = liquidaciones.map((liq) => {
      const ordenPago =
        liq.pagos.find((p) => p.ordenPago !== null)?.ordenPago ?? null

      const adelantosDesc = sumarImportes(liq.adelantoDescuentos.map(a => a.montoDescontado))
      const gastosDesc = sumarImportes(liq.gastoDescuentos.map(g => g.montoDescontado))

      return {
        id: liq.id,
        grabadaEn: liq.grabadaEn.toISOString(),
        nroComprobante: liq.nroComprobante,
        ptoVenta: liq.ptoVenta,
        pdfS3Key: liq.pdfS3Key,
        total: liq.total,
        estado: liq.estado,
        adelantosDesc,
        gastosDesc,
        ordenPago: ordenPago
          ? {
              id: ordenPago.id,
              nro: ordenPago.nro,
              anio: ordenPago.anio,
              fecha: ordenPago.fecha.toISOString(),
              pdfS3Key: ordenPago.pdfS3Key,
            }
          : null,
      }
    })

    const totalEmitido = sumarImportes(rows.map(r => r.total))
    const totalPagado = sumarImportes(rows.filter(r => r.estado === "PAGADA").map(r => r.total))
    const saldoPendiente = restarImportes(totalEmitido, totalPagado)

    return NextResponse.json({
      fletero,
      liquidaciones: rows,
      totalEmitido,
      totalPagado,
      saldoPendiente,
    })
  } catch (error) {
    console.error("[GET /api/fleteros/[id]/cc-lps]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
