/**
 * API JM Proveedores — listar y crear.
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
  rubro: z.string().optional(),
  tipo: z.enum(["GENERAL", "ASEGURADORA"]).default("GENERAL"),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedores = await prismaJm.proveedor.findMany({ orderBy: { razonSocial: "asc" } })
  return NextResponse.json(proveedores)
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = crearSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const dup = await prismaJm.proveedor.findUnique({ where: { cuit: parsed.data.cuit } })
  if (dup) return NextResponse.json({ error: `Ya existe un proveedor con CUIT ${parsed.data.cuit}` }, { status: 409 })

  const proveedor = await prismaJm.proveedor.create({
    data: {
      razonSocial: parsed.data.razonSocial,
      cuit: parsed.data.cuit,
      condicionIva: parsed.data.condicionIva,
      rubro: parsed.data.rubro || null,
      tipo: parsed.data.tipo,
    },
  })
  return NextResponse.json(proveedor, { status: 201 })
}
