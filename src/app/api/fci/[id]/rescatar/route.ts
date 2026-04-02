/**
 * POST /api/fci/[id]/rescatar
 * Rescate de un FCI: acredita la cuenta bancaria y debita el FCI.
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
  cuentaId: z.string().uuid("Cuenta bancaria inválida"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
})

/**
 * POST: NextRequest { params: { id: string (FCI id) } } -> Promise<NextResponse>
 *
 * Dado [el id del FCI, la cuenta bancaria destino, el monto y la fecha],
 * valida que haya saldo suficiente, crea un INGRESO en la cuenta banco,
 * un MovimientoFci RESCATE y actualiza saldoActual del FCI.
 *
 * Ejemplos:
 * POST(req, { params: { id: "fciId" } }) === { movimientoFci, movimientoBanco }
 * POST(req, { params: { id: "fciId" } }) === { error: "Saldo insuficiente en el FCI" }
 * POST(req, { params: { id: "noexiste" } }) === { error: "FCI no encontrado" }
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

    const { cuentaId, monto, fecha } = parsed.data

    const [fci, cuentaBanco] = await Promise.all([
      prisma.fci.findUnique({ where: { id } }),
      prisma.cuenta.findUnique({ where: { id: cuentaId } }),
    ])

    if (!fci) return notFoundResponse("FCI")
    if (!cuentaBanco) return notFoundResponse("Cuenta bancaria")
    if (cuentaBanco.tipo !== "BANCO") return badRequestResponse("La cuenta debe ser de tipo BANCO")
    if (monto > fci.saldoActual) return badRequestResponse("Saldo insuficiente en el FCI")

    const fechaDate = new Date(fecha)

    const [movimientoBanco, movimientoFci] = await prisma.$transaction([
      prisma.movimientoSinFactura.create({
        data: {
          cuentaId,
          tipo: "INGRESO",
          categoria: "RESCATE_DE_BROKER",
          monto,
          fecha: fechaDate,
          descripcion: `Rescate FCI ${fci.nombre}`,
          operadorId,
        },
      }),
      prisma.movimientoFci.create({
        data: {
          fciId: id,
          cuentaOrigenDestinoId: cuentaId,
          tipo: "RESCATE",
          monto,
          fecha: fechaDate,
          descripcion: `Rescate a ${cuentaBanco.nombre}`,
          operadorId,
        },
      }),
      prisma.fci.update({
        where: { id },
        data: {
          saldoActual: { decrement: monto },
          saldoActualizadoEn: fechaDate,
        },
      }),
    ])

    return NextResponse.json({ movimientoFci, movimientoBanco }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/fci/[id]/rescatar", error)
  }
}
