/**
 * factura-commands.ts (JM)
 *
 * Lógica transaccional para emitir facturas en JM. Adaptado de
 * src/lib/factura-commands.ts:
 * - Sin `esCamionPropio` ni `fleteroId` (todos los viajes son propios).
 * - Sin punto de venta ARCA — usa ptoVenta=1 fijo (mejorable cuando se
 *   active ARCA real).
 * - Numeración interna correlativa por (tipoCbte, ptoVenta).
 * - operadorEmail (string) en vez de operadorId.
 * - Sin autorización ARCA — `estadoArca = "PENDIENTE"`.
 */

import { prismaJm } from "@/jm/prisma"
import { calcularTotalViaje, calcularFactura } from "@/lib/viajes"
import { EstadoFacturaDocumento, EstadoFacturaViaje } from "@/lib/viaje-workflow"

export type DatosCrearFacturaJm = {
  empresaId: string
  viajeIds: string[]
  tipoCbte: number
  modalidadMiPymes?: string
  ivaPct: number
  metodoPago?: string
  fechaEmision?: string
  ediciones?: Record<string, { kilos?: number; tarifaEmpresa?: number }>
}

type ResultadoFactura =
  | { ok: true; factura: { id: string; nroComprobante: string | null; tipoCbte: number; ptoVenta: number | null; total: unknown } }
  | { ok: false; status: number; error: string }

class _ValidationError extends Error {
  constructor(public status: number, message: string) {
    super(message)
  }
}

/**
 * ejecutarCrearFacturaJm: emite factura en JM.
 *
 * Valida:
 * - Empresa existe y activa.
 * - tipoCbte compatible con condicionIva (RI → 1/201; otros → 6).
 * - modalidadMiPymes obligatoria si tipoCbte === 201.
 * - Viajes existen, pertenecen a la empresa, están PENDIENTE_FACTURAR.
 * - Hermanos por cupo tienen misma tarifaEmpresa efectiva.
 *
 * Ejecuta en transacción:
 * - Crea FacturaEmitida con nroComprobante = max+1 por (tipoCbte, ptoVenta).
 * - Crea AsientoIva VENTA.
 * - Crea ViajeEnFactura por cada viaje + AsientoIibb por provincia.
 * - Marca viajes como FACTURADO.
 */
export async function ejecutarCrearFacturaJm(
  data: DatosCrearFacturaJm,
  operadorEmail: string,
): Promise<ResultadoFactura> {
  const { empresaId, viajeIds, tipoCbte, modalidadMiPymes, ivaPct, metodoPago, ediciones } = data

  if (!viajeIds || viajeIds.length === 0) {
    return { ok: false, status: 400, error: "Se requiere al menos un viaje para crear la factura" }
  }

  const empresa = await prismaJm.empresa.findFirst({ where: { id: empresaId, activa: true } })
  if (!empresa) return { ok: false, status: 404, error: "Empresa no encontrada" }

  if (empresa.condicionIva === "RESPONSABLE_INSCRIPTO") {
    if (![1, 201].includes(tipoCbte)) {
      return { ok: false, status: 422, error: "Para empresas RI solo se puede emitir Factura A (1) o Factura A MiPyme (201)" }
    }
  } else {
    if (tipoCbte !== 6) {
      return { ok: false, status: 422, error: "Para empresas no RI solo se puede emitir Factura B (6)" }
    }
  }

  if (tipoCbte === 201 && !modalidadMiPymes) {
    return { ok: false, status: 422, error: "Para Factura A MiPyme se debe especificar la modalidad (SCA o ADC)" }
  }

  const ptoVenta = 1

  try {
    const factura = await prismaJm.$transaction(async (tx) => {
      const viajes = await tx.viaje.findMany({
        where: { id: { in: viajeIds } },
        select: {
          id: true, empresaId: true, kilos: true, tarifaEmpresa: true,
          fechaViaje: true, remito: true, cupo: true, mercaderia: true,
          procedencia: true, provinciaOrigen: true, destino: true,
          provinciaDestino: true, camionId: true, choferId: true, estadoFactura: true,
        },
      })

      if (viajes.length !== viajeIds.length) {
        const encontrados = new Set(viajes.map((v) => v.id))
        const faltantes = viajeIds.filter((id) => !encontrados.has(id))
        throw new _ValidationError(404, `Viaje(s) no encontrado(s): ${faltantes.join(", ")}`)
      }

      const noPertenece = viajes.filter((v) => v.empresaId !== empresaId)
      if (noPertenece.length > 0) {
        throw new _ValidationError(400, "Uno o más viajes no pertenecen a la empresa seleccionada")
      }

      const noFacturables = viajes.filter((v) => v.estadoFactura !== "PENDIENTE_FACTURAR")
      if (noFacturables.length > 0) {
        throw new _ValidationError(400, "Uno o más viajes no están pendientes de facturar")
      }

      const viajesConEdiciones = viajes.map((v) => {
        const edit = ediciones?.[v.id]
        return {
          ...v,
          kilosEfectivos: edit?.kilos ?? v.kilos ?? 0,
          tarifaEmpresaEfectiva: edit?.tarifaEmpresa ?? Number(v.tarifaEmpresa),
        }
      })

      const tarifaPorCupo = new Map<string, number>()
      for (const v of viajesConEdiciones) {
        const cupoKey = v.cupo?.trim()
        if (!cupoKey) continue
        const previa = tarifaPorCupo.get(cupoKey)
        if (previa === undefined) {
          tarifaPorCupo.set(cupoKey, Number(v.tarifaEmpresaEfectiva))
        } else if (Number(v.tarifaEmpresaEfectiva) !== previa) {
          throw new _ValidationError(
            409,
            `Los viajes con cupo "${cupoKey}" tienen tarifas distintas (${previa} vs ${v.tarifaEmpresaEfectiva}). Unificá la tarifa antes de facturar.`,
          )
        }
      }

      const viajesParaCalc = viajesConEdiciones.map((v) => ({
        kilos: v.kilosEfectivos,
        tarifaEmpresa: v.tarifaEmpresaEfectiva,
      }))
      const { neto, ivaMonto, total } = calcularFactura(viajesParaCalc, ivaPct)
      const periodo = viajes[0].fechaViaje.toISOString().slice(0, 7)

      // Numeración correlativa interna por (tipoCbte, ptoVenta)
      const ultima = await tx.facturaEmitida.findFirst({
        where: { tipoCbte, ptoVenta },
        orderBy: { nroComprobante: "desc" },
        select: { nroComprobante: true },
      })
      const proximoNro = (() => {
        const n = parseInt(ultima?.nroComprobante ?? "0", 10)
        return String((Number.isFinite(n) ? n : 0) + 1).padStart(8, "0")
      })()

      const fact = await tx.facturaEmitida.create({
        data: {
          empresaId,
          operadorEmail,
          tipoCbte,
          ptoVenta,
          nroComprobante: proximoNro,
          modalidadMiPymes: modalidadMiPymes ?? null,
          ivaPct,
          metodoPago: metodoPago ?? "Transferencia Bancaria",
          emitidaEn: data.fechaEmision ? new Date(data.fechaEmision + "T12:00:00") : new Date(),
          neto,
          ivaMonto,
          total,
          estadoArca: "PENDIENTE",
          estado: EstadoFacturaDocumento.EMITIDA,
        },
      })

      await tx.asientoIva.create({
        data: {
          facturaEmitidaId: fact.id,
          tipoReferencia: "FACTURA_EMITIDA",
          tipo: "VENTA",
          baseImponible: neto,
          alicuota: ivaPct,
          montoIva: ivaMonto,
          periodo,
        },
      })

      for (const viaje of viajesConEdiciones) {
        const subtotalViaje = calcularTotalViaje(viaje.kilosEfectivos, viaje.tarifaEmpresaEfectiva)
        const enFact = await tx.viajeEnFactura.create({
          data: {
            viajeId: viaje.id,
            facturaId: fact.id,
            fechaViaje: viaje.fechaViaje,
            remito: viaje.remito ?? null,
            cupo: viaje.cupo ?? null,
            mercaderia: viaje.mercaderia ?? null,
            procedencia: viaje.procedencia ?? null,
            provinciaOrigen: viaje.provinciaOrigen ?? null,
            destino: viaje.destino ?? null,
            provinciaDestino: viaje.provinciaDestino ?? null,
            kilos: viaje.kilosEfectivos,
            tarifaEmpresa: viaje.tarifaEmpresaEfectiva,
            subtotal: subtotalViaje,
          },
        })

        if (viaje.provinciaOrigen) {
          await tx.asientoIibb.create({
            data: {
              viajeEnFactId: enFact.id,
              tablaOrigen: "viajes_en_factura",
              provincia: viaje.provinciaOrigen,
              montoIngreso: subtotalViaje,
              periodo: viaje.fechaViaje.toISOString().slice(0, 7),
            },
          })
        }
      }

      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estadoFactura: EstadoFacturaViaje.FACTURADO },
      })

      return fact
    })

    return {
      ok: true,
      factura: {
        id: factura.id,
        nroComprobante: factura.nroComprobante,
        tipoCbte: factura.tipoCbte,
        ptoVenta: factura.ptoVenta,
        total: factura.total,
      },
    }
  } catch (err) {
    if (err instanceof _ValidationError) {
      return { ok: false, status: err.status, error: err.message }
    }
    throw err
  }
}
