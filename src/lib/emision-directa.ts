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
 * Los mensajes de error son precisos según la etapa del fallo, usando las clases
 * tipadas de src/lib/arca/errors.ts.
 */

import { prisma } from "@/lib/prisma"
import { ejecutarCrearFactura, type DatosCrearFactura } from "@/lib/factura-commands"
import { ejecutarCrearLiquidacion, type DatosCrearLiquidacion } from "@/lib/liquidacion-commands"
import { ejecutarCrearNotaCD, type DatosNotaCD, crearNotaEmpresaEmitida, type DatosNotaEmpresaEmitida } from "@/lib/nota-cd-commands"
import {
  autorizarFacturaArca,
  autorizarLiquidacionArca,
  autorizarNotaCDArca,
} from "@/lib/arca/service"
import { esArcaError } from "@/lib/arca/errors"
import type { AutorizarComprobanteResult } from "@/lib/arca/types"

// ─── Tipos ──────────────────────────────────────────────────────────────────

type ResultadoEmisionDirecta =
  | { ok: true; documento: unknown; arca: AutorizarComprobanteResult }
  | { ok: false; status: number; error: string; code: string; reintentable: boolean; documentoId?: string }

// ─── Clasificación de errores ───────────────────────────────────────────────

export function clasificarError(err: unknown): { status: number; error: string; code: string; reintentable: boolean } {
  if (esArcaError(err)) {
    return {
      status: err.statusCode,
      error: err.message,
      code: err.code,
      reintentable: err.retryable,
    }
  }
  if (err instanceof Error) {
    return {
      status: 500,
      error: `Error interno: ${err.message}`,
      code: "ERROR_INTERNO",
      reintentable: false,
    }
  }
  return {
    status: 500,
    error: "Error desconocido",
    code: "ERROR_DESCONOCIDO",
    reintentable: false,
  }
}

// ─── Helpers internos post-CAE ──────────────────────────────────────────────

function _respuestaPostCaeReadError(cae: string, documentoId: string): ResultadoEmisionDirecta {
  return {
    ok: false,
    status: 500,
    error: `El comprobante fue autorizado por ARCA (CAE: ${cae}) pero falló al releer los datos. Contacte soporte.`,
    code: "POST_CAE_READ_ERROR",
    reintentable: false,
    documentoId,
  }
}

function _respuestaPostCaePdfError(cae: string, documentoId: string): ResultadoEmisionDirecta {
  return {
    ok: false,
    status: 500,
    error: `El comprobante fue autorizado por ARCA (CAE: ${cae}) pero falló al generar el PDF. El comprobante quedó emitido. Contacte soporte.`,
    code: "POST_CAE_PDF_ERROR",
    reintentable: false,
    documentoId,
  }
}

/**
 * Maneja errores post-autorización ARCA con semántica uniforme:
 * 1. Si el CAE ya fue persistido → POST_CAE_PDF_ERROR (no revertir)
 * 2. Si el error es transitorio → conservar comprobante para reintento
 * 3. Si el error es permanente → revertir todo
 */
async function _manejarErrorPostArca(
  err: unknown,
  documentoId: string,
  verificarCae: () => Promise<string | null>,
  revertir: () => Promise<void>
): Promise<ResultadoEmisionDirecta> {
  const caePersistido = await verificarCae()

  if (caePersistido) {
    console.error("[emision-directa] Error post-CAE (no se revierte):", err)
    return _respuestaPostCaePdfError(caePersistido, documentoId)
  }

  const clasificado = clasificarError(err)

  if (clasificado.reintentable) {
    console.error("[emision-directa] Error transitorio ARCA, comprobante conservado:", err)
    return { ok: false, ...clasificado, documentoId }
  }

  await revertir()
  return { ok: false, ...clasificado }
}

/**
 * Re-lee un documento post-CAE para devolver el estado final (con CAE, QR, etc.).
 * Si la relectura falla, devuelve POST_CAE_READ_ERROR (el CAE ya fue persistido).
 */
async function _releerPostCae(
  readFn: () => Promise<unknown>,
  cae: string,
  documentoId: string
): Promise<ResultadoEmisionDirecta | { ok: true; documento: unknown }> {
  try {
    const documento = await readFn()
    return { ok: true, documento }
  } catch (readErr) {
    console.error("[emision-directa] Error re-leyendo post-CAE (CAE ya persistido):", readErr)
    return _respuestaPostCaeReadError(cae, documentoId)
  }
}

// ─── Factura ────────────────────────────────────────────────────────────────

export async function emitirFacturaDirecta(
  data: DatosCrearFactura,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const resultado = await ejecutarCrearFactura(data, operadorId)
  if (!resultado.ok) return { ...resultado, code: "ERROR_CREAR_COMPROBANTE", reintentable: false }

  const factura = resultado.factura as { id: string }

  try {
    const arca = await autorizarFacturaArca(factura.id, idempotencyKey)

    const relectura = await _releerPostCae(
      () => prisma.facturaEmitida.findUnique({ where: { id: factura.id } }),
      arca.cae, factura.id
    )
    if (!relectura.ok) return relectura
    return { ok: true, documento: relectura.documento, arca }
  } catch (err) {
    return _manejarErrorPostArca(
      err, factura.id,
      () => prisma.facturaEmitida.findUnique({
        where: { id: factura.id },
        select: { cae: true, estadoArca: true },
      }).then(f => f?.cae && f.estadoArca === "AUTORIZADA" ? f.cae : null).catch(() => null),
      () => _revertirFactura(factura.id, data.viajeIds)
    )
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
  if (!resultado.ok) return { ...resultado, code: "ERROR_CREAR_COMPROBANTE", reintentable: false }

  const liquidacion = resultado.liquidacion as { id: string }

  try {
    const arca = await autorizarLiquidacionArca(liquidacion.id, idempotencyKey)

    const relectura = await _releerPostCae(
      () => prisma.liquidacion.findUnique({ where: { id: liquidacion.id } }),
      arca.cae, liquidacion.id
    )
    if (!relectura.ok) return relectura
    return { ok: true, documento: relectura.documento, arca }
  } catch (err) {
    return _manejarErrorPostArca(
      err, liquidacion.id,
      () => prisma.liquidacion.findUnique({
        where: { id: liquidacion.id },
        select: { cae: true, arcaEstado: true },
      }).then(l => l?.cae && l.arcaEstado === "AUTORIZADA" ? l.cae : null).catch(() => null),
      () => _revertirLiquidacion(liquidacion.id, data.viajes.map((v) => v.viajeId))
    )
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
    if (!resultado.ok) return { ...resultado, code: "ERROR_CREAR_COMPROBANTE", reintentable: false }
    return {
      ok: true,
      documento: resultado.nota,
      arca: { ok: true, cae: "", caeVto: new Date(), nroComprobante: 0, ptoVenta: 0, tipoCbte: 0, qrData: "", observaciones: null },
    }
  }

  const resultado = await ejecutarCrearNotaCD(data, operadorId)
  if (!resultado.ok) return { ...resultado, code: "ERROR_CREAR_COMPROBANTE", reintentable: false }

  const nota = resultado.nota as { id: string }

  try {
    const arca = await autorizarNotaCDArca(nota.id, idempotencyKey)

    const relectura = await _releerPostCae(
      () => prisma.notaCreditoDebito.findUnique({ where: { id: nota.id } }),
      arca.cae, nota.id
    )
    if (!relectura.ok) return relectura
    return { ok: true, documento: relectura.documento, arca }
  } catch (err) {
    return _manejarErrorPostArca(
      err, nota.id,
      () => prisma.notaCreditoDebito.findUnique({
        where: { id: nota.id },
        select: { cae: true, arcaEstado: true },
      }).then(n => n?.cae && n.arcaEstado === "AUTORIZADA" ? n.cae : null).catch(() => null),
      () => _revertirNotaCD(nota.id, data)
    )
  }
}

// ─── Nota Empresa Items-Based ───────────────────────────────────────────────

/**
 * emitirNotaEmpresaDirecta: DatosNotaEmpresaEmitida string string -> Promise<ResultadoEmisionDirecta>
 *
 * Crea NC/ND empresa con ítems y la autoriza en ARCA.
 * Si ARCA falla no-reintentable: borra nota (cascade borra ítems).
 * Si ARCA falla reintentable: conserva nota para reintento.
 * Si CAE ya otorgado: no revierte aunque falle PDF.
 */
export async function emitirNotaEmpresaDirecta(
  data: DatosNotaEmpresaEmitida,
  operadorId: string,
  idempotencyKey: string
): Promise<ResultadoEmisionDirecta> {
  const resultado = await crearNotaEmpresaEmitida(data, operadorId)
  if (!resultado.ok) return { ...resultado, code: "ERROR_CREAR_COMPROBANTE", reintentable: false }

  const nota = resultado.nota as { id: string }

  try {
    const arca = await autorizarNotaCDArca(nota.id, idempotencyKey)

    const relectura = await _releerPostCae(
      () => prisma.notaCreditoDebito.findUnique({ where: { id: nota.id } }),
      arca.cae, nota.id
    )
    if (!relectura.ok) return relectura
    return { ok: true, documento: relectura.documento, arca }
  } catch (err) {
    return _manejarErrorPostArca(
      err, nota.id,
      () => prisma.notaCreditoDebito.findUnique({
        where: { id: nota.id },
        select: { cae: true, arcaEstado: true },
      }).then(n => n?.cae && n.arcaEstado === "AUTORIZADA" ? n.cae : null).catch(() => null),
      async () => {
        // Revertir: borrar nota (cascade borra ítems). No hay viajes que revertir.
        await prisma.notaCreditoDebito.delete({ where: { id: nota.id } }).catch((e) =>
          console.error("[emision-directa] Error revirtiendo nota empresa:", e)
        )
      }
    )
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
