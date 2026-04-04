import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { requireFinancialAccess, badRequestResponse, serverErrorResponse, invalidDataResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"
import { sumarImportes } from "@/lib/money"
import { ejecutarCrearOrdenPago } from "@/lib/orden-pago-commands"

/**
 * GET /api/ordenes-pago
 *
 * Devuelve las Ordenes de Pago emitidas, ordenadas por numero descendente.
 * Soporta filtros opcionales: ?fleteroId=, ?nro=, ?desde=, ?hasta=
 */
export async function GET(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { searchParams } = new URL(req.url)
  const fleteroId = searchParams.get("fleteroId") || undefined
  const nroStr = searchParams.get("nro")
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  try {
    const ordenes = await prisma.ordenPago.findMany({
      where: {
        ...(fleteroId ? { fleteroId } : {}),
        ...(nroStr ? { nro: parseInt(nroStr) } : {}),
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta + "T23:59:59") } : {}),
              },
            }
          : {}),
      },
      include: {
        fletero: { select: { id: true, razonSocial: true } },
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
      orderBy: { nro: "desc" },
      take: 200,
    })

    const resultado = ordenes.map((op) => ({
      id: op.id,
      nro: op.nro,
      fecha: op.fecha.toISOString(),
      fletero: op.fletero,
      total: sumarImportes(op.pagos.map(p => p.monto)),
      pdfS3Key: op.pdfS3Key,
    }))

    return NextResponse.json(resultado)
  } catch (error) {
    return serverErrorResponse("GET /api/ordenes-pago", error)
  }
}

// ── POST /api/ordenes-pago ───────────────────────────────────────────────────

const pagoFleteroItemSchema = z.discriminatedUnion("tipoPago", [
  z.object({
    tipoPago: z.literal("TRANSFERENCIA"),
    monto: z.number().positive(),
    cuentaBancariaId: z.string().uuid(),
    referencia: z.string().optional(),
    comprobanteS3Key: z.string().min(1),
  }),
  z.object({
    tipoPago: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive(),
    comprobanteS3Key: z.string().min(1),
    chequePropio: z.object({
      cuentaId: z.string().uuid(),
      nroCheque: z.string().min(1),
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
    comprobanteS3Key: z.string().min(1),
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

const multiLPPagoSchema = z.object({
  fleteroId: z.string().uuid(),
  liquidacionIds: z.array(z.string().uuid()).min(1),
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

/**
 * POST /api/ordenes-pago
 *
 * Crea una Orden de Pago que puede cubrir uno o varios LPs del mismo fletero.
 * Los pagos se distribuyen entre los LPs segun su saldo pendiente, aplicando
 * primero al LP mas antiguo (por grabadaEn).
 *
 * Body: { fleteroId, liquidacionIds, pagos, gastos?, fecha }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

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

  const parsed = multiLPPagoSchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  try {
    const result = await ejecutarCrearOrdenPago(parsed.data, operadorId)

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    return NextResponse.json({
      ok: true,
      ordenPago: result.result.ordenPago,
    })
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("DUPLICATE_CHEQUE:")) {
      const nro = error.message.split(":")[1]
      return NextResponse.json(
        { error: `El cheque N° ${nro} ya existe para esa cuenta. Verifica el numero.` },
        { status: 409 }
      )
    }
    return serverErrorResponse("POST /api/ordenes-pago", error)
  }
}
