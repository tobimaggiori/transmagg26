/**
 * API Routes para usuario individual.
 * PATCH  /api/usuarios/[id] - Actualiza usuario (ADMIN_TRANSMAGG)
 * DELETE /api/usuarios/[id] - Elimina usuario (ADMIN_TRANSMAGG)
 *
 * Desde la migración a Empleado, Usuario rol=CHOFER es solo login; la relación
 * chofer↔camión vive en CamionChofer vía Empleado.id. PATCH/DELETE de Usuario
 * NO tocan camion_chofer.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"

const actualizarSchema = z.object({
  nombre: z.string().min(1).optional(),
  apellido: z.string().min(1).optional(),
  email: z.string().email().optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
})

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const existe = await prisma.usuario.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    if (params.id === session.user.id) {
      return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      await tx.permisoUsuario.deleteMany({ where: { usuarioId: params.id } })
      await tx.usuario.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error("[DELETE /api/usuarios/[id]]", error)
    return NextResponse.json(
      { error: "No se pudo eliminar el usuario. Puede tener registros asociados." },
      { status: 500 }
    )
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = actualizarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existe = await prisma.usuario.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    if (parsed.data.email && parsed.data.email !== existe.email) {
      const ocupado = await prisma.usuario.findUnique({ where: { email: parsed.data.email } })
      if (ocupado && ocupado.id !== params.id) {
        return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })
      }
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(usuario)
  } catch (error) {
    console.error("[PATCH /api/usuarios/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
