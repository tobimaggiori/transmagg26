/**
 * POST /api/facturas/[id]/autorizar-arca
 * Reintenta la autorización ARCA de una factura con estadoArca PENDIENTE o RECHAZADA.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { autorizarFacturaArca } from "@/lib/arca/service"
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

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id },
    select: { estadoArca: true, cae: true },
  })

  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  if (factura.estadoArca === "AUTORIZADA") {
    return NextResponse.json({ error: "Ya está autorizado" }, { status: 409 })
  }
  if (factura.estadoArca === "EN_PROCESO") {
    return NextResponse.json({ error: "Está siendo procesado" }, { status: 409 })
  }

  try {
    const arca = await autorizarFacturaArca(id, randomUUID())
    const facturaFinal = await prisma.facturaEmitida.findUnique({ where: { id } })
    return NextResponse.json({ ok: true, documento: facturaFinal, arca })
  } catch (err) {
    console.error("[autorizar-arca/factura]", err)
    const clasificado = clasificarError(err)
    return NextResponse.json({
      ok: false,
      error: clasificado.error,
      code: clasificado.code,
      reintentable: clasificado.reintentable,
    }, { status: clasificado.status })
  }
}
