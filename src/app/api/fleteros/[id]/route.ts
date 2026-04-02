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
  direccion: z.string().nullable().optional(),
  comisionDefault: z.number().min(0).max(100).optional(),
  telefono: z.string().optional(),
  activo: z.boolean().optional(),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero, devuelve todos los datos del fletero incluyendo dirección
 * y los datos de su usuario asociado.
 * Existe para obtener el detalle completo de un fletero específico en formularios
 * de edición y en el panel de liquidaciones.
 *
 * Ejemplos:
 * GET /api/fleteros/f1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id: "f1", razonSocial: "...", cuit: "...", direccion: "...", usuario: {...} }
 * GET /api/fleteros/noexiste (sesión ADMIN_TRANSMAGG)
 * // => 404 { error: "Fletero no encontrado" }
 * GET /api/fleteros/f1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const fletero = await prisma.fletero.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        razonSocial: true,
        cuit: true,
        condicionIva: true,
        direccion: true,
        comisionDefault: true,
        activo: true,
        usuario: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      },
    })

    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })
    return NextResponse.json(fletero)
  } catch (error) {
    console.error("[GET /api/fleteros/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero y campos opcionales { razonSocial, condicionIva, direccion, comisionDefault, telefono, activo },
 * actualiza los datos del fletero y su usuario en paralelo si incluye teléfono.
 * Existe para permitir que el panel interno modifique datos de un fletero
 * sin necesidad de recrearlo, actualizando fletero y usuario atómicamente.
 *
 * Ejemplos:
 * PATCH /api/fleteros/f1 { comisionDefault: 12, direccion: "Av. Mitre 123" }
 * // => 200 { id: "f1", comisionDefault: 12, direccion: "Av. Mitre 123", usuario: {...} }
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

    const fletero = await prisma.fletero.findUnique({
      where: { id: params.id },
      include: { camiones: { where: { activo: true }, select: { id: true } } },
    })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    const { telefono, activo, ...datosFletero } = parsed.data

    if (activo !== undefined) {
      // Togglear activo: sincronizar usuario y, si se desactiva, cerrar asignaciones de chofer
      const ahora = new Date()
      await prisma.$transaction(async (tx) => {
        if (activo === false) {
          const camionIds = fletero.camiones.map((c) => c.id)
          if (camionIds.length > 0) {
            await tx.camionChofer.updateMany({
              where: { camionId: { in: camionIds }, hasta: null },
              data: { hasta: ahora },
            })
          }
        }
        await tx.fletero.update({ where: { id: params.id }, data: { activo } })
        await tx.usuario.update({ where: { id: fletero.usuarioId }, data: { activo } })
      })
    } else {
      // Actualizar datos del fletero y usuario en paralelo si hay cambio de teléfono
      const updates: Promise<unknown>[] = [
        prisma.fletero.update({ where: { id: params.id }, data: datosFletero }),
      ]
      if (telefono !== undefined) {
        updates.push(
          prisma.usuario.update({ where: { id: fletero.usuarioId }, data: { telefono } })
        )
      }
      await Promise.all(updates)
    }
    const actualizado = await prisma.fletero.findUnique({
      where: { id: params.id },
      select: {
        id: true,
        razonSocial: true,
        cuit: true,
        condicionIva: true,
        direccion: true,
        comisionDefault: true,
        activo: true,
        usuario: { select: { nombre: true, apellido: true, email: true, telefono: true } },
      },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/fleteros/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero, lo elimina permanentemente si no tiene viajes ni liquidaciones.
 * Si tiene registros asociados, devuelve 422 con el detalle.
 * Existe para permitir borrar fleteros creados por error sin historial operativo.
 *
 * Ejemplos:
 * DELETE /api/fleteros/f1 (sin viajes ni liquidaciones)
 * // => 200 { message: "Fletero eliminado correctamente" }
 * DELETE /api/fleteros/f1 (con 5 viajes)
 * // => 422 { error: "No se puede eliminar: tiene 5 viaje(s) y 0 liquidación(es) asociados." }
 * DELETE /api/fleteros/noexiste
 * // => 404 { error: "Fletero no encontrado" }
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
    const fletero = await prisma.fletero.findUnique({
      where: { id: params.id },
      include: { camiones: { select: { id: true } } },
    })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    const [nViajes, nLiquidaciones] = await Promise.all([
      prisma.viaje.count({ where: { fleteroId: params.id } }),
      prisma.liquidacion.count({ where: { fleteroId: params.id } }),
    ])

    if (nViajes > 0 || nLiquidaciones > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${nViajes} viaje(s) y ${nLiquidaciones} liquidación(es) asociados. Desactivá el fletero en su lugar.` },
        { status: 422 }
      )
    }

    const camionIds = fletero.camiones.map((c) => c.id)

    await prisma.$transaction(async (tx) => {
      if (camionIds.length > 0) {
        await tx.polizaSeguro.deleteMany({ where: { camionId: { in: camionIds } } })
        await tx.infraccion.deleteMany({ where: { camionId: { in: camionIds } } })
        await tx.camionChofer.deleteMany({ where: { camionId: { in: camionIds } } })
        await tx.camion.deleteMany({ where: { id: { in: camionIds } } })
      }
      await tx.contactoEmail.deleteMany({ where: { fleteroId: params.id } })
      // Desactivar primero los choferes (usuarios vinculados al fletero) antes de borrar el fletero
      await tx.usuario.updateMany({ where: { fleteroId: params.id, rol: "CHOFER" }, data: { activo: false } })
      await tx.fletero.delete({ where: { id: params.id } })
      await tx.usuario.delete({ where: { id: fletero.usuarioId } })
    })

    return NextResponse.json({ message: "Fletero eliminado correctamente" })
  } catch (error) {
    console.error("[DELETE /api/fleteros/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
