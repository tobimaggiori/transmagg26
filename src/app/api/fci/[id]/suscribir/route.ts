/**
 * POST /api/fci/[id]/suscribir
 * Suscripción a un FCI: debita la cuenta bancaria y acredita el FCI.
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
 * Dado [el id del FCI, la cuenta bancaria origen, el monto y la fecha],
 * crea un EGRESO en la cuenta banco, un MovimientoFci SUSCRIPCION y actualiza saldoActual del FCI.
 *
 * Ejemplos:
 * POST(req, { params: { id: "fciId" } }) === { movimientoFci, movimientoBanco }
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

    const fechaDate = new Date(fecha)

    const [movimientoBanco, movimientoFci] = await prisma.$transaction([
      prisma.movimientoSinFactura.create({
        data: {
          cuentaId,
          tipo: "EGRESO",
          categoria: "ENVIO_A_BROKER",
          monto,
          fecha: fechaDate,
          descripcion: `Suscripción FCI ${fci.nombre}`,
          operadorId,
        },
      }),
      prisma.movimientoFci.create({
        data: {
          fciId: id,
          cuentaOrigenDestinoId: cuentaId,
          tipo: "SUSCRIPCION",
          monto,
          fecha: fechaDate,
          descripcion: `Suscripción desde ${cuentaBanco.nombre}`,
          operadorId,
        },
      }),
      prisma.fci.update({
        where: { id },
        data: {
          saldoActual: { increment: monto },
          saldoActualizadoEn: fechaDate,
        },
      }),
    ])

    return NextResponse.json({ movimientoFci, movimientoBanco }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/fci/[id]/suscribir", error)
  }
}
