/**
 * API Route: GET /api/contabilidad/viajes-sin-lp
 * Lista viajes que están en facturas emitidas pero no en ninguna liquidación activa,
 * agrupados por provincia de origen.
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

function labelTipoCbte(tipoCbte: number): string {
  const map: Record<number, string> = {
    1: "Factura A",
    6: "Factura B",
    201: "Factura A MiPyme",



  }
  return map[tipoCbte] ?? `Tipo ${tipoCbte}`
}

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params de período, devuelve viajes en facturas activas sin
 * ninguna liquidación activa, agrupados por provincia.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  try {
    const registros = await prisma.viajeEnFactura.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        factura: { estado: { notIn: ["ANULADA", "BORRADOR"] } },
        viaje: {
          enLiquidaciones: {
            none: { liquidacion: { estado: { notIn: ["ANULADA", "BORRADOR"] } } },
          },
        },
      },
      include: {
        viaje: { include: { empresa: { select: { razonSocial: true } } } },
        factura: { select: { nroComprobante: true, tipoCbte: true } },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    type ViajeRow = {
      fecha: string
      empresa: string
      remito: string
      nroComp: string
      tipoComprobante: string
      subtotal: number
    }

    const provinciasMap = new Map<string, ViajeRow[]>()

    for (const r of registros) {
      const provincia = r.provinciaOrigen ?? "SIN PROVINCIA"
      if (!provinciasMap.has(provincia)) provinciasMap.set(provincia, [])
      provinciasMap.get(provincia)!.push({
        fecha: r.fechaViaje.toISOString().slice(0, 10),
        empresa: r.viaje.empresa.razonSocial,
        remito: r.remito ?? "—",
        nroComp: r.factura.nroComprobante ?? "—",
        tipoComprobante: labelTipoCbte(r.factura.tipoCbte),
        subtotal: r.subtotal,
      })
    }

    const provincias = Array.from(provinciasMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nombre, viajesArr]) => ({
        nombre,
        viajes: viajesArr,
        total: sumarImportes(viajesArr.map(r => r.subtotal)),
      }))

    const totalGeneral = sumarImportes(provincias.map(p => p.total))

    return NextResponse.json({ provincias, totalGeneral })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/viajes-sin-lp", error)
  }
}
