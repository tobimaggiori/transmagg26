/**
 * GET  /api/tarjetas/[id]/resumenes  — Lista resúmenes de una tarjeta.
 * POST /api/tarjetas/[id]/resumenes  — Crea un resumen por ciclo.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { resolverOperadorId } from "@/lib/session-utils"
import { z } from "zod"
import type { Rol } from "@/types"

const crearResumenSchema = z.object({
  periodo: z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Formato: YYYY-MM"),
  periodoDesde: z.string().datetime(),
  periodoHasta: z.string().datetime(),
  fechaVtoPago: z.string().datetime(),
  totalARS: z.number().nonnegative(),
  totalUSD: z.number().nonnegative().optional().nullable(),
  s3Key: z.string().optional().nullable(),
  pagado: z.boolean().optional().default(false),
})

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
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
      include: { _count: { select: { diasConciliados: true } } },
    })
    return NextResponse.json(resumenes)
  } catch (error) {
    console.error(`GET /api/tarjetas/${id}/resumenes error:`, error)
    return NextResponse.json({ error: "Error al obtener resúmenes", detail: String(error) }, { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida." }, { status: 401 })
  }

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
      data: {
        tarjetaId: id,
        periodo: parsed.data.periodo,
        periodoDesde: new Date(parsed.data.periodoDesde),
        periodoHasta: new Date(parsed.data.periodoHasta),
        fechaVtoPago: new Date(parsed.data.fechaVtoPago),
        totalARS: parsed.data.totalARS,
        totalUSD: parsed.data.totalUSD ?? null,
        s3Key: parsed.data.s3Key ?? null,
        pagado: parsed.data.pagado ?? false,
        operadorId,
      },
    })
    return NextResponse.json(resumen, { status: 201 })
  } catch (error) {
    console.error(`POST /api/tarjetas/${id}/resumenes error:`, error)
    return NextResponse.json({ error: "Error al crear resumen", detail: String(error) }, { status: 500 })
  }
}
