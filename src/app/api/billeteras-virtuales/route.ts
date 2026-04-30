/**
 * API Route: /api/billeteras-virtuales
 * GET: lista billeteras virtuales maestras con conteo de cuentas.
 * POST: crea una billetera virtual nueva (valida unicidad de nombre).
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearBilleteraVirtualSchema } from "@/lib/financial-schemas"

export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const billeteras = await prisma.billeteraVirtual.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    })
    return NextResponse.json(
      billeteras.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        activa: b.activa,
        creadoEn: b.creadoEn,
        cuentasCount: b._count.cuentas,
      })),
    )
  } catch (error) {
    return serverErrorResponse("GET /api/billeteras-virtuales", error)
  }
}

export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response
  try {
    const body = await request.json()
    const parsed = crearBilleteraVirtualSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const nombre = parsed.data.nombre.trim()
    const existente = await prisma.billeteraVirtual.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    })
    if (existente) return conflictResponse("Ya existe una billetera virtual con ese nombre")

    const billetera = await prisma.billeteraVirtual.create({ data: { nombre } })
    return NextResponse.json(billetera, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/billeteras-virtuales", error)
  }
}
