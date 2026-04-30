import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const factura = await prismaJm.facturaEmitida.findUnique({
    where: { id: params.id },
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true } },
      viajes: true,
      pagos: true,
      notasCreditoDebito: true,
    },
  })
  if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
  return NextResponse.json(factura)
}
