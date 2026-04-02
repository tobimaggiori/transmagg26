/**
 * API Route: GET /api/iva/libros
 * Devuelve la lista de LibroIva generados, ordenados por período descendente.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

export async function GET(): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const libros = await prisma.libroIva.findMany({
    include: {
      operador: { select: { nombre: true, apellido: true } },
    },
    orderBy: { mesAnio: "desc" },
  })

  return NextResponse.json(libros)
}
