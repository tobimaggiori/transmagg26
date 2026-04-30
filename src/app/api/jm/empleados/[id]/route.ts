import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const updateSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  cargo: z.enum(["CHOFER", "ADMINISTRATIVO", "MECANICO", "OTRO"]).nullable().optional(),
  email: z.string().email().nullable().optional(),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const empleado = await prismaJm.empleado.findUnique({ where: { id: params.id } })
  if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })

  const { fechaIngreso, ...resto } = parsed.data
  const actualizado = await prismaJm.empleado.update({
    where: { id: params.id },
    data: { ...resto, ...(fechaIngreso ? { fechaIngreso: new Date(fechaIngreso) } : {}) },
  })
  return NextResponse.json(actualizado)
}
