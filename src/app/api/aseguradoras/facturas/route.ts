/**
 * API Route: GET/POST /api/aseguradoras/facturas
 * Gestiona facturas de seguro con polizas, cuotas de tarjeta y asientos IVA.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, serverErrorResponse, badRequestResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarCrearFacturaSeguro } from "@/lib/factura-seguro-commands"

export async function GET(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(request.url)
  const aseguradoraId = searchParams.get("aseguradoraId")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")
  const estado = searchParams.get("estado")

  try {
    const where: Record<string, unknown> = {}
    if (aseguradoraId) where.aseguradoraId = aseguradoraId
    if (estado) where.estadoPago = estado
    if (desde || hasta) {
      const fechaWhere: Record<string, Date> = {}
      if (desde) fechaWhere.gte = new Date(desde)
      if (hasta) fechaWhere.lte = new Date(hasta)
      where.fecha = fechaWhere
    }

    const facturas = await prisma.facturaSeguro.findMany({
      where,
      include: {
        aseguradora: { select: { id: true, razonSocial: true, cuit: true } },
        polizas: { select: { id: true, nroPoliza: true, tipoBien: true, vigenciaDesde: true, vigenciaHasta: true } },
        cuotas: { select: { id: true, nroCuota: true, totalCuotas: true, monto: true, mesAnio: true, estado: true } },
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: { fecha: "desc" },
    })

    return NextResponse.json({ facturas, total: facturas.length })
  } catch (error) {
    return serverErrorResponse("GET /api/aseguradoras/facturas", error)
  }
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("JSON inválido")
  }

  const data = body as {
    aseguradoraId: string
    nroComprobante: string
    tipoComprobante: string
    fecha: string
    periodoDesde: string
    periodoHasta: string
    neto: number
    iva: number
    total: number
    percepciones?: Array<{
      tipo: string
      categoria: string
      descripcion?: string | null
      monto: number
    }>
    formaPago: string
    medioPagoContado?: string
    cuentaId?: string
    tarjetaId?: string
    cantCuotas?: number
    primerMesAnio?: string
    polizas: Array<{
      tipoBien: string
      camionId?: string
      descripcionBien?: string
      nroPoliza: string
      cobertura?: string
      vigenciaDesde: string
      vigenciaHasta: string
    }>
  }

  if (
    !data.aseguradoraId ||
    !data.nroComprobante ||
    !data.fecha ||
    !data.periodoDesde ||
    !data.periodoHasta ||
    data.neto === undefined ||
    data.iva === undefined ||
    data.total === undefined ||
    !data.formaPago ||
    !Array.isArray(data.polizas) ||
    data.polizas.length === 0
  ) {
    return badRequestResponse("Campos requeridos faltantes")
  }

  try {
    const operadorId = await resolverOperadorId({
      id: acceso.session.user.id,
      email: acceso.session.user.email,
    })

    const result = await ejecutarCrearFacturaSeguro(data, operadorId)
    if (!result.ok) {
      return badRequestResponse(result.error)
    }

    return NextResponse.json({ factura: result.factura }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/aseguradoras/facturas", error)
  }
}
