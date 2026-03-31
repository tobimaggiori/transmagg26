/**
 * GET  /api/tarjetas/[id]/gastos  — Lista gastos de una tarjeta (con filtro de período)
 * POST /api/tarjetas/[id]/gastos  — Registra un nuevo gasto
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const TIPOS_GASTO = ["COMBUSTIBLE", "PEAJE", "COMIDA", "ALOJAMIENTO", "REPUESTO", "LAVADO", "OTRO"] as const

const crearGastoSchema = z.object({
  tipoGasto: z.enum(TIPOS_GASTO),
  monto: z.number().positive(),
  fecha: z.string().datetime(),
  descripcion: z.string().optional().nullable(),
  comprobanteS3Key: z.string().optional().nullable(),
})

/**
 * GET: NextRequest, { params } -> Promise<NextResponse>
 * Devuelve los gastos de la tarjeta. Opcionalmente filtra por ?desde=YYYY-MM-DD&hasta=YYYY-MM-DD.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  try {
    const gastos = await prisma.gastoTarjeta.findMany({
      where: {
        tarjetaId: id,
        ...(desde || hasta
          ? {
              fecha: {
                ...(desde ? { gte: new Date(desde) } : {}),
                ...(hasta ? { lte: new Date(hasta + "T23:59:59Z") } : {}),
              },
            }
          : {}),
      },
      include: { operador: { select: { id: true, nombre: true, apellido: true } } },
      orderBy: { fecha: "desc" },
    })
    return NextResponse.json(gastos)
  } catch (error) {
    console.error(`GET /api/tarjetas/${id}/gastos error:`, error)
    return NextResponse.json({ error: "Error al obtener gastos", detail: String(error) }, { status: 500 })
  }
}

/**
 * POST: NextRequest, { params } -> Promise<NextResponse>
 * Registra un gasto en la tarjeta. El operador es el usuario autenticado.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = crearGastoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const gasto = await prisma.gastoTarjeta.create({
      data: {
        tarjetaId: id,
        operadorId: session.user.id,
        ...parsed.data,
      },
      include: { operador: { select: { id: true, nombre: true, apellido: true } } },
    })
    return NextResponse.json(gasto, { status: 201 })
  } catch (error) {
    console.error(`POST /api/tarjetas/${id}/gastos error:`, error)
    return NextResponse.json({ error: "Error al registrar gasto", detail: String(error) }, { status: 500 })
  }
}
