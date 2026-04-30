import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const updateSchema = z.object({
  razonSocial: z.string().min(1).optional(),
  condicionIva: z.enum(["RESPONSABLE_INSCRIPTO", "MONOTRIBUTISTA", "EXENTO", "CONSUMIDOR_FINAL"]).optional(),
  rubro: z.string().optional(),
  tipo: z.enum(["GENERAL", "ASEGURADORA"]).optional(),
  activo: z.boolean().optional(),
})

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const body = await request.json()
  const parsed = updateSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })

  const proveedor = await prismaJm.proveedor.findUnique({ where: { id: params.id } })
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

  const actualizado = await prismaJm.proveedor.update({ where: { id: params.id }, data: parsed.data })
  return NextResponse.json(actualizado)
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedor = await prismaJm.proveedor.findUnique({
    where: { id: params.id },
    include: { _count: { select: { facturas: true, polizas: true, facturasSeguro: true } } },
  })
  if (!proveedor) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })
  if (proveedor._count.facturas > 0 || proveedor._count.polizas > 0 || proveedor._count.facturasSeguro > 0) {
    return NextResponse.json({ error: "No se puede eliminar: tiene facturas o pólizas asociadas" }, { status: 422 })
  }

  await prismaJm.proveedor.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
