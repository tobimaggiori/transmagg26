import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"

const schema = z.object({
  smtpHost: z.string().min(1),
  smtpPuerto: z.number().int().min(1).max(65535),
  smtpUsuario: z.string().min(1),
  smtpPassword: z.string().optional(),
  smtpSsl: z.boolean(),
  smtpActivo: z.boolean(),
})

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN_TRANSMAGG") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const { smtpHost, smtpPuerto, smtpUsuario, smtpPassword, smtpSsl, smtpActivo } = parsed.data

  const existente = await prisma.usuario.findUnique({
    where: { id },
    select: { id: true, smtpPassword: true },
  })
  if (!existente) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

  let passwordCifrada: string | undefined
  try {
    if (smtpPassword && smtpPassword.trim() !== "") {
      passwordCifrada = encrypt(smtpPassword)
    } else {
      passwordCifrada = existente.smtpPassword ?? undefined
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al cifrar contraseña"
    return NextResponse.json({ error: `Error de configuración del servidor: ${msg}` }, { status: 500 })
  }

  await prisma.usuario.update({
    where: { id },
    data: {
      smtpHost,
      smtpPuerto,
      smtpUsuario,
      smtpPassword: passwordCifrada ?? null,
      smtpSsl,
      smtpActivo,
    },
  })

  return NextResponse.json({ ok: true })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN_TRANSMAGG") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params

  await prisma.usuario.update({
    where: { id },
    data: {
      smtpHost: null,
      smtpPuerto: null,
      smtpUsuario: null,
      smtpPassword: null,
      smtpSsl: true,
      smtpActivo: false,
    },
  })

  return NextResponse.json({ ok: true })
}
