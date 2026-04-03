/**
 * POST /api/cheques-recibidos/adelanto — Registra un cheque recibido sin factura asociada.
 * Usado cuando se recibe un cheque como adelanto antes de emitir la factura.
 * Solo soporta origen Empresa.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const adelantoSchema = z.object({
  tipoOrigen: z.literal("EMPRESA"),
  empresaId: z.string().uuid("La empresa es obligatoria"),
  esElectronico: z.boolean().default(false),
  nroCheque: z.string().min(1, "El número de cheque es obligatorio"),
  bancoEmisor: z.string().min(1, "El banco emisor es obligatorio"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de emisión inválida"),
  fechaCobro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha de cobro inválida"),
  observaciones: z.string().optional().nullable(),
})

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un ChequeRecibido sin facturaId (adelanto o depósito sin factura).
 * Estado inicial: EN_CARTERA.
 * Solo soporta tipoOrigen EMPRESA.
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

    const { tipoOrigen: _tipoOrigen, empresaId, ...chequeData } = parsed.data
    void _tipoOrigen

    const empresa = await prisma.empresa.findUnique({ where: { id: empresaId }, select: { id: true } })
    if (!empresa) return notFoundResponse("Empresa")

    const cheque = await prisma.chequeRecibido.create({
      data: {
        empresaId,
        proveedorOrigenId: null,
        facturaId: null,
        esElectronico: chequeData.esElectronico,
        nroCheque: chequeData.nroCheque,
        bancoEmisor: chequeData.bancoEmisor,
        monto: chequeData.monto,
        fechaEmision: new Date(chequeData.fechaEmision),
        fechaCobro: new Date(chequeData.fechaCobro),
        estado: "EN_CARTERA",
        cuitLibrador: chequeData.observaciones ?? null,
        operadorId,
      },
    })

    return NextResponse.json(cheque, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cheques-recibidos/adelanto", error)
  }
}
