import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const recibo = await prismaJm.reciboCobranza.findUnique({
    where: { id: params.id },
    include: {
      empresa: { select: { razonSocial: true, cuit: true, condicionIva: true } },
      facturasEnRecibo: { include: { factura: { select: { id: true, nroComprobante: true, ptoVenta: true, tipoCbte: true, total: true, emitidaEn: true } } } },
      mediosPago: true,
      notasAplicadas: { include: { nota: { select: { id: true, tipo: true, nroComprobante: true, ptoVenta: true, montoTotal: true } } } },
      faltantes: { include: { viaje: { select: { id: true, fechaViaje: true, remito: true } } } },
    },
  })
  if (!recibo) return NextResponse.json({ error: "Recibo no encontrado" }, { status: 404 })
  return NextResponse.json(recibo)
}
