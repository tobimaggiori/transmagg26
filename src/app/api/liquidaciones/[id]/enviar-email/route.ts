import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { requireFinancialAccess, notFoundResponse, serverErrorResponse } from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { generarPDFLiquidacion } from "@/lib/pdf-liquidacion"
import { enviarEmail } from "@/lib/email"
import { formatearNroComprobante } from "@/lib/liquidacion-utils"

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

  const liq = await prisma.liquidacion.findUnique({
    where: { id },
    select: {
      id: true,
      nroComprobante: true,
      ptoVenta: true,
      grabadaEn: true,
      fletero: { select: { razonSocial: true, usuario: { select: { email: true } } } },
    },
  })
  if (!liq) return notFoundResponse("Liquidación")

  let bodyRaw: unknown
  try {
    bodyRaw = await req.json()
  } catch {
    bodyRaw = {}
  }
  const parsed = bodySchema.safeParse(bodyRaw)
  const emailDestino = parsed.success && parsed.data.emailDestino
    ? parsed.data.emailDestino
    : liq.fletero.usuario.email ?? null

  if (!emailDestino) {
    return NextResponse.json(
      { error: "No hay email de destino. Ingresá un email o configurá el email del fletero." },
      { status: 400 }
    )
  }

  try {
    const pdfBuffer = await generarPDFLiquidacion(id)
    const nroLP = liq.nroComprobante
      ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${formatearNroComprobante(liq.nroComprobante)}`
      : `LP-${id.slice(0, 8)}`
    const fecha = new Date(liq.grabadaEn).toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" })

    const resultado = await enviarEmail({
      para: emailDestino,
      asunto: `Líquido Producto ${nroLP} — Trans-Magg S.R.L. — ${fecha}`,
      texto: `Estimado/a ${liq.fletero.razonSocial},\n\nAdjunto encontrará el Líquido Producto ${nroLP}.\n\nAnte cualquier consulta no dude en contactarnos.\n\nTrans-Magg S.R.L.`,
      html: `
        <div style="font-family: sans-serif; max-width: 500px; margin: 0 auto;">
          <h2 style="color: #1a1a1a;">Trans-Magg S.R.L.</h2>
          <p>Estimado/a <strong>${liq.fletero.razonSocial}</strong>,</p>
          <p>Adjunto encontrará el <strong>Líquido Producto ${nroLP}</strong>.</p>
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
        nombre: `${nroLP}.pdf`,
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
    return serverErrorResponse("POST /api/liquidaciones/[id]/enviar-email", error)
  }
}
