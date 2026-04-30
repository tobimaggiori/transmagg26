/**
 * API Route: GET /api/contabilidad/gastos/pdf
 * PDF (application/pdf, inline) del Detalle de Gastos por Concepto.
 * Per CLAUDE.md regla 8.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarPDFGastos, type GastoItem } from "@/lib/pdf-gastos"

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
  const hoy = new Date()
  const inicio = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const fin = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde: inicio, hasta: fin }
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
  const { desde, hasta } = periodoFilter(searchParams)

  try {
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

    const items: GastoItem[] = []
    for (const f of facturas) {
      items.push({
        rubro: f.concepto ?? "SIN CLASIFICAR",
        fecha: f.fechaCbte,
        descripcion: `${f.proveedor.razonSocial} — ${f.tipoCbte} ${f.nroComprobante}`,
        monto: Number(f.total),
      })
    }
    for (const liq of liquidaciones) {
      items.push({
        rubro: "VIAJES CONTRATADOS",
        fecha: liq.grabadaEn,
        descripcion: `Liquidación ${liq.nroComprobante ? String(liq.nroComprobante).padStart(8, "0") : "s/n"} — ${liq.fletero.razonSocial}`,
        monto: Number(liq.total),
      })
    }

    const pdf = await generarPDFGastos(items, periodoLabel(searchParams))
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="gastos-${periodoSlug(searchParams)}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/gastos/pdf", error)
  }
}
