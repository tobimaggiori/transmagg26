/**
 * POST /api/cheques-recibidos/adelanto — Registra un cheque recibido sin factura asociada.
 * Usado cuando se recibe un cheque como adelanto antes de emitir la factura.
 * Soporta origen Empresa o Proveedor.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import { invalidDataResponse, notFoundResponse, requireFinancialAccess, serverErrorResponse } from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const adelantoSchema = z.object({
  tipoOrigen: z.enum(["EMPRESA", "PROVEEDOR"]),
  empresaId: z.string().uuid().optional(),
  proveedorId: z.string().uuid().optional(),
  esElectronico: z.boolean().default(false),
  nroCheque: z.string().min(1),
  bancoEmisor: z.string().min(1),
  monto: z.number().positive(),
  fechaEmision: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  fechaCobro: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  observaciones: z.string().optional().nullable(),
}).refine(
  (d) => (d.tipoOrigen === "EMPRESA" && !!d.empresaId) || (d.tipoOrigen === "PROVEEDOR" && !!d.proveedorId),
  { message: "Debe indicar empresaId o proveedorId según el tipo de origen" },
)

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un ChequeRecibido sin facturaId (adelanto o depósito sin factura).
 * Estado inicial: EN_CARTERA.
 * Soporta tipoOrigen EMPRESA o PROVEEDOR.
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

    const { tipoOrigen, empresaId, proveedorId, ...chequeData } = parsed.data

    if (tipoOrigen === "EMPRESA") {
      const empresa = await prisma.empresa.findUnique({ where: { id: empresaId! }, select: { id: true } })
      if (!empresa) return notFoundResponse("Empresa")
    } else {
      const proveedor = await prisma.proveedor.findUnique({ where: { id: proveedorId! }, select: { id: true } })
      if (!proveedor) return notFoundResponse("Proveedor")
    }

    const cheque = await prisma.chequeRecibido.create({
      data: {
        empresaId: tipoOrigen === "EMPRESA" ? empresaId! : null,
        proveedorOrigenId: tipoOrigen === "PROVEEDOR" ? proveedorId! : null,
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
