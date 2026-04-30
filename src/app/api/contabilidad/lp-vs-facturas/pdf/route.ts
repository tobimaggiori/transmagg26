/**
 * API Route: GET /api/contabilidad/lp-vs-facturas/pdf
 * PDF (application/pdf, inline) — Compara LP vs Facturas. Per CLAUDE.md regla 8.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarPDFLpVsFacturas, type ConciliacionItem } from "@/lib/pdf-lp-vs-facturas"

function parsePeriodo(params: URLSearchParams): { desde: Date; hasta: Date } {
  const mes = params.get("mes")
  const anio = params.get("anio")
  const desde = params.get("desde")
  const hasta = params.get("hasta")

  if (mes && anio) {
    const d = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const h = new Date(d)
    h.setMonth(h.getMonth() + 1)
    return { desde: d, hasta: h }
  }
  if (desde || hasta) {
    return {
      desde: desde ? new Date(`${desde}T00:00:00.000Z`) : new Date("2000-01-01"),
      hasta: hasta ? new Date(`${hasta}T23:59:59.999Z`) : new Date("2099-12-31"),
    }
  }
  const hoy = new Date()
  return {
    desde: new Date(hoy.getFullYear(), hoy.getMonth(), 1),
    hasta: new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1),
  }
}

function periodoLabel(searchParams: URLSearchParams): string {
  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  if (mes && anio) {
    const dd = new Date(Number(anio), Number(mes), 0).getDate().toString().padStart(2, "0")
    return `01/${String(mes).padStart(2, "0")}/${anio} al ${dd}/${String(mes).padStart(2, "0")}/${anio}`
  }
  if (desde && hasta) return `${desde} al ${hasta}`
  return "período actual"
}

function periodoSlug(params: URLSearchParams): string {
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) return `${anio}-${String(mes).padStart(2, "0")}`
  return "todos"
}

export async function GET(request: NextRequest): Promise<Response | NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const { desde, hasta } = parsePeriodo(searchParams)

  try {
    const viajes = await prisma.viaje.findMany({
      where: {
        fechaViaje: { gte: desde, lt: hasta },
        enLiquidaciones: { some: {} },
        enFacturas: { some: {} },
      },
      include: {
        empresa: { select: { razonSocial: true } },
        enLiquidaciones: {
          include: { liquidacion: { select: { nroComprobante: true } } },
          orderBy: { liquidacion: { grabadaEn: "asc" } },
          take: 1,
        },
        enFacturas: {
          include: { factura: { select: { nroComprobante: true } } },
          orderBy: { factura: { emitidaEn: "asc" } },
          take: 1,
        },
      },
      orderBy: [{ provinciaOrigen: "asc" }, { fechaViaje: "asc" }],
    })

    const items: ConciliacionItem[] = []
    for (const v of viajes) {
      const vel = v.enLiquidaciones[0]
      const vef = v.enFacturas[0]
      if (!vel || !vef) continue
      const netoLP = Number(vel.subtotal)
      const netoFact = Number(vef.subtotal)
      items.push({
        provincia: v.provinciaOrigen ?? "SIN PROVINCIA",
        remito: v.remito ?? "—",
        nroLP: vel.liquidacion.nroComprobante ? String(vel.liquidacion.nroComprobante) : "—",
        netoLP,
        nroFact: vef.factura.nroComprobante ?? "—",
        netoFact,
        diferencia: netoFact - netoLP,
        empresa: v.empresa.razonSocial,
      })
    }

    const pdf = await generarPDFLpVsFacturas(items, periodoLabel(searchParams))
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="lp-vs-facturas-${periodoSlug(searchParams)}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/lp-vs-facturas/pdf", error)
  }
}
