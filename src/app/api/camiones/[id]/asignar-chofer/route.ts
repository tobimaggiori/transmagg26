/**
 * API Route para asignar un chofer a un camión.
 * POST /api/camiones/[id]/asignar-chofer
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const asignarChoferSchema = z.object({
  choferId: z.string().uuid(),
})

/**
 * POST: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del camión y { choferId }, cierra la asignación anterior (hasta=now)
 * y crea una nueva entrada en CamionChofer con desde=now y hasta=null.
 * También actualiza el fleteroId en el Usuario (chofer) para vincularlo al fletero dueño del camión.
 * Solo accesible por ADMIN_TRANSMAGG.
 * Existe para mantener el historial de asignaciones chofer↔camión de forma atómica
 * y garantizar que un camión tenga a lo sumo un chofer activo en todo momento.
 *
 * Ejemplos:
 * POST /api/camiones/c1/asignar-chofer { choferId: "u1" }
 * // => 200 { id, camionId: "c1", choferId: "u1", desde, hasta: null }
 * POST /api/camiones/noexiste/asignar-chofer { choferId: "u1" }
 * // => 404 { error: "Camión no encontrado" }
 * POST /api/camiones/c1/asignar-chofer { choferId: "u_no_chofer" }
 * // => 400 { error: "El usuario no tiene rol CHOFER" }
 * POST /api/camiones/c1/asignar-chofer { choferId: "u1" } (chofer de otro fletero)
 * // => 400 { error: "El chofer no pertenece al mismo fletero que el camión" }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol) && !esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = asignarChoferSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { choferId } = parsed.data

    const camion = await prisma.camion.findUnique({ where: { id: params.id } })
    if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })

    const chofer = await prisma.usuario.findUnique({ where: { id: choferId } })
    if (!chofer) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    if (chofer.rol !== "CHOFER") return NextResponse.json({ error: "El usuario no tiene rol CHOFER" }, { status: 400 })

    // Para camiones propios (esPropio=true, fleteroId=null), cualquier chofer sin fletero es válido.
    // Para camiones de fletero, el chofer debe pertenecer al mismo fletero (o no tener fletero asignado aún).
    if (!camion.esPropio) {
      if (chofer.fleteroId && chofer.fleteroId !== camion.fleteroId) {
        return NextResponse.json({ error: "El chofer no pertenece al mismo fletero que el camión" }, { status: 400 })
      }
    }

    const ahora = new Date()

    const asignacion = await prisma.$transaction(async (tx) => {
      // Cerrar asignación anterior del camión (si existe)
      await tx.camionChofer.updateMany({
        where: { camionId: params.id, hasta: null },
        data: { hasta: ahora },
      })

      // Crear nueva asignación
      const nueva = await tx.camionChofer.create({
        data: { camionId: params.id, choferId, desde: ahora },
      })

      // Vincular fletero al chofer
      await tx.usuario.update({
        where: { id: choferId },
        data: { fleteroId: camion.fleteroId },
      })

      return nueva
    })

    return NextResponse.json(asignacion)
  } catch (error) {
    console.error("[POST /api/camiones/[id]/asignar-chofer]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
