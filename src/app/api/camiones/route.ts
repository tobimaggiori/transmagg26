/**
 * API Routes para gestión de camiones.
 * GET  /api/camiones - Lista camiones (filtrado por rol)
 * POST /api/camiones - Crea camión (ADMIN/OPERADOR_TRANSMAGG o FLETERO propio)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverFleteroIdPorEmail, verificarPropietarioFletero } from "@/lib/session-utils"
import type { Rol } from "@/types"

const crearCamionSchema = z.object({
  fleteroId: z.string().uuid(),
  patenteChasis: z.string().min(6).max(8).toUpperCase(),
  patenteAcoplado: z.string().min(6).max(8).toUpperCase().optional(),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve camiones activos filtrados por rol: FLETERO solo ve sus camiones,
 * roles internos ven todos. Incluye razón social del fletero.
 * Existe para el listado de camiones en el panel, donde cada fletero
 * solo accede a su propia flota.
 *
 * Ejemplos:
 * GET /api/camiones (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, patenteChasis, fletero: { razonSocial } }]
 * GET /api/camiones (sesión FLETERO con id "f1")
 * // => 200 [{ id, patenteChasis, ... }] (solo los camiones de f1)
 * GET /api/camiones (sesión ADMIN_EMPRESA)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  let whereClause = {}

  if (rol === "FLETERO") {
    const fleteroId = await resolverFleteroIdPorEmail(session.user.email ?? "")
    if (!fleteroId) return NextResponse.json([])
    whereClause = { fleteroId }
  } else if (!esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  try {
    const camiones = await prisma.camion.findMany({
      where: { ...whereClause, activo: true },
      include: { fletero: { select: { razonSocial: true } } },
      orderBy: { patenteChasis: "asc" },
    })
    return NextResponse.json(camiones)
  } catch (error) {
    console.error("[GET /api/camiones]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { fleteroId, patenteChasis, patenteAcoplado? },
 * crea un camión verificando que la patente no esté duplicada y que
 * un FLETERO solo pueda crear camiones bajo su propio fleteroId.
 * Existe para registrar vehículos en el sistema de forma segura,
 * con control de acceso por rol.
 *
 * Ejemplos:
 * POST /api/camiones { fleteroId: "f1", patenteChasis: "ABC123" }
 * // => 201 { id, patenteChasis: "ABC123", fleteroId: "f1" }
 * POST /api/camiones { ...datos, patenteChasis: "ABC123" } (patente duplicada)
 * // => 409 { error: "La patente chasis ya está registrada" }
 * POST /api/camiones { ...datos, patenteChasis: "x" } (muy corta)
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol

  try {
    const body = await request.json()
    const parsed = crearCamionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { fleteroId, patenteChasis, patenteAcoplado } = parsed.data

    // Un FLETERO solo puede crear camiones bajo su propio fleteroId
    if (rol === "FLETERO") {
      const esPropietario = await verificarPropietarioFletero(fleteroId, session.user.email!)
      if (!esPropietario) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    } else if (!esRolInterno(rol)) {
      return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
    }

    // Verificar patente única
    const patenteExiste = await prisma.camion.findUnique({ where: { patenteChasis } })
    if (patenteExiste) return NextResponse.json({ error: "La patente chasis ya está registrada" }, { status: 409 })

    const camion = await prisma.camion.create({
      data: { fleteroId, patenteChasis, patenteAcoplado },
    })

    return NextResponse.json(camion, { status: 201 })
  } catch (error) {
    console.error("[POST /api/camiones]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
