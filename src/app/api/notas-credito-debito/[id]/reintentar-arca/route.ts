/**
 * PATCH /api/notas-credito-debito/[id]/reintentar-arca
 * Reintenta la autorización ARCA de una NC/ND con arcaEstado=PENDIENTE.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { autorizarNotaCDArca } from "@/lib/arca/service"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import type { Rol } from "@/types"

export async function PATCH(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = params

  const nota = await prisma.notaCreditoDebito.findUnique({
    where: { id },
    select: { arcaEstado: true, cae: true },
  })

  if (!nota) return NextResponse.json({ error: "Nota no encontrada" }, { status: 404 })
  if (nota.cae && nota.arcaEstado === "AUTORIZADA") {
    return NextResponse.json({ error: "Esta nota ya fue autorizada" }, { status: 409 })
  }
  if (nota.arcaEstado !== "PENDIENTE") {
    return NextResponse.json({ error: `Estado actual: ${nota.arcaEstado}. Solo se puede reintentar en estado PENDIENTE.` }, { status: 409 })
  }

  try {
    const arca = await autorizarNotaCDArca(id, randomUUID())
    return NextResponse.json({ ok: true, arca })
  } catch (err) {
    console.error("[reintentar-arca/nota-cd]", err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Error al reintentar autorización ARCA",
    }, { status: 502 })
  }
}
