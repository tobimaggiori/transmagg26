/**
 * GET /api/polizas/[id]/pdf — devuelve URL firmada del PDF de la póliza (15 min)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { obtenerUrlFirmada, storageConfigurado } from "@/lib/storage"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  const poliza = await prisma.polizaSeguro.findUnique({ where: { id }, select: { pdfS3Key: true } })
  if (!poliza) return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 })
  if (!poliza.pdfS3Key) return NextResponse.json({ error: "Sin PDF" }, { status: 404 })

  if (!storageConfigurado()) {
    return NextResponse.json({ error: "Storage no configurado" }, { status: 503 })
  }

  const url = await obtenerUrlFirmada(poliza.pdfS3Key)
  return NextResponse.json({ url })
}
