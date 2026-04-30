/**
 * liquidacion-commands.ts
 *
 * Lógica de negocio transaccional para creación de liquidaciones.
 * Valida precondiciones, calcula totales y ejecuta la transacción
 * que crea la liquidación, snapshots de viajes y asientos IIBB.
 *
 * La validación de estado de viajes y la numeración de comprobantes
 * se ejecutan DENTRO de la transacción para evitar race conditions
 * en requests concurrentes.
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
  tarifaEmpresa?: number
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

/** Error de validación interno para usar dentro de transacciones. */
class _ValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

// ─── Próximo nro comprobante ─────────────────────────────────────────────────

/**
 * calcularProximoNroComprobanteLiquidacion: -> Promise<number>
 *
 * Devuelve el próximo número de comprobante disponible para liquidaciones.
 * NOTA: para uso atómico, usar _proximoNroComprobanteTx dentro de una transacción.
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function _proximoNroComprobanteTx(tx: any): Promise<number> {
  const ultima = await tx.liquidacion.findFirst({
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
 * - Todos los viajes existen, pertenecen al fletero y están pendientes (dentro de tx)
 * - Camión y chofer editados son válidos
 *
 * Ejecuta en transacción atómica:
 * - Lee y valida viajes (protección contra race condition)
 * - Obtiene próximo nro comprobante (protección contra numeración duplicada)
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

  // ── Validaciones fuera de tx (no dependen de estado mutable) ──

  // Invariante: al menos 1 viaje
  if (!viajes || viajes.length === 0) {
    return { ok: false, status: 400, error: "Se requiere al menos un viaje para crear la liquidación" }
  }

  // Validar fletero — fuera de tx porque verifica configuración estática (activo).
  // La invariante de estado de viajes (PENDIENTE_LIQUIDAR → LIQUIDADO) se protege
  // dentro de la tx, que ya filtra por fleteroId.
  const fletero = await prisma.fletero.findFirst({ where: { id: fleteroId, activo: true } })
  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }

  // Validar que viajes hermanos del mismo cupo tengan misma tarifa fletero.
  // Los hermanos siempre se liquidan juntos en la misma LP, y deben acordar
  // la tarifa para no introducir diferencias imposibles de auditar.
  const tarifaPorCupo = new Map<string, number>()
  for (const v of viajes) {
    const cupoKey = v.cupo?.trim()
    if (!cupoKey) continue
    const previa = tarifaPorCupo.get(cupoKey)
    if (previa === undefined) {
      tarifaPorCupo.set(cupoKey, v.tarifaFletero)
    } else if (v.tarifaFletero !== previa) {
      return {
        ok: false,
        status: 409,
        error: `Los viajes con cupo "${cupoKey}" tienen tarifas distintas (${previa} vs ${v.tarifaFletero}). Unificá la tarifa antes de liquidar.`,
      }
    }
  }

  // Calcular totales (desde input del caller, no depende de DB)
  const viajeIds = viajes.map((v) => v.viajeId)
  const viajesParaCalc = viajes.map((v) => ({ kilos: v.kilos, tarifaFletero: v.tarifaFletero }))
  const { subtotalBruto, comisionMonto, neto, ivaMonto, totalFinal } = calcularLiquidacion(viajesParaCalc, comisionPct, ivaPct)

  // ── Transacción atómica: lectura + validación + creación ──

  try {
    const liquidacion = await prisma.$transaction(async (tx) => {
      // Leer viajes DENTRO de tx para evitar race condition
      const viajesExistentes = await tx.viaje.findMany({
        where: {
          id: { in: viajeIds },
          fleteroId,
          estadoLiquidacion: EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR,
        },
      })
      if (viajesExistentes.length !== viajes.length) {
        throw new _ValidationError(400, "Uno o más viajes no existen, no pertenecen al fletero o ya están liquidados")
      }

      // Próximo nro comprobante DENTRO de tx (evita numeración duplicada)
      const nroComprobante = await _proximoNroComprobanteTx(tx)

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
              ? tx.empleado.findFirst({ where: { id: viaje.choferId, cargo: "CHOFER", activo: true }, select: { id: true } })
              : Promise.resolve({ id: viajeData.choferId }),
          ])
          if (!camion) throw new _ValidationError(400, `Camión inválido para el viaje ${viaje.viajeId}`)
          if (!chofer) throw new _ValidationError(400, `Chofer inválido para el viaje ${viaje.viajeId}`)
        }

        // Actualizar viaje con datos editados (incluye tarifas)
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
            tarifa: viaje.tarifaFletero,
            ...(viaje.tarifaEmpresa != null ? { tarifaEmpresa: viaje.tarifaEmpresa } : {}),
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

      // Asiento IVA Compras
      const periodo = liq.grabadaEn.toISOString().slice(0, 7)
      await tx.asientoIva.create({
        data: {
          liquidacionId: liq.id,
          tipoReferencia: "LIQUIDACION",
          tipo: "COMPRA",
          baseImponible: neto,
          alicuota: ivaPct,
          montoIva: ivaMonto,
          periodo,
        },
      })

      return liq
    })

    return { ok: true, liquidacion }
  } catch (err) {
    if (err instanceof _ValidationError) {
      return { ok: false, status: err.status, error: err.message }
    }
    throw err
  }
}
