/**
 * API Routes para permisos de usuario individual.
 * GET  /api/usuarios/[id]/permisos — retorna permisos habilitados del usuario
 * POST /api/usuarios/[id]/permisos — reemplaza todos los permisos del usuario
 *
 * Solo accesible para ADMIN_TRANSMAGG.
 * Solo aplica a usuarios con rol OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del usuario objetivo, retorna sus permisos habilitados como array de strings.
 * Solo accesible para ADMIN_TRANSMAGG.
 *
 * Ejemplos:
 * GET /api/usuarios/u1/permisos → { permisos: ["dashboard", "fleteros.viajes", ...] }
 */
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params

  const permisos = await prisma.permisoUsuario.findMany({
    where: { usuarioId: id, habilitado: true },
    select: { seccion: true },
  })

  return NextResponse.json({ permisos: permisos.map(p => p.seccion) })
}

const permisosSchema = z.object({
  permisos: z.array(z.string()),
})

/**
 * POST: NextRequest { params: { id }, body: { permisos: string[] } } -> Promise<NextResponse>
 *
 * Dado el id del usuario y el nuevo array de secciones habilitadas,
 * reemplaza todos sus permisos en una transacción (deleteMany + createMany).
 * Solo accesible para ADMIN_TRANSMAGG. Solo aplica a OPERADOR_TRANSMAGG.
 *
 * Ejemplos:
 * POST /api/usuarios/u1/permisos { permisos: ["dashboard", "fleteros.viajes"] }
 * → { ok: true }
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  const rol = (session.user.rol ?? "OPERADOR_TRANSMAGG") as Rol
  if (!esAdmin(rol)) return NextResponse.json({ error: "Sin permiso" }, { status: 403 })

  const { id } = await params

  // Verificar que el usuario objetivo sea OPERADOR_TRANSMAGG
  const usuarioObjetivo = await prisma.usuario.findUnique({
    where: { id },
    select: { rol: true },
  })

  if (!usuarioObjetivo) {
    return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })
  }

  if (usuarioObjetivo.rol !== "OPERADOR_TRANSMAGG") {
    return NextResponse.json(
      { error: "Los permisos granulares solo aplican a OPERADOR_TRANSMAGG" },
      { status: 400 }
    )
  }

  const body = await req.json().catch(() => null)
  const parsed = permisosSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Body inválido — se espera { permisos: string[] }" }, { status: 400 })
  }

  const { permisos } = parsed.data

  await prisma.$transaction([
    prisma.permisoUsuario.deleteMany({ where: { usuarioId: id } }),
    prisma.permisoUsuario.createMany({
      data: permisos.map(seccion => ({
        usuarioId: id,
        seccion,
        habilitado: true,
      })),
    }),
  ])

  return NextResponse.json({ ok: true })
}
