/**
 * GET  /api/tarjetas        — Lista tarjetas (con filtro opcional ?tipo=PREPAGA&choferId=)
 * POST /api/tarjetas        — Crea una nueva tarjeta
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const crearTarjetaSchema = z.object({
  nombre: z.string().min(1),
  tipo: z.enum(["CREDITO", "DEBITO", "PREPAGA"]),
  banco: z.string().min(1),
  ultimos4: z.string().length(4),
  titularTipo: z.enum(["EMPRESA", "CHOFER", "EMPLEADO"]),
  titularNombre: z.string().min(1),
  cuentaId: z.string().optional().nullable(),
  choferId: z.string().optional().nullable(),
  limiteMensual: z.number().positive().optional().nullable(),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 * Devuelve todas las tarjetas activas, con filtros opcionales por tipo y choferId.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")
  const choferId = searchParams.get("choferId")
  const incluirInactivas = searchParams.get("incluirInactivas") === "true"

  try {
    const tarjetas = await prisma.tarjeta.findMany({
      where: {
        ...(incluirInactivas ? {} : { activa: true }),
        ...(tipo ? { tipo } : {}),
        ...(choferId ? { choferId } : {}),
      },
      include: {
        cuenta: { select: { id: true, nombre: true } },
        chofer: { select: { id: true, nombre: true, apellido: true } },
        _count: { select: { gastos: true, resumenes: true } },
      },
      orderBy: { creadoEn: "desc" },
    })
    return NextResponse.json(tarjetas)
  } catch (error) {
    console.error("GET /api/tarjetas error:", error)
    return NextResponse.json({ error: "Error al obtener tarjetas", detail: String(error) }, { status: 500 })
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 * Crea una nueva tarjeta.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = crearTarjetaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const tarjeta = await prisma.tarjeta.create({ data: parsed.data })
    return NextResponse.json(tarjeta, { status: 201 })
  } catch (error) {
    console.error("POST /api/tarjetas error:", error)
    return NextResponse.json({ error: "Error al crear tarjeta", detail: String(error) }, { status: 500 })
  }
}
