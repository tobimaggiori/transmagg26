import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarHTMLOrdenPago } from "@/lib/pdf-orden-pago"
import { enviarEmail } from "@/lib/email"

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
    const fecha = new Date(op.fecha).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

    const resultado = await enviarEmail({
      para: emailDestino,
      asunto: `Orden de Pago Nro ${String(op.nro).padStart(8, "0")} — ${op.fletero.razonSocial} — ${fecha}`,
      texto: `Adjunto encontrará la Orden de Pago Nro ${op.nro} de Trans-Magg S.R.L.`,
      html,
      tipo: "usuario",
      usuarioId: acceso.session.user.id,
    })

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error ?? "No se pudo enviar el email" },
        { status: 422 }
      )
    }

    return NextResponse.json({ ok: true, emailDestino })
  } catch (error) {
    return serverErrorResponse("POST /api/ordenes-pago/[id]/enviar-email", error)
  }
}
