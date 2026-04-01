/**
 * PATCH /api/camiones/[id]/polizas/[polizaId] - Actualiza póliza
 * DELETE /api/camiones/[id]/polizas/[polizaId] - Elimina póliza
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const actualizarPolizaSchema = z.object({
  aseguradora: z.string().min(1).optional(),
  nroPoliza: z.string().min(1).optional(),
  cobertura: z.string().nullable().optional(),
  montoMensual: z.number().positive().nullable().optional(),
  vigenciaDesde: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  vigenciaHasta: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; polizaId: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const poliza = await prisma.polizaSeguro.findFirst({
      where: { id: params.polizaId, camionId: params.id },
    })
    if (!poliza) return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 })

    const body = await request.json()
    const parsed = actualizarPolizaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { vigenciaDesde, vigenciaHasta, ...resto } = parsed.data
    const actualizado = await prisma.polizaSeguro.update({
      where: { id: params.polizaId },
      data: {
        ...resto,
        ...(vigenciaDesde ? { vigenciaDesde: new Date(vigenciaDesde) } : {}),
        ...(vigenciaHasta ? { vigenciaHasta: new Date(vigenciaHasta) } : {}),
      },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/camiones/[id]/polizas/[polizaId]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string; polizaId: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const poliza = await prisma.polizaSeguro.findFirst({
      where: { id: params.polizaId, camionId: params.id },
    })
    if (!poliza) return NextResponse.json({ error: "Póliza no encontrada" }, { status: 404 })

    await prisma.polizaSeguro.delete({ where: { id: params.polizaId } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/camiones/[id]/polizas/[polizaId]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido" },
      { status: 500 }
    )
  }
}
