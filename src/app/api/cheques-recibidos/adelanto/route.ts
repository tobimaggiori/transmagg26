/**
 * POST /api/cheques-recibidos/adelanto — Registra un cheque recibido sin factura asociada.
 * Usado cuando se recibe un cheque como adelanto antes de emitir la factura.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const adelantoSchema = z.object({
  empresaId: z.string().uuid(),
  esElectronico: z.boolean().default(false),
  nroCheque: z.string().min(1),
  bancoEmisor: z.string().min(1),
  monto: z.number().positive(),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaCobro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observaciones: z.string().optional().nullable(),
})

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un ChequeRecibido sin facturaId (adelanto o depósito sin factura).
 * Estado inicial: EN_CARTERA.
 *
 * Ejemplos:
 * POST({ empresaId, nroCheque, monto, ... }) => 201 { id, estado: "EN_CARTERA", facturaId: null }
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = adelantoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const empresa = await prisma.empresa.findUnique({ where: { id: parsed.data.empresaId }, select: { id: true } })
    if (!empresa) return notFoundResponse("Empresa")

    const cheque = await prisma.chequeRecibido.create({
      data: {
        empresaId: parsed.data.empresaId,
        facturaId: null,
        esElectronico: parsed.data.esElectronico,
        nroCheque: parsed.data.nroCheque,
        bancoEmisor: parsed.data.bancoEmisor,
        monto: parsed.data.monto,
        fechaEmision: new Date(parsed.data.fechaEmision),
        fechaCobro: new Date(parsed.data.fechaCobro),
        estado: "EN_CARTERA",
        cuitLibrador: parsed.data.observaciones ?? null,
        operadorId,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/adelanto", error)
  }
}
