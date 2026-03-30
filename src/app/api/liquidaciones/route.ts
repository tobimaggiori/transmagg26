/**
 * API Routes para gestión de liquidaciones.
 * GET  /api/liquidaciones - Lista liquidaciones (filtrado por rol)
 * POST /api/liquidaciones - Crea liquidación asociando viajes existentes (ADMIN/OPERADOR_TRANSMAGG)
 *
 * SEGURIDAD: tarifaFletero en ViajeEnLiquidacion es NUNCA visible para empresas/choferes.
 * Los viajes ya deben existir en estado PENDIENTE. El POST los marca como EN_LIQUIDACION.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

const viajeEnLiqSchema = z.object({
  viajeId: z.string().uuid(),
  tarifaFletero: z.number().positive("La tarifa del fletero debe ser mayor a 0"),
})

const crearLiquidacionSchema = z.object({
  fleteroId: z.string().uuid(),
  comisionPct: z.number().min(0).max(100),
  viajes: z.array(viajeEnLiqSchema).min(1, "Debe incluir al menos un viaje"),
})

/**
 * GET: () -> Promise<NextResponse>
 *
 * Devuelve hasta 50 liquidaciones ordenadas por fecha desc.
 * Roles internos ven todas; FLETERO solo ve las suyas. Otros roles: 403.
 * Existe para el listado de liquidaciones en el panel, donde cada
 * fletero accede solo a sus propias liquidaciones.
 *
 * Ejemplos:
 * GET /api/liquidaciones (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, estado, total, fletero: { razonSocial }, _count: { viajes } }]
 * GET /api/liquidaciones (sesión FLETERO)
 * // => 200 [{ id, estado, total, ... }] (solo las suyas)
 * GET /api/liquidaciones (sesión ADMIN_EMPRESA)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET() {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol

  const whereClause =
    rol === "FLETERO"
      ? { fletero: { usuario: { email: session.user.email } } }
      : esRolInterno(rol)
        ? {}
        : null

  if (whereClause === null) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  const liquidaciones = await prisma.liquidacion.findMany({
    where: whereClause,
    include: {
      fletero: { select: { razonSocial: true } },
      _count: { select: { viajes: true } },
    },
    orderBy: { grabadaEn: "desc" },
    take: 50,
  })

  return NextResponse.json(liquidaciones)
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { fleteroId, comisionPct, viajes: [{ viajeId, tarifaFletero }] },
 * crea una liquidación en BORRADOR, crea los ViajeEnLiquidacion con tarifaFletero,
 * genera asientos IIBB por provincia y marca los viajes como EN_LIQUIDACION.
 * Existe para liquidar los viajes pendientes de un fletero, calculando
 * automáticamente subtotales, comisión, IVA y neto.
 *
 * Ejemplos:
 * POST /api/liquidaciones { fleteroId: "f1", comisionPct: 10, viajes: [{ viajeId: "v2", tarifaFletero: 45000 }] }
 * // => 201 { id, estado: "BORRADOR", total, subtotalBruto, neto }
 * POST /api/liquidaciones { fleteroId: "f1", comisionPct: 10, viajes: [{ viajeId: "v1", tarifaFletero: 50000 }] } (v1 EN_LIQUIDACION)
 * // => 400 { error: "Uno o más viajes no existen, no pertenecen al fletero, o no están en estado PENDIENTE" }
 * POST /api/liquidaciones { comisionPct: 10, viajes: [] }
 * // => 400 { error: "Datos inválidos", detalles: {...} }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearLiquidacionSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const { fleteroId, comisionPct, viajes } = parsed.data

    const fletero = await prisma.fletero.findUnique({ where: { id: fleteroId, activo: true } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    // Verificar que todos los viajes existen y están PENDIENTES
    const viajeIds = viajes.map((v) => v.viajeId)
    const viajesExistentes = await prisma.viaje.findMany({
      where: { id: { in: viajeIds }, fleteroId, estado: "PENDIENTE" },
    })

    if (viajesExistentes.length !== viajes.length) {
      return NextResponse.json(
        { error: "Uno o más viajes no existen, no pertenecen al fletero, o no están en estado PENDIENTE" },
        { status: 400 }
      )
    }

    // Calcular totales
    const subtotalBruto = viajes.reduce((acc, v) => acc + v.tarifaFletero, 0)
    const comisionMonto = subtotalBruto * (comisionPct / 100)
    const neto = subtotalBruto - comisionMonto
    const ivaMonto = comisionMonto * 0.21
    const total = neto + ivaMonto

    const liquidacion = await prisma.$transaction(async (tx) => {
      const liq = await tx.liquidacion.create({
        data: {
          fleteroId,
          operadorId: session.user.id,
          comisionPct,
          subtotalBruto,
          comisionMonto,
          neto,
          ivaMonto,
          total,
          estado: "BORRADOR",
        },
      })

      for (const viaje of viajes) {
        const viajeData = viajesExistentes.find((v) => v.id === viaje.viajeId)!

        const enLiq = await tx.viajeEnLiquidacion.create({
          data: {
            viajeId: viaje.viajeId,
            liquidacionId: liq.id,
            tarifaFletero: viaje.tarifaFletero,
            subtotal: viaje.tarifaFletero,
          },
        })

        // Asiento IIBB por provincia de origen
        if (viajeData.provinciaOrigen) {
          const periodo = viajeData.fechaViaje.toISOString().slice(0, 7)
          await tx.asientoIibb.create({
            data: {
              viajeEnLiqId: enLiq.id,
              tablaOrigen: "viajes_en_liquidacion",
              provincia: viajeData.provinciaOrigen,
              montoIngreso: viaje.tarifaFletero,
              periodo,
            },
          })
        }
      }

      // Marcar viajes como EN_LIQUIDACION
      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estado: "EN_LIQUIDACION" },
      })

      return liq
    })

    return NextResponse.json(liquidacion, { status: 201 })
  } catch (error) {
    console.error("[POST /api/liquidaciones]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
