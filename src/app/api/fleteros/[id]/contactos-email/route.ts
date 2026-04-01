import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const schema = z.object({
  email: z.string().email(),
  nombre: z.string().optional(),
})

async function checkAuth() {
  const session = await auth()
  if (!session?.user) return null
  if (!esRolInterno(session.user.rol as Rol)) return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAuth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const contactos = await prisma.contactoEmail.findMany({
    where: { fleteroId: id, activo: true },
    select: { id: true, email: true, nombre: true },
    orderBy: { creadoEn: "asc" },
  })

  return NextResponse.json(contactos)
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await checkAuth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { id } = await params

  const fletero = await prisma.fletero.findUnique({ where: { id }, select: { id: true } })
  if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const { email, nombre } = parsed.data

  const duplicado = await prisma.contactoEmail.findFirst({
    where: { fleteroId: id, email, activo: true },
  })
  if (duplicado) return NextResponse.json({ error: "Ya existe un contacto con ese email en este fletero" }, { status: 409 })

  const contacto = await prisma.contactoEmail.create({
    data: { fleteroId: id, email, nombre: nombre || null },
    select: { id: true, email: true, nombre: true },
  })

  return NextResponse.json(contacto, { status: 201 })
}
