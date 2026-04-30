/**
 * POST   /api/cuentas/[id]/conciliacion/dia  — Sella (o actualiza) el ConciliacionDia
 *                                               para (cuentaId, fecha) con el saldo del extracto.
 * DELETE /api/cuentas/[id]/conciliacion/dia?fecha=YYYY-MM-DD  — Desella ese día.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

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
import { sellarDia, desellarDia } from "@/lib/conciliacion"

const sellarSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  saldoExtracto: z.number(),
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
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const { id: cuentaId } = await params
    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      select: { id: true, activa: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se puede conciliar." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = sellarSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const r = await sellarDia({
      cuentaId,
      fecha: new Date(parsed.data.fecha),
      saldoExtracto: parsed.data.saldoExtracto,
      operadorId,
    })
    return NextResponse.json(r, { status: 200 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("POST /api/cuentas/[id]/conciliacion/dia", error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: cuentaId } = await params
    const { searchParams } = new URL(request.url)
    const fecha = searchParams.get("fecha")
    if (!fecha || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
      return NextResponse.json({ error: "fecha requerida (YYYY-MM-DD)" }, { status: 400 })
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      select: { id: true, activa: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se puede desconciliar." },
        { status: 400 }
      )
    }

    const elim = await desellarDia({ cuentaId, fecha: new Date(fecha) })
    return NextResponse.json({ eliminado: elim })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("DELETE /api/cuentas/[id]/conciliacion/dia", error)
  }
}
