/**
 * API singleton de configuración ARCA para JM.
 * Versión mínima: cuit, razonSocial, modo, ptosVenta, comprobantesHabilitados,
 * cbuMiPymes, montoMinimoFce, activa.
 * Certificado/password/WSAA tickets quedan para una próxima iteración.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const updateSchema = z.object({
  cuit: z.string().regex(/^\d{11}$/).optional(),
  razonSocial: z.string().optional(),
  modo: z.enum(["homologacion", "produccion"]).optional(),
  puntosVenta: z.string().optional(),
  comprobantesHabilitados: z.string().optional(),
  cbuMiPymes: z.string().nullable().optional(),
  montoMinimoFce: z.number().nullable().optional(),
  activa: z.boolean().optional(),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let config = await prismaJm.configuracionArca.findUnique({ where: { id: "unico" } })
  if (!config) {
    config = await prismaJm.configuracionArca.create({
      data: { id: "unico", cuit: "", razonSocial: "" },
    })
  }
  return NextResponse.json(config)
}

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const config = await prismaJm.configuracionArca.upsert({
    where: { id: "unico" },
    create: { id: "unico", cuit: "", razonSocial: "", ...parsed.data, actualizadoPor: session.user.email },
    update: { ...parsed.data, actualizadoPor: session.user.email },
  })
  return NextResponse.json(config)
}
