/**
 * GET   /api/tarjetas/[id]  — Detalle de una tarjeta con resumenes y últimos gastos
 * PATCH /api/tarjetas/[id]  — Edita campos de la tarjeta (incluyendo activa)
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { esRolInterno } from "@/lib/permissions"
import { prisma } from "@/lib/prisma"
import { z } from "zod"
import type { Rol } from "@/types"

const editarTarjetaSchema = z.object({
  nombre: z.string().min(1).optional(),
  tipo: z.enum(["CREDITO", "DEBITO", "PREPAGA"]).optional(),
  banco: z.string().min(1).optional(),
  ultimos4: z.string().length(4).optional(),
  titularTipo: z.enum(["EMPRESA", "CHOFER", "EMPLEADO"]).optional(),
  titularNombre: z.string().min(1).optional(),
  cuentaId: z.string().nullable().optional(),
  choferId: z.string().nullable().optional(),
  limiteMensual: z.number().positive().nullable().optional(),
  activa: z.boolean().optional(),
})

/**
 * GET: NextRequest, { params } -> Promise<NextResponse>
 * Devuelve el detalle de una tarjeta con sus resúmenes y últimos 20 gastos.
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  try {
    const tarjeta = await prisma.tarjeta.findUnique({
      where: { id },
      include: {
        cuenta: { select: { id: true, nombre: true } },
        chofer: { select: { id: true, nombre: true, apellido: true } },
        resumenes: { orderBy: { periodo: "desc" }, take: 24 },
        gastos: {
          orderBy: { fecha: "desc" },
          take: 20,
          include: { operador: { select: { id: true, nombre: true, apellido: true } } },
        },
      },
    })
    if (!tarjeta) return NextResponse.json({ error: "Tarjeta no encontrada" }, { status: 404 })
    return NextResponse.json(tarjeta)
  } catch (error) {
    console.error(`GET /api/tarjetas/${id} error:`, error)
    return NextResponse.json({ error: "Error al obtener tarjeta", detail: String(error) }, { status: 500 })
  }
}

/**
 * PATCH: NextRequest, { params } -> Promise<NextResponse>
 * Edita campos de una tarjeta existente.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esRolInterno((session.user.rol ?? "") as Rol))
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "JSON inválido" }, { status: 400 })
  }

  const parsed = editarTarjetaSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detail: parsed.error.flatten() }, { status: 400 })
  }

  try {
    const tarjeta = await prisma.tarjeta.update({ where: { id }, data: parsed.data })
    return NextResponse.json(tarjeta)
  } catch (error) {
    console.error(`PATCH /api/tarjetas/${id} error:`, error)
    return NextResponse.json({ error: "Error al editar tarjeta", detail: String(error) }, { status: 500 })
  }
}
