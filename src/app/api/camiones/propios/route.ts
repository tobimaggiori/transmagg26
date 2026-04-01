/**
 * API Routes para camiones propios de Transmagg.
 * GET  /api/camiones/propios - Lista camiones propios con choferes y pólizas
 * POST /api/camiones/propios - Crea camión propio (solo roles internos)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearCamionPropioSchema = z.object({
  patenteChasis: z.string().min(6).max(8).toUpperCase(),
  patenteAcoplado: z.string().min(6).max(8).toUpperCase().optional().nullable(),
  tipoCamion: z.string().min(1),
})

export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const now = new Date()
    const camiones = await prisma.camion.findMany({
      where: { esPropio: true, activo: true },
      include: {
        choferHistorial: {
          where: { hasta: null },
          include: { chofer: { select: { id: true, nombre: true, apellido: true, email: true, empleado: { select: { id: true, nombre: true, apellido: true } } } } },
          take: 1,
        },
        polizas: {
          orderBy: { vigenciaHasta: "desc" },
        },
      },
      orderBy: { patenteChasis: "asc" },
    })

    // Enrich with estado de póliza
    const camionesEnriquecidos = camiones.map((c) => {
      const polizaVigente = c.polizas.find((p) => p.vigenciaHasta >= now && p.vigenciaDesde <= now)
      const polizaPorVencer = c.polizas.find(
        (p) =>
          p.vigenciaHasta >= now &&
          p.vigenciaHasta <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000) &&
          p.vigenciaDesde <= now
      )
      const polizasConEstado = c.polizas.map((p) => ({
        ...p,
        estadoPoliza:
          p.vigenciaHasta < now
            ? "VENCIDA"
            : p.vigenciaHasta <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
            ? "POR_VENCER"
            : "VIGENTE",
      }))
      return {
        ...c,
        choferActual: c.choferHistorial[0]?.chofer ?? null,
        polizas: polizasConEstado,
        alertaPoliza: polizaPorVencer ? "POR_VENCER" : polizaVigente ? null : "SIN_COBERTURA",
      }
    })

    return NextResponse.json(camionesEnriquecidos)
  } catch (error) {
    console.error("[GET /api/camiones/propios]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearCamionPropioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { patenteChasis, patenteAcoplado, tipoCamion } = parsed.data

    const existente = await prisma.camion.findUnique({ where: { patenteChasis } })
    if (existente) return NextResponse.json({ error: "La patente chasis ya está registrada" }, { status: 409 })

    const camion = await prisma.camion.create({
      data: { patenteChasis, patenteAcoplado, tipoCamion, esPropio: true, fleteroId: null },
    })

    return NextResponse.json(camion, { status: 201 })
  } catch (error) {
    console.error("[POST /api/camiones/propios]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
