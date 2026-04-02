/**
 * GET    /api/polizas/[id]  — detalle de una póliza
 * PATCH  /api/polizas/[id]  — actualizar campos
 * DELETE /api/polizas/[id]  — eliminar póliza
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const patchSchema = z.object({
  aseguradora:     z.string().min(1).optional(),
  nroPoliza:       z.string().min(1).optional(),
  tipoBien:        z.enum(["CAMION", "VEHICULO", "INMUEBLE", "EQUIPO", "CARGA_GENERAL"]).optional(),
  camionId:        z.string().uuid().nullable().optional(),
  proveedorId:     z.string().uuid().nullable().optional(),
  descripcionBien: z.string().nullable().optional(),
  cobertura:       z.string().nullable().optional(),
  vigenciaDesde:   z.string().optional(),
  vigenciaHasta:   z.string().optional(),
  montoMensual:    z.number().nullable().optional(),
  pdfS3Key:        z.string().nullable().optional(),
  activa:          z.boolean().optional(),
})

function polizaConEstado(p: { vigenciaHasta: Date | string; activa: boolean }) {
  const now = new Date()
  const vh = new Date(p.vigenciaHasta)
  if (!p.activa || vh < now) return "VENCIDA"
  if (vh <= new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)) return "POR_VENCER"
  return "VIGENTE"
}

async function checkAcceso() {
  const session = await auth()
  if (!session?.user) return null
  if (!esRolInterno(session.user.rol as Rol)) return null
  return session
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAcceso()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const p = await prisma.polizaSeguro.findUnique({
    where: { id },
    include: { camion: { select: { patenteChasis: true } }, proveedor: { select: { razonSocial: true, cuit: true } } },
  })
  if (!p) return NextResponse.json({ error: "No encontrada" }, { status: 404 })
  return NextResponse.json({ ...p, vigenciaDesde: p.vigenciaDesde.toISOString(), vigenciaHasta: p.vigenciaHasta.toISOString(), creadoEn: p.creadoEn.toISOString(), estadoPoliza: polizaConEstado(p) })
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAcceso()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  const body = await req.json()
  const parsed = patchSchema.safeParse(body)
  if (!parsed.success) return NextResponse.json({ error: "Datos inválidos" }, { status: 400 })

  const d = parsed.data
  const p = await prisma.polizaSeguro.update({
    where: { id },
    data: {
      ...d,
      ...(d.vigenciaDesde ? { vigenciaDesde: new Date(d.vigenciaDesde) } : {}),
      ...(d.vigenciaHasta ? { vigenciaHasta: new Date(d.vigenciaHasta) } : {}),
    },
    include: { camion: { select: { patenteChasis: true } }, proveedor: { select: { razonSocial: true, cuit: true } } },
  })
  return NextResponse.json({ ...p, vigenciaDesde: p.vigenciaDesde.toISOString(), vigenciaHasta: p.vigenciaHasta.toISOString(), creadoEn: p.creadoEn.toISOString(), estadoPoliza: polizaConEstado(p) })
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!await checkAcceso()) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const { id } = await params
  await prisma.polizaSeguro.delete({ where: { id } })
  return new NextResponse(null, { status: 204 })
}
