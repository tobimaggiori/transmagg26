/**
 * GET /api/facturas/[id]/pdf
 *
 * Sirve el PDF de la factura como application/pdf.
 * Si tiene pdfS3Key y R2 está configurado, lo descarga de R2.
 * Si no, lo genera al vuelo con pdfkit (generarPDFFactura).
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { obtenerArchivo, storageConfigurado } from "@/lib/storage"
import { verificarPropietarioEmpresa } from "@/lib/session-utils"
import { generarPDFFactura } from "@/lib/pdf-factura"
import type { Rol } from "@/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  if (!esRolInterno(rol) && !esRolEmpresa(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const fac = await prisma.facturaEmitida.findUnique({
    where: { id: params.id },
    select: { id: true, pdfS3Key: true, empresaId: true, tipoCbte: true, ptoVenta: true, nroComprobante: true },
  })
  if (!fac) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

  if (esRolEmpresa(rol)) {
    const esPropietario = await verificarPropietarioEmpresa(fac.empresaId, session.user.email!)
    if (!esPropietario) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const letra = fac.tipoCbte === 1 || fac.tipoCbte === 201 ? "A" : fac.tipoCbte === 6 ? "B" : "X"
  const nro = fac.nroComprobante
    ? `FAC-${letra}-${String(fac.ptoVenta ?? 1).padStart(4, "0")}-${String(parseInt(fac.nroComprobante) || 0).padStart(8, "0")}`
    : `FAC-${fac.id.slice(0, 8)}`
  const filename = `${nro}.pdf`

  // Intentar obtener de R2
  if (fac.pdfS3Key && storageConfigurado()) {
    try {
      const buffer = await obtenerArchivo(fac.pdfS3Key)
      return new NextResponse(new Uint8Array(buffer), {
        headers: {
          "Content-Type": "application/pdf",
          "Content-Disposition": `inline; filename="${filename}"`,
        },
      })
    } catch {
      // Fallthrough: regenerar con pdfkit
    }
  }

  // Generar al vuelo con pdfkit
  try {
    const buffer = await generarPDFFactura(fac.id)
    return new NextResponse(new Uint8Array(buffer), {
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `inline; filename="${filename}"`,
      },
    })
  } catch (err) {
    console.error("[GET /api/facturas/[id]/pdf] Error generando PDF:", err)
    return NextResponse.json({ error: "No se pudo generar el PDF" }, { status: 500 })
  }
}
