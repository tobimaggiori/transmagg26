/**
 * POST /api/facturas/[id]/enviar-email
 * Genera el PDF de la factura y lo envía por email al destinatario.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarPDFFactura } from "@/lib/pdf-factura"
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

  const fac = await prisma.facturaEmitida.findUnique({
    where: { id },
    select: {
      id: true,
      tipoCbte: true,
      nroComprobante: true,
      ptoVenta: true,
      emitidaEn: true,
      empresa: {
        select: {
          razonSocial: true,
          empresaUsuarios: {
            take: 1,
            select: { usuario: { select: { email: true } } },
          },
        },
      },
    },
  })
  if (!fac) return notFoundResponse("Factura")

  let bodyRaw: unknown
  try {
    bodyRaw = await req.json()
  } catch {
    bodyRaw = {}
  }
  const parsed = bodySchema.safeParse(bodyRaw)
  const emailDestino = parsed.success && parsed.data.emailDestino
    ? parsed.data.emailDestino
    : fac.empresa.empresaUsuarios[0]?.usuario.email ?? null

  if (!emailDestino) {
    return NextResponse.json(
      { error: "No hay email de destino. Ingresá un email o configurá el email de la empresa." },
      { status: 400 }
    )
  }

  const letra = fac.tipoCbte === 1 || fac.tipoCbte === 201 ? "A" : fac.tipoCbte === 6 ? "B" : "X"
  const nroFmt = fac.nroComprobante
    ? `${String(fac.ptoVenta ?? 1).padStart(4, "0")}-${String(parseInt(fac.nroComprobante) || 0).padStart(8, "0")}`
    : `FAC-${id.slice(0, 8)}`
  const tipoLabel = fac.tipoCbte === 201 ? `Factura A MiPyme` : `Factura ${letra}`
  const fecha = new Date(fac.emitidaEn).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

  try {
    const pdfBuffer = await generarPDFFactura(id)

    const resultado = await enviarEmail({
      para: emailDestino,
      asunto: `${tipoLabel} ${nroFmt} — Trans-Magg S.R.L. — ${fecha}`,
      texto: `Estimado/a ${fac.empresa.razonSocial},\n\nAdjunto encontrará la ${tipoLabel} ${nroFmt}.\n\nAnte cualquier consulta no dude en contactarnos.\n\nTrans-Magg S.R.L.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Trans-Magg S.R.L.</h2>
          <p>Estimado/a <strong>${fac.empresa.razonSocial}</strong>,</p>
          <p>Adjunto encontrará la <strong>${tipoLabel} ${nroFmt}</strong>.</p>
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
      adjuntos: [{
        nombre: `${tipoLabel.replace(/ /g, "-")}-${nroFmt}.pdf`,
        contenido: pdfBuffer,
        tipo: "application/pdf",
      }],
    })

    if (!resultado.ok) {
      return NextResponse.json(
        { error: resultado.error ?? "No se pudo enviar el email" },
        { status: 422 }
      )
    }

    return NextResponse.json({ ok: true, emailDestino })
  } catch (error) {
    return serverErrorResponse("POST /api/facturas/[id]/enviar-email", error)
  }
}
