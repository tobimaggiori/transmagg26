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
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

const schema = z.object({
  cuentaId: z.string().uuid("Cuenta bancaria inválida"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().min(1, "La fecha es obligatoria"),
})

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
      prisma.fci.findUnique({ where: { id }, include: { cuenta: true } }),
      prisma.cuenta.findUnique({ where: { id: cuentaId } }),
    ])

    if (!fci) return notFoundResponse("FCI")
    if (!cuentaBanco) return notFoundResponse("Cuenta")
    if (!cuentaBanco.activa) return badRequestResponse("La cuenta está inactiva")

    // FCI de banco/billetera: la cuenta destino debe ser la propia del FCI.
    // FCI de broker: el operador puede rescatar hacia cualquier cuenta activa.
    if (fci.cuenta.tipo !== "BROKER" && cuentaId !== fci.cuentaId) {
      return badRequestResponse("Para FCIs bancarios el rescate debe ir a la cuenta asociada al FCI")
    }

    if (monto > Number(fci.saldoActual)) return badRequestResponse("Saldo insuficiente en el FCI")

    const fechaDate = new Date(fecha)

    const resultado = await prisma.$transaction(async (tx) => {
      const movimientoFci = await tx.movimientoFci.create({
        data: {
          fciId: id,
          cuentaOrigenDestinoId: cuentaId,
          tipo: "RESCATE",
          monto,
          fecha: fechaDate,
          descripcion: `Rescate a ${cuentaBanco.nombre}`,
          operadorId,
        },
      })
      await tx.fci.update({
        where: { id },
        data: {
          saldoActual: { decrement: monto },
          saldoActualizadoEn: fechaDate,
        },
      })
      const movimientoBanco = await registrarMovimiento(tx, {
        cuentaId,
        tipo: "INGRESO",
        categoria: "RESCATE_FCI",
        monto,
        fecha: fechaDate,
        descripcion: `Rescate FCI ${fci.nombre}`,
        movimientoFciId: movimientoFci.id,
        operadorCreacionId: operadorId,
      })
      return { movimientoFci, movimientoBanco }
    })

    return NextResponse.json(resultado, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("POST /api/fci/[id]/rescatar", error)
  }
}
