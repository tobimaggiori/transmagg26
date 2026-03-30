/**
 * API Route: GET /api/dashboard-financiero/pendiente-facturar
 * Devuelve los viajes PENDIENTES sin factura agrupados por empresa.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

/**
 * GET: -> Promise<NextResponse>
 *
 * Dado [ningún parámetro], devuelve [los viajes pendientes de facturar agrupados por empresa con totales].
 * Esta función existe para poblar el modal de "Pendiente de Facturar" del dashboard financiero.
 *
 * Ejemplos:
 * GET() === NextResponse.json([{ empresaId, razonSocial, totalTarifaBase, cantidadViajes, viajes }])
 * GET() === NextResponse.json([{ empresaId: "...", totalTarifaBase: 200000, cantidadViajes: 5 }])
 * GET() === NextResponse.json([])
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        estado: "PENDIENTE",
        enFacturas: { none: {} },
      },
      include: {
        empresa: { select: { id: true, razonSocial: true } },
      },
      orderBy: { fechaViaje: "desc" },
    })

    // Agrupar por empresa
    const porEmpresa = new Map<string, {
      empresaId: string
      razonSocial: string
      totalTarifaBase: number
      cantidadViajes: number
      viajes: Array<{
        id: string
        fechaViaje: string
        procedencia: string | null
        destino: string | null
        tarifaBase: number
      }>
    }>()

    for (const v of viajes) {
      const key = v.empresaId
      if (!porEmpresa.has(key)) {
        porEmpresa.set(key, {
          empresaId: v.empresaId,
          razonSocial: v.empresa.razonSocial,
          totalTarifaBase: 0,
          cantidadViajes: 0,
          viajes: [],
        })
      }
      const entry = porEmpresa.get(key)!
      const tarifaBase = v.tarifaBase ?? 0
      entry.totalTarifaBase += tarifaBase
      entry.cantidadViajes += 1
      entry.viajes.push({
        id: v.id,
        fechaViaje: v.fechaViaje.toISOString(),
        procedencia: v.procedencia,
        destino: v.destino,
        tarifaBase,
      })
    }

    const resultado = Array.from(porEmpresa.values())
      .sort((a, b) => b.totalTarifaBase - a.totalTarifaBase)

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/dashboard-financiero/pendiente-facturar", error)
  }
}
