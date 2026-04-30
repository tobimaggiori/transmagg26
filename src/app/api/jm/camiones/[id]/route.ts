import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const updateSchema = z.object({
  patenteChasis: z.string().min(1).optional(),
  patenteAcoplado: z.string().nullable().optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const camion = await prismaJm.camion.findUnique({ where: { id: params.id } })
  if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })

  const actualizado = await prismaJm.camion.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(actualizado)
}
