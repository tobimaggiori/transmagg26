/**
 * API Routes para gestión de empresas clientes.
 * GET  /api/empresas - Lista empresas activas
 * POST /api/empresas - Crea empresa (ADMIN/OPERADOR_TRANSMAGG)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearEmpresaSchema = z.object({
  razonSocial: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  condicionIva: z.string().min(1),
  direccion: z.string().optional(),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve el listado de empresas activas ordenadas por razón social ascendente.
 * Existe para que el panel interno pueda listar y seleccionar empresas
 * en formularios de facturas y viajes.
 *
 * Ejemplos:
 * GET /api/empresas (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, razonSocial, cuit, condicionIva, direccion }]
 * GET /api/empresas (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/empresas (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const empresas = await prisma.empresa.findMany({
    where: { activa: true },
    orderBy: { razonSocial: "asc" },
  })
  return NextResponse.json(empresas)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { razonSocial, cuit, condicionIva, direccion? },
 * crea una empresa cliente verificando que el CUIT no esté duplicado.
 * Existe para registrar nuevas empresas clientes en el sistema
 * que luego podrán asociarse a facturas y viajes.
 *
 * Ejemplos:
 * POST /api/empresas { razonSocial: "Alimentos del Sur", cuit: "30714295698", condicionIva: "RI" }
 * // => 201 { id, razonSocial: "Alimentos del Sur", cuit: "30714295698" }
 * POST /api/empresas { ...datos, cuit: "30714295698" } (CUIT duplicado)
 * // => 409 { error: "El CUIT ya está registrado" }
 * POST /api/empresas { razonSocial: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearEmpresaSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { razonSocial, cuit, condicionIva, direccion } = parsed.data

    const cuitExiste = await prisma.empresa.findUnique({ where: { cuit } })
    if (cuitExiste) return NextResponse.json({ error: "El CUIT ya está registrado" }, { status: 409 })

    const empresa = await prisma.empresa.create({
      data: { razonSocial, cuit, condicionIva, direccion },
    })

    return NextResponse.json(empresa, { status: 201 })
  } catch (error) {
    console.error("[POST /api/empresas]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
