/**
 * POST /api/recibos-cobranza/[id]/enviar-email
 * Envía el PDF del Recibo de Cobranza por email al destinatario indicado.
 * Body: { emailDestino: string }
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarPDFReciboCobranza } from "@/lib/pdf-recibo-cobranza"
import { enviarEmail } from "@/lib/email"

const bodySchema = z.object({
  emailDestino: z.string().email("Email inválido"),
})

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params

  const recibo = await prisma.reciboCobranza.findUnique({
    where: { id },
    select: {
      id: true,
      nro: true,
      ptoVenta: true,
      fecha: true,
      empresa: { select: { razonSocial: true } },
    },
  })
  if (!recibo) return notFoundResponse("Recibo de Cobranza")

  let bodyRaw: unknown
  try {
    bodyRaw = await req.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message ?? "Email inválido" },
      { status: 400 }
    )
  }

  const { emailDestino } = parsed.data

  try {
    const pdfBuffer = await generarPDFReciboCobranza(id)
    const fecha = new Date(recibo.fecha).toLocaleDateString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    })
    const nroFormateado = `${String(recibo.ptoVenta).padStart(4, "0")}-${String(recibo.nro).padStart(8, "0")}`

    const resultado = await enviarEmail({
      para: emailDestino,
      asunto: `Recibo de Cobranza Nro ${nroFormateado} — Trans-Magg S.R.L. — ${fecha}`,
      texto: `Estimado/a,\n\nAdjunto encontrará el Recibo de Cobranza Nro ${nroFormateado} correspondiente a ${recibo.empresa.razonSocial}.\n\nAnte cualquier consulta no dude en contactarnos.\n\nTrans-Magg S.R.L.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Trans-Magg S.R.L.</h2>
          <p>Estimado/a,</p>
          <p>Adjunto encontrará el <strong>Recibo de Cobranza Nro ${nroFormateado}</strong> correspondiente a <strong>${recibo.empresa.razonSocial}</strong>.</p>
          <p style="color: #666; font-size: 14px;">
            Ante cualquier consulta no dude en contactarnos.
          </p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="color: #999; font-size: 12px;">
            Trans-Magg S.R.L. — Belgrano 184, Acebal (S.F.)
          </p>
        </div>
      `,
      tipo: "usuario",
      usuarioId: acceso.session.user.id,
      adjuntos: [
        {
          nombre: `Recibo-${nroFormateado}.pdf`,
          contenido: pdfBuffer,
          tipo: "application/pdf",
        },
      ],
    })

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error ?? "No se pudo enviar el email" },
        { status: 422 }
      )
    }

    return NextResponse.json({ ok: true, emailDestino })
  } catch (error) {
    return serverErrorResponse("POST /api/recibos-cobranza/[id]/enviar-email", error)
  }
}
