/**
 * GET /api/recibos-cobranza/[id]/pdf
 *
 * Devuelve una URL firmada (15 min) para visualizar el PDF del recibo en R2.
 * Si no existe el PDF, lo genera y sube antes de responder.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import { obtenerUrlFirmada, subirPDF } from "@/lib/storage"
import { generarPDFReciboCobranza } from "@/lib/pdf-recibo-cobranza"
import type { Rol } from "@/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const { id } = await params

  const recibo = await prisma.reciboCobranza.findUnique({
    where: { id },
    select: { id: true, nro: true, pdfS3Key: true },
  })

  if (!recibo) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })

  let key = recibo.pdfS3Key

  // Si no tiene PDF, generarlo ahora
  if (!key) {
    const buf = await generarPDFReciboCobranza(recibo.id)
    key = await subirPDF(buf, "recibos-cobranza", `recibo-${recibo.nro}.pdf`)
    await prisma.reciboCobranza.update({
      where: { id: recibo.id },
      data: { pdfS3Key: key },
    })
  }

  const url = await obtenerUrlFirmada(key, 900)
  return NextResponse.json({ url })
}
