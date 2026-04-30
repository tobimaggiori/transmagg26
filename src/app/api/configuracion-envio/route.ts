/**
 * API Routes para ConfiguracionEnvio (singleton).
 * GET   /api/configuracion-envio
 * PATCH /api/configuracion-envio { replyTo }
 *
 * Solo ADMIN_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"

const patchSchema = z.object({
  replyTo: z.string().email().nullable().optional(),
})

async function getOrInit() {
  return prisma.configuracionEnvio.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  })
}

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const cfg = await getOrInit()
    return NextResponse.json({
      replyTo: cfg.replyTo,
      resendConfigurado: !!process.env.RESEND_API_KEY,
      remitente: "Trans-Magg S.R.L. <auth@transmagg.com.ar>",
    })
  } catch (error) {
    console.error("[GET /api/configuracion-envio]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = patchSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const cfg = await prisma.configuracionEnvio.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", replyTo: parsed.data.replyTo ?? null },
      update: { replyTo: parsed.data.replyTo ?? null },
    })

    return NextResponse.json({
      replyTo: cfg.replyTo,
      resendConfigurado: !!process.env.RESEND_API_KEY,
      remitente: "Trans-Magg S.R.L. <auth@transmagg.com.ar>",
    })
  } catch (error) {
    console.error("[PATCH /api/configuracion-envio]", error)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
