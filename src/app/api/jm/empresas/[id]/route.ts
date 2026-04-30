import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const updateSchema = z.object({
  razonSocial: z.string().min(1).optional(),
  condicionIva: z.enum(["RESPONSABLE_INSCRIPTO", "MONOTRIBUTISTA", "EXENTO", "CONSUMIDOR_FINAL"]).optional(),
  direccion: z.string().nullable().optional(),
  padronFce: z.boolean().optional(),
  activa: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const empresa = await prismaJm.empresa.findUnique({ where: { id: params.id } })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

  const actualizada = await prismaJm.empresa.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(actualizada)
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empresa = await prismaJm.empresa.findUnique({
    where: { id: params.id },
    include: { _count: { select: { viajes: true, facturasEmitidas: true } } },
  })
  if (!empresa) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })
  if (empresa._count.viajes > 0 || empresa._count.facturasEmitidas > 0) {
    return NextResponse.json({ error: "No se puede eliminar: tiene viajes o facturas asociadas" }, { status: 422 })
  }

  await prismaJm.empresa.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
