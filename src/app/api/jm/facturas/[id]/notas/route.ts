/**
 * GET /api/jm/facturas/[id]/notas — listar NC/ND de una factura.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(_req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const notas = await prismaJm.notaCreditoDebito.findMany({
    where: { facturaId: params.id },
    include: { items: { orderBy: { orden: "asc" } } },
    orderBy: { creadoEn: "desc" },
  })
  return NextResponse.json(notas)
}
