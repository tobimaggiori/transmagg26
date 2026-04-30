/**
 * POST   /api/cuentas/[id]/conciliacion/cierre  — Cierra el mes (mes, anio). Valida
 *                                                  que todos los días con movimientos tengan
 *                                                  ConciliacionDia. Acepta PDF del extracto.
 * DELETE /api/cuentas/[id]/conciliacion/cierre?mes=4&anio=2026  — Reabre el mes.
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
import { cerrarMes, reabrirMes } from "@/lib/conciliacion"

const cerrarSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2000).max(2100),
  pdfExtractoKey: z.string().nullable().optional(),
  observaciones: z.string().nullable().optional(),
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
        { error: "La cuenta está cerrada. No se puede cerrar el mes." },
        { status: 400 }
      )
    }

    const body = await request.json()
    const parsed = cerrarSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const r = await cerrarMes({
      cuentaId,
      mes: parsed.data.mes,
      anio: parsed.data.anio,
      operadorId,
      pdfExtractoKey: parsed.data.pdfExtractoKey ?? null,
      observaciones: parsed.data.observaciones ?? null,
    })
    return NextResponse.json(r, { status: 201 })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("POST /api/cuentas/[id]/conciliacion/cierre", error)
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
    const mes = parseInt(searchParams.get("mes") ?? "", 10)
    const anio = parseInt(searchParams.get("anio") ?? "", 10)
    if (Number.isNaN(mes) || Number.isNaN(anio)) {
      return NextResponse.json({ error: "mes y anio requeridos" }, { status: 400 })
    }

    const cuenta = await prisma.cuenta.findUnique({
      where: { id: cuentaId },
      select: { id: true, activa: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")
    if (!cuenta.activa) {
      return NextResponse.json(
        { error: "La cuenta está cerrada. No se puede reabrir el mes." },
        { status: 400 }
      )
    }

    const reabierto = await reabrirMes({ cuentaId, mes, anio })
    return NextResponse.json({ reabierto })
  } catch (error) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }
    return serverErrorResponse("DELETE /api/cuentas/[id]/conciliacion/cierre", error)
  }
}
