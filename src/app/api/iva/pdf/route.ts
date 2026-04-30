/**
 * API Route: GET /api/iva/pdf?mes=MM&anio=YYYY
 *
 * Devuelve el Libro IVA mensual en PDF (application/pdf, inline). Per
 * CLAUDE.md regla 8 — pdfkit, sin HTML wrapper.
 *
 * Si no se especifica mes+anio, usa el mes actual.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { generarPDFLibroIva, type AsientoPdf } from "@/lib/pdf-libro-iva"
import type { Rol } from "@/types"

export async function GET(request: NextRequest): Promise<Response | NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const mes = searchParams.get("mes")
  const anio = searchParams.get("anio")
  const hoy = new Date()
  const mesAnio =
    mes && anio
      ? `${anio}-${String(mes).padStart(2, "0")}`
      : `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, "0")}`

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

  try {
    const pdf = await generarPDFLibroIva(asientosPdf, mesAnio)
    const ab = new ArrayBuffer(pdf.byteLength)
    new Uint8Array(ab).set(new Uint8Array(pdf))
    return new Response(ab, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="libro-iva-${mesAnio}.pdf"`,
        "Cache-Control": "no-store",
      },
    })
  } catch (error) {
    console.error("[GET /api/iva/pdf]", error)
    return NextResponse.json({ error: "Error al generar PDF" }, { status: 500 })
  }
}
