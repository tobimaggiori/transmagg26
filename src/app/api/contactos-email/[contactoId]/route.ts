import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const patchSchema = z.object({
  email: z.string().email().optional(),
  nombre: z.string().optional().nullable(),
})

async function checkAuth() {
  const session = await auth()
  if (!session?.user) return null
  if (!esRolInterno(session.user.rol as Rol)) return null
  return session
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ contactoId: string }> }
) {
  const session = await checkAuth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { contactoId } = await params

  const contacto = await prisma.contactoEmail.findUnique({
    where: { id: contactoId },
    select: { id: true, empresaId: true, fleteroId: true },
  })
  if (!contacto) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })

  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const { email, nombre } = parsed.data

  // Check duplicate email within same parent
  if (email) {
    const duplicado = await prisma.contactoEmail.findFirst({
      where: {
        id: { not: contactoId },
        email,
        activo: true,
        ...(contacto.empresaId ? { empresaId: contacto.empresaId } : { fleteroId: contacto.fleteroId! }),
      },
    })
    if (duplicado) return NextResponse.json({ error: "Ya existe un contacto con ese email" }, { status: 409 })
  }

  const updated = await prisma.contactoEmail.update({
    where: { id: contactoId },
    data: {
      ...(email !== undefined ? { email } : {}),
      ...(nombre !== undefined ? { nombre: nombre || null } : {}),
    },
    select: { id: true, email: true, nombre: true },
  })

  return NextResponse.json(updated)
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ contactoId: string }> }
) {
  const session = await checkAuth()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const { contactoId } = await params

  const contacto = await prisma.contactoEmail.findUnique({
    where: { id: contactoId },
    select: { id: true },
  })
  if (!contacto) return NextResponse.json({ error: "Contacto no encontrado" }, { status: 404 })

  await prisma.contactoEmail.update({
    where: { id: contactoId },
    data: { activo: false },
  })

  return NextResponse.json({ ok: true })
}
