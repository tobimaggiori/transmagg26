/**
 * API Route: GET /api/dashboard-financiero/pendiente-liquidar
 * Devuelve los viajes PENDIENTES sin liquidación agrupados por fletero.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [los viajes pendientes de liquidar agrupados por fletero con totales].
 * Esta función existe para poblar el modal de "Pendiente de Liquidar" del dashboard financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ fleteroId, razonSocial, totalTarifaBase, cantidadViajes, viajes }])
 * GET() === NextResponse.json([{ fleteroId: "...", totalTarifaBase: 150000, cantidadViajes: 3 }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fleteroId: { not: null },
        enLiquidaciones: { none: { liquidacion: { estado: { in: ["EMITIDA", "PAGADA", "PARCIALMENTE_PAGADA"] as string[] } } } },
      },
      include: {
        fletero: { select: { id: true, razonSocial: true } },
      },
      orderBy: { fechaViaje: "desc" },
    })

    // Agrupar por fletero
    const porFletero = new Map<string, {
      fleteroId: string
      razonSocial: string
      totalTarifaBase: number
      cantidadViajes: number
      viajes: Array<{
        id: string
        fechaViaje: string
        procedencia: string | null
        destino: string | null
        tarifa: number
      }>
    }>()

    for (const v of viajes) {
      if (!v.fletero || !v.fleteroId) continue
      const key = v.fleteroId
      if (!porFletero.has(key)) {
        porFletero.set(key, {
          fleteroId: v.fleteroId,
          razonSocial: v.fletero.razonSocial,
          totalTarifaBase: 0,
          cantidadViajes: 0,
          viajes: [],
        })
      }
      const entry = porFletero.get(key)!
      const tarifaVal = v.tarifa ?? 0
      entry.totalTarifaBase += tarifaVal
      entry.cantidadViajes += 1
      entry.viajes.push({
        id: v.id,
        fechaViaje: v.fechaViaje.toISOString(),
        procedencia: v.procedencia,
        destino: v.destino,
        tarifa: tarifaVal,
      })
    }

    const resultado = Array.from(porFletero.values())
      .sort((a, b) => b.totalTarifaBase - a.totalTarifaBase)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/pendiente-liquidar", error)
  }
}
