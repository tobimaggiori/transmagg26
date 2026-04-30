/**
 * GET /api/jm/cuentas-corrientes/empresas — lista empresas con su saldo CC.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { calcularSaldoCCEmpresaJm } from "@/jm/lib/cuenta-corriente"
import type { Rol } from "@/types"

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empresas = await prismaJm.empresa.findMany({
    where: { activa: true },
    select: { id: true, razonSocial: true, cuit: true },
    orderBy: { razonSocial: "asc" },
  })

  const saldos = await Promise.all(
    empresas.map(async (e) => ({
      ...e,
      saldo: await calcularSaldoCCEmpresaJm(e.id),
    })),
  )

  return NextResponse.json(saldos)
}
