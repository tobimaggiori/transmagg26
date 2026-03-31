/**
 * PATCH /api/tarjetas/[id]/resumenes/[resumenId]  — Edita un resumen (s3Key, pagado, totalARS/USD)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const editarResumenSchema = z.object({
  totalARS: z.number().nonnegative().optional(),
  totalUSD: z.number().nonnegative().nullable().optional(),
  fechaVtoPago: z.string().datetime().optional(),
  s3Key: z.string().nullable().optional(),
  pagado: z.boolean().optional(),
})

/**
 * PATCH: NextRequest, { params } -> Promise<NextResponse>
 * Edita un resumen mensual existente.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { resumenId } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = editarResumenSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const resumen = await prisma.resumenTarjeta.update({
      where: { id: resumenId },
      data: parsed.data,
    })
    return NextResponse.json(resumen)
  } catch (error) {
    console.error(`PATCH /api/tarjetas/.../resumenes/${resumenId} error:`, error)
    return NextResponse.json({ error: "Error al editar resumen", detail: String(error) }, { status: 500 })
  }
}
