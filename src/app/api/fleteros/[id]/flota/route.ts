/**
 * API Route para obtener la flota completa de un fletero.
 * GET /api/fleteros/[id]/flota
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin, esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del fletero, devuelve sus camiones activos con el chofer actual asignado
 * (CamionChofer con hasta=null) y la lista de choferes del fletero sin camión activo.
 * FLETERO solo puede consultar su propia flota. ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG
 * pueden consultar cualquier fletero.
 * Existe para que el ABM y la página Mi Flota muestren la flota completa
 * organizada por camión y chofer, incluyendo choferes aún sin camión asignado.
 *
 * Ejemplos:
 * GET /api/fleteros/f1/flota (sesión ADMIN_TRANSMAGG)
 * // => 200 { camiones: [{ id, patenteChasis, tipoCamion, choferActual: { id, nombre, apellido } | null }], choferesSinCamion: [...] }
 * GET /api/fleteros/f1/flota (sesión FLETERO propio)
 * // => 200 { camiones: [...], choferesSinCamion: [...] }
 * GET /api/fleteros/f1/flota (sesión FLETERO ajeno)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/fleteros/noexiste/flota
 * // => 404 { error: "Fletero no encontrado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol

  try {
    const fletero = await prisma.fletero.findUnique({ where: { id: params.id } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    // FLETERO solo puede ver su propia flota
    if (rol === "FLETERO") {
      const fleteroPropio = await prisma.fletero.findFirst({
        where: { id: params.id, usuario: { email: session.user.email } },
      })
      if (!fleteroPropio) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    } else if (!esRolInterno(rol)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Camiones activos con chofer actual
    const camiones = await prisma.camion.findMany({
      where: { fleteroId: params.id, activo: true },
      orderBy: { patenteChasis: "asc" },
      select: {
        id: true,
        patenteChasis: true,
        patenteAcoplado: true,
        tipoCamion: true,
        choferHistorial: {
          where: { hasta: null },
          select: {
            chofer: { select: { id: true, nombre: true, apellido: true, email: true } },
          },
          take: 1,
        },
      },
    })

    // Todos los choferes del fletero
    const todosChoferes = await prisma.usuario.findMany({
      where: { fleteroId: params.id, rol: "CHOFER", activo: true },
      select: { id: true, nombre: true, apellido: true, email: true },
      orderBy: [{ apellido: "asc" }, { nombre: "asc" }],
    })

    // IDs de choferes con camión activo
    const choferesConCamion = new Set(
      camiones.flatMap((c) => c.choferHistorial.map((h) => h.chofer.id))
    )

    const choferesSinCamion = todosChoferes.filter((c) => !choferesConCamion.has(c.id))

    const resultado = {
      camiones: camiones.map((c) => ({
        id: c.id,
        patenteChasis: c.patenteChasis,
        patenteAcoplado: c.patenteAcoplado,
        tipoCamion: c.tipoCamion,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
      })),
      choferesSinCamion,
    }

    return NextResponse.json(resultado)
  } catch (error) {
    console.error("[GET /api/fleteros/[id]/flota]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
