/**
 * API Routes para usuario individual.
 * PATCH  /api/usuarios/[id] - Actualiza usuario (ADMIN_TRANSMAGG)
 * DELETE /api/usuarios/[id] - Elimina usuario (ADMIN_TRANSMAGG)
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
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
  camionId: z.string().uuid().optional(), // Para CHOFER: reasignar camión
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del usuario y campos opcionales { nombre, apellido, telefono, activo, camionId? },
 * actualiza los datos del usuario. Para CHOFER, si se envía camionId, cierra la asignación
 * previa y crea una nueva en CamionChofer (y valida que el camión sea del mismo fletero).
 * Solo accesible por ADMIN_TRANSMAGG.
 * Existe para que el administrador pueda modificar o reasignar usuarios
 * del sistema sin necesidad de eliminarlos.
 *
 * Ejemplos:
 * PATCH /api/usuarios/u1 { activo: false }
 * // => 200 { id: "u1", activo: false, ... }
 * PATCH /api/usuarios/u1 { camionId: "c2" } (chofer, camión del mismo fletero)
 * // => 200 { id: "u1", ... } (nueva asignación CamionChofer creada)
 * PATCH /api/usuarios/noexiste { activo: false }
 * // => 404 { error: "Usuario no encontrado" }
 * PATCH /api/usuarios/u1 { nombre: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
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

    // No permitir que el admin se elimine a sí mismo
    if (params.id === session.user.id) {
      return NextResponse.json({ error: "No podés eliminar tu propio usuario" }, { status: 400 })
    }

    await prisma.$transaction(async (tx) => {
      // Cerrar asignaciones de camión activas si es CHOFER
      if (existe.rol === "CHOFER") {
        await tx.camionChofer.updateMany({
          where: { choferId: params.id, hasta: null },
          data: { hasta: new Date() },
        })
      }
      // Eliminar permisos granulares
      await tx.permisoUsuario.deleteMany({ where: { usuarioId: params.id } })
      // Eliminar usuario
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

    const { camionId, ...datosUsuario } = parsed.data

    // Si se envía camionId y el usuario es CHOFER, reasignar camión
    if (camionId !== undefined && existe.rol === "CHOFER") {
      const camion = await prisma.camion.findUnique({ where: { id: camionId } })
      if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })
      if (existe.fleteroId && camion.fleteroId !== existe.fleteroId) {
        return NextResponse.json({ error: "El camión no pertenece al fletero del chofer" }, { status: 400 })
      }

      const ahora = new Date()
      const usuario = await prisma.$transaction(async (tx) => {
        await tx.camionChofer.updateMany({
          where: { camionId, hasta: null },
          data: { hasta: ahora },
        })
        await tx.camionChofer.updateMany({
          where: { choferId: params.id, hasta: null },
          data: { hasta: ahora },
        })
        await tx.camionChofer.create({
          data: { camionId, choferId: params.id, desde: ahora },
        })
        return tx.usuario.update({ where: { id: params.id }, data: datosUsuario })
      })
      return NextResponse.json(usuario)
    }

    // Si se desactiva un CHOFER, cerrar su asignación activa en CamionChofer
    if (datosUsuario.activo === false && existe.rol === "CHOFER") {
      const usuario = await prisma.$transaction(async (tx) => {
        await tx.camionChofer.updateMany({
          where: { choferId: params.id, hasta: null },
          data: { hasta: new Date() },
        })
        return tx.usuario.update({ where: { id: params.id }, data: datosUsuario })
      })
      return NextResponse.json(usuario)
    }

    const usuario = await prisma.usuario.update({
      where: { id: params.id },
      data: datosUsuario,
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
