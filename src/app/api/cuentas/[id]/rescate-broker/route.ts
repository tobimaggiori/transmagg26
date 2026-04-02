/**
 * POST /api/cuentas/[id]/rescate-broker
 * Forma A: El broker devuelve fondos por transferencia.
 * Crea un EGRESO en la cuenta del broker y un INGRESO en la cuenta destino.
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
  cuentaDestinoId: z.string().uuid("Cuenta destino inválida"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
  referencia: z.string().nullable().optional(),
})

/**
 * POST: NextRequest { params: { id: string (broker Cuenta ID) } } -> Promise<NextResponse>
 *
 * Dado [el id de la cuenta broker, la cuenta destino, el monto y la fecha],
 * crea un EGRESO en la cuenta broker y un INGRESO en la cuenta destino.
 *
 * Ejemplos:
 * POST(req, { params: { id: "cuentaBrokerId" } }) === { movimientoBroker, movimientoDestino }
 * POST(req, { params: { id: "noexiste" } }) === { error: "Cuenta no encontrada" }
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

    const { cuentaDestinoId, monto, fecha, referencia } = parsed.data

    const [cuentaBroker, cuentaDestino] = await Promise.all([
      prisma.cuenta.findUnique({ where: { id } }),
      prisma.cuenta.findUnique({ where: { id: cuentaDestinoId } }),
    ])

    if (!cuentaBroker) return notFoundResponse("Cuenta broker")
    if (cuentaBroker.tipo !== "BROKER") return badRequestResponse("La cuenta debe ser de tipo BROKER")
    if (!cuentaDestino) return notFoundResponse("Cuenta destino")

    const fechaDate = new Date(fecha)

    const [movimientoBroker, movimientoDestino] = await prisma.$transaction([
      prisma.movimientoSinFactura.create({
        data: {
          cuentaId: id,
          tipo: "EGRESO",
          categoria: "RESCATE_DE_BROKER",
          monto,
          fecha: fechaDate,
          descripcion: `Transferencia a ${cuentaDestino.nombre}`,
          referencia: referencia ?? null,
          operadorId,
        },
      }),
      prisma.movimientoSinFactura.create({
        data: {
          cuentaId: cuentaDestinoId,
          tipo: "INGRESO",
          categoria: "RESCATE_DE_BROKER",
          monto,
          fecha: fechaDate,
          descripcion: `Rescate desde broker — ${cuentaBroker.nombre}`,
          referencia: referencia ?? null,
          operadorId,
        },
      }),
    ])

    return NextResponse.json({ movimientoBroker, movimientoDestino }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cuentas/[id]/rescate-broker", error)
  }
}
