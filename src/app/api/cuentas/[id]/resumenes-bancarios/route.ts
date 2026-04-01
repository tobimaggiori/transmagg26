/**
 * GET /api/cuentas/[id]/resumenes-bancarios — Lista resúmenes bancarios de una cuenta.
 * POST /api/cuentas/[id]/resumenes-bancarios — Crea un resumen bancario mensual.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  conflictResponse,
  invalidDataResponse,
  notFoundResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const crearResumenSchema = z.object({
  mes: z.number().int().min(1).max(12),
  anio: z.number().int().min(2020).max(2100),
})

/**
 * GET: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de una cuenta, devuelve todos sus resúmenes bancarios ordenados por anio/mes desc.
 *
 * Ejemplos:
 * GET(/api/cuentas/c1/resumenes-bancarios) === { resumenes: [{ id, mes, anio, estado, pdfS3Key }] }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params

    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      select: { id: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")

    const resumenes = await prisma.resumenBancario.findMany({
      where: { cuentaId: id },
      include: {
        operador: { select: { nombre: true, apellido: true } },
      },
      orderBy: [{ anio: "desc" }, { mes: "desc" }],
    })

    return NextResponse.json({ resumenes })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]/resumenes-bancarios", error)
  }
}

/**
 * POST: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y { mes, anio }, crea un ResumenBancario en estado PENDIENTE.
 * Falla con 409 si ya existe uno para ese mes/año en esa cuenta.
 *
 * Ejemplos:
 * POST({ mes: 3, anio: 2026 }) => 201 { id, cuentaId, mes, anio, estado: "PENDIENTE" }
 * POST({ mes: 3, anio: 2026 }) (duplicado) => 409
 */
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
      select: { id: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")

    const body = await request.json()
    const parsed = crearResumenSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const { mes, anio } = parsed.data

    const existente = await prisma.resumenBancario.findUnique({
      where: { cuentaId_mes_anio: { cuentaId, mes, anio } },
    })
    if (existente) return conflictResponse(`Ya existe un resumen para ${mes}/${anio} en esta cuenta`)

    const resumen = await prisma.resumenBancario.create({
      data: { cuentaId, mes, anio, operadorId },
    })

    return NextResponse.json(resumen, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cuentas/[id]/resumenes-bancarios", error)
  }
}
