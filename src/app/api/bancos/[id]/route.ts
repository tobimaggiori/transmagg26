/**
 * API Route: /api/bancos/[id]
 * GET: devuelve un banco con conteo de cuentas.
 * PATCH: renombra o activa/desactiva.
 * DELETE: desactiva (soft). Rechaza si tiene cuentas asociadas.
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
import { actualizarBancoSchema } from "@/lib/financial-schemas"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const banco = await prisma.banco.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!banco) return notFoundResponse("Banco")
    return NextResponse.json({
      id: banco.id,
      nombre: banco.nombre,
      activo: banco.activo,
      creadoEn: banco.creadoEn,
      cuentasCount: banco._count.cuentas,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/bancos/[id]", error)
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const body = await request.json()
    const parsed = actualizarBancoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const existente = await prisma.banco.findUnique({ where: { id } })
    if (!existente) return notFoundResponse("Banco")

    if (parsed.data.nombre && parsed.data.nombre.trim() !== existente.nombre) {
      const nombre = parsed.data.nombre.trim()
      const colision = await prisma.banco.findFirst({
        where: {
          id: { not: id },
          nombre: { equals: nombre, mode: "insensitive" },
        },
      })
      if (colision) return conflictResponse("Ya existe un banco con ese nombre")
    }

    const banco = await prisma.banco.update({
      where: { id },
      data: {
        ...(parsed.data.nombre !== undefined ? { nombre: parsed.data.nombre.trim() } : {}),
        ...(parsed.data.activo !== undefined ? { activo: parsed.data.activo } : {}),
      },
    })
    return NextResponse.json(banco)
  } catch (error) {
    return serverErrorResponse("PATCH /api/bancos/[id]", error)
  }
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const { id } = await params
    const banco = await prisma.banco.findUnique({
      where: { id },
      include: { _count: { select: { cuentas: true } } },
    })
    if (!banco) return notFoundResponse("Banco")
    if (banco._count.cuentas > 0) {
      return conflictResponse(
        "No se puede desactivar: el banco tiene cuentas asociadas. Primero reasignalas o desactivalas.",
      )
    }
    await prisma.banco.update({ where: { id }, data: { activo: false } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    return serverErrorResponse("DELETE /api/bancos/[id]", error)
  }
}
