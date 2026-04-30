/**
 * API Route: /api/billeteras-virtuales/[id]
 * GET / PATCH / DELETE (soft) con las mismas reglas que /api/bancos/[id].
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { actualizarBilleteraVirtualSchema } from "@/lib/financial-schemas"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const billetera = await prisma.billeteraVirtual.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!billetera) return notFoundResponse("Billetera virtual")
    return NextResponse.json({
      id: billetera.id,
      nombre: billetera.nombre,
      activa: billetera.activa,
      creadoEn: billetera.creadoEn,
      cuentasCount: billetera._count.cuentas,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/billeteras-virtuales/[id]", error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = actualizarBilleteraVirtualSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.billeteraVirtual.findUnique({ where: { id } })
    if (!existente) return notFoundResponse("Billetera virtual")

    if (parsed.data.nombre && parsed.data.nombre.trim() !== existente.nombre) {
      const nombre = parsed.data.nombre.trim()
      const colision = await prisma.billeteraVirtual.findFirst({
        where: { id: { not: id }, nombre: { equals: nombre, mode: "insensitive" } },
      })
      if (colision) return conflictResponse("Ya existe una billetera virtual con ese nombre")
    }

    const billetera = await prisma.billeteraVirtual.update({
      where: { id },
      data: {
        ...(parsed.data.nombre !== undefined ? { nombre: parsed.data.nombre.trim() } : {}),
        ...(parsed.data.activa !== undefined ? { activa: parsed.data.activa } : {}),
      },
    })
    return NextResponse.json(billetera)
  } catch (error) {
    return serverErrorResponse("PATCH /api/billeteras-virtuales/[id]", error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const billetera = await prisma.billeteraVirtual.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!billetera) return notFoundResponse("Billetera virtual")
    if (billetera._count.cuentas > 0) {
      return conflictResponse(
        "No se puede desactivar: la billetera tiene cuentas asociadas. Primero reasignalas o desactivalas.",
      )
    }
    await prisma.billeteraVirtual.update({ where: { id }, data: { activa: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("DELETE /api/billeteras-virtuales/[id]", error)
  }
}
