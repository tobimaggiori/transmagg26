/**
 * API Route: /api/brokers/[id]
 * GET / PATCH / DELETE (soft) del broker maestro.
 * Rechaza DELETE si el broker tiene cuentas asociadas.
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
import { actualizarBrokerSchema } from "@/lib/financial-schemas"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const broker = await prisma.broker.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!broker) return notFoundResponse("Broker")
    return NextResponse.json({
      id: broker.id,
      nombre: broker.nombre,
      cuit: broker.cuit,
      activo: broker.activo,
      creadoEn: broker.creadoEn,
      cuentasCount: broker._count.cuentas,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/brokers/[id]", error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = actualizarBrokerSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.broker.findUnique({ where: { id } })
    if (!existente) return notFoundResponse("Broker")

    if (parsed.data.nombre || parsed.data.cuit) {
      const duplicado = await prisma.broker.findFirst({
        where: {
          id: { not: id },
          OR: [
            ...(parsed.data.nombre
              ? [{ nombre: { equals: parsed.data.nombre.trim(), mode: "insensitive" as const } }]
              : []),
            ...(parsed.data.cuit ? [{ cuit: parsed.data.cuit }] : []),
          ],
        },
      })
      if (duplicado) return conflictResponse("Ya existe un broker con ese nombre o CUIT")
    }

    const broker = await prisma.broker.update({
      where: { id },
      data: {
        ...(parsed.data.nombre !== undefined ? { nombre: parsed.data.nombre.trim() } : {}),
        ...(parsed.data.cuit !== undefined ? { cuit: parsed.data.cuit } : {}),
        ...(parsed.data.activo !== undefined ? { activo: parsed.data.activo } : {}),
      },
    })
    return NextResponse.json(broker)
  } catch (error) {
    return serverErrorResponse("PATCH /api/brokers/[id]", error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const broker = await prisma.broker.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!broker) return notFoundResponse("Broker")
    if (broker._count.cuentas > 0) {
      return conflictResponse(
        "No se puede desactivar: el broker tiene cuentas asociadas. Primero reasignalas o desactivalas.",
      )
    }
    await prisma.broker.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("DELETE /api/brokers/[id]", error)
  }
}
