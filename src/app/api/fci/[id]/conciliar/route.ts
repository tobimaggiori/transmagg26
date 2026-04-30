/**
 * POST /api/fci/[id]/conciliar
 *
 * Conciliación diaria del saldo de un FCI:
 *   interés = nuevoSaldo − (saldoAnteriorInformado + ΣSuscripciones − ΣRescates)
 *                                                    [movimientos entre ambas fechas]
 *
 * - `saldoAnteriorInformado`: el saldoInformado del último `SaldoFci`.
 *   Si no hay ninguno, se toma 0 (o el saldo inicial cargado al alta, que
 *   quedó guardado como primer SaldoFci).
 * - Los movimientos considerados son los que tienen fecha > última conciliación
 *   y fecha <= fecha de la nueva conciliación.
 * - Permite rendimiento negativo (warning lo gestiona el cliente).
 *
 * Crea una fila en `SaldoFci` con el nuevo saldo, fecha y rendimiento calculado.
 * NO modifica `fci.saldoActual` (ese campo refleja saldo contable derivado de
 * suscripciones/rescates; la conciliación sólo informa el saldo "real" reportado
 * por el FCI para auditoría y cálculo de intereses).
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
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  saldoInformado: z.number().min(0, "El saldo no puede ser negativo"),
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

    const { fecha, saldoInformado } = parsed.data
    const fechaDate = new Date(fecha + "T12:00:00")

    const fci = await prisma.fci.findUnique({ where: { id } })
    if (!fci) return notFoundResponse("FCI")

    // Último SaldoFci informado (si existe)
    const saldoAnterior = await prisma.saldoFci.findFirst({
      where: { fciId: id },
      orderBy: { fechaActualizacion: "desc" },
    })

    // Evitar conciliar hacia atrás
    if (saldoAnterior && fechaDate <= saldoAnterior.fechaActualizacion) {
      return badRequestResponse(
        `La fecha de conciliación debe ser posterior a la última (${saldoAnterior.fechaActualizacion.toISOString().slice(0, 10)})`
      )
    }

    const fechaDesde = saldoAnterior?.fechaActualizacion ?? new Date(0)

    // Movimientos en el período (no inclusivo del saldo anterior, inclusivo del hoy)
    const movimientos = await prisma.movimientoFci.findMany({
      where: {
        fciId: id,
        fecha: { gt: fechaDesde, lte: fechaDate },
      },
      select: { tipo: true, monto: true },
    })

    const suscripciones = movimientos
      .filter((m) => m.tipo === "SUSCRIPCION")
      .reduce((acc, m) => acc + Number(m.monto), 0)
    const rescates = movimientos
      .filter((m) => m.tipo === "RESCATE")
      .reduce((acc, m) => acc + Number(m.monto), 0)

    const base = Number(saldoAnterior?.saldoInformado ?? 0) + suscripciones - rescates
    const rendimiento = saldoInformado - base

    const saldo = await prisma.saldoFci.create({
      data: {
        fciId: id,
        saldoInformado,
        fechaActualizacion: fechaDate,
        rendimientoPeriodo: rendimiento,
        operadorId,
      },
    })

    return NextResponse.json(
      {
        saldo,
        calculo: {
          saldoAnterior: Number(saldoAnterior?.saldoInformado ?? 0),
          fechaSaldoAnterior: saldoAnterior?.fechaActualizacion ?? null,
          suscripciones,
          rescates,
          rendimiento,
          esNegativo: rendimiento < 0,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    return serverErrorResponse("POST /api/fci/[id]/conciliar", error)
  }
}
