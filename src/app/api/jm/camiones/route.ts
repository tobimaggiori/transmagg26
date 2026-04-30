/**
 * API JM Camiones — listar y crear.
 * Todos son "propios" en JM (no hay fletero externo).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearSchema = z.object({
  patenteChasis: z.string().min(1),
  patenteAcoplado: z.string().nullable().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const camiones = await prismaJm.camion.findMany({ orderBy: [{ activo: "desc" }, { patenteChasis: "asc" }] })
  return NextResponse.json(camiones)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const dup = await prismaJm.camion.findUnique({ where: { patenteChasis: parsed.data.patenteChasis } })
  if (dup) return NextResponse.json({ error: `Ya existe un camión con patente ${parsed.data.patenteChasis}` }, { status: 409 })

  const camion = await prismaJm.camion.create({ data: parsed.data })
  return NextResponse.json(camion, { status: 201 })
}
