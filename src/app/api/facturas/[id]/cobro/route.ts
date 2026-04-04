import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  requireFinancialAccess,
  badRequestResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarRegistrarCobro } from "@/lib/cobro-commands"

const pagoItemSchema = z.discriminatedUnion("tipoPago", [
  z.object({
    tipoPago: z.literal("CHEQUE"),
    monto: z.number().positive(),
    esElectronico: z.boolean().default(false),
    nroCheque: z.string().min(1),
    bancoEmisor: z.string().min(1),
    fechaEmision: z.string(),
    fechaCobro: z.string(),
    cuitLibrador: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaBancariaId: z.string().uuid(),
    referencia: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("EFECTIVO"),
    monto: z.number().positive(),
    descripcion: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("SALDO_A_FAVOR"),
    monto: z.number().positive(),
  }),
])

const cobroSchema = z.object({
  pagos: z.array(pagoItemSchema).min(1),
  fecha: z.string(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: facturaId } = await params
  let operadorId: string
  try {
    operadorId = await resolverOperadorId(acceso.session.user)
  } catch {
    return NextResponse.json({ error: "Sesion invalida. Cerra sesion y volve a ingresar." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return badRequestResponse("Cuerpo JSON invalido")
  }

  const parsed = cobroSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  try {
    const result = await ejecutarRegistrarCobro(
      { facturaId, ...parsed.data },
      operadorId
    )

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      ok: true,
      ...result.result,
    })
  } catch (error) {
    return serverErrorResponse("POST /api/facturas/[id]/cobro", error)
  }
}
