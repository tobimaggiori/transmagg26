/**
 * emision-directa.ts
 *
 * Orquesta la emisión directa de comprobantes ARCA.
 *
 * Semántica transaccional de negocio:
 * - Si ARCA devuelve CAE: comprobante queda EMITIDA + PDF + viajes actualizados.
 *   NUNCA se revierte si el CAE ya fue obtenido (el comprobante tiene efecto fiscal).
 * - Si ARCA falla por error transitorio (red/WSAA): comprobante se CONSERVA con
 *   estadoArca=PENDIENTE para reintentar. El operador no pierde su trabajo.
 * - Si ARCA falla por error permanente (rechazo, validación, config): se revierte TODO.
 *
 * Los mensajes de error son precisos según la etapa del fallo.
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
import {
  ArcaRechazoError,
  ArcaValidacionError,
  ArcaNoConfiguradaError,
  ArcaConfigIncompletaError,
  WsaaError,
  Wsfev1Error,
  DocumentoYaAutorizadoError,
  DocumentoEnProcesoError,
  DocumentoNoEncontradoError,
} from "@/lib/arca/errors"
import type { AutorizarComprobanteResult } from "@/lib/arca/types"

// ─── Tipos ──────────────────────────────────────────────────────────────────

type ResultadoEmisionDirecta =
  | { ok: true; documento: unknown; arca: AutorizarComprobanteResult }
  | { ok: false; status: number; error: string; documentoId?: string; reintentable?: boolean }

// ─── Clasificación de errores ───────────────────────────────────────────────

/** Errores permanentes: se borra el comprobante porque no tiene sentido conservarlo */
function esErrorPermanente(err: unknown): boolean {
  return (
    err instanceof ArcaNoConfiguradaError ||
    err instanceof ArcaConfigIncompletaError ||
    err instanceof ArcaValidacionError ||
    err instanceof ArcaRechazoError ||
    err instanceof DocumentoNoEncontradoError
  )
}

function mensajeErrorArca(err: unknown): { status: number; mensaje: string } {
  if (err instanceof ArcaNoConfiguradaError || err instanceof ArcaConfigIncompletaError) {
    return { status: 503, mensaje: err.message }
  }
  if (err instanceof DocumentoYaAutorizadoError || err instanceof DocumentoEnProcesoError) {
    return { status: 409, mensaje: err.message }
  }
  if (err instanceof DocumentoNoEncontradoError) {
    return { status: 404, mensaje: err.message }
  }
  if (err instanceof ArcaValidacionError) {
    return { status: 400, mensaje: err.message }
  }
  if (err instanceof ArcaRechazoError) {
    return {
      status: 422,
      mensaje: `ARCA rechazó el comprobante. Motivo: ${err.observaciones}.`,
    }
  }
  if (err instanceof WsaaError) {
    return {
      status: 502,
      mensaje: `No se pudo conectar con ARCA (autenticación). Puede haber una caída del servicio. ${err.message}`,
    }
  }
  if (err instanceof Wsfev1Error) {
    return {
      status: 502,
      mensaje: `No se pudo conectar con ARCA (WSFEv1). Puede haber una caída del servicio. ${err.message}`,
    }
  }
  const detalle = err instanceof Error ? err.message : String(err)
  return {
    status: 500,
    mensaje: `Error interno al preparar el comprobante. ${detalle}`,
  }
}

// ─── Factura ────────────────────────────────────────────────────────────────

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

    let facturaFinal
    try {
      facturaFinal = await prisma.facturaEmitida.findUnique({ where: { id: factura.id } })
    } catch (readErr) {
      console.error("[emision-directa] Error re-leyendo factura post-CAE (CAE ya persistido):", readErr)
      return {
        ok: false,
        status: 500,
        error: `El comprobante fue autorizado por ARCA (CAE: ${arca.cae}) pero falló al releer los datos. Contacte soporte.`,
        documentoId: factura.id,
      }
    }

    return { ok: true, documento: facturaFinal, arca }
  } catch (err) {
    // Verificar si el CAE ya fue obtenido
    const facturaActual = await prisma.facturaEmitida.findUnique({
      where: { id: factura.id },
      select: { cae: true, estadoArca: true },
    }).catch(() => null)

    if (facturaActual?.cae && facturaActual.estadoArca === "AUTORIZADA") {
      console.error("[emision-directa] Error post-CAE (no se revierte):", err)
      return {
        ok: false,
        status: 500,
        error: `El comprobante fue autorizado por ARCA (CAE: ${facturaActual.cae}) pero falló al generar el PDF. El comprobante quedó emitido. Contacte soporte.`,
        documentoId: factura.id,
      }
    }

    // Error permanente → borrar comprobante
    if (esErrorPermanente(err)) {
      await _revertirFactura(factura.id, data.viajeIds)
      const { status, mensaje } = mensajeErrorArca(err)
      return { ok: false, status, error: mensaje }
    }

    // Error transitorio → conservar comprobante con estadoArca=PENDIENTE
    console.error("[emision-directa] Error transitorio ARCA, comprobante conservado:", err)
    const { status, mensaje } = mensajeErrorArca(err)
    return {
      ok: false,
      status,
      error: `${mensaje} El comprobante se creó correctamente pero ARCA no está disponible. Podés reintentar la autorización cuando ARCA vuelva a funcionar.`,
      documentoId: factura.id,
      reintentable: true,
    }
  }
}

async function _revertirFactura(facturaId: string, viajeIds: string[]) {
  try {
    await prisma.$transaction(async (tx) => {
      const vefs = await tx.viajeEnFactura.findMany({
        where: { facturaId },
        select: { id: true },
      })
      if (vefs.length > 0) {
        await tx.asientoIibb.deleteMany({
          where: { viajeEnFactId: { in: vefs.map((v) => v.id) } },
        })
      }
      await tx.asientoIva.deleteMany({ where: { facturaEmitidaId: facturaId } })
      await tx.facturaEmitida.delete({ where: { id: facturaId } })
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

    let liqFinal
    try {
      liqFinal = await prisma.liquidacion.findUnique({ where: { id: liquidacion.id } })
    } catch (readErr) {
      console.error("[emision-directa] Error re-leyendo liquidación post-CAE:", readErr)
      return {
        ok: false,
        status: 500,
        error: `El comprobante fue autorizado por ARCA (CAE: ${arca.cae}) pero falló al releer los datos. Contacte soporte.`,
        documentoId: liquidacion.id,
      }
    }

    return { ok: true, documento: liqFinal, arca }
  } catch (err) {
    const liqActual = await prisma.liquidacion.findUnique({
      where: { id: liquidacion.id },
      select: { cae: true, arcaEstado: true },
    }).catch(() => null)

    if (liqActual?.cae && liqActual.arcaEstado === "AUTORIZADA") {
      console.error("[emision-directa] Error post-CAE liquidación (no se revierte):", err)
      return {
        ok: false,
        status: 500,
        error: `El comprobante fue autorizado por ARCA (CAE: ${liqActual.cae}) pero falló al generar el PDF. El comprobante quedó emitido. Contacte soporte.`,
        documentoId: liquidacion.id,
      }
    }

    if (esErrorPermanente(err)) {
      await _revertirLiquidacion(liquidacion.id, data.viajes.map((v) => v.viajeId))
      const { status, mensaje } = mensajeErrorArca(err)
      return { ok: false, status, error: mensaje }
    }

    console.error("[emision-directa] Error transitorio ARCA liquidación, conservada:", err)
    const { status, mensaje } = mensajeErrorArca(err)
    return {
      ok: false,
      status,
      error: `${mensaje} El comprobante se creó correctamente pero ARCA no está disponible. Podés reintentar la autorización cuando ARCA vuelva a funcionar.`,
      documentoId: liquidacion.id,
      reintentable: true,
    }
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

export async function emitirNotaCDDirecta(
  data: DatosNotaCD,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const esEmitida = data.tipo === "NC_EMITIDA" || data.tipo === "ND_EMITIDA"

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
    const notaActual = await prisma.notaCreditoDebito.findUnique({
      where: { id: nota.id },
      select: { cae: true, arcaEstado: true },
    }).catch(() => null)

    if (notaActual?.cae && notaActual.arcaEstado === "AUTORIZADA") {
      console.error("[emision-directa] Error post-CAE nota CD (no se revierte):", err)
      return {
        ok: false,
        status: 500,
        error: `El comprobante fue autorizado por ARCA (CAE: ${notaActual.cae}) pero falló al generar el PDF. El comprobante quedó emitido. Contacte soporte.`,
        documentoId: nota.id,
      }
    }

    if (esErrorPermanente(err)) {
      await _revertirNotaCD(nota.id, data)
      const { status, mensaje } = mensajeErrorArca(err)
      return { ok: false, status, error: mensaje }
    }

    console.error("[emision-directa] Error transitorio ARCA nota CD, conservada:", err)
    const { status, mensaje } = mensajeErrorArca(err)
    return {
      ok: false,
      status,
      error: `${mensaje} El comprobante se creó correctamente pero ARCA no está disponible. Podés reintentar la autorización cuando ARCA vuelva a funcionar.`,
      documentoId: nota.id,
      reintentable: true,
    }
  }
}

async function _revertirNotaCD(notaId: string, data: DatosNotaCD) {
  try {
    await prisma.$transaction(async (tx) => {
      await tx.notaCreditoDebito.delete({ where: { id: notaId } })

      if (data.tipo === "NC_EMITIDA") {
        if (data.subtipo === "ANULACION_TOTAL" && data.facturaId) {
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
        } else if (data.subtipo === "ANULACION_TOTAL" && data.liquidacionId) {
          const vels = await tx.viajeEnLiquidacion.findMany({
            where: { liquidacionId: data.liquidacionId },
            select: { viajeId: true },
          })
          const ids = vels.map((v) => v.viajeId)
          if (ids.length > 0) {
            await tx.viaje.updateMany({
              where: { id: { in: ids } },
              data: { estadoLiquidacion: "LIQUIDADO" },
            })
          }
        } else if (data.subtipo === "ANULACION_PARCIAL" && data.viajesIds?.length && data.facturaId) {
          await tx.viaje.updateMany({
            where: { id: { in: data.viajesIds } },
            data: { estadoFactura: "FACTURADO" },
          })
        } else if (data.subtipo === "ANULACION_PARCIAL" && data.viajesIds?.length && data.liquidacionId) {
          await tx.viaje.updateMany({
            where: { id: { in: data.viajesIds } },
            data: { estadoLiquidacion: "LIQUIDADO" },
          })
        }
      }
    })
  } catch (revertErr) {
    console.error("[emision-directa] Error revirtiendo nota CD:", revertErr)
  }
}
