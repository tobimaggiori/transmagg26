import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(req: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(req.url)
  const desde = searchParams.get("desde")
  const hasta = searchParams.get("hasta")

  const movs = await prismaJm.movimientoCuenta.findMany({
    where: {
      cuentaId: params.id,
      ...(desde || hasta ? {
        fecha: {
          ...(desde ? { gte: new Date(desde) } : {}),
          ...(hasta ? { lte: new Date(`${hasta}T23:59:59.999Z`) } : {}),
        },
      } : {}),
    },
    orderBy: [{ fecha: "asc" }, { orden: "asc" }],
  })
  return NextResponse.json(movs)
}
