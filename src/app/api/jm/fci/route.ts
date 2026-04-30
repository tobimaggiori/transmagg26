import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  nombre: z.string().min(1),
  cuentaId: z.string().min(1),
  moneda: z.enum(["PESOS", "DOLARES", "OTRO"]),
  diasHabilesAlerta: z.number().int().min(1).default(1),
  saldoInicial: z.number().positive().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  return NextResponse.json(await prismaJm.fci.findMany({
    include: { cuenta: { select: { id: true, nombre: true } } },
    orderBy: [{ activo: "desc" }, { nombre: "asc" }],
  }))
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const dup = await prismaJm.fci.findUnique({ where: { nombre: parsed.data.nombre } })
  if (dup) return NextResponse.json({ error: "Ya existe un FCI con ese nombre" }, { status: 409 })

  const { saldoInicial, ...resto } = parsed.data
  const fci = await prismaJm.fci.create({
    data: { ...resto, saldoActual: saldoInicial ?? 0 },
  })
  return NextResponse.json(fci, { status: 201 })
}
