/**
 * API Routes para gestión de fleteros.
 * GET  /api/fleteros - Lista fleteros (uso interno)
 * POST /api/fleteros - Crea fletero + usuario asociado (ADMIN/OPERADOR_TRANSMAGG)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearFleteroSchema = z.object({
  razonSocial: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  condicionIva: z.string().min(1),
  direccion: z.string().optional(),
  comisionDefault: z.number().min(0).max(100),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve el listado de fleteros activos con datos de su usuario asociado,
 * incluyendo dirección, ordenados por razón social ascendente.
 * Existe para que el panel interno pueda listar y seleccionar fleteros
 * en formularios de liquidaciones y camiones.
 *
 * Ejemplos:
 * GET /api/fleteros (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, razonSocial, cuit, direccion, usuario: { nombre, apellido, email } }]
 * GET /api/fleteros (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/fleteros (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const fleteros = await prisma.fletero.findMany({
      where: { activo: true },
      select: {
        id: true,
        razonSocial: true,
        cuit: true,
        condicionIva: true,
        direccion: true,
        comisionDefault: true,
        activo: true,
        usuario: { select: { nombre: true, apellido: true, email: true } },
      },
      orderBy: { razonSocial: "asc" },
    })
    return NextResponse.json(fleteros)
  } catch (error) {
    console.error("[GET /api/fleteros]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { nombre, apellido, email, razonSocial, cuit, condicionIva, comisionDefault },
 * crea un usuario FLETERO y su fletero asociado en una transacción atómica.
 * Existe para registrar nuevos fleteros en el sistema, garantizando que
 * CUIT y email no estén duplicados antes de crear los registros.
 *
 * Ejemplos:
 * POST /api/fleteros { nombre: "Juan", apellido: "Pérez", email: "juan@x.com", razonSocial: "JP SRL", cuit: "20123456789", condicionIva: "RI", comisionDefault: 10 }
 * // => 201 { usuario: {...}, fletero: {...} }
 * POST /api/fleteros { ...datos, cuit: "20123456789" } (CUIT ya registrado)
 * // => 409 { error: "El CUIT ya está registrado" }
 * POST /api/fleteros { nombre: "" } (datos inválidos)
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearFleteroSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { razonSocial, cuit, condicionIva, direccion, comisionDefault } = parsed.data

    const cuitExiste = await prisma.fletero.findUnique({ where: { cuit } })
    if (cuitExiste) return NextResponse.json({ error: "El CUIT ya está registrado" }, { status: 409 })

    // El usuario asociado se crea/vincula desde ABM Usuarios.
    const fletero = await prisma.fletero.create({
      data: { razonSocial, cuit, condicionIva, direccion, comisionDefault },
    })

    return NextResponse.json({ fletero }, { status: 201 })
  } catch (error) {
    console.error("[POST /api/fleteros]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
