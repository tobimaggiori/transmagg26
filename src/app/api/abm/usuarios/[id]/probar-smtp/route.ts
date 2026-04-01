import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import nodemailer from "nodemailer"

const schema = z.object({
  smtpHost: z.string().min(1),
  smtpPuerto: z.number().int().min(1).max(65535),
  smtpUsuario: z.string().min(1),
  smtpPassword: z.string().optional(),
  smtpSsl: z.boolean(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN_TRANSMAGG") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  const { id } = await params

  const body = await req.json()
  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { smtpHost, smtpPuerto, smtpUsuario, smtpPassword, smtpSsl } = parsed.data

  // Resolve password: use provided plaintext or decrypt stored one
  let password: string
  if (smtpPassword && smtpPassword.trim() !== "") {
    password = smtpPassword
  } else {
    const usuario = await prisma.usuario.findUnique({
      where: { id },
      select: { smtpPassword: true },
    })
    if (!usuario?.smtpPassword) {
      return NextResponse.json({ error: "No hay contraseña configurada" }, { status: 422 })
    }
    password = decrypt(usuario.smtpPassword)
  }

  try {
    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: smtpPuerto,
      secure: smtpSsl,
      auth: { user: smtpUsuario, pass: password },
    })
    await transporter.verify()
    return NextResponse.json({ ok: true })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ error: `Conexión fallida: ${msg}` }, { status: 422 })
  }
}
