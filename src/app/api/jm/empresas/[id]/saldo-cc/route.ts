/**
 * GET /api/jm/empresas/[id]/saldo-cc — saldo CC en vivo.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { calcularSaldoCCEmpresaJm } from "@/jm/lib/cuenta-corriente"
import type { Rol } from "@/types"

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const saldo = await calcularSaldoCCEmpresaJm(params.id)
  return NextResponse.json(saldo)
}
