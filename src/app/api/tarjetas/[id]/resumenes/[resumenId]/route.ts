/**
 * PATCH /api/tarjetas/[id]/resumenes/[resumenId] — Edita resumen (saldos/PDF/estado).
 * DELETE — Elimina si no tiene días conciliados.
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
  periodoDesde: z.string().datetime().optional(),
  periodoHasta: z.string().datetime().optional(),
  s3Key: z.string().nullable().optional(),
  pagado: z.boolean().optional(),
  estado: z.enum(["PENDIENTE", "EN_CURSO", "CONCILIADO"]).optional(),
})

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id, resumenId } = await params

  const existente = await prisma.resumenTarjeta.findUnique({
    where: { id: resumenId },
    select: { id: true, tarjetaId: true },
  })
  if (!existente || existente.tarjetaId !== id) {
    return NextResponse.json({ error: "Resumen no encontrado" }, { status: 404 })
  }

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
    const data: Record<string, unknown> = {}
    if (parsed.data.totalARS !== undefined) data.totalARS = parsed.data.totalARS
    if (parsed.data.totalUSD !== undefined) data.totalUSD = parsed.data.totalUSD
    if (parsed.data.fechaVtoPago) data.fechaVtoPago = new Date(parsed.data.fechaVtoPago)
    if (parsed.data.periodoDesde) data.periodoDesde = new Date(parsed.data.periodoDesde)
    if (parsed.data.periodoHasta) data.periodoHasta = new Date(parsed.data.periodoHasta)
    if (parsed.data.s3Key !== undefined) data.s3Key = parsed.data.s3Key
    if (parsed.data.pagado !== undefined) data.pagado = parsed.data.pagado
    if (parsed.data.estado !== undefined) {
      data.estado = parsed.data.estado
      data.conciliadoEn = parsed.data.estado === "CONCILIADO" ? new Date() : null
    }

    const resumen = await prisma.resumenTarjeta.update({
      where: { id: resumenId },
      data,
    })
    return NextResponse.json(resumen)
  } catch (error) {
    console.error(`PATCH /api/tarjetas/.../resumenes/${resumenId} error:`, error)
    return NextResponse.json({ error: "Error al editar resumen", detail: String(error) }, { status: 500 })
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; resumenId: string }> },
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id, resumenId } = await params
  const existente = await prisma.resumenTarjeta.findUnique({
    where: { id: resumenId },
    include: { _count: { select: { diasConciliados: true } } },
  })
  if (!existente || existente.tarjetaId !== id) {
    return NextResponse.json({ error: "Resumen no encontrado" }, { status: 404 })
  }
  if (existente._count.diasConciliados > 0) {
    return NextResponse.json(
      { error: "No se puede eliminar: tiene días conciliados. Desconcilialos primero." },
      { status: 400 },
    )
  }
  await prisma.resumenTarjeta.delete({ where: { id: resumenId } })
  return NextResponse.json({ ok: true })
}
