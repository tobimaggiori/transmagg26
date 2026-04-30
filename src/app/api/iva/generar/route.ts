/**
 * API Route: POST /api/iva/generar
 * Genera el PDF del Libro de IVA mensual, lo sube a R2 y registra el LibroIva.
 * Body: { mesAnio: "2026-03" }
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { generarPDFLibroIva, type AsientoPdf } from "@/lib/pdf-libro-iva"
import { subirPDF } from "@/lib/storage"
import type { Rol } from "@/types"

const bodySchema = z.object({
  mesAnio: z.string().regex(/^\d{4}-\d{2}$/, "Formato inválido (YYYY-MM)"),
})

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { mesAnio }, obtiene todos los asientos IVA del período,
 * genera el PDF, lo sube a R2 y registra o actualiza el LibroIva.
 *
 * Ejemplos:
 * POST { mesAnio: "2026-03" } => 200 { ok: true, s3Key, mesAnio }
 * POST { mesAnio: "2026-13" } => 400 { error: "Formato inválido" }
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Operador no encontrado" }, { status: 400 })
  }

  let bodyRaw: unknown
  try {
    bodyRaw = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = bodySchema.safeParse(bodyRaw)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message ?? "Datos inválidos" }, { status: 400 })
  }

  const { mesAnio } = parsed.data

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
    const s3Key = await subirPDF(pdfBuffer, "libros-iva", `Libro-IVA-${mesAnio}.pdf`)

    await prisma.libroIva.upsert({
      where: { mesAnio },
      create: { mesAnio, pdfS3Key: s3Key, operadorId },
      update: { pdfS3Key: s3Key, generadoEn: new Date(), operadorId },
    })

    return NextResponse.json({ ok: true, s3Key, mesAnio })
  } catch (error) {
    console.error("[POST /api/iva/generar]", error)
    return NextResponse.json({ error: "Error interno al generar el libro de IVA" }, { status: 500 })
  }
}
