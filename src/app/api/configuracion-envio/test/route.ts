/**
 * POST /api/configuracion-envio/test
 * Envía un mail de prueba vía Resend al destinatario indicado.
 * Solo ADMIN_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { esAdmin } from "@/lib/permissions"
import { enviarEmail } from "@/lib/email"
import type { Rol } from "@/types"

const bodySchema = z.object({
  destinatario: z.string().email(),
})

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = bodySchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const r = await enviarEmail({
      tipo: "sistema",
      para: parsed.data.destinatario,
      asunto: "Prueba de envío — Trans-Magg",
      html: `<p>Este es un email de prueba enviado desde el panel de configuración de Trans-Magg.</p>
<p>Si lo estás viendo, Resend está funcionando correctamente.</p>`,
      texto: "Prueba de envío — Trans-Magg. Resend está funcionando.",
    })

    if (!r.ok) {
      return NextResponse.json({ ok: false, error: r.error ?? "Error al enviar" }, { status: 502 })
    }
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/configuracion-envio/test]", error)
    return NextResponse.json({ ok: false, error: "Error interno" }, { status: 500 })
  }
}
