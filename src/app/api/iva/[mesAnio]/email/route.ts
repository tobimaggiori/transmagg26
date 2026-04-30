/**
 * API Route: POST /api/iva/[mesAnio]/email
 * Envía el PDF del Libro de IVA mensual por email a una dirección libre.
 * Body: { emailDestino: string }
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { generarPDFLibroIva, type AsientoPdf } from "@/lib/pdf-libro-iva"
import { enviarEmail } from "@/lib/email"
import type { Rol } from "@/types"

const bodySchema = z.object({
  emailDestino: z.string().email("Email inválido"),
})

function nombreMes(mesAnio: string): string {
  const [anio, mes] = mesAnio.split("-")
  const meses = [
    "enero", "febrero", "marzo", "abril", "mayo", "junio",
    "julio", "agosto", "septiembre", "octubre", "noviembre", "diciembre",
  ]
  return `${meses[parseInt(mes, 10) - 1] ?? mes} ${anio}`
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ mesAnio: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { mesAnio } = await params

  if (!/^\d{4}-\d{2}$/.test(mesAnio)) {
    return NextResponse.json({ error: "Período inválido" }, { status: 400 })
  }

  const libro = await prisma.libroIva.findUnique({ where: { mesAnio } })
  if (!libro) {
    return NextResponse.json({ error: "El libro de IVA de este período no fue generado todavía" }, { status: 404 })
  }

  let bodyRaw: unknown
  try {
    bodyRaw = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Email inválido" }, { status: 400 })
  }

  const { emailDestino } = parsed.data

  try {
    const asientos = await prisma.asientoIva.findMany({
      where: { periodo: mesAnio },
      include: {
        facturaEmitida: {
          select: {
            nroComprobante: true, tipoCbte: true, ptoVenta: true, emitidaEn: true,
            empresa: { select: { razonSocial: true, cuit: true } },
          },
        },
        facturaProveedor: {
          select: {
            nroComprobante: true, ptoVenta: true, tipoCbte: true, fechaCbte: true,
            proveedor: { select: { razonSocial: true, cuit: true } },
          },
        },
        liquidacion: {
          select: {
            nroComprobante: true, ptoVenta: true, grabadaEn: true,
            fletero: { select: { razonSocial: true, cuit: true } },
          },
        },
        notaCreditoDebito: {
          select: {
            tipo: true, tipoCbte: true, ptoVenta: true, nroComprobante: true,
            nroComprobanteExterno: true, fechaComprobanteExterno: true, emisorExterno: true, creadoEn: true,
            factura: { select: { empresa: { select: { razonSocial: true, cuit: true } } } },
            facturaProveedor: { select: { proveedor: { select: { razonSocial: true, cuit: true } } } },
            liquidacion: { select: { fletero: { select: { razonSocial: true, cuit: true } } } },
          },
        },
        facturaSeguro: {
          select: {
            nroComprobante: true, tipoComprobante: true, fecha: true,
            aseguradora: { select: { razonSocial: true, cuit: true } },
          },
        },
      },
      orderBy: [{ tipo: "asc" }, { id: "asc" }],
    })

    const asientosPdf: AsientoPdf[] = asientos.map((a) => ({
      ...a,
      baseImponible: Number(a.baseImponible),
      montoIva: Number(a.montoIva),
    }))

    const pdfBuffer = await generarPDFLibroIva(asientosPdf, mesAnio)
    const periodo = nombreMes(mesAnio)

    const resultado = await enviarEmail({
      para: emailDestino,
      asunto: `Libro de IVA — ${periodo} — Trans-Magg S.R.L.`,
      html: `<p>Adjunto encontrá el Libro de IVA correspondiente al período <strong>${periodo}</strong>.</p>
             <p>Trans-Magg S.R.L.</p>`,
      texto: `Libro de IVA — ${periodo} — Trans-Magg S.R.L.`,
      tipo: "sistema",
      adjuntos: [
        {
          nombre: `Libro-IVA-${mesAnio}.pdf`,
          contenido: pdfBuffer,
          tipo: "application/pdf",
        },
      ],
    })

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error ?? "No se pudo enviar el email" }, { status: 500 })
    }

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[POST /api/iva/[mesAnio]/email]", error)
    return NextResponse.json({ error: "Error interno al enviar el email" }, { status: 500 })
  }
}
