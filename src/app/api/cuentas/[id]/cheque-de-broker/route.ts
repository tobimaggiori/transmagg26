/**
 * POST /api/cuentas/[id]/cheque-de-broker
 * Forma B: El broker emite un cheque a Transmagg.
 * Crea un ChequeRecibido con brokerOrigenId y un EGRESO en la cuenta del broker.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  badRequestResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const schema = z.object({
  nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
  bancoEmisor: z.string().min(1, "El banco emisor es obligatorio"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fechaEmision: z.string().min(1, "La fecha de emisión es obligatoria"),
  fechaCobro: z.string().min(1, "La fecha de cobro es obligatoria"),
})

/**
 * POST: NextRequest { params: { id: string (broker Cuenta ID) } } -> Promise<NextResponse>
 *
 * Dado [el id de la cuenta broker y los datos del cheque],
 * crea un ChequeRecibido con brokerOrigenId y un EGRESO en la cuenta broker.
 *
 * Ejemplos:
 * POST(req, { params: { id: "cuentaBrokerId" } }) === { cheque, movimiento }
 * POST(req, { params: { id: "noexiste" } }) === { error: "Cuenta broker no encontrada" }
 */
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
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  try {
    const { id } = await params
    const body = await request.json()
    const parsed = schema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const { nroCheque, bancoEmisor, monto, fechaEmision, fechaCobro } = parsed.data

    const cuentaBroker = await prisma.cuenta.findUnique({ where: { id } })
    if (!cuentaBroker) return notFoundResponse("Cuenta broker")
    if (cuentaBroker.tipo !== "BROKER") return badRequestResponse("La cuenta debe ser de tipo BROKER")

    const broker = await prisma.broker.findUnique({ where: { cuentaId: id } })
    if (!broker) return notFoundResponse("Broker")

    const [cheque, movimiento] = await prisma.$transaction([
      prisma.chequeRecibido.create({
        data: {
          empresaId: null,
          brokerOrigenId: broker.id,
          nroCheque,
          bancoEmisor,
          monto,
          fechaEmision: new Date(fechaEmision),
          fechaCobro: new Date(fechaCobro),
          estado: "EN_CARTERA",
          operadorId,
        },
      }),
      prisma.movimientoSinFactura.create({
        data: {
          cuentaId: id,
          tipo: "EGRESO",
          categoria: "RESCATE_DE_BROKER",
          monto,
          fecha: new Date(fechaCobro),
          descripcion: `Cheque emitido por broker — Nro ${nroCheque}`,
          operadorId,
        },
      }),
    ])

    return NextResponse.json({ cheque, movimiento }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cuentas/[id]/cheque-de-broker", error)
  }
}
