import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"
import { enviarEmail, SmtpNoConfiguradoError } from "@/lib/email"

const bodySchema = z.object({
  emailDestino: z.string().email().optional(),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  const op = await prisma.ordenPago.findUnique({
    where: { id },
    select: {
      id: true,
      nro: true,
      fecha: true,
      fletero: { select: { razonSocial: true, usuario: { select: { email: true } } } },
    },
  })
  if (!op) return notFoundResponse("Orden de Pago")

  let bodyRaw: unknown
  try {
    bodyRaw = await req.json()
  } catch {
    bodyRaw = {}
  }
  const parsed = bodySchema.safeParse(bodyRaw)
  const emailDestino = parsed.success && parsed.data.emailDestino
    ? parsed.data.emailDestino
    : op.fletero.usuario.email ?? null

  if (!emailDestino) {
    return NextResponse.json(
      { error: "No hay email de destino. Ingresá un email o configurá el email del fletero." },
      { status: 400 }
    )
  }

  try {
    const html = await generarHTMLOrdenPago(id)

    if (process.env.NODE_ENV === "development") {
      console.log(`[OP DEV] Enviar Orden de Pago Nro ${op.nro} a ${emailDestino}`)
      return NextResponse.json({ ok: true, emailDestino, dev: true })
    }

    const fecha = new Date(op.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

    await enviarEmail(acceso.session.user.id, {
      to: emailDestino,
      subject: `Orden de Pago Nro ${String(op.nro).padStart(8, "0")} — ${op.fletero.razonSocial} — ${fecha}`,
      text: `Adjunto encontrará la Orden de Pago Nro ${op.nro} de Trans-Magg S.R.L.`,
      html,
    })

    return NextResponse.json({ ok: true, emailDestino })
  } catch (error) {
    if (error instanceof SmtpNoConfiguradoError) {
      return NextResponse.json({ error: "No tenés SMTP configurado. Configurá tu cuenta de email en ABM → Usuarios." }, { status: 422 })
    }
    return serverErrorResponse("POST /api/ordenes-pago/[id]/enviar-email", error)
  }
}
