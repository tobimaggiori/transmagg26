import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(req: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const estado = req.nextUrl.searchParams.get("estado")
  const cheques = await prismaJm.chequeRecibido.findMany({
    where: { ...(estado ? { estado } : {}) },
    include: {
      empresa: { select: { id: true, razonSocial: true } },
      proveedorOrigen: { select: { id: true, razonSocial: true } },
      cuentaDeposito: { select: { id: true, nombre: true } },
    },
    orderBy: { fechaCobro: "asc" },
    take: 200,
  })
  return NextResponse.json(cheques)
}
