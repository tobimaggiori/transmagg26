/**
 * PATCH /api/facturas/[id]/reintentar-arca
 * Reintenta la autorización ARCA de una factura con estadoArca=PENDIENTE.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { autorizarFacturaArca } from "@/lib/arca/service"
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

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id },
    select: { estadoArca: true, cae: true },
  })

  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  if (factura.cae && factura.estadoArca === "AUTORIZADA") {
    return NextResponse.json({ error: "Esta factura ya fue autorizada" }, { status: 409 })
  }
  if (factura.estadoArca !== "PENDIENTE") {
    return NextResponse.json({ error: `Estado actual: ${factura.estadoArca}. Solo se puede reintentar en estado PENDIENTE.` }, { status: 409 })
  }

  try {
    const arca = await autorizarFacturaArca(id, randomUUID())
    const facturaFinal = await prisma.facturaEmitida.findUnique({ where: { id } })
    return NextResponse.json({ ok: true, documento: facturaFinal, arca })
  } catch (err) {
    console.error("[reintentar-arca/factura]", err)
    return NextResponse.json({
      error: err instanceof Error ? err.message : "Error al reintentar autorización ARCA",
    }, { status: 502 })
  }
}
