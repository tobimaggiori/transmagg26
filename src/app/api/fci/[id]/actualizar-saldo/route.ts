import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const actualizarSaldoFciBodySchema = z.object({
  saldoNuevo: z.number(),
  fechaConsulta: z.string().min(1, "La fecha es obligatoria"),
})

/**
 * POST: NextRequest { params: { id: string } } -> Promise<NextResponse>
 *
 * Dado [el id de un FCI, el nuevo saldo y la fecha de consulta], actualiza saldoActual y saldoActualizadoEn
 * en el FCI y crea un registro SaldoFci con el rendimientoPeriodo calculado.
 * Esta función existe para actualizar el saldo visible de un FCI desde la UI de brokers.
 *
 * Ejemplos:
 * POST(request, { params: { id: "f1" } }) === NextResponse.json({ fci, saldoFci }, { status: 201 })
 * POST(request, { params: { id: "noexiste" } }) === NextResponse.json({ error: "FCI no encontrado" }, { status: 404 })
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
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
    const body = await request.json()
    const parsed = actualizarSaldoFciBodySchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const fciExistente = await prisma.fci.findUnique({
      where: { id: params.id },
    })
    if (!fciExistente) return notFoundResponse("FCI")

    const saldoAnterior = fciExistente.saldoActual
    const fechaActualizacion = new Date(parsed.data.fechaConsulta)

    const [fci, saldoFci] = await prisma.$transaction([
      prisma.fci.update({
        where: { id: params.id },
        data: {
          saldoActual: parsed.data.saldoNuevo,
          saldoActualizadoEn: fechaActualizacion,
        },
      }),
      prisma.saldoFci.create({
        data: {
          fciId: params.id,
          saldoInformado: parsed.data.saldoNuevo,
          fechaActualizacion,
          rendimientoPeriodo: parsed.data.saldoNuevo - saldoAnterior,
          operadorId,
        },
      }),
    ])

    return NextResponse.json({ fci, saldoFci }, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/fci/[id]/actualizar-saldo", error)
  }
}
