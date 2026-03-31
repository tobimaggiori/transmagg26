/**
 * API Route: GET /api/contabilidad/gastos
 * Devuelve el detalle de gastos agrupado por rubro/concepto para el período dado.
 * Fuentes: FacturaProveedor (por concepto) + Liquidacion EMITIDA (→ "VIAJES CONTRATADOS").
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"

function periodoFilter(params: URLSearchParams) {
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) {
    const inicio = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const fin = new Date(inicio)
    fin.setMonth(fin.getMonth() + 1)
    return { desde: inicio, hasta: fin }
  }
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  if (desde || hasta) {
    return {
      desde: desde ? new Date(`${desde}T00:00:00.000Z`) : undefined,
      hasta: hasta ? new Date(`${hasta}T23:59:59.999Z`) : undefined,
    }
  }
  // Default: current month
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde: inicio, hasta: fin }
}

type RubroItem = {
  descripcion: string
  monto: number
  fecha: Date | null
}

type Rubro = {
  nombre: string
  items: RubroItem[]
  total: number
}

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado los query params de período, devuelve { rubros: Rubro[], totalGeneral: number }.
 * Existe para el módulo de detalle de gastos por concepto.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = periodoFilter(searchParams)

  try {
    // Facturas proveedor dentro del período
    const facturas = await prisma.facturaProveedor.findMany({
      where: {
        fechaCbte: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { proveedor: { select: { razonSocial: true } } },
      orderBy: { fechaCbte: "asc" },
    })

    // Liquidaciones EMITIDA dentro del período
    const liquidaciones = await prisma.liquidacion.findMany({
      where: {
        estado: "EMITIDA",
        grabadaEn: {
          ...(desde ? { gte: desde } : {}),
          ...(hasta ? { lt: hasta } : {}),
        },
      },
      include: { fletero: { select: { razonSocial: true } } },
      orderBy: { grabadaEn: "asc" },
    })

    // Build rubros map
    const rubrosMap = new Map<string, RubroItem[]>()

    for (const f of facturas) {
      const rubro = f.concepto ?? "SIN CLASIFICAR"
      if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
      rubrosMap.get(rubro)!.push({
        descripcion: `${f.proveedor.razonSocial} — ${f.tipoCbte} ${f.nroComprobante}`,
        monto: f.total,
        fecha: f.fechaCbte,
      })
    }

    for (const liq of liquidaciones) {
      const rubro = "VIAJES CONTRATADOS"
      if (!rubrosMap.has(rubro)) rubrosMap.set(rubro, [])
      rubrosMap.get(rubro)!.push({
        descripcion: `Liquidación ${liq.nroComprobante ? String(liq.nroComprobante).padStart(8, "0") : "s/n"} — ${liq.fletero.razonSocial}`,
        monto: liq.total,
        fecha: liq.grabadaEn,
      })
    }

    const rubros: Rubro[] = Array.from(rubrosMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([nombre, items]) => ({
        nombre,
        items,
        total: items.reduce((acc, i) => acc + i.monto, 0),
      }))

    const totalGeneral = rubros.reduce((acc, r) => acc + r.total, 0)

    return NextResponse.json({ rubros, totalGeneral })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/gastos", error)
  }
}
