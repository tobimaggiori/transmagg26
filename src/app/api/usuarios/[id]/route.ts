/**
 * API Routes para usuario individual.
 * PATCH /api/usuarios/[id] - Actualiza usuario (ADMIN_TRANSMAGG)
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
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del usuario y campos opcionales { nombre, apellido, telefono, activo },
 * actualiza los datos del usuario. Solo accesible por ADMIN_TRANSMAGG.
 * Existe para que el administrador pueda modificar o desactivar usuarios
 * del sistema sin necesidad de eliminarlos.
 *
 * Ejemplos:
 * PATCH /api/usuarios/u1 { activo: false }
 * // => 200 { id: "u1", activo: false, ... }
 * PATCH /api/usuarios/noexiste { activo: false }
 * // => 404 { error: "Usuario no encontrado" }
 * PATCH /api/usuarios/u1 { nombre: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
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
