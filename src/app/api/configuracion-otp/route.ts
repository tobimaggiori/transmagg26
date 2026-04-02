import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { encrypt } from "@/lib/crypto"

async function requireAdmin() {
  const session = await auth()
  if (!session?.user) return null
  if (session.user.rol !== "ADMIN_TRANSMAGG") return null
  return session
}

export async function GET() {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const config = await prisma.configuracionOtp.findUnique({
    where: { id: "singleton" },
  })

  if (!config) {
    return NextResponse.json({
      host: null,
      puerto: null,
      usuario: null,
      tienePassword: false,
      usarSsl: true,
      emailRemitente: null,
      nombreRemitente: null,
      activo: false,
    })
  }

  return NextResponse.json({
    host: config.host,
    puerto: config.puerto,
    usuario: config.usuario,
    tienePassword: !!config.passwordHash,
    usarSsl: config.usarSsl,
    emailRemitente: config.emailRemitente,
    nombreRemitente: config.nombreRemitente,
    activo: config.activo,
  })
}

const saveSchema = z.object({
  host: z.string().min(1),
  puerto: z.number().int().positive(),
  usuario: z.string().min(1),
  password: z.string().optional(),
  usarSsl: z.boolean(),
  emailRemitente: z.string().email(),
  nombreRemitente: z.string().min(1),
  activo: z.boolean().optional().default(true),
})

export async function POST(req: NextRequest) {
  const session = await requireAdmin()
  if (!session) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  let body: unknown
  try {
    body = await req.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = saveSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", issues: parsed.error.issues }, { status: 400 })
  }

  const { host, puerto, usuario, password, usarSsl, emailRemitente, nombreRemitente, activo } = parsed.data

  // Resolve password: encrypt new one or keep existing
  let passwordHash: string | null | undefined
  try {
    if (password && password.trim() !== "") {
      passwordHash = encrypt(password)
    } else {
      const existing = await prisma.configuracionOtp.findUnique({
        where: { id: "singleton" },
        select: { passwordHash: true },
      })
      passwordHash = existing?.passwordHash ?? null
    }
  } catch (err) {
    const msg = err instanceof Error ? err.message : "Error al cifrar contraseña"
    return NextResponse.json({ error: `Error de configuración del servidor: ${msg}` }, { status: 500 })
  }

  await prisma.configuracionOtp.upsert({
    where: { id: "singleton" },
    create: {
      id: "singleton",
      host,
      puerto,
      usuario,
      passwordHash: passwordHash ?? null,
      usarSsl,
      emailRemitente,
      nombreRemitente,
      activo: activo ?? true,
    },
    update: {
      host,
      puerto,
      usuario,
      passwordHash: passwordHash ?? null,
      usarSsl,
      emailRemitente,
      nombreRemitente,
      activo: activo ?? true,
    },
  })

  return NextResponse.json({ ok: true })
}
