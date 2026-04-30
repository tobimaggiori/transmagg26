/**
 * API Route: GET /api/contabilidad/iva-ventas-alicuota/pdf
 * PDF (application/pdf, inline) de "Ventas por Alícuota". Per CLAUDE.md regla 8.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarPDFVentasPorAlicuota, type AsientoPdf } from "@/lib/pdf-libro-iva"

const INCLUDE_PDF = {
  facturaEmitida: {
    select: {
      nroComprobante: true, tipoCbte: true, ptoVenta: true, emitidaEn: true,
      empresa: { select: { razonSocial: true, cuit: true } },
    },
  },
  facturaProveedor: {
    select: {
      nroComprobante: true, ptoVenta: true, tipoCbte: true, fechaCbte: true,
      proveedor: { select: { razonSocial: true, cuit: true } },
    },
  },
  liquidacion: {
    select: {
      nroComprobante: true, ptoVenta: true, grabadaEn: true,
      fletero: { select: { razonSocial: true, cuit: true } },
    },
  },
  notaCreditoDebito: {
    select: {
      tipo: true, tipoCbte: true, ptoVenta: true, nroComprobante: true,
      nroComprobanteExterno: true, fechaComprobanteExterno: true, emisorExterno: true, creadoEn: true,
      factura: { select: { empresa: { select: { razonSocial: true, cuit: true } } } },
      facturaProveedor: { select: { proveedor: { select: { razonSocial: true, cuit: true } } } },
      liquidacion: { select: { fletero: { select: { razonSocial: true, cuit: true } } } },
    },
  },
  facturaSeguro: {
    select: {
      nroComprobante: true, tipoComprobante: true, fecha: true,
      aseguradora: { select: { razonSocial: true, cuit: true } },
    },
  },
} as const

function periodoWhere(params: URLSearchParams): Record<string, unknown> {
  const desde = params.get("desde"), hasta = params.get("hasta")
  const mes = params.get("mes"), anio = params.get("anio")
  if (mes && anio) return { periodo: `${anio}-${String(mes).padStart(2, "0")}` }
  if (desde || hasta) {
    const w: Record<string, string> = {}
    if (desde) w.gte = desde.slice(0, 7)
    if (hasta) w.lte = hasta.slice(0, 7)
    return { periodo: w }
  }
  return {}
}

function periodoLabel(params: URLSearchParams): string {
  const mes = params.get("mes"), anio = params.get("anio")
  const desde = params.get("desde"), hasta = params.get("hasta")
  if (mes && anio) return `${String(mes).padStart(2, "0")}/${anio}`
  if (desde && hasta) return `${desde} al ${hasta}`
  return "todos los períodos"
}

function periodoSlug(params: URLSearchParams): string {
  const mes = params.get("mes"), anio = params.get("anio")
  if (mes && anio) return `${anio}-${String(mes).padStart(2, "0")}`
  return "todos"
}

export async function GET(request: NextRequest): Promise<Response | NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)

  try {
    const asientos = await prisma.asientoIva.findMany({
      where: { tipo: "VENTA", ...periodoWhere(searchParams) },
      include: INCLUDE_PDF,
      orderBy: [{ periodo: "asc" }],
    })

    const asientosPdf: AsientoPdf[] = asientos.map((a) => ({
      ...a,
      baseImponible: Number(a.baseImponible),
      montoIva: Number(a.montoIva),
    }))

    const pdf = await generarPDFVentasPorAlicuota(asientosPdf, periodoLabel(searchParams))
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="iva-ventas-alicuota-${periodoSlug(searchParams)}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/iva-ventas-alicuota/pdf", error)
  }
}
