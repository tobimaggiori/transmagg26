/**
 * API Routes para gestión de proveedores.
 * GET  /api/proveedores - Lista proveedores activos
 * POST /api/proveedores - Crea proveedor (ADMIN/OPERADOR_TRANSMAGG)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearProveedorSchema = z.object({
  razonSocial: z.string().min(1),
  cuit: z.string().regex(/^\d{11}$/, "CUIT debe tener 11 dígitos"),
  condicionIva: z.string().min(1),
  rubro: z.string().optional(),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve el listado de proveedores activos ordenados por razón social ascendente.
 * Existe para que el panel interno pueda listar proveedores en tablas y
 * seleccionarlos al registrar asientos contables o gastos.
 *
 * Ejemplos:
 * GET /api/proveedores (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, razonSocial, cuit, condicionIva, rubro }]
 * GET /api/proveedores (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/proveedores (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const proveedores = await prisma.proveedor.findMany({
    where: { activo: true },
    orderBy: { razonSocial: "asc" },
  })
  return NextResponse.json(proveedores)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { razonSocial, cuit, condicionIva, rubro? },
 * crea un proveedor verificando que el CUIT no esté duplicado.
 * Existe para registrar proveedores de servicios externos (combustible,
 * peajes, etc.) que luego se asocian a asientos de IIBB e IVA.
 *
 * Ejemplos:
 * POST /api/proveedores { razonSocial: "YPF SA", cuit: "30546524278", condicionIva: "RI", rubro: "Combustible" }
 * // => 201 { id, razonSocial: "YPF SA", cuit: "30546524278" }
 * POST /api/proveedores { ...datos, cuit: "30546524278" } (CUIT duplicado)
 * // => 409 { error: "El CUIT ya está registrado" }
 * POST /api/proveedores { razonSocial: "" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearProveedorSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const cuitExiste = await prisma.proveedor.findUnique({ where: { cuit: parsed.data.cuit } })
    if (cuitExiste) return NextResponse.json({ error: "El CUIT ya está registrado" }, { status: 409 })

    const proveedor = await prisma.proveedor.create({ data: parsed.data })

    return NextResponse.json(proveedor, { status: 201 })
  } catch (error) {
    console.error("[POST /api/proveedores]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
