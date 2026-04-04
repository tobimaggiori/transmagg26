/**
 * GET /api/cuentas/[id]/movimientos — Lista movimientos de una cuenta con saldo running.
 * POST /api/cuentas/[id]/movimientos — Crea un movimiento manual vinculado a la cuenta.
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
import { sumarImportes, restarImportes } from "@/lib/money"

const crearMovimientoSchema = z.object({
  tipo: z.enum(["INGRESO", "EGRESO"]),
  categoria: z.string().min(1, "Categoría requerida"),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Fecha inválida (YYYY-MM-DD)"),
  descripcion: z.string().min(1, "Descripción requerida"),
  referencia: z.string().optional().nullable(),
  comprobanteS3Key: z.string().optional().nullable(),
})

/**
 * GET: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de una cuenta y filtros opcionales (tipo, categoria, desde, hasta, page, limit),
 * devuelve los movimientos paginados con saldo running calculado desde saldoInicial.
 * El saldo running refleja el balance real de la cuenta en ese momento (incluyendo todos
 * los movimientos, no solo los del filtro actual).
 *
 * Ejemplos:
 * GET(/api/cuentas/c1/movimientos) === { movimientos: [...], total, totalDebitos, totalCreditos }
 * GET(...?tipo=EGRESO&desde=2026-03-01) === movimientos filtrados con saldo running real
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { id } = await params
    const { searchParams } = new URL(request.url)
    const tipo = searchParams.get("tipo") ?? undefined
    const categoria = searchParams.get("categoria") ?? undefined
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))

    const cuenta = await prisma.cuenta.findUnique({
      where: { id },
      select: { id: true, saldoInicial: true },
    })
    if (!cuenta) return notFoundResponse("Cuenta")

    // Load ALL movements to compute running saldo accurately (regardless of filters)
    const todosLosMovimientos = await prisma.movimientoSinFactura.findMany({
      where: { cuentaId: id },
      select: { id: true, tipo: true, monto: true },
      orderBy: [{ fecha: "asc" }, { creadoEn: "asc" }],
    })

    let saldoAcumulado = cuenta.saldoInicial
    const saldoPorId = new Map<string, number>()
    for (const mov of todosLosMovimientos) {
      if (mov.tipo === "INGRESO") saldoAcumulado = sumarImportes([saldoAcumulado, mov.monto])
      else saldoAcumulado = restarImportes(saldoAcumulado, mov.monto)
      saldoPorId.set(mov.id, saldoAcumulado)
    }

    const where = {
      cuentaId: id,
      ...(tipo ? { tipo } : {}),
      ...(categoria ? { categoria: { contains: categoria } } : {}),
      ...(desde || hasta
        ? {
            fecha: {
              ...(desde ? { gte: new Date(desde) } : {}),
              ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
            },
          }
        : {}),
    }

    const [total, movimientos] = await Promise.all([
      prisma.movimientoSinFactura.count({ where }),
      prisma.movimientoSinFactura.findMany({
        where,
        include: {
          operador: { select: { nombre: true, apellido: true } },
        },
        orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    const movimientosConSaldo = movimientos.map((m) => ({
      ...m,
      saldoDespues: saldoPorId.get(m.id) ?? null,
    }))

    const totalDebitos = sumarImportes(
      movimientos.filter((m) => m.tipo === "EGRESO").map((m) => m.monto)
    )
    const totalCreditos = sumarImportes(
      movimientos.filter((m) => m.tipo === "INGRESO").map((m) => m.monto)
    )

    return NextResponse.json({
      movimientos: movimientosConSaldo,
      total,
      page,
      limit,
      totalDebitos,
      totalCreditos,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/cuentas/[id]/movimientos", error)
  }
}

/**
 * POST: NextRequest, { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la cuenta y el body del movimiento, crea un MovimientoSinFactura
 * vinculado a esta cuenta.
 *
 * Ejemplos:
 * POST({ tipo: "EGRESO", categoria: "COMBUSTIBLE", monto: 5000, fecha: "2026-03-15", descripcion: "YPF" })
 * => 201 { id, cuentaId, tipo, categoria, monto }
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
    const parsed = crearMovimientoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const { fecha, ...rest } = parsed.data
    const movimiento = await prisma.movimientoSinFactura.create({
      data: {
        ...rest,
        cuentaId,
        fecha: new Date(fecha),
        operadorId,
        referencia: rest.referencia ?? null,
        comprobanteS3Key: rest.comprobanteS3Key ?? null,
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/cuentas/[id]/movimientos", error)
  }
}
