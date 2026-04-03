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

function normalizarProvincia(valor: string): string {
  const upper = valor.toUpperCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.toUpperCase() === upper) ?? valor
}

const provinciaOptSchema = z.string().transform(normalizarProvincia).nullable().optional()

const actualizarViajeSchema = z.object({
  fechaViaje: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  remito: z.string().nullable().optional(),
  tieneCupo: z.boolean().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: provinciaOptSchema,
  destino: z.string().nullable().optional(),
  provinciaDestino: provinciaOptSchema,
  kilos: z.number().positive().nullable().optional(),
  tarifa: z.number().positive().optional(),
  empresaId: z.string().optional(),
  motivoCambioEmpresa: z.string().optional(),
  fleteroId: z.string().uuid().nullable().optional(),
  camionId: z.string().uuid().optional(),
  motivoCambioFletero: z.string().optional(),
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

    const viaje = await prisma.viaje.findUnique({
      where: { id: params.id },
      include: {
        empresa: { select: { razonSocial: true } },
        fletero: { select: { razonSocial: true } },
        enLiquidaciones: { select: { id: true } },
      },
    })
    if (!viaje) return NextResponse.json({ error: "Viaje no encontrado" }, { status: 404 })

    // Validaciones por LP emitido: no permitir cambios en kilos
    if (viaje.estadoLiquidacion === "LIQUIDADO" && parsed.data.kilos !== undefined) {
      return NextResponse.json(
        { error: "No se pueden modificar los kilos porque el viaje tiene un LP emitido" },
        { status: 422 }
      )
    }

    // Validaciones por factura emitida: no permitir cambios en tarifa
    if (viaje.estadoFactura === "FACTURADO" && parsed.data.tarifa !== undefined) {
      return NextResponse.json(
        { error: "No se puede modificar la tarifa porque el viaje tiene una factura emitida" },
        { status: 422 }
      )
    }

    // Validaciones de cambio de fletero
    if (parsed.data.fleteroId !== undefined) {
      if (viaje.estadoLiquidacion === "LIQUIDADO") {
        return NextResponse.json(
          { error: "No se puede cambiar el fletero de un viaje ya liquidado" },
          { status: 422 }
        )
      }
      if (!parsed.data.motivoCambioFletero?.trim()) {
        return NextResponse.json(
          { error: "El motivo del cambio de fletero es obligatorio" },
          { status: 422 }
        )
      }
    }

    // Validaciones de cambio de empresa
    if (parsed.data.empresaId) {
      if (viaje.estadoFactura === "FACTURADA") {
        return NextResponse.json(
          { error: "No se puede cambiar la empresa de un viaje ya facturado" },
          { status: 422 }
        )
      }
      if (!parsed.data.motivoCambioEmpresa?.trim()) {
        return NextResponse.json(
          { error: "El motivo del cambio de empresa es obligatorio" },
          { status: 422 }
        )
      }
    }

    const { fechaViaje, empresaId, motivoCambioEmpresa, fleteroId, camionId, motivoCambioFletero, tarifa, ...resto } = parsed.data

    // Determinar qué campos de tarifa actualizar según estado del LP
    const tieneLP = viaje.estadoLiquidacion === "LIQUIDADO"
    const tarifaUpdate: Record<string, number> = {}
    if (tarifa !== undefined) {
      // tarifaEmpresa siempre actualizable
      tarifaUpdate.tarifaEmpresa = tarifa
      // tarifaFletero solo si no tiene LP emitido
      if (!tieneLP) {
        tarifaUpdate.tarifaFletero = tarifa
      }
    }

    const actualizado = await prisma.$transaction(async (tx) => {
      const historial: Array<Record<string, unknown>> = JSON.parse(viaje.historialCambios ?? "[]")

      // Si se cambia empresa, registrar en historial
      if (empresaId && empresaId !== viaje.empresaId) {
        const nuevaEmpresa = await tx.empresa.findUnique({ where: { id: empresaId }, select: { razonSocial: true } })
        historial.push({
          fecha: new Date().toISOString(),
          campo: "empresaId",
          valorAnterior: viaje.empresa.razonSocial,
          valorNuevo: nuevaEmpresa?.razonSocial ?? empresaId,
          motivo: motivoCambioEmpresa,
          operadorId: session.user.id,
        })
      }

      // Si se cambia fletero, registrar en historial
      if (fleteroId !== undefined && fleteroId !== viaje.fleteroId) {
        const nuevoFletero = fleteroId
          ? await tx.fletero.findUnique({ where: { id: fleteroId }, select: { razonSocial: true } })
          : null
        historial.push({
          fecha: new Date().toISOString(),
          campo: "fleteroId",
          valorAnterior: viaje.fletero?.razonSocial ?? "(propio)",
          valorNuevo: nuevoFletero?.razonSocial ?? "(propio)",
          motivo: motivoCambioFletero,
          operadorId: session.user.id,
        })
      }

      const historialCambios = historial.length > 0 ? JSON.stringify(historial) : viaje.historialCambios

      const updated = await tx.viaje.update({
        where: { id: params.id },
        data: {
          ...resto,
          ...tarifaUpdate,
          ...(empresaId ? { empresaId } : {}),
          ...(fleteroId !== undefined ? { fleteroId } : {}),
          ...(camionId ? { camionId } : {}),
          ...(historial.length > 0 ? { historialCambios } : {}),
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
