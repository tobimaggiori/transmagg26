/**
 * emitir-factura.ts — Caso de uso: Emisión de Factura a Empresa
 *
 * Orquesta la creación de una factura emitida con autorización ARCA:
 * 1. Valida fecha de emisión ARCA (si se envía)
 * 2. Delega la creación + autorización a emitirFacturaDirecta
 * 3. Retorna resultado uniforme (UseCaseResult)
 *
 * La route delega aquí después de auth y parseo Zod.
 * Este módulo no accede a Prisma directamente — delega en commands y emision-directa.
 */

import { randomUUID } from "crypto"
import { emitirFacturaDirecta } from "@/lib/emision-directa"
import { validarFechaEmisionArca } from "@/lib/fecha-emision"
import type { DatosCrearFactura } from "@/lib/factura-commands"
import type { UseCaseResult, UseCaseError } from "@/application/nota-cd/emitir-nota-cd"

// ─── Tipos de entrada ───────────────────────────────────────────────────────

export type EmitirFacturaInput = {
  data: DatosCrearFactura & { idempotencyKey?: string }
  operadorId: string
}

// ─── Alias de salida ────────────────────────────────────────────────────────

export type EmitirFacturaOutput = UseCaseResult

// ─── Caso de uso ────────────────────────────────────────────────────────────

/**
 * emitirFactura: EmitirFacturaInput -> Promise<EmitirFacturaOutput>
 *
 * Dado [los datos de facturación validados por Zod y el operadorId],
 * devuelve [el resultado de la emisión con status y body].
 *
 * Flujo:
 * 1. Validar fecha ARCA (si se envía)
 * 2. emitirFacturaDirecta: crear factura + autorizar ARCA + generar PDF
 * 3. Mapear resultado a UseCaseResult
 *
 * Ejemplos:
 * emitirFactura({ data: { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 }, operadorId: "op1" })
 *   // => { ok: true, status: 201, body: { ok: true, documento: {...}, arca: {...} } }
 * emitirFactura({ data: { empresaId: "noexiste", ... }, operadorId: "op1" })
 *   // => { ok: false, status: 404, body: { error: "Empresa no encontrada", code: "ERROR_CREAR_COMPROBANTE" } }
 */
export async function emitirFactura(input: EmitirFacturaInput): Promise<EmitirFacturaOutput> {
  const { data, operadorId } = input

  if (data.fechaEmision) {
    const validacion = validarFechaEmisionArca(data.fechaEmision)
    if (!validacion.ok) {
      return { ok: false, status: 422, body: { error: validacion.error } }
    }
  }

  const idempotencyKey = data.idempotencyKey ?? randomUUID()
  const resultado = await emitirFacturaDirecta(data, operadorId, idempotencyKey)

  if (!resultado.ok) {
    return {
      ok: false,
      status: resultado.status,
      body: {
        error: resultado.error,
        code: resultado.code,
        reintentable: resultado.reintentable,
        documentoId: resultado.documentoId,
      },
    }
  }

  return { ok: true, status: 201, body: resultado }
}
