/**
 * API Route: POST /api/aseguradoras/resumen-tarjetas
 * Cierra el resumen mensual de cuotas de seguro de una tarjeta y registra el pago.
 */

import { NextRequest, NextResponse } from "next/server"
import { requireFinancialAccess, serverErrorResponse, badRequestResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarResumenTarjetaAseguradora } from "@/lib/tarjeta-commands"

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
    tarjetaId: string
    mesAnio: string
    cuentaPagoId: string
    fechaPago: string
  }

  if (!data.tarjetaId || !data.mesAnio || !data.cuentaPagoId || !data.fechaPago) {
    return badRequestResponse("Campos requeridos: tarjetaId, mesAnio, cuentaPagoId, fechaPago")
  }

  try {
    const operadorId = await resolverOperadorId({
      id: acceso.session.user.id,
      email: acceso.session.user.email,
    })

    const resultado = await ejecutarResumenTarjetaAseguradora(data, operadorId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json({ resumen: resultado.result }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/aseguradoras/resumen-tarjetas", error)
  }
}
