/**
 * API Routes para viaje individual.
 * GET   /api/viajes/[id] - Detalle de viaje
 * PATCH /api/viajes/[id] - Actualiza datos o estado del viaje
 * DELETE /api/viajes/[id] - Elimina viaje PENDIENTE
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const actualizarViajeSchema = z.object({
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remito: z.string().optional(),
  cupo: z.string().optional(),
  mercaderia: z.string().optional(),
  procedencia: z.string().optional(),
  provinciaOrigen: z.string().optional(),
  destino: z.string().optional(),
  provinciaDestino: z.string().optional(),
  kilos: z.number().positive().optional(),
  tarifaBase: z.number().positive().optional(),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje, devuelve el detalle completo incluyendo fletero, camión,
 * chofer, empresa, operador y sus liquidaciones/facturas asociadas.
 * Solo accesible por roles internos. Existe para la vista de detalle
 * de un viaje desde el panel de gestión.
 *
 * Ejemplos:
 * GET /api/viajes/v1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id: "v1", tarifaBase, enLiquidaciones: [...], enFacturas: [...] }
 * GET /api/viajes/noexiste (sesión ADMIN_TRANSMAGG)
 * // => 404 { error: "Viaje no encontrado" }
 * GET /api/viajes/v1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const viaje = await prisma.viaje.findUnique({
    where: { id: params.id },
    include: {
      fletero: { select: { razonSocial: true, cuit: true } },
      camion: { select: { patenteChasis: true, patenteAcoplado: true, tipoCamion: true } },
      chofer: { select: { nombre: true, apellido: true, email: true } },
      empresa: { select: { razonSocial: true, cuit: true } },
      operador: { select: { nombre: true, apellido: true } },
      enLiquidaciones: {
        include: { liquidacion: { select: { id: true, estado: true, grabadaEn: true } } },
      },
      enFacturas: {
        include: { factura: { select: { id: true, estado: true, nroComprobante: true } } },
      },
    },
  })

  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

  return NextResponse.json(viaje)
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje y campos opcionales de actualización, modifica el viaje
 * solo si está en estado PENDIENTE.
 * Existe para corregir datos de un viaje antes de que sea incorporado
 * a una liquidación o factura, momento en que queda bloqueado.
 *
 * Ejemplos:
 * PATCH /api/viajes/v1 { mercaderia: "Granos" } (viaje PENDIENTE)
 * // => 200 { id: "v1", mercaderia: "Granos", estado: "PENDIENTE" }
 * PATCH /api/viajes/v1 { mercaderia: "Granos" } (viaje EN_LIQUIDACION)
 * // => 422 { error: "Solo se pueden editar viajes en estado PENDIENTE" }
 * PATCH /api/viajes/noexiste { mercaderia: "Granos" }
 * // => 404 { error: "Viaje no encontrado" }
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    const viaje = await prisma.viaje.findUnique({ where: { id: params.id } })
    if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

    if (viaje.estado !== "PENDIENTE") {
      return NextResponse.json({ error: "Solo se pueden editar viajes en estado PENDIENTE" }, { status: 422 })
    }

    const { fechaViaje, ...resto } = parsed.data
    const actualizado = await prisma.viaje.update({
      where: { id: params.id },
      data: {
        ...resto,
        ...(fechaViaje ? { fechaViaje: new Date(fechaViaje) } : {}),
      },
    })

    return NextResponse.json(actualizado)
  } catch (error) {
    console.error("[PATCH /api/viajes/[id]]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje, lo elimina permanentemente solo si está en PENDIENTE.
 * Existe para deshacer viajes cargados por error antes de que sean
 * incluidos en una liquidación o factura.
 *
 * Ejemplos:
 * DELETE /api/viajes/v1 (viaje PENDIENTE)
 * // => 204 (sin cuerpo)
 * DELETE /api/viajes/v2 (viaje EN_LIQUIDACION)
 * // => 422 { error: "Solo se pueden eliminar viajes en estado PENDIENTE" }
 * DELETE /api/viajes/noexiste
 * // => 404 { error: "Viaje no encontrado" }
 */
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const viaje = await prisma.viaje.findUnique({ where: { id: params.id } })
  if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

  if (viaje.estado !== "PENDIENTE") {
    return NextResponse.json(
      { error: "Solo se pueden eliminar viajes en estado PENDIENTE" },
      { status: 422 }
    )
  }

  await prisma.viaje.delete({ where: { id: params.id } })
  return new NextResponse(null, { status: 204 })
}
