/**
 * GET /api/recibos-cobranza/[id] — Devuelve el recibo con todas sus relaciones.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
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
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true, direccion: true } },
      operador: { select: { nombre: true, apellido: true } },
      facturas: { select: { id: true, nroComprobante: true, tipoCbte: true, total: true, emitidaEn: true } },
      mediosPago: true,
    },
  })

  if (!recibo) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })

  return NextResponse.json(recibo)
}
