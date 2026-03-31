/**
 * API Route para movimientos sin factura.
 * GET /api/movimientos-sin-factura - Lista movimientos con filtros opcionales.
 * POST /api/movimientos-sin-factura - Crea un nuevo movimiento.
 *
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  invalidDataResponse,
  requireFinancialAccess,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

const crearMovimientoSchema = z.object({
  cuentaId: z.string().min(1),
  tipo: z.enum(["INGRESO", "EGRESO"]),
  categoria: z.string().min(1),
  monto: z.number().positive("El monto debe ser mayor a 0"),
  fecha: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  descripcion: z.string().min(1),
  referencia: z.string().optional(),
  comprobanteS3Key: z.string().optional(),
  cuentaDestinoId: z.string().optional(),
  tarjetaId: z.string().optional(),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado [filtros opcionales cuentaId, tipo, categoria, desde, hasta, page, limit],
 * devuelve [lista paginada de movimientos sin factura con operador y cuenta].
 *
 * Ejemplos:
 * GET(?cuentaId=c1) === NextResponse.json({ movimientos: [...], total: 12 })
 * GET(?tipo=EGRESO&desde=2026-03-01) === NextResponse.json({ movimientos: [...], total: 5 })
 */
export async function GET(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  try {
    const { searchParams } = new URL(request.url)
    const cuentaId = searchParams.get("cuentaId") ?? undefined
    const tipo = searchParams.get("tipo") ?? undefined
    const categoria = searchParams.get("categoria") ?? undefined
    const desde = searchParams.get("desde") ?? undefined
    const hasta = searchParams.get("hasta") ?? undefined
    const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10))
    const limit = Math.min(200, Math.max(1, parseInt(searchParams.get("limit") ?? "50", 10)))

    const where = {
      ...(cuentaId ? { cuentaId } : {}),
      ...(tipo ? { tipo } : {}),
      ...(categoria ? { categoria } : {}),
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(hasta + "T23:59:59.999Z") } : {}),
        },
      } : {}),
    }

    const [total, movimientos] = await Promise.all([
      prisma.movimientoSinFactura.count({ where }),
      prisma.movimientoSinFactura.findMany({
        where,
        include: {
          cuenta: { select: { id: true, nombre: true } },
          cuentaDestino: { select: { id: true, nombre: true } },
          tarjeta: { select: { id: true, nombre: true } },
          operador: { select: { id: true, nombre: true, apellido: true } },
        },
        orderBy: [{ fecha: "desc" }, { creadoEn: "desc" }],
        skip: (page - 1) * limit,
        take: limit,
      }),
    ])

    return NextResponse.json({ movimientos, total, page, limit })
  } catch (error) {
    return serverErrorResponse("GET /api/movimientos-sin-factura", error)
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado [un body con cuentaId, tipo, categoria, monto, fecha, descripcion y opcionales],
 * devuelve [el movimiento creado].
 *
 * Ejemplos:
 * POST({ cuentaId: "c1", tipo: "INGRESO", categoria: "TRANSFERENCIA_RECIBIDA", monto: 5000, fecha: "2026-03-15", descripcion: "Cobro" })
 * // => 201 { id, cuentaId, tipo, categoria, monto, fecha }
 */
export async function POST(request: NextRequest) {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

  try {
    const body = await request.json()
    const parsed = crearMovimientoSchema.safeParse(body)
    if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

    const { fecha, ...rest } = parsed.data
    const movimiento = await prisma.movimientoSinFactura.create({
      data: {
        ...rest,
        fecha: new Date(fecha),
        operadorId,
        referencia: rest.referencia ?? null,
        comprobanteS3Key: rest.comprobanteS3Key ?? null,
        cuentaDestinoId: rest.cuentaDestinoId ?? null,
        tarjetaId: rest.tarjetaId ?? null,
      },
      include: {
        cuenta: { select: { id: true, nombre: true } },
        cuentaDestino: { select: { id: true, nombre: true } },
      },
    })

    return NextResponse.json(movimiento, { status: 201 })
  } catch (error) {
    return serverErrorResponse("POST /api/movimientos-sin-factura", error)
  }
}
