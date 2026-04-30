/**
 * API Route para asignar un chofer (Empleado con cargo CHOFER) a un camión.
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
 * Dado el id del camión y { choferId } (id de un Empleado con cargo CHOFER),
 * cierra la asignación previa (hasta=now) y crea una nueva en CamionChofer.
 * Para camiones de fletero, el empleado debe pertenecer al mismo fletero.
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

    const chofer = await prisma.empleado.findUnique({ where: { id: choferId } })
    if (!chofer) return NextResponse.json({ error: "Chofer no encontrado" }, { status: 404 })
    if (chofer.cargo !== "CHOFER") return NextResponse.json({ error: "El empleado no tiene cargo CHOFER" }, { status: 400 })

    // Camión propio: fleteroId=null; empleado debe tener fleteroId=null.
    // Camión de fletero: fleteroId debe coincidir.
    if (camion.fleteroId !== chofer.fleteroId) {
      return NextResponse.json(
        { error: "El chofer no pertenece al mismo fletero que el camión" },
        { status: 400 },
      )
    }

    const ahora = new Date()

    const asignacion = await prisma.$transaction(async (tx) => {
      await tx.camionChofer.updateMany({
        where: { camionId: params.id, hasta: null },
        data: { hasta: ahora },
      })
      return tx.camionChofer.create({
        data: { camionId: params.id, choferId, desde: ahora },
      })
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
