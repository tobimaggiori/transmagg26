/**
 * API JM Empresas — listar y crear.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearSchema = z.object({
  razonSocial: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe ser 11 dígitos"),
  condicionIva: z.enum(["RESPONSABLE_INSCRIPTO", "MONOTRIBUTISTA", "EXENTO", "CONSUMIDOR_FINAL"]),
  direccion: z.string().nullable().optional(),
  padronFce: z.boolean().default(false),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empresas = await prismaJm.empresa.findMany({ orderBy: { razonSocial: "asc" } })
  return NextResponse.json(empresas)
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

  const existente = await prismaJm.empresa.findUnique({ where: { cuit: parsed.data.cuit } })
  if (existente) return NextResponse.json({ error: `Ya existe una empresa con CUIT ${parsed.data.cuit}` }, { status: 409 })

  const creada = await prismaJm.empresa.create({ data: parsed.data })
  return NextResponse.json(creada, { status: 201 })
}
