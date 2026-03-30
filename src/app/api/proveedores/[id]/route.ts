/**
 * API Routes para proveedor individual.
 * PATCH /api/proveedores/[id] - Actualiza proveedor
 * DELETE /api/proveedores/[id] - Desactiva proveedor (soft delete)
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
  rubro: z.string().optional(),
  activo: z.boolean().optional(),
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del proveedor y campos opcionales { razonSocial, condicionIva, rubro, activo },
 * actualiza los datos del proveedor y devuelve el registro actualizado.
 * Existe para corregir datos de un proveedor registrado sin eliminarlo.
 *
 * Ejemplos:
 * PATCH /api/proveedores/p1 { rubro: "Peajes" }
 * // => 200 { id: "p1", rubro: "Peajes", ... }
 * PATCH /api/proveedores/noexiste { rubro: "Peajes" }
 * // => 404 { error: "Proveedor no encontrado" }
 * PATCH /api/proveedores/p1 { razonSocial: "" }
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

    const existe = await prisma.proveedor.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    const proveedor = await prisma.proveedor.update({
      where: { id: params.id },
      data: parsed.data,
    })

    return NextResponse.json(proveedor)
  } catch (error) {
    console.error("[PATCH /api/proveedores/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del proveedor, lo desactiva (soft delete) sin eliminar el registro.
 * Existe para retirar un proveedor del sistema conservando los asientos
 * contables históricos que lo referencian.
 *
 * Ejemplos:
 * DELETE /api/proveedores/p1 (proveedor activo)
 * // => 200 { message: "Proveedor desactivado correctamente" }
 * DELETE /api/proveedores/noexiste
 * // => 404 { error: "Proveedor no encontrado" }
 * DELETE /api/proveedores/p1 (sesión FLETERO)
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
    const existe = await prisma.proveedor.findUnique({ where: { id: params.id } })
    if (!existe) return NextResponse.json({ error: "Proveedor no encontrado" }, { status: 404 })

    await prisma.proveedor.update({ where: { id: params.id }, data: { activo: false } })

    return NextResponse.json({ message: "Proveedor desactivado correctamente" })
  } catch (error) {
    console.error("[DELETE /api/proveedores/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
