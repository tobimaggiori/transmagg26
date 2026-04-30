/**
 * API Route: GET /api/contabilidad/iibb/pdf
 * PDF (application/pdf, inline) del Listado de Viajes por Provincia (IIBB).
 * Per CLAUDE.md regla 8.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarPDFIibb, type ViajeIibbItem } from "@/lib/pdf-iibb"

function periodoWhere(params: URLSearchParams): Record<string, unknown> {
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) return { periodo: `${anio}-${String(mes).padStart(2, "0")}` }
  if (desde || hasta) {
    const w: Record<string, string> = {}
    if (desde) w.gte = desde.slice(0, 7)
    if (hasta) w.lte = hasta.slice(0, 7)
    return { periodo: w }
  }
  const hoy = new Date()
  const m = String(hoy.getMonth() + 1).padStart(2, "0")
  return { periodo: `${hoy.getFullYear()}-${m}` }
}

function periodoLabel(searchParams: URLSearchParams): string {
  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  if (mes && anio) return `${String(mes).padStart(2, "0")}/${anio}`
  if (desde && hasta) return `${desde} al ${hasta}`
  return `${String(new Date().getMonth() + 1).padStart(2, "0")}/${new Date().getFullYear()}`
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

  try {
    const asientos = await prisma.asientoIibb.findMany({
      where: periodoWhere(searchParams),
      include: {
        viajeEnLiquidacion: {
          include: {
            viaje: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
        viajeEnFactura: {
          include: {
            factura: { include: { empresa: { select: { razonSocial: true } } } },
          },
        },
      },
      orderBy: [{ provincia: "asc" }, { periodo: "asc" }],
    })

    const items: ViajeIibbItem[] = asientos.map((a) => {
      const vel = a.viajeEnLiquidacion
      const vef = a.viajeEnFactura
      return {
        provincia: a.provincia,
        fecha: vef?.fechaViaje ?? vel?.fechaViaje ?? null,
        empresa: vef?.factura.empresa.razonSocial ?? vel?.viaje.empresa.razonSocial ?? "—",
        mercaderia: vef?.mercaderia ?? vel?.mercaderia ?? "—",
        procedencia: vef?.procedencia ?? vel?.procedencia ?? "—",
        subtotal: Number(a.montoIngreso),
      }
    })

    const pdf = await generarPDFIibb(items, periodoLabel(searchParams))
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="iibb-${periodoSlug(searchParams)}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iibb/pdf", error)
  }
}
