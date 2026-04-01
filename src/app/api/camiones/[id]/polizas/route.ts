/**
 * POST /api/camiones/[id]/polizas - Crea póliza de seguro para un camión propio
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearPolizaSchema = z.object({
  aseguradora: z.string().min(1),
  nroPoliza: z.string().min(1),
  cobertura: z.string().optional().nullable(),
  montoMensual: z.number().positive().optional().nullable(),
  vigenciaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  vigenciaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
})

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const camion = await prisma.camion.findUnique({ where: { id: params.id, esPropio: true } })
    if (!camion) return NextResponse.json({ error: "Camión no encontrado o no es propio" }, { status: 404 })

    const body = await request.json()
    const parsed = crearPolizaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { vigenciaDesde, vigenciaHasta, ...resto } = parsed.data
    if (vigenciaHasta <= vigenciaDesde) {
      return NextResponse.json({ error: "La fecha de fin debe ser posterior a la de inicio" }, { status: 400 })
    }

    const poliza = await prisma.polizaSeguro.create({
      data: {
        camionId: params.id,
        ...resto,
        vigenciaDesde: new Date(vigenciaDesde),
        vigenciaHasta: new Date(vigenciaHasta),
      },
    })

    return NextResponse.json(poliza, { status: 201 })
  } catch (error) {
    console.error("[POST /api/camiones/[id]/polizas]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
