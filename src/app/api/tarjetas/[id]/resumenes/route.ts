/**
 * GET  /api/tarjetas/[id]/resumenes  — Lista resúmenes de una tarjeta
 * POST /api/tarjetas/[id]/resumenes  — Carga un nuevo resumen mensual
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const crearResumenSchema = z.object({
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato: YYYY-MM"),
  fechaVtoPago: z.string().datetime(),
  totalARS: z.number().nonnegative(),
  totalUSD: z.number().nonnegative().optional().nullable(),
  s3Key: z.string().optional().nullable(),
  pagado: z.boolean().optional().default(false),
})

/**
 * GET: NextRequest, { params } -> Promise<NextResponse>
 * Devuelve todos los resúmenes de la tarjeta, ordenados por período descendente.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  try {
    const resumenes = await prisma.resumenTarjeta.findMany({
      where: { tarjetaId: id },
      orderBy: { periodo: "desc" },
    })
    return NextResponse.json(resumenes)
  } catch (error) {
    console.error(`GET /api/tarjetas/${id}/resumenes error:`, error)
    return NextResponse.json({ error: "Error al obtener resúmenes", detail: String(error) }, { status: 500 })
  }
}

/**
 * POST: NextRequest, { params } -> Promise<NextResponse>
 * Crea un nuevo resumen mensual para la tarjeta.
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

  const parsed = crearResumenSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const resumen = await prisma.resumenTarjeta.create({
      data: { tarjetaId: id, ...parsed.data },
    })
    return NextResponse.json(resumen, { status: 201 })
  } catch (error) {
    console.error(`POST /api/tarjetas/${id}/resumenes error:`, error)
    return NextResponse.json({ error: "Error al crear resumen", detail: String(error) }, { status: 500 })
  }
}
