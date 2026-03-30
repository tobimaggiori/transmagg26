/**
 * API Routes para fletero individual.
 * PATCH /api/fleteros/[id] - Actualiza datos del fletero
 * DELETE /api/fleteros/[id] - Desactiva (soft delete) el fletero
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
  comisionDefault: z.number().min(0).max(100).optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
})

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero y campos opcionales { razonSocial, condicionIva, comisionDefault, telefono, activo },
 * actualiza los datos del fletero y su usuario en paralelo si incluye teléfono.
 * Existe para permitir que el panel interno modifique datos de un fletero
 * sin necesidad de recrearlo, actualizando fletero y usuario atómicamente.
 *
 * Ejemplos:
 * PATCH /api/fleteros/f1 { comisionDefault: 12 }
 * // => 200 { id: "f1", comisionDefault: 12, usuario: {...} }
 * PATCH /api/fleteros/noexiste { comisionDefault: 12 }
 * // => 404 { error: "Fletero no encontrado" }
 * PATCH /api/fleteros/f1 { comisionDefault: -5 }
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

    const fletero = await prisma.fletero.findUnique({ where: { id: params.id } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    const { telefono, ...datosFletero } = parsed.data

    // Actualizar fletero y usuario en paralelo si hay cambio de teléfono
    const updates: Promise<unknown>[] = [
      prisma.fletero.update({ where: { id: params.id }, data: datosFletero }),
    ]
    if (telefono !== undefined) {
      updates.push(
        prisma.usuario.update({ where: { id: fletero.usuarioId }, data: { telefono } })
      )
    }

    await Promise.all(updates)
    const actualizado = await prisma.fletero.findUnique({
      where: { id: params.id },
      include: { usuario: { select: { nombre: true, apellido: true, email: true, telefono: true } } },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/fleteros/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero, desactiva el fletero y su usuario (soft delete)
 * en paralelo, sin eliminar registros de la DB.
 * Existe para conservar el historial de liquidaciones y camiones asociados
 * al fletero mientras se impide su acceso al sistema.
 *
 * Ejemplos:
 * DELETE /api/fleteros/f1 (fletero activo)
 * // => 200 { message: "Fletero desactivado correctamente" }
 * DELETE /api/fleteros/noexiste
 * // => 404 { error: "Fletero no encontrado" }
 * DELETE /api/fleteros/f1 (sesión FLETERO)
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
    const fletero = await prisma.fletero.findUnique({ where: { id: params.id } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    await Promise.all([
      prisma.fletero.update({ where: { id: params.id }, data: { activo: false } }),
      prisma.usuario.update({ where: { id: fletero.usuarioId }, data: { activo: false } }),
    ])

    return NextResponse.json({ message: "Fletero desactivado correctamente" })
  } catch (error) {
    console.error("[DELETE /api/fleteros/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
