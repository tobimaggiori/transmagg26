/**
 * API Route: GET /api/dashboard-financiero/pendiente-liquidar
 * Devuelve los viajes sin liquidación emitida, agrupados por fletero.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { calcularTotalViaje } from "@/lib/viajes"

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

    const porFletero = new Map<string, {
      fleteroId: string
      razonSocial: string
      total: number
      cantidadViajes: number
      viajes: Array<{
        id: string
        fechaViaje: string
        procedencia: string | null
        destino: string | null
        nroCartaPorte: string | null
        cartaPorteS3Key: string | null
        total: number | null
      }>
    }>()

    for (const v of viajes) {
      if (!v.fletero || !v.fleteroId) continue
      const key = v.fleteroId
      if (!porFletero.has(key)) {
        porFletero.set(key, {
          fleteroId: v.fleteroId,
          razonSocial: v.fletero.razonSocial,
          total: 0,
          cantidadViajes: 0,
          viajes: [],
        })
      }
      const entry = porFletero.get(key)!
      const viajeTotal = v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifa) : null
      entry.total += viajeTotal ?? 0
      entry.cantidadViajes += 1
      entry.viajes.push({
        id: v.id,
        fechaViaje: v.fechaViaje.toISOString(),
        procedencia: v.procedencia,
        destino: v.destino,
        nroCartaPorte: v.nroCartaPorte,
        cartaPorteS3Key: v.cartaPorteS3Key,
        total: viajeTotal,
      })
    }

    const resultado = Array.from(porFletero.values())
      .sort((a, b) => b.total - a.total)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/pendiente-liquidar", error)
  }
}
