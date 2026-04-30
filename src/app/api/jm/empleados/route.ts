/**
 * API JM Empleados — listar y crear.
 * En JM no hay `usuarioId` (auth vive en Transmagg).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe ser 11 dígitos"),
  cargo: z.enum(["CHOFER", "ADMINISTRATIVO", "MECANICO", "OTRO"]).nullable().optional(),
  email: z.string().email().nullable().optional(),
  fechaIngreso: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  activo: z.boolean().default(true),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empleados = await prismaJm.empleado.findMany({ orderBy: [{ activo: "desc" }, { apellido: "asc" }] })
  return NextResponse.json(empleados)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const dup = await prismaJm.empleado.findFirst({
    where: {
      OR: [
        { cuit: parsed.data.cuit },
        ...(parsed.data.email ? [{ email: parsed.data.email }] : []),
      ],
    },
  })
  if (dup) return NextResponse.json({ error: "Ya existe un empleado con ese CUIT o email" }, { status: 409 })

  const { fechaIngreso, ...resto } = parsed.data
  const empleado = await prismaJm.empleado.create({
    data: { ...resto, fechaIngreso: new Date(fechaIngreso) },
  })
  return NextResponse.json(empleado, { status: 201 })
}
