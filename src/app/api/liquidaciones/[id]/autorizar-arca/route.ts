/**
 * POST /api/liquidaciones/[id]/autorizar-arca
 * Reintenta la autorización ARCA de una liquidación con arcaEstado PENDIENTE o RECHAZADA.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { autorizarLiquidacionArca } from "@/lib/arca/service"
import { clasificarError } from "@/lib/emision-directa"
import { prisma } from "@/lib/prisma"
import { randomUUID } from "crypto"
import type { Rol } from "@/types"

export async function POST(
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
  if (liq.arcaEstado === "AUTORIZADA") {
    return NextResponse.json({ error: "Ya está autorizado" }, { status: 409 })
  }
  if (liq.arcaEstado === "EN_PROCESO") {
    return NextResponse.json({ error: "Está siendo procesado" }, { status: 409 })
  }

  try {
    const arca = await autorizarLiquidacionArca(id, randomUUID())
    const liqFinal = await prisma.liquidacion.findUnique({ where: { id } })
    return NextResponse.json({ ok: true, documento: liqFinal, arca })
  } catch (err) {
    console.error("[autorizar-arca/liquidacion]", err)
    const clasificado = clasificarError(err)
    return NextResponse.json({
      ok: false,
      error: clasificado.error,
      code: clasificado.code,
      reintentable: clasificado.reintentable,
    }, { status: clasificado.status })
  }
}
