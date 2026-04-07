/**
 * GET /api/facturas/[id]/pdf
 *
 * Si la factura tiene pdfS3Key, devuelve URL firmada de R2.
 * Si no, genera el PDF con pdfkit, sube a R2, guarda la key y devuelve URL firmada.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno, esRolEmpresa } from "@/lib/permissions"
import { obtenerUrlFirmada, subirPDF, storageConfigurado } from "@/lib/storage"
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

  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 })
  }

  let key = fac.pdfS3Key

  // Si no tiene PDF en R2, generarlo y subirlo
  if (!key) {
    try {
      const buf = await generarPDFFactura(fac.id)
      const letra = fac.tipoCbte === 1 || fac.tipoCbte === 201 ? "A" : fac.tipoCbte === 6 ? "B" : "X"
      const nro = fac.nroComprobante
        ? `FAC-${letra}-${String(fac.ptoVenta ?? 1).padStart(4, "0")}-${String(parseInt(fac.nroComprobante) || 0).padStart(8, "0")}`
        : `FAC-${fac.id.slice(0, 8)}`
      key = await subirPDF(buf, "facturas-emitidas", `${nro}.pdf`)
      await prisma.facturaEmitida.update({
        where: { id: fac.id },
        data: { pdfS3Key: key },
      })
    } catch (pdfError) {
      console.error("[GET /api/facturas/[id]/pdf] Error generando PDF:", pdfError)
      return NextResponse.json(
        { error: "No se pudo generar el PDF. Intentá de nuevo." },
        { status: 500 }
      )
    }
  }

  try {
    const url = await obtenerUrlFirmada(key, 900)
    return NextResponse.json({ url })
  } catch (signError) {
    console.error("[GET /api/facturas/[id]/pdf] Error obteniendo URL firmada:", signError)
    return NextResponse.json({ error: "No se pudo obtener la URL del PDF" }, { status: 500 })
  }
}
