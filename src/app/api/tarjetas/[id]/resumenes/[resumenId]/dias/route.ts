/**
 * POST /api/tarjetas/[id]/resumenes/[resumenId]/dias — concilia día del resumen (upsert).
 * DELETE ?fecha=YYYY-MM-DD — desconcilia el día.
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

const postSchema = z.object({
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha YYYY-MM-DD"),
  saldoResumen: z.number(),
})

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> },
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
    const { id: tarjetaId, resumenId } = await params

    const resumen = await prisma.resumenTarjeta.findUnique({
      where: { id: resumenId },
      select: {
        id: true,
        tarjetaId: true,
        periodoDesde: true,
        periodoHasta: true,
        estado: true,
      },
    })
    if (!resumen || resumen.tarjetaId !== tarjetaId) return notFoundResponse("Resumen de tarjeta")
    if (resumen.estado === "CONCILIADO") {
      return badRequestResponse("El resumen está cerrado. Reabrilo para modificar días.")
    }
    if (!resumen.periodoDesde || !resumen.periodoHasta) {
      return badRequestResponse("El resumen no tiene período definido (desde/hasta).")
    }

    const body = await request.json()
    const parsed = postSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const fecha = new Date(`${parsed.data.fecha}T00:00:00Z`)
    if (fecha < resumen.periodoDesde || fecha > resumen.periodoHasta) {
      return badRequestResponse("La fecha no corresponde al período del resumen")
    }

    const dia = await prisma.conciliacionDiaTarjeta.upsert({
      where: { resumenTarjetaId_fecha: { resumenTarjetaId: resumenId, fecha } },
      create: {
        resumenTarjetaId: resumenId,
        fecha,
        saldoResumen: parsed.data.saldoResumen,
        operadorId,
      },
      update: {
        saldoResumen: parsed.data.saldoResumen,
        conciliadoEn: new Date(),
        operadorId,
      },
    })

    if (resumen.estado === "PENDIENTE") {
      await prisma.resumenTarjeta.update({
        where: { id: resumenId },
        data: { estado: "EN_CURSO" },
      })
    }

    return NextResponse.json(dia, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/tarjetas/[id]/resumenes/[resumenId]/dias", error)
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> },
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id: tarjetaId, resumenId } = await params
    const { searchParams } = new URL(request.url)
    const fechaStr = searchParams.get("fecha")
    if (!fechaStr || !/^\d{4}-\d{2}-\d{2}$/.test(fechaStr)) {
      return badRequestResponse("Query param 'fecha' requerido (YYYY-MM-DD)")
    }

    const resumen = await prisma.resumenTarjeta.findUnique({
      where: { id: resumenId },
      select: { id: true, tarjetaId: true, estado: true },
    })
    if (!resumen || resumen.tarjetaId !== tarjetaId) return notFoundResponse("Resumen de tarjeta")
    if (resumen.estado === "CONCILIADO") {
      return badRequestResponse("El resumen está cerrado. Reabrilo para modificar días.")
    }

    const fecha = new Date(`${fechaStr}T00:00:00Z`)
    await prisma.conciliacionDiaTarjeta.deleteMany({
      where: { resumenTarjetaId: resumenId, fecha },
    })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("DELETE /api/tarjetas/[id]/resumenes/[resumenId]/dias", error)
  }
}
