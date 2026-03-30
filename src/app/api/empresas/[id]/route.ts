/**
 * API Routes para empresa individual.
 * PATCH /api/empresas/[id] - Actualiza empresa
 * DELETE /api/empresas/[id] - Desactiva empresa (soft delete)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const actualizarSchema = z.object({
  razonSocial: z.string().min(1).optional(),
  condicionIva: z.string().min(1).optional(),
  direccion: z.string().optional(),
  activa: z.boolean().optional(),
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la empresa y campos opcionales { razonSocial, condicionIva, direccion, activa },
 * actualiza los datos de la empresa y devuelve el registro actualizado.
 * Existe para permitir al panel interno modificar datos de una empresa
 * sin necesidad de eliminarla y recrearla.
 *
 * Ejemplos:
 * PATCH /api/empresas/e1 { condicionIva: "Exento" }
 * // => 200 { id: "e1", condicionIva: "Exento", ... }
 * PATCH /api/empresas/noexiste { condicionIva: "RI" }
 * // => 404 { error: "Empresa no encontrada" }
 * PATCH /api/empresas/e1 { razonSocial: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = actualizarSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const existe = await prisma.empresa.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    const empresa = await prisma.empresa.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(empresa)
  } catch (error) {
    console.error("[PATCH /api/empresas/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la empresa, la desactiva (soft delete) sin eliminar registros.
 * Existe para conservar el historial de facturas y viajes asociados
 * a la empresa mientras se impide su aparición en formularios nuevos.
 *
 * Ejemplos:
 * DELETE /api/empresas/e1 (empresa activa)
 * // => 200 { message: "Empresa desactivada correctamente" }
 * DELETE /api/empresas/noexiste
 * // => 404 { error: "Empresa no encontrada" }
 * DELETE /api/empresas/e1 (sesión ADMIN_EMPRESA)
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
    const existe = await prisma.empresa.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Empresa no encontrada" }, { status: 404 })

    await prisma.empresa.update({ where: { id: params.id }, data: { activa: false } })

    return NextResponse.json({ message: "Empresa desactivada correctamente" })
  } catch (error) {
    console.error("[DELETE /api/empresas/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
