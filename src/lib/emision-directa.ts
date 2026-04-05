/**
 * emision-directa.ts
 *
 * Orquesta la emisión directa de comprobantes ARCA.
 *
 * Semántica transaccional de negocio:
 * - Si ARCA devuelve CAE: comprobante queda EMITIDA + PDF + viajes actualizados.
 * - Si ARCA falla: se revierte TODO — comprobante eliminado, viajes intactos,
 *   sin efectos parciales. Como si la emisión nunca hubiera ocurrido.
 *
 * Reutiliza los commands de creación existentes y el servicio ARCA existente.
 */

import { prisma } from "@/lib/prisma"
import { ejecutarCrearFactura, type DatosCrearFactura } from "@/lib/factura-commands"
import { ejecutarCrearLiquidacion, type DatosCrearLiquidacion } from "@/lib/liquidacion-commands"
import { ejecutarCrearNotaCD, type DatosNotaCD } from "@/lib/nota-cd-commands"
import {
  autorizarFacturaArca,
  autorizarLiquidacionArca,
  autorizarNotaCDArca,
} from "@/lib/arca/service"
import type { AutorizarComprobanteResult } from "@/lib/arca/types"

// ─── Tipos ──────────────────────────────────────────────────────────────────

type ResultadoEmisionDirecta =
  | { ok: true; documento: unknown; arca: AutorizarComprobanteResult }
  | { ok: false; status: number; error: string }

function mensajeErrorArca(err: unknown): string {
  const detalle = err instanceof Error ? err.message : String(err)
  return detalle
    ? `No se pudo emitir el comprobante porque no fue posible obtener CAE de ARCA. El comprobante no quedó emitido. Motivo informado por ARCA: ${detalle}.`
    : "No se pudo emitir el comprobante porque no fue posible obtener CAE de ARCA. El comprobante no quedó emitido."
}

// ─── Factura ────────────────────────────────────────────────────────────────

/**
 * emitirFacturaDirecta: DatosCrearFactura string string -> Promise<ResultadoEmisionDirecta>
 *
 * 1. Crea factura (EMITIDA + viajes FACTURADO + snapshots + contabilidad).
 * 2. Autoriza en ARCA.
 * 3. Si ARCA OK → devuelve éxito con CAE.
 * 4. Si ARCA FAIL → borra todo lo creado, revierte viajes, devuelve error.
 */
export async function emitirFacturaDirecta(
  data: DatosCrearFactura,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const resultado = await ejecutarCrearFactura(data, operadorId)
  if (!resultado.ok) return resultado

  const factura = resultado.factura as { id: string }

  try {
    const arca = await autorizarFacturaArca(factura.id, idempotencyKey)

    // ARCA OK → re-leer con datos ARCA persistidos
    const facturaFinal = await prisma.facturaEmitida.findUnique({
      where: { id: factura.id },
    })

    return { ok: true, documento: facturaFinal, arca }
  } catch (err) {
    // ARCA FAIL → compensar: borrar comprobante + revertir viajes
    await _revertirFactura(factura.id, data.viajeIds)
    return { ok: false, status: 502, error: mensajeErrorArca(err) }
  }
}

async function _revertirFactura(facturaId: string, viajeIds: string[]) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Borrar IIBB (referencia ViajeEnFactura que va a desaparecer por cascade)
      const vefs = await tx.viajeEnFactura.findMany({
        where: { facturaId },
        select: { id: true },
      })
      if (vefs.length > 0) {
        await tx.asientoIibb.deleteMany({
          where: { viajeEnFactId: { in: vefs.map((v) => v.id) } },
        })
      }
      // 2. Borrar asientos IVA
      await tx.asientoIva.deleteMany({ where: { facturaEmitidaId: facturaId } })
      // 3. Borrar factura (cascade → ViajeEnFactura)
      await tx.facturaEmitida.delete({ where: { id: facturaId } })
      // 4. Revertir viajes a PENDIENTE_FACTURAR (estaban PENDIENTE antes de crear)
      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    })
  } catch (revertErr) {
    console.error("[emision-directa] Error revirtiendo factura:", revertErr)
  }
}

// ─── Liquidación ────────────────────────────────────────────────────────────

/**
 * emitirLiquidacionDirecta: DatosCrearLiquidacion string string -> Promise<ResultadoEmisionDirecta>
 *
 * Mismo contrato transaccional que emitirFacturaDirecta.
 * La liquidación se crea como EMITIDA por el command existente.
 * Si ARCA OK → queda EMITIDA con CAE. Si ARCA FAIL → se borra todo.
 */
export async function emitirLiquidacionDirecta(
  data: DatosCrearLiquidacion,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const resultado = await ejecutarCrearLiquidacion(data, operadorId)
  if (!resultado.ok) return resultado

  const liquidacion = resultado.liquidacion as { id: string }

  try {
    const arca = await autorizarLiquidacionArca(liquidacion.id, idempotencyKey)

    // ARCA OK → re-leer con datos ARCA persistidos
    const liqFinal = await prisma.liquidacion.findUnique({
      where: { id: liquidacion.id },
    })

    return { ok: true, documento: liqFinal, arca }
  } catch (err) {
    await _revertirLiquidacion(liquidacion.id, data.viajes.map((v) => v.viajeId))
    return { ok: false, status: 502, error: mensajeErrorArca(err) }
  }
}

async function _revertirLiquidacion(liquidacionId: string, viajeIds: string[]) {
  try {
    await prisma.$transaction(async (tx) => {
      const vels = await tx.viajeEnLiquidacion.findMany({
        where: { liquidacionId },
        select: { id: true },
      })
      if (vels.length > 0) {
        await tx.asientoIibb.deleteMany({
          where: { viajeEnLiqId: { in: vels.map((v) => v.id) } },
        })
      }
      await tx.asientoIva.deleteMany({ where: { liquidacionId } })
      await tx.liquidacion.delete({ where: { id: liquidacionId } })
      await tx.viaje.updateMany({
        where: { id: { in: viajeIds } },
        data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
      })
    })
  } catch (revertErr) {
    console.error("[emision-directa] Error revirtiendo liquidación:", revertErr)
  }
}

// ─── Nota de Crédito / Débito ───────────────────────────────────────────────

/**
 * emitirNotaCDDirecta: DatosNotaCD string string -> Promise<ResultadoEmisionDirecta>
 *
 * Solo autoriza en ARCA si es NC_EMITIDA o ND_EMITIDA.
 * NC/ND recibidas se crean sin ARCA (flujo clásico).
 *
 * Si ARCA FAIL → borra la nota y revierte estados de viaje.
 */
export async function emitirNotaCDDirecta(
  data: DatosNotaCD,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const esEmitida = data.tipo === "NC_EMITIDA" || data.tipo === "ND_EMITIDA"

  // NC/ND recibidas: crear sin ARCA (flujo clásico directo)
  if (!esEmitida) {
    const resultado = await ejecutarCrearNotaCD(data, operadorId)
    if (!resultado.ok) return resultado
    return {
      ok: true,
      documento: resultado.nota,
      arca: { ok: true, cae: "", caeVto: new Date(), nroComprobante: 0, ptoVenta: 0, tipoCbte: 0, qrData: "" },
    }
  }

  const resultado = await ejecutarCrearNotaCD(data, operadorId)
  if (!resultado.ok) return resultado

  const nota = resultado.nota as { id: string }

  try {
    const arca = await autorizarNotaCDArca(nota.id, idempotencyKey)

    return { ok: true, documento: nota, arca }
  } catch (err) {
    await _revertirNotaCD(nota.id, data)
    return { ok: false, status: 502, error: mensajeErrorArca(err) }
  }
}

async function _revertirNotaCD(notaId: string, data: DatosNotaCD) {
  try {
    await prisma.$transaction(async (tx) => {
      // 1. Borrar nota (cascade → ViajeEnNotaCD)
      await tx.notaCreditoDebito.delete({ where: { id: notaId } })

      // 2. Revertir viaje states según subtipo
      if (data.tipo === "NC_EMITIDA") {
        if (data.subtipo === "ANULACION_TOTAL" && data.facturaId) {
          // NC total puso viajes en PENDIENTE_FACTURAR → revertir a FACTURADO
          const vefs = await tx.viajeEnFactura.findMany({
            where: { facturaId: data.facturaId },
            select: { viajeId: true },
          })
          const ids = vefs.map((v) => v.viajeId)
          if (ids.length > 0) {
            await tx.viaje.updateMany({
              where: { id: { in: ids } },
              data: { estadoFactura: "FACTURADO" },
            })
          }
        } else if (data.subtipo === "ANULACION_PARCIAL" && data.viajesIds?.length) {
          // NC parcial puso viajes seleccionados en PENDIENTE → revertir a FACTURADO
          await tx.viaje.updateMany({
            where: { id: { in: data.viajesIds } },
            data: { estadoFactura: "FACTURADO" },
          })
        }
        // CORRECCION_IMPORTE: no tocó viajes, nada que revertir
      }
      // ND_EMITIDA: no tocó viajes, nada que revertir
    })
  } catch (revertErr) {
    console.error("[emision-directa] Error revirtiendo nota CD:", revertErr)
  }
}
