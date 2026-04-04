/**
 * GET /api/notas-credito-debito/[id]/pdf
 *
 * Devuelve una URL firmada (15 min) para visualizar el PDF de la NC/ND en R2.
 * Si no existe el PDF, lo genera con pdfkit, sube a R2, guarda la key y responde.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { obtenerUrlFirmada, subirPDF, storageConfigurado } from "@/lib/storage"
import { generarPDFNotaCD } from "@/lib/pdf-nota-cd"
import type { Rol } from "@/types"

export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const nota = await prisma.notaCreditoDebito.findUnique({
    where: { id: params.id },
    select: { id: true, nroComprobante: true, ptoVenta: true, tipo: true, pdfS3Key: true },
  })

  if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })

  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Almacenamiento no configurado" }, { status: 503 })
  }

  let key = nota.pdfS3Key

  if (!key) {
    try {
      const buf = await generarPDFNotaCD(nota.id)
      const prefijo = nota.tipo === "NC_EMITIDA" ? "NC" : nota.tipo === "ND_EMITIDA" ? "ND" : "NOTA"
      const nro = nota.nroComprobante
        ? `${prefijo}-${String(nota.ptoVenta ?? 1).padStart(4, "0")}-${String(nota.nroComprobante).padStart(8, "0")}`
        : `${prefijo}-${nota.id.slice(0, 8)}`
      key = await subirPDF(buf, "facturas-emitidas", `${nro}.pdf`)
      await prisma.notaCreditoDebito.update({
        where: { id: nota.id },
        data: { pdfS3Key: key },
      })
    } catch (pdfError) {
      console.error("[GET /api/notas-credito-debito/[id]/pdf] Error generando PDF:", pdfError)
      return NextResponse.json(
        { error: "No se pudo generar el PDF. Intentá de nuevo." },
        { status: 500 }
      )
    }
  }

  try {
    const url = await obtenerUrlFirmada(key, 900)
    return NextResponse.json({ url })
  } catch {
    return NextResponse.json({ error: "No se pudo obtener la URL del PDF" }, { status: 500 })
  }
}
