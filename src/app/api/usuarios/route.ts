/**
 * API Routes para gestión de usuarios.
 * GET  /api/usuarios - Lista usuarios (ADMIN_TRANSMAGG)
 * POST /api/usuarios - Crea usuario (ADMIN_TRANSMAGG)
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esAdmin } from "@/lib/permissions"
import type { Rol } from "@/types"

const crearUsuarioSchema = z.object({
  nombre: z.string().min(1),
  apellido: z.string().min(1),
  email: z.string().email(),
  telefono: z.string().optional(),
  rol: z.enum(["ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG", "FLETERO", "CHOFER", "ADMIN_EMPRESA", "OPERADOR_EMPRESA"]),
  empresaId: z.string().uuid().optional(), // Para ADMIN_EMPRESA / OPERADOR_EMPRESA
  fleteroId: z.string().uuid().optional(), // Para CHOFER
  camionId: z.string().uuid().optional(),  // Para CHOFER: camión inicial asignado
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve todos los usuarios ordenados por activo desc, apellido asc,
 * incluyendo empresas asociadas. Solo accesible por ADMIN_TRANSMAGG.
 * Existe para el panel de administración donde se gestionan todos los
 * usuarios del sistema independientemente de su rol.
 *
 * Ejemplos:
 * GET /api/usuarios (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, nombre, apellido, email, rol, activo, empresaUsuarios }]
 * GET /api/usuarios (sesión OPERADOR_TRANSMAGG)
 * // => 403 { error: "Acceso denegado" }
 * GET /api/usuarios (sin sesión)
 * // => 401 { error: "No autorizado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const usuarios = await prisma.usuario.findMany({
      orderBy: [{ activo: "desc" }, { apellido: "asc" }],
      select: {
        id: true,
        nombre: true,
        apellido: true,
        email: true,
        telefono: true,
        rol: true,
        activo: true,
        creadoEn: true,
        empresaUsuarios: {
          select: {
            empresa: { select: { razonSocial: true } },
            nivelAcceso: true,
          },
        },
      },
    })

    return NextResponse.json(usuarios)
  } catch (error) {
    console.error("[GET /api/usuarios]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { nombre, apellido, email, rol, telefono?, empresaId?, fleteroId?, camionId? },
 * crea un usuario y opcionalmente lo asocia a una empresa o fletero en una transacción.
 * Para rol CHOFER: requiere fleteroId y camionId; crea el CamionChofer inicial.
 * Para roles ADMIN_EMPRESA/OPERADOR_EMPRESA: requiere empresaId.
 * Existe para que el administrador pueda dar de alta usuarios de todos los roles,
 * creando automáticamente las relaciones necesarias según el rol.
 *
 * Ejemplos:
 * POST /api/usuarios { nombre: "Laura", apellido: "Gómez", email: "laura@x.com", rol: "OPERADOR_TRANSMAGG" }
 * // => 201 { id, nombre: "Laura", apellido: "Gómez", rol: "OPERADOR_TRANSMAGG" }
 * POST /api/usuarios { ...datos, rol: "CHOFER", fleteroId: "f1", camionId: "c1" }
 * // => 201 { id, nombre, rol: "CHOFER", fleteroId: "f1" }
 * POST /api/usuarios { ...datos, email: "existente@x.com" } (email duplicado)
 * // => 409 { error: "El email ya está registrado" }
 * POST /api/usuarios { nombre: "A", apellido: "B", email: "x", rol: "INVALIDO" }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  if (!esAdmin(session.user.rol as Rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearUsuarioSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { nombre, apellido, email, telefono, rol, empresaId, fleteroId, camionId } = parsed.data

    // Validaciones específicas por rol
    if (rol === "CHOFER") {
      if (!fleteroId) return NextResponse.json({ error: "Se requiere fleteroId para crear un chofer" }, { status: 400 })
      if (!camionId) return NextResponse.json({ error: "Se requiere camionId para crear un chofer" }, { status: 400 })
      const camion = await prisma.camion.findUnique({ where: { id: camionId } })
      if (!camion) return NextResponse.json({ error: "Camión no encontrado" }, { status: 404 })
      if (camion.fleteroId !== fleteroId) return NextResponse.json({ error: "El camión no pertenece al fletero indicado" }, { status: 400 })
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email } })
    if (emailExiste) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

    const ahora = new Date()

    const usuario = await prisma.$transaction(async (tx) => {
      const usr = await tx.usuario.create({
        data: {
          nombre,
          apellido,
          email,
          telefono,
          rol,
          ...(rol === "CHOFER" && fleteroId ? { fleteroId } : {}),
        },
      })

      // Si es rol de empresa, crear la relación empresa-usuario
      if ((rol === "ADMIN_EMPRESA" || rol === "OPERADOR_EMPRESA") && empresaId) {
        await tx.empresaUsuario.create({
          data: {
            usuarioId: usr.id,
            empresaId,
            nivelAcceso: rol === "ADMIN_EMPRESA" ? "ADMIN" : "OPERADOR",
          },
        })
      }

      // Si es CHOFER, cerrar asignación previa del camión y crear la nueva
      if (rol === "CHOFER" && camionId) {
        await tx.camionChofer.updateMany({
          where: { camionId, hasta: null },
          data: { hasta: ahora },
        })
        await tx.camionChofer.create({
          data: { camionId, choferId: usr.id, desde: ahora },
        })
      }

      return usr
    })

    return NextResponse.json(usuario, { status: 201 })
  } catch (error) {
    console.error("[POST /api/usuarios]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
