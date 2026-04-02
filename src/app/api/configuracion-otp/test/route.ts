import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { decrypt } from "@/lib/crypto"
import nodemailer from "nodemailer"

const schema = z.object({
  host: z.string().min(1),
  puerto: z.number().int().positive(),
  usuario: z.string().min(1),
  password: z.string().optional(),
  usarSsl: z.boolean(),
})

export async function POST(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (session.user.rol !== "ADMIN_TRANSMAGG") {
    return NextResponse.json({ error: "Sin permisos" }, { status: 403 })
  }

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = schema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })
  }

  const { host, puerto, usuario, password, usarSsl } = parsed.data

  // Resolve password: use provided plaintext or decrypt stored one
  let pass: string
  if (password && password.trim() !== "") {
    pass = password
  } else {
    const config = await prisma.configuracionOtp.findUnique({
      where: { id: "singleton" },
      select: { passwordHash: true },
    })
    if (!config?.passwordHash) {
      return NextResponse.json({ ok: false, mensaje: "No hay contraseña configurada" }, { status: 422 })
    }
    try {
      pass = decrypt(config.passwordHash)
    } catch {
      return NextResponse.json({ ok: false, mensaje: "Error al descifrar la contraseña almacenada" }, { status: 500 })
    }
  }

  try {
    const transporter = nodemailer.createTransport({
      host,
      port: puerto,
      secure: usarSsl,
      auth: { user: usuario, pass },
    })
    await transporter.verify()
    return NextResponse.json({ ok: true, mensaje: "Conexión exitosa" })
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error desconocido"
    return NextResponse.json({ ok: false, mensaje: `Conexión fallida: ${msg}` })
  }
}
