/**
 * liquidacion-commands.ts
 *
 * Lógica de negocio transaccional para creación de liquidaciones.
 * Valida precondiciones, calcula totales y ejecuta la transacción
 * que crea la liquidación, snapshots de viajes y asientos IIBB.
 */

import { prisma } from "@/lib/prisma"
import { calcularTotalViaje, calcularLiquidacion } from "@/lib/viajes"
import { EstadoLiquidacionDocumento, EstadoLiquidacionViaje } from "@/lib/viaje-workflow"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ViajeEnLiqInput = {
  viajeId: string
  camionId?: string
  choferId?: string
  fechaViaje: string
  remito?: string | null
  cupo?: string | null
  mercaderia?: string | null
  procedencia?: string | null
  provinciaOrigen?: string | null
  destino?: string | null
  provinciaDestino?: string | null
  kilos: number
  tarifaFletero: number
}

export type DatosCrearLiquidacion = {
  fleteroId: string
  comisionPct: number
  ivaPct: number
  metodoPago?: string
  fechaEmision?: string
  viajes: ViajeEnLiqInput[]
}

type ResultadoLiquidacion =
  | { ok: true; liquidacion: unknown }
  | { ok: false; status: number; error: string }

// ─── Próximo nro comprobante ─────────────────────────────────────────────────

/**
 * calcularProximoNroComprobanteLiquidacion: -> Promise<number>
 *
 * Devuelve el próximo número de comprobante disponible para liquidaciones.
 *
 * Ejemplos:
 * calcularProximoNroComprobanteLiquidacion() // => 1 (sin liquidaciones)
 * calcularProximoNroComprobanteLiquidacion() // => 6 (última nro = 5)
 */
export async function calcularProximoNroComprobanteLiquidacion(): Promise<number> {
  const ultima = await prisma.liquidacion.findFirst({
    orderBy: { nroComprobante: "desc" },
    select: { nroComprobante: true },
  })
  return (ultima?.nroComprobante ?? 0) + 1
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearLiquidacion: DatosCrearLiquidacion string -> Promise<ResultadoLiquidacion>
 *
 * Dado [los datos validados de la liquidación y el operadorId],
 * devuelve [la liquidación creada o un error con status HTTP].
 *
 * Valida:
 * - Fletero existe y está activo
 * - Todos los viajes existen, pertenecen al fletero y están pendientes
 * - Camión y chofer editados son válidos
 *
 * Ejecuta en transacción:
 * - Crea liquidación con totales calculados
 * - Crea snapshots ViajeEnLiquidacion por cada viaje
 * - Crea/actualiza asientos IIBB por provincia
 * - Marca viajes como LIQUIDADO
 *
 * Ejemplos:
 * ejecutarCrearLiquidacion({ fleteroId: "f1", comisionPct: 10, ivaPct: 21, viajes: [...] }, "op1")
 *   // => { ok: true, liquidacion: { id, estado: "EMITIDA", ... } }
 * ejecutarCrearLiquidacion({ fleteroId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Fletero no encontrado" }
 */
export async function ejecutarCrearLiquidacion(
  data: DatosCrearLiquidacion,
  operadorId: string
): Promise<ResultadoLiquidacion> {
  const { fleteroId, comisionPct, ivaPct, metodoPago, viajes } = data

  // Validar fletero
  const fletero = await prisma.fletero.findFirst({ where: { id: fleteroId, activo: true } })
  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }

  // Validar viajes
  const viajeIds = viajes.map((v) => v.viajeId)
  const viajesExistentes = await prisma.viaje.findMany({
    where: {
      id: { in: viajeIds },
      fleteroId,
      estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR,
    },
  })
  if (viajesExistentes.length !== viajes.length) {
    return { ok: false, status: 400, error: "Uno o más viajes no existen, no pertenecen al fletero o ya están liquidados" }
  }

  // Calcular totales
  const nroComprobante = await calcularProximoNroComprobanteLiquidacion()
  const viajesParaCalc = viajes.map((v) => ({ kilos: v.kilos, tarifaFletero: v.tarifaFletero }))
  const { subtotalBruto, comisionMonto, neto, ivaMonto, totalFinal } = calcularLiquidacion(viajesParaCalc, comisionPct, ivaPct)

  // Transacción
  const liquidacion = await prisma.$transaction(async (tx) => {
    const liq = await tx.liquidacion.create({
      data: {
        fleteroId,
        operadorId,
        comisionPct,
        ivaPct,
        subtotalBruto,
        comisionMonto,
        neto,
        ivaMonto,
        total: totalFinal,
        estado: EstadoLiquidacionDocumento.EMITIDA,
        metodoPago: metodoPago ?? "Transferencia Bancaria",
        grabadaEn: data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date(),
        nroComprobante,
        ptoVenta: 1,
        tipoCbte: 60,
        arcaEstado: "PENDIENTE",
      },
    })

    for (const viaje of viajes) {
      const subtotalViaje = calcularTotalViaje(viaje.kilos, viaje.tarifaFletero)
      const viajeData = viajesExistentes.find((v) => v.id === viaje.viajeId)!

      // Validar camión/chofer editados
      if (viaje.camionId || viaje.choferId) {
        const [camion, chofer] = await Promise.all([
          viaje.camionId
            ? tx.camion.findFirst({ where: { id: viaje.camionId, fleteroId, activo: true }, select: { id: true } })
            : Promise.resolve({ id: viajeData.camionId }),
          viaje.choferId
            ? tx.usuario.findFirst({ where: { id: viaje.choferId, rol: "CHOFER", activo: true }, select: { id: true } })
            : Promise.resolve({ id: viajeData.choferId }),
        ])
        if (!camion) throw new Error(`Camión inválido para el viaje ${viaje.viajeId}`)
        if (!chofer) throw new Error(`Chofer inválido para el viaje ${viaje.viajeId}`)
      }

      // Actualizar viaje con datos editados
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

      // Snapshot en ViajeEnLiquidacion
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

      // Asiento IIBB por provincia
      const provincia = viaje.provinciaOrigen ?? viajeData.provinciaOrigen
      if (provincia) {
        const periodo = new Date(viaje.fechaViaje).toISOString().slice(0, 7)
        const asientoExistente = await tx.asientoIibb.findFirst({ where: { viajeEnLiqId: enLiq.id } })
        if (asientoExistente) {
          await tx.asientoIibb.update({
            where: { id: asientoExistente.id },
            data: { provincia, montoIngreso: subtotalViaje, periodo },
          })
        } else {
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
    }

    // Marcar viajes como LIQUIDADO
    await tx.viaje.updateMany({
      where: { id: { in: viajeIds } },
      data: { estadoLiquidacion: EstadoLiquidacionViaje.LIQUIDADO },
    })

    return liq
  })

  return { ok: true, liquidacion }
}
