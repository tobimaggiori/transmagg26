/**
 * API Routes para gestión de liquidaciones.
 * GET  /api/liquidaciones?fleteroId=XXX - Viajes pendientes + liquidaciones
 * POST /api/liquidaciones - Crea liquidación asociando viajes existentes
 *
 * SEGURIDAD: tarifaFletero en ViajeEnLiquidacion es NUNCA visible para empresas/choferes.
 * Los viajes se filtran por estadoLiquidacion="PENDIENTE_LIQUIDAR".
 * El POST los marca como estadoLiquidacion="LIQUIDADO" (NO toca estadoFactura).
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { calcularToneladas, calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { obtenerTarifaOperativaInicial } from "@/lib/viaje-serialization"
import { EstadoLiquidacionDocumento, EstadoLiquidacionViaje } from "@/lib/viaje-workflow"
import type { Rol } from "@/types"

const viajeEnLiqSchema = z.object({
  viajeId: z.string().uuid(),
  camionId: z.string().uuid().optional(),
  choferId: z.string().uuid().optional(),
  fechaViaje: z.string(),
  remito: z.string().nullable().optional(),
  cupo: z.string().nullable().optional(),
  mercaderia: z.string().nullable().optional(),
  procedencia: z.string().nullable().optional(),
  provinciaOrigen: z.string().nullable().optional(),
  destino: z.string().nullable().optional(),
  provinciaDestino: z.string().nullable().optional(),
  kilos: z.number().positive("Kilos debe ser mayor a 0"),
  tarifaFletero: z.number().positive("La tarifa del fletero debe ser mayor a 0"),
})

const crearLiquidacionSchema = z.object({
  fleteroId: z.string().uuid(),
  comisionPct: z.number().min(0).max(100),
  ivaPct: z.number().min(0).max(100).default(21),
  viajes: z.array(viajeEnLiqSchema).min(1, "Debe incluir al menos un viaje"),
})

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Devuelve viajes pendientes de liquidar (estadoLiquidacion="PENDIENTE_LIQUIDAR")
 * y las liquidaciones existentes del fletero especificado.
 * Roles internos pueden filtrar por fleteroId; FLETERO solo ve los suyos.
 * Existe para el panel de liquidaciones mostrando qué liquidar y qué ya está liquidado.
 *
 * Ejemplos:
 * GET /api/liquidaciones?fleteroId=f1 (sesión ADMIN_TRANSMAGG)
 * // => 200 { viajesPendientes: [...], liquidaciones: [...] }
 * GET /api/liquidaciones (sesión FLETERO)
 * // => 200 { viajesPendientes: [...], liquidaciones: [...] } (solo los suyos)
 * GET /api/liquidaciones (sesión ADMIN_EMPRESA)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })

  const rol = session.user.rol as Rol
  const { searchParams } = new URL(request.url)
  const fleteroId = searchParams.get("fleteroId")

  if (rol !== "FLETERO" && !esRolInterno(rol)) {
    return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })
  }

  // Determinar el fleteroId real según el rol
  let fleteroIdReal: string | null = fleteroId

  if (rol === "FLETERO") {
    const fletero = await prisma.fletero.findFirst({
      where: { usuario: { email: session.user.email ?? "" } },
      select: { id: true },
    })
    if (!fletero) return NextResponse.json({ viajesPendientes: [], liquidaciones: [] })
    fleteroIdReal = fletero.id
  }

  const whereViajes: Record<string, unknown> = {
    estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR,
  }
  if (fleteroIdReal) whereViajes.fleteroId = fleteroIdReal

  const whereLiquidaciones: Record<string, unknown> = {}
  if (fleteroIdReal) whereLiquidaciones.fleteroId = fleteroIdReal

  const [viajesRaw, liquidaciones] = await Promise.all([
    prisma.viaje.findMany({
      where: whereViajes,
      select: {
        id: true,
        fechaViaje: true,
        fleteroId: true,
        empresaId: true,
        empresa: { select: { razonSocial: true } },
        camionId: true,
        camion: { select: { patenteChasis: true } },
        choferId: true,
        chofer: { select: { nombre: true, apellido: true } },
        remito: true,
        cupo: true,
        mercaderia: true,
        procedencia: true,
        provinciaOrigen: true,
        destino: true,
        provinciaDestino: true,
        kilos: true,
        tarifaOperativaInicial: true,
        estadoLiquidacion: true,
        estadoFactura: true,
      },
      orderBy: { fechaViaje: "desc" },
      take: 200,
    }),
    prisma.liquidacion.findMany({
      where: whereLiquidaciones,
      include: {
        fletero: { select: { razonSocial: true } },
        viajes: true,
        pagos: { select: { monto: true } },
      },
      orderBy: { grabadaEn: "desc" },
      take: 100,
    }),
  ])

  // Calcular toneladas y total en los viajes pendientes
  const viajesPendientes = viajesRaw.map((v) => ({
    ...v,
    tarifaOperativaInicial: obtenerTarifaOperativaInicial(v.tarifaOperativaInicial),
    toneladas: v.kilos != null ? calcularToneladas(v.kilos) : null,
    total: v.kilos != null ? calcularTotalViaje(v.kilos, v.tarifaOperativaInicial) : null,
  }))

  return NextResponse.json({ viajesPendientes, liquidaciones })
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body { fleteroId, comisionPct, ivaPct, viajes: [{ viajeId, fechaViaje, kilos, tarifaFletero, ...campos }] },
 * crea una liquidación en BORRADOR con los datos copiados del viaje al momento de liquidar.
 * Actualiza estadoLiquidacion="LIQUIDADO" en cada viaje (NO toca estadoFactura).
 * Existe para liquidar viajes pendientes de un fletero, calculando subtotales, comisión, IVA y neto.
 *
 * Ejemplos:
 * POST /api/liquidaciones { fleteroId: "f1", comisionPct: 10, ivaPct: 21, viajes: [{ viajeId: "v2", kilos: 25000, tarifaFletero: 50, ... }] }
 * // => 201 { id, estado: "BORRADOR", total, subtotalBruto, neto }
 * POST /api/liquidaciones { fleteroId: "f1", comisionPct: 10, ivaPct: 21, viajes: [{ viajeId: "v1", ... }] } (v1 ya LIQUIDADO)
 * // => 400 { error: "Uno o más viajes no existen, no pertenecen al fletero o ya están liquidados" }
 * POST /api/liquidaciones (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
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

    const { fleteroId, comisionPct, ivaPct, viajes } = parsed.data

    const fletero = await prisma.fletero.findFirst({ where: { id: fleteroId, activo: true } })
    if (!fletero) return NextResponse.json({ error: "Fletero no encontrado" }, { status: 404 })

    // Verificar que todos los viajes existen, pertenecen al fletero y están pendientes de liquidar
    const viajeIds = viajes.map((v) => v.viajeId)
    const viajesExistentes = await prisma.viaje.findMany({
      where: { id: { in: viajeIds }, fleteroId, estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR },
    })

    if (viajesExistentes.length !== viajes.length) {
      return NextResponse.json(
        { error: "Uno o más viajes no existen, no pertenecen al fletero o ya están liquidados" },
        { status: 400 }
      )
    }

    // Calcular totales usando calcularLiquidacion
    const viajesParaCalc = viajes.map((v) => ({ kilos: v.kilos, tarifaFletero: v.tarifaFletero }))
    const { subtotalBruto, comisionMonto, neto, ivaMonto, totalFinal } = calcularLiquidacion(
      viajesParaCalc,
      comisionPct,
      ivaPct
    )

    const liquidacion = await prisma.$transaction(async (tx) => {
      const liq = await tx.liquidacion.create({
        data: {
          fleteroId,
          operadorId: session.user.id,
          comisionPct,
          ivaPct,
          subtotalBruto,
          comisionMonto,
          neto,
          ivaMonto,
          total: totalFinal,
          estado: EstadoLiquidacionDocumento.BORRADOR,
        },
      })

      for (const viaje of viajes) {
        const subtotalViaje = calcularTotalViaje(viaje.kilos, viaje.tarifaFletero)
        const viajeData = viajesExistentes.find((v) => v.id === viaje.viajeId)!

        if (viaje.camionId || viaje.choferId) {
          const [camion, chofer] = await Promise.all([
            viaje.camionId
              ? tx.camion.findFirst({
                  where: { id: viaje.camionId, fleteroId, activo: true },
                  select: { id: true },
                })
              : Promise.resolve({ id: viajeData.camionId }),
            viaje.choferId
              ? tx.usuario.findFirst({
                  where: { id: viaje.choferId, rol: "CHOFER", activo: true },
                  select: { id: true },
                })
              : Promise.resolve({ id: viajeData.choferId }),
          ])

          if (!camion) {
            throw new Error(`Camión inválido para el viaje ${viaje.viajeId}`)
          }

          if (!chofer) {
            throw new Error(`Chofer inválido para el viaje ${viaje.viajeId}`)
          }
        }

        await tx.viaje.update({
          where: { id: viaje.viajeId },
          data: {
            camionId: viaje.camionId ?? viajeData.camionId,
            choferId: viaje.choferId ?? viajeData.choferId,
            fechaViaje: new Date(viaje.fechaViaje),
            remito: viaje.remito ?? null,
            cupo: viaje.cupo ?? null,
            mercaderia: viaje.mercaderia ?? null,
            procedencia: viaje.procedencia ?? null,
            provinciaOrigen: viaje.provinciaOrigen ?? null,
            destino: viaje.destino ?? null,
            provinciaDestino: viaje.provinciaDestino ?? null,
            kilos: viaje.kilos,
          },
        })

        const enLiq = await tx.viajeEnLiquidacion.create({
          data: {
            viajeId: viaje.viajeId,
            liquidacionId: liq.id,
            fechaViaje: new Date(viaje.fechaViaje),
            remito: viaje.remito ?? null,
            cupo: viaje.cupo ?? null,
            mercaderia: viaje.mercaderia ?? null,
            procedencia: viaje.procedencia ?? null,
            provinciaOrigen: viaje.provinciaOrigen ?? null,
            destino: viaje.destino ?? null,
            provinciaDestino: viaje.provinciaDestino ?? null,
            kilos: viaje.kilos,
            tarifaFletero: viaje.tarifaFletero,
            subtotal: subtotalViaje,
          },
        })

        // Asiento IIBB por provincia de origen
        const provincia = viaje.provinciaOrigen ?? viajeData.provinciaOrigen
        if (provincia) {
          const periodo = new Date(viaje.fechaViaje).toISOString().slice(0, 7)
          await tx.asientoIibb.create({
            data: {
              viajeEnLiqId: enLiq.id,
              tablaOrigen: "viajes_en_liquidacion",
              provincia,
              montoIngreso: subtotalViaje,
              periodo,
            },
          })
        }
      }

      // Marcar viajes como LIQUIDADO (sin tocar estadoFactura)
      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estadoLiquidacion: EstadoLiquidacionViaje.LIQUIDADO },
      })

      return liq
    })

    return NextResponse.json(liquidacion, { status: 201 })
  } catch (error) {
    console.error("[POST /api/liquidaciones]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error interno del servidor" },
      { status: 500 }
    )
  }
}
