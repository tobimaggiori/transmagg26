/**
 * PATCH  /api/tarjetas/[id]/gastos/[gastoId]  — Edita un gasto
 * DELETE /api/tarjetas/[id]/gastos/[gastoId]  — Elimina un gasto
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const TIPOS_GASTO = ["COMBUSTIBLE", "PEAJE", "COMIDA", "ALOJAMIENTO", "REPUESTO", "LAVADO", "OTRO"] as const

const editarGastoSchema = z.object({
  tipoGasto: z.enum(TIPOS_GASTO).optional(),
  monto: z.number().positive().optional(),
  fecha: z.string().datetime().optional(),
  descripcion: z.string().nullable().optional(),
  comprobanteS3Key: z.string().nullable().optional(),
})

/**
 * PATCH: NextRequest, { params } -> Promise<NextResponse>
 * Edita un gasto existente.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; gastoId: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { gastoId } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = editarGastoSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const gasto = await prisma.gastoTarjeta.update({
      where: { id: gastoId },
      data: parsed.data,
      include: { operador: { select: { id: true, nombre: true, apellido: true } } },
    })
    return NextResponse.json(gasto)
  } catch (error) {
    console.error(`PATCH /api/tarjetas/.../gastos/${gastoId} error:`, error)
    return NextResponse.json({ error: "Error al editar gasto", detail: String(error) }, { status: 500 })
  }
}

/**
 * DELETE: NextRequest, { params } -> Promise<NextResponse>
 * Elimina un gasto.
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string; gastoId: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { gastoId } = await params
  try {
    await prisma.gastoTarjeta.delete({ where: { id: gastoId } })
    return NextResponse.json({ ok: true })
  } catch (error) {
    console.error(`DELETE /api/tarjetas/.../gastos/${gastoId} error:`, error)
    return NextResponse.json({ error: "Error al eliminar gasto", detail: String(error) }, { status: 500 })
  }
}
