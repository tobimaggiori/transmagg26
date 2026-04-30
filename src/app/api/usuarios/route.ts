/**
 * API Routes para gestión de usuarios.
 * GET  /api/usuarios - Lista usuarios (ADMIN_TRANSMAGG)
 * POST /api/usuarios - Crea usuario (ADMIN_TRANSMAGG)
 *
 * Un Usuario es exclusivamente una cuenta de login. Los choferes viven
 * en la tabla Empleado; si un chofer necesita login, se crea un Usuario
 * rol=CHOFER y se vincula con Empleado.usuarioId.
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
  empresaId: z.string().uuid().optional(), // ADMIN_EMPRESA / OPERADOR_EMPRESA
  empleadoId: z.string().uuid().optional(), // CHOFER — vincula Empleado.usuarioId
})

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
        empleado: { select: { id: true, fleteroId: true } },
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

    const { nombre, apellido, email, telefono, rol, empresaId, empleadoId } = parsed.data

    if (rol === "CHOFER") {
      if (!empleadoId) return NextResponse.json({ error: "Elegí un empleado para vincular el login" }, { status: 400 })
      const empleado = await prisma.empleado.findUnique({ where: { id: empleadoId } })
      if (!empleado) return NextResponse.json({ error: "Empleado no encontrado" }, { status: 404 })
      if (empleado.cargo !== "CHOFER") return NextResponse.json({ error: "El empleado no tiene cargo CHOFER" }, { status: 400 })
      if (empleado.usuarioId) return NextResponse.json({ error: "El empleado ya tiene un usuario vinculado" }, { status: 409 })
    }

    const emailExiste = await prisma.usuario.findUnique({ where: { email } })
    if (emailExiste) return NextResponse.json({ error: "El email ya está registrado" }, { status: 409 })

    const usuario = await prisma.$transaction(async (tx) => {
      const usr = await tx.usuario.create({
        data: { nombre, apellido, email, telefono, rol },
      })

      if ((rol === "ADMIN_EMPRESA" || rol === "OPERADOR_EMPRESA") && empresaId) {
        await tx.empresaUsuario.create({
          data: {
            usuarioId: usr.id,
            empresaId,
            nivelAcceso: rol === "ADMIN_EMPRESA" ? "ADMIN" : "OPERADOR",
          },
        })
      }

      if (rol === "CHOFER" && empleadoId) {
        await tx.empleado.update({ where: { id: empleadoId }, data: { usuarioId: usr.id } })
      }

      // OPERADOR_TRANSMAGG: arranca con todas las secciones habilitadas (blacklist).
      if (rol === "OPERADOR_TRANSMAGG") {
        const { SECCIONES } = await import("@/lib/secciones")
        await tx.permisoUsuario.createMany({
          data: Object.values(SECCIONES).map((seccion) => ({
            usuarioId: usr.id,
            seccion,
            habilitado: true,
          })),
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
