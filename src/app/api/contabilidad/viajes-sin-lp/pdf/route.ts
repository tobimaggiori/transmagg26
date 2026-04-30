/**
 * API Route: GET /api/contabilidad/viajes-sin-lp/pdf
 * Devuelve el PDF (A4 portrait) del reporte "Viajes propios".
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { generarPDFViajesPropios } from "@/lib/pdf-viajes-propios"

function fmtFecha(d: Date) {
  return new Intl.DateTimeFormat("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" }).format(d)
}

function parsePeriodo(params: URLSearchParams): { desde: Date; hasta: Date; periodoLabel: string } {
  const mes = params.get("mes")
  const anio = params.get("anio")
  const desdeParam = params.get("desde")
  const hastaParam = params.get("hasta")

  if (mes && anio) {
    const desde = new Date(`${anio}-${String(mes).padStart(2, "0")}-01T00:00:00.000Z`)
    const hasta = new Date(desde)
    hasta.setMonth(hasta.getMonth() + 1)
    const ultimoDia = new Date(Number(anio), Number(mes), 0).getDate().toString().padStart(2, "0")
    const periodoLabel = `01/${String(mes).padStart(2, "0")}/${anio} al ${ultimoDia}/${String(mes).padStart(2, "0")}/${anio}`
    return { desde, hasta, periodoLabel }
  }
  if (desdeParam || hastaParam) {
    const desde = desdeParam ? new Date(`${desdeParam}T00:00:00.000Z`) : new Date("2000-01-01")
    const hasta = hastaParam ? new Date(`${hastaParam}T23:59:59.999Z`) : new Date("2099-12-31")
    return { desde, hasta, periodoLabel: `${desdeParam ?? "—"} al ${hastaParam ?? "—"}` }
  }
  const hoy = new Date()
  const desde = new Date(hoy.getFullYear(), hoy.getMonth(), 1)
  const hasta = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1)
  return { desde, hasta, periodoLabel: `${fmtFecha(desde)} al ${fmtFecha(new Date(hasta.getTime() - 1))}` }
}

function periodoSlug(params: URLSearchParams): string {
  const mes = params.get("mes")
  const anio = params.get("anio")
  if (mes && anio) return `${anio}-${String(mes).padStart(2, "0")}`
  const desde = params.get("desde")
  const hasta = params.get("hasta")
  if (desde && hasta) return `${desde}_${hasta}`
  return "todos"
}

export async function GET(request: NextRequest): Promise<Response | NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  try {
    const { searchParams } = new URL(request.url)
    const { desde, hasta, periodoLabel } = parsePeriodo(searchParams)

    const pdf = await generarPDFViajesPropios(desde, hasta, periodoLabel)
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))

    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="viajes-propios-${periodoSlug(searchParams)}.pdf"`,
      },
    })
  } catch (error) {
    return serverErrorResponse("GET /api/contabilidad/viajes-sin-lp/pdf", error)
  }
}
