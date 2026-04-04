import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import {
  requireFinancialAccess,
  badRequestResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarRegistrarPagoFletero } from "@/lib/pago-fletero-commands"

const pagoFleteroItemSchema = z.discriminatedUnion("tipoPago", [
  z.object({
    tipoPago: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaBancariaId: z.string().uuid(),
    referencia: z.string().optional(),
  }),
  z.object({
    tipoPago: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive(),
    chequePropio: z.object({
      cuentaId: z.string().uuid(),
      nroCheque: z.string().min(1, "El numero de cheque es obligatorio"),
      mailBeneficiario: z.string().optional().nullable(),
      fechaEmision: z.string().min(1),
      fechaPago: z.string().min(1),
      clausula: z.string().optional().nullable(),
      descripcion1: z.string().optional().nullable(),
      descripcion2: z.string().optional().nullable(),
    }),
  }),
  z.object({
    tipoPago: z.literal("CHEQUE_TERCERO"),
    monto: z.number().positive(),
    chequeRecibidoId: z.string().uuid(),
  }),
  z.object({
    tipoPago: z.literal("EFECTIVO"),
    monto: z.number().positive(),
  }),
  z.object({
    tipoPago: z.literal("SALDO_A_FAVOR"),
    monto: z.number().positive(),
  }),
])

const pagoLiqSchema = z.object({
  pagos: z.array(pagoFleteroItemSchema),
  fecha: z.string(),
  gastos: z
    .array(
      z.object({
        gastoId: z.string().uuid(),
        montoDescontar: z.number().positive(),
      })
    )
    .optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id: liquidacionId } = await params
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

  const parsed = pagoLiqSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  try {
    const result = await ejecutarRegistrarPagoFletero(
      { liquidacionId, ...parsed.data },
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
    if (error instanceof Error && error.message.startsWith("DUPLICATE_CHEQUE:")) {
      const nro = error.message.split(":")[1]
      return NextResponse.json(
        { error: `El cheque N° ${nro} ya existe para esa cuenta. Verifica el numero.` },
        { status: 409 }
      )
    }
    return serverErrorResponse("POST /api/liquidaciones/[id]/pago", error)
  }
}
