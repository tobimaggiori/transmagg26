/**
 * POST /api/mi-flota/infracciones — registra una nueva infracción para un camión propio
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import type { Rol } from "@/types"

export async function POST(request: NextRequest): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = (session.user.rol ?? "") as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let body: {
    camionId: string
    fecha: string
    organismo: string
    descripcion: string
    monto: number
  }

  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const { camionId, fecha, organismo, descripcion, monto } = body
  if (!camionId || !fecha || !organismo || !descripcion || !monto) {
    return NextResponse.json({ error: "Faltan campos requeridos" }, { status: 400 })
  }

  const infraccion = await prisma.infraccion.create({
    data: {
      camionId,
      fecha: new Date(fecha),
      organismo,
      descripcion,
      monto,
      estado: "PENDIENTE",
      operadorId: session.user.id,
    },
  })

  return NextResponse.json({ infraccion }, { status: 201 })
}
