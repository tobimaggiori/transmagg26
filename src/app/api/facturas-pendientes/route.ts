/**
 * GET /api/facturas-pendientes?empresaId=...
 *
 * Devuelve las facturas emitidas con estadoCobro=PENDIENTE y estado=EMITIDA
 * para la empresa indicada. Usado en el formulario de nuevo recibo de cobranza.
 *
 * SEGURIDAD: solo roles internos y roles empresa pueden acceder.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { puedeAcceder } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!puedeAcceder(session.user.rol as Rol, "facturas")) {
    return NextResponse.json({ error: "Sin permiso" }, { status: 403 })
  }

  const empresaId = req.nextUrl.searchParams.get("empresaId")
  if (!empresaId) return NextResponse.json({ error: "empresaId requerido" }, { status: 400 })

  const facturas = await prisma.facturaEmitida.findMany({
    where: {
      empresaId,
      estado: "EMITIDA",
      estadoCobro: "PENDIENTE",
    },
    select: {
      id: true,
      nroComprobante: true,
      tipoCbte: true,
      total: true,
      emitidaEn: true,
      neto: true,
      ivaMonto: true,
    },
    orderBy: { emitidaEn: "asc" },
  })

  return NextResponse.json(facturas)
}
