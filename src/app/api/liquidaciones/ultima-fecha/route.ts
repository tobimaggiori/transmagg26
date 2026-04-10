/**
 * GET /api/liquidaciones/ultima-fecha
 *
 * Devuelve la fecha de emisión de la última liquidación emitida.
 * Se usa como fecha por defecto al crear una nueva LP.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const ultima = await prisma.liquidacion.findFirst({
    orderBy: { grabadaEn: "desc" },
    select: { grabadaEn: true },
  })

  if (!ultima) return NextResponse.json({ fecha: null })

  // Devolver en formato YYYY-MM-DD
  const fecha = ultima.grabadaEn.toISOString().slice(0, 10)
  return NextResponse.json({ fecha })
}
