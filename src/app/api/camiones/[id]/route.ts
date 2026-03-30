/**
 * API Routes para camión individual.
 * PATCH /api/camiones/[id] - Actualiza camión
 * DELETE /api/camiones/[id] - Desactiva camión (soft delete)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const actualizarSchema = z.object({
  patenteAcoplado: z.string().min(6).max(8).toUpperCase().nullable().optional(),
  tipoCamion: z.string().min(1).optional(),
  activo: z.boolean().optional(),
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del camión y campos opcionales { patenteAcoplado, tipoCamion, activo },
 * actualiza el camión. FLETERO solo puede modificar sus propios camiones.
 * Existe para corregir o actualizar datos de un camión registrado
 * sin necesidad de eliminarlo y recrearlo.
 *
 * Ejemplos:
 * PATCH /api/camiones/c1 { tipoCamion: "Chasis" }
 * // => 200 { id: "c1", tipoCamion: "Chasis", ... }
 * PATCH /api/camiones/noexiste { tipoCamion: "Semi" }
 * // => 404 { error: "Camión no encontrado" }
 * PATCH /api/camiones/c1 { tipoCamion: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol

  try {
    const body = await request.json()
    const parsed = actualizarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const camion = await prisma.camion.findUnique({ where: { id: params.id } })
    if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })

    // FLETERO solo puede modificar sus propios camiones
    if (rol === "FLETERO") {
      const fleteroPropio = await prisma.fletero.findFirst({
        where: { id: camion.fleteroId, usuario: { email: session.user.email } },
      })
      if (!fleteroPropio) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    } else if (!esRolInterno(rol)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    const actualizado = await prisma.camion.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/camiones/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del camión, lo desactiva (soft delete) sin eliminar el registro.
 * Solo roles internos pueden desactivar camiones.
 * Existe para retirar un camión del sistema conservando su historial
 * en viajes y liquidaciones anteriores.
 *
 * Ejemplos:
 * DELETE /api/camiones/c1 (camión activo, sesión ADMIN_TRANSMAGG)
 * // => 200 { message: "Camión desactivado correctamente" }
 * DELETE /api/camiones/noexiste
 * // => 404 { error: "Camión no encontrado" }
 * DELETE /api/camiones/c1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const existe = await prisma.camion.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })

    await prisma.camion.update({ where: { id: params.id }, data: { activo: false } })

    return NextResponse.json({ message: "Camión desactivado correctamente" })
  } catch (error) {
    console.error("[DELETE /api/camiones/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
