/**
 * API JM Viaje individual: GET / PATCH / DELETE.
 * En JM no hay liquidaciones ni facturas, así que la edición/borrado es libre.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { Prisma } from ".prisma/jm-client"
import { auth } from "@/lib/auth"
import { prismaJm } from "@/jm/prisma"
import { esRolInterno } from "@/lib/permissions"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { Rol } from "@/types"

function normalizarProvincia(valor: string): string {
  const upper = valor.toUpperCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.toUpperCase() === upper) ?? valor
}

const provinciaOptSchema = z.string().transform(normalizarProvincia).nullable().optional()

const actualizarViajeSchema = z.object({
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  empresaId: z.string().optional(),
  camionId: z.string().optional(),
  choferId: z.string().optional(),
  remito: z.string().nullable().optional(),
  remitoS3Key: z.string().nullable().optional(),
  tieneCtg: z.boolean().optional(),
  nroCtg: z.string().nullable().optional(),
  ctgS3Key: z.string().nullable().optional(),
  cpe: z.string().nullable().optional(),
  tieneCupo: z.boolean().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().min(1).optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: provinciaOptSchema,
  destino: z.string().nullable().optional(),
  provinciaDestino: provinciaOptSchema,
  kilos: z.number().positive().nullable().optional(),
  tarifaEmpresa: z.number().positive().optional(),
})

export async function GET(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const viaje = await prismaJm.viaje.findUnique({
      where: { id: params.id },
      include: {
        empresa: { select: { razonSocial: true, cuit: true } },
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
      },
    })
    if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
    return NextResponse.json(viaje)
  } catch (error) {
    console.error("[GET /api/jm/viajes/[id]]", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}

export async function PATCH(request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = actualizarViajeSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }
    const existente = await prismaJm.viaje.findUnique({ where: { id: params.id } })
    if (!existente) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

    const { fechaViaje, ...resto } = parsed.data
    const data: Prisma.ViajeUncheckedUpdateInput = {
      ...resto,
      ...(fechaViaje ? { fechaViaje: new Date(fechaViaje) } : {}),
    }
    const actualizado = await prismaJm.viaje.update({
      where: { id: params.id },
      data,
      include: {
        empresa: { select: { razonSocial: true, cuit: true } },
        camion: { select: { patenteChasis: true } },
        chofer: { select: { nombre: true, apellido: true } },
      },
    })
    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/jm/viajes/[id]]", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, { params }: { params: { id: string } }) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const existente = await prismaJm.viaje.findUnique({ where: { id: params.id } })
    if (!existente) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })
    await prismaJm.viaje.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/jm/viajes/[id]]", error)
    return NextResponse.json({ error: error instanceof Error ? error.message : "Error" }, { status: 500 })
  }
}
