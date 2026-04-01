/**
 * API Routes para viaje individual.
 * GET   /api/viajes/[id] - Detalle de viaje
 * PATCH /api/viajes/[id] - Actualiza datos del viaje (libre, sin restricción de estado)
 * DELETE /api/viajes/[id] - Elimina viaje que no tenga liquidaciones ni facturas
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { enriquecerViajeOperativo } from "@/lib/viaje-serialization"
import { construirAvisosEdicionViaje } from "@/lib/viaje-workflow"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { Rol } from "@/types"

const actualizarViajeSchema = z.object({
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remito: z.string().nullable().optional(),
  tieneCupo: z.boolean().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: z.enum(PROVINCIAS_ARGENTINA as unknown as [string, ...string[]]).nullable().optional(),
  destino: z.string().nullable().optional(),
  provinciaDestino: z.enum(PROVINCIAS_ARGENTINA as unknown as [string, ...string[]]).nullable().optional(),
  kilos: z.number().positive().nullable().optional(),
  tarifaOperativaInicial: z.number().positive().optional(),
})

/**
 * GET: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje, devuelve el detalle completo incluyendo fletero, camión,
 * chofer, empresa, operador, enLiquidaciones y enFacturas.
 * Solo accesible por roles internos. Existe para la vista de detalle del viaje.
 *
 * Ejemplos:
 * GET /api/viajes/v1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { id: "v1", estadoLiquidacion, estadoFactura, toneladas, total, ... }
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

  try {
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

    return NextResponse.json(enriquecerViajeOperativo(viaje))
  } catch (error) {
    console.error("[GET /api/viajes/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * PATCH: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje y campos opcionales de actualización, modifica el viaje.
 * La edición es libre — NO restringe por estado. Si el viaje está liquidado o facturado,
 * se avisa al cliente pero se permite igual (para correcciones).
 * NUNCA modifica liquidaciones ni facturas existentes.
 * Existe para corregir datos de un viaje en cualquier momento del ciclo de vida.
 *
 * Ejemplos:
 * PATCH /api/viajes/v1 { mercaderia: "Granos" }
 * // => 200 { id: "v1", mercaderia: "Granos", estadoLiquidacion, estadoFactura }
 * PATCH /api/viajes/noexiste { mercaderia: "Granos" }
 * // => 404 { error: "Viaje no encontrado" }
 * PATCH /api/viajes/v1 (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
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

    const { fechaViaje, ...resto } = parsed.data
    const actualizado = await prisma.$transaction(async (tx) => {
      const updated = await tx.viaje.update({
        where: { id: params.id },
        data: {
          ...resto,
          ...(fechaViaje ? { fechaViaje: new Date(fechaViaje) } : {}),
        },
        include: {
          fletero: { select: { razonSocial: true } },
          empresa: { select: { razonSocial: true } },
        },
      })

      if (parsed.data.provinciaOrigen && parsed.data.provinciaOrigen !== viaje.provinciaOrigen) {
        const nuevaProv = parsed.data.provinciaOrigen
        const [velIds, vefIds] = await Promise.all([
          tx.viajeEnLiquidacion.findMany({ where: { viajeId: viaje.id }, select: { id: true } }),
          tx.viajeEnFactura.findMany({ where: { viajeId: viaje.id }, select: { id: true } }),
        ])
        await Promise.all([
          tx.asientoIibb.updateMany({
            where: { viajeEnLiqId: { in: velIds.map((r) => r.id) } },
            data: { provincia: nuevaProv },
          }),
          tx.asientoIibb.updateMany({
            where: { viajeEnFactId: { in: vefIds.map((r) => r.id) } },
            data: { provincia: nuevaProv },
          }),
        ])
      }

      return updated
    })

    const avisos = construirAvisosEdicionViaje(viaje.estadoLiquidacion, viaje.estadoFactura)

    return NextResponse.json({
      ...enriquecerViajeOperativo(actualizado),
      _avisos: avisos.length > 0 ? avisos : undefined,
    })
  } catch (error) {
    console.error("[PATCH /api/viajes/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}

/**
 * DELETE: NextRequest { params: { id } } -> Promise<NextResponse>
 *
 * Dado el id del viaje, lo elimina si no tiene liquidaciones ni facturas asociadas.
 * Existe para deshacer viajes cargados por error.
 *
 * Ejemplos:
 * DELETE /api/viajes/v1 (viaje sin liquidaciones ni facturas)
 * // => 204 (sin cuerpo)
 * DELETE /api/viajes/v2 (viaje con liquidacion asociada)
 * // => 422 { error: "No se puede eliminar un viaje que ya tiene liquidaciones o facturas" }
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

  try {
    const viaje = await prisma.viaje.findUnique({
      where: { id: params.id },
      include: {
        _count: { select: { enLiquidaciones: true, enFacturas: true } },
      },
    })
    if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

    if (viaje._count.enLiquidaciones > 0 || viaje._count.enFacturas > 0) {
      return NextResponse.json(
        { error: "No se puede eliminar un viaje que ya tiene liquidaciones o facturas asociadas" },
        { status: 422 }
      )
    }

    await prisma.viaje.delete({ where: { id: params.id } })
    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DELETE /api/viajes/[id]]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
