/**
 * API Route: GET /api/contabilidad/lp-vs-facturas
 * Compara el subtotal de cada viaje en liquidaciones vs facturas emitidas,
 * agrupado por provincia de origen.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { sumarImportes } from "@/lib/money"

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

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params de período, devuelve viajes que tienen tanto liquidación
 * como factura activa, agrupados por provincia, con netoLP, netoFact y diferencia.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        enLiquidaciones: {
          some: { liquidacion: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
        },
        enFacturas: {
          some: { factura: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
        },
      },
      include: {
        empresa: { select: { razonSocial: true } },
        enLiquidaciones: {
          where: { liquidacion: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
          include: { liquidacion: { select: { nroComprobante: true } } },
          orderBy: { liquidacion: { grabadaEn: "asc" } },
          take: 1,
        },
        enFacturas: {
          where: { factura: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
          include: { factura: { select: { nroComprobante: true } } },
          orderBy: { factura: { emitidaEn: "asc" } },
          take: 1,
        },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type ViajeRow = {
      remito: string
      nroLP: string
      netoLP: number
      nroFact: string
      netoFact: number
      diferencia: number
      empresa: string
    }

    const provinciasMap = new Map<string, ViajeRow[]>()

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

    const provincias = Array.from(provinciasMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nombre, viajesArr]) => ({
        nombre,
        viajes: viajesArr,
        totalNetoLP: sumarImportes(viajesArr.map(r => r.netoLP)),
        totalNetoFact: sumarImportes(viajesArr.map(r => r.netoFact)),
        totalDiferencia: sumarImportes(viajesArr.map(r => r.diferencia)),
      }))

    const totalGeneral = sumarImportes(provincias.map(p => p.totalDiferencia))

    return NextResponse.json({ provincias, totalGeneral })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/lp-vs-facturas", error)
  }
}
