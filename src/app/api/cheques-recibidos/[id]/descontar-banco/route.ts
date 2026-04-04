/**
 * POST /api/cheques-recibidos/[id]/descontar-banco
 * Descuenta el cheque en el banco.
 * Estado → DESCONTADO_BANCO.
 * Crea dos MovimientoSinFactura: INGRESO por neto + EGRESO por comisión bancaria.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { invalidDataResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarDescontarChequeBanco } from "@/lib/cheque-commands"

const schema = z.object({
  cuentaId: z.string().uuid(),
  tasaDescuento: z.number().min(0).max(100),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const resultado = await ejecutarDescontarChequeBanco(
      {
        chequeId: id,
        cuentaId: parsed.data.cuentaId,
        tasaDescuento: parsed.data.tasaDescuento,
        fecha: parsed.data.fecha,
      },
      operadorId
    )

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.result)
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/[id]/descontar-banco", error)
  }
}
