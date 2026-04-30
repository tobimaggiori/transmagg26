/**
 * API Route: /api/bancos
 * GET: lista todos los bancos (activos e inactivos) con conteo de cuentas.
 * POST: crea un banco nuevo validando unicidad de nombre.
 * Solo accesible para roles internos.
 */

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { crearBancoSchema } from "@/lib/financial-schemas"

/**
 * GET: -> Promise<NextResponse>
 *
 * Devuelve los bancos con `cuentasCount` (número de cuentas asociadas)
 * ordenados alfabéticamente por nombre.
 *
 * Ejemplos:
 * GET /api/bancos === 200 [{ id, nombre: "Banco Galicia", activo: true, cuentasCount: 2 }]
 * GET /api/bancos (sin sesión) === 401
 */
export async function GET() {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const bancos = await prisma.banco.findMany({
      orderBy: { nombre: "asc" },
      include: { _count: { select: { cuentas: true } } },
    })
    return NextResponse.json(
      bancos.map((b) => ({
        id: b.id,
        nombre: b.nombre,
        activo: b.activo,
        creadoEn: b.creadoEn,
        cuentasCount: b._count.cuentas,
      })),
    )
  } catch (error) {
    return serverErrorResponse("GET /api/bancos", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Crea un banco nuevo. Valida unicidad case-insensitive del nombre.
 *
 * Ejemplos:
 * POST { nombre: "Banco Galicia" } === 201 { id, nombre, activo: true }
 * POST { nombre: "" } === 400 datos inválidos
 * POST { nombre: "Banco Galicia" } (duplicado) === 409
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const body = await request.json()
    const parsed = crearBancoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const nombre = parsed.data.nombre.trim()
    const existente = await prisma.banco.findFirst({
      where: { nombre: { equals: nombre, mode: "insensitive" } },
    })
    if (existente) return conflictResponse("Ya existe un banco con ese nombre")

    const banco = await prisma.banco.create({ data: { nombre } })
    return NextResponse.json(banco, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/bancos", error)
  }
}
