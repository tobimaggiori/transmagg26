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
  padronFce: z.boolean().optional(),
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
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id de la empresa, la elimina permanentemente si no tiene viajes ni facturas.
 * Si tiene registros asociados, devuelve 422 con el detalle.
 * Existe para permitir borrar empresas creadas por error sin historial operativo.
 *
 * Ejemplos:
 * DELETE /api/empresas/e1 (sin viajes ni facturas)
 * // => 200 { message: "Empresa eliminada correctamente" }
 * DELETE /api/empresas/e1 (con 3 viajes)
 * // => 422 { error: "No se puede eliminar: tiene 3 viaje(s) y 0 factura(s) asociados." }
 * DELETE /api/empresas/noexiste
 * // => 404 { error: "Empresa no encontrada" }
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

    const [nViajes, nFacturas] = await Promise.all([
      prisma.viaje.count({ where: { empresaId: params.id } }),
      prisma.facturaEmitida.count({ where: { empresaId: params.id } }),
    ])

    if (nViajes > 0 || nFacturas > 0) {
      return NextResponse.json(
        { error: `No se puede eliminar: tiene ${nViajes} viaje(s) y ${nFacturas} factura(s) asociados. Desactivá la empresa en su lugar.` },
        { status: 422 }
      )
    }

    await prisma.$transaction(async (tx) => {
      await tx.contactoEmail.deleteMany({ where: { empresaId: params.id } })
      await tx.empresa.delete({ where: { id: params.id } })
    })

    return NextResponse.json({ message: "Empresa eliminada correctamente" })
  } catch (error) {
    console.error("[DELETE /api/empresas/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
