/**
 * PATCH /api/liquidaciones/[id]/reintentar-arca
 * Reintenta la autorización ARCA de una liquidación con arcaEstado=PENDIENTE.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { autorizarLiquidacionArca } from "@/lib/arca/service"
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

  const liq = await prisma.liquidacion.findUnique({
    where: { id },
    select: { arcaEstado: true, cae: true },
  })

  if (!liq) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })
  if (liq.cae && liq.arcaEstado === "AUTORIZADA") {
    return NextResponse.json({ error: "Esta liquidación ya fue autorizada" }, { status: 409 })
  }
  if (liq.arcaEstado !== "PENDIENTE") {
    return NextResponse.json({ error: `Estado actual: ${liq.arcaEstado}. Solo se puede reintentar en estado PENDIENTE.` }, { status: 409 })
  }

  try {
    const arca = await autorizarLiquidacionArca(id, randomUUID())
    const liqFinal = await prisma.liquidacion.findUnique({ where: { id } })
    return NextResponse.json({ ok: true, documento: liqFinal, arca })
  } catch (err) {
    console.error("[reintentar-arca/liquidacion]", err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Error al reintentar autorización ARCA",
    }, { status: 502 })
  }
}
