import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  nombre: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  return NextResponse.json(await prismaJm.broker.findMany({ orderBy: { nombre: "asc" } }))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const dup = await prismaJm.broker.findFirst({
    where: { OR: [{ nombre: parsed.data.nombre }, { cuit: parsed.data.cuit }] },
  })
  if (dup) return NextResponse.json({ error: "Ya existe un broker con ese nombre o CUIT" }, { status: 409 })

  return NextResponse.json(await prismaJm.broker.create({ data: parsed.data }), { status: 201 })
}
