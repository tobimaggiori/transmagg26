/**
 * emitir-nota-cd.ts — Caso de uso: Emisión de Nota de Crédito / Débito
 *
 * Orquesta los 3 flujos de creación de NC/ND sin lógica de HTTP:
 * 1. Flujo items-based: NC/ND empresa contextual (factura + ítems)
 * 2. Flujo ND recibida por faltante
 * 3. Flujo legacy subtipo-based (NC/ND emitidas con ARCA, o recibidas sin ARCA)
 *
 * La route delega aquí después de auth y parseo de body.
 * Este módulo no accede a Prisma directamente — delega en commands y emision-directa.
 */

import { randomUUID } from "crypto"
import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"
import { emitirNotaCDDirecta, emitirNotaEmpresaDirecta } from "@/lib/emision-directa"
import { validarFechaEmisionArca } from "@/lib/fecha-emision"
import type { DatosNotaCD, DatosNotaEmpresaEmitida } from "@/lib/nota-cd-commands"
import type { UseCaseResult, UseCaseError } from "@/lib/use-case-result"

// Re-exportar para que consumidores existentes no se rompan
export type { UseCaseResult, UseCaseError } from "@/lib/use-case-result"

// ─── Tipos de entrada (union discriminada por flujo) ────────────────────────

/** Datos de ND recibida por faltante de mercadería. */
export type DatosNDRecibidaFaltante = {
  facturaId: string
  montoNeto: number
  ivaPct: number
  descripcion: string
  viajesIds?: string[]
  nroComprobanteExterno?: string
  fechaComprobanteExterno?: string
}

/** Flujo items-based: NC/ND empresa contextual */
export type EmitirNotaEmpresaInput = {
  flujo: "empresa"
  data: DatosNotaEmpresaEmitida & { idempotencyKey?: string; fechaEmision?: string }
  operadorId: string
}

/** Flujo ND recibida por faltante */
export type EmitirNDRecibidaFaltanteInput = {
  flujo: "nd-recibida-faltante"
  data: DatosNDRecibidaFaltante
  operadorId: string
}

/** Flujo legacy subtipo-based */
export type EmitirNotaCDLegacyInput = {
  flujo: "legacy"
  data: DatosNotaCD & { idempotencyKey?: string; emisionArca?: boolean }
  operadorId: string
}

export type EmitirNotaCDInput =
  | EmitirNotaEmpresaInput
  | EmitirNDRecibidaFaltanteInput
  | EmitirNotaCDLegacyInput

// ─── Alias de salida ────────────────────────────────────────────────────────

export type EmitirNotaCDOutput = UseCaseResult

// ─── Caso de uso ────────────────────────────────────────────────────────────

/**
 * emitirNotaCD: EmitirNotaCDInput -> Promise<EmitirNotaCDOutput>
 *
 * Dado [el input discriminado por flujo, con datos validados por Zod y operadorId],
 * devuelve [el resultado de la emisión con status HTTP y body].
 *
 * Despacha al flujo correcto según el discriminante:
 * - "empresa": NC/ND items-based → emitirNotaEmpresaDirecta (con ARCA)
 * - "nd-recibida-faltante": ND por faltante → ejecutarCrearNotaCD (sin ARCA)
 * - "legacy": subtipo-based → emitirNotaCDDirecta (emitidas) o ejecutarCrearNotaCD (recibidas)
 */
export async function emitirNotaCD(input: EmitirNotaCDInput): Promise<EmitirNotaCDOutput> {
  switch (input.flujo) {
    case "empresa":
      return flujoEmpresa(input)
    case "nd-recibida-faltante":
      return flujoNDRecibidaFaltante(input)
    case "legacy":
      return flujoLegacy(input)
  }
}

// ─── Helpers internos ───────────────────────────────────────────────────────

function validarFechaArca(fecha: string | undefined): UseCaseResult | null {
  if (!fecha) return null
  const validacion = validarFechaEmisionArca(fecha)
  if (!validacion.ok) {
    return { ok: false, status: 422, body: { error: validacion.error } }
  }
  return null
}

function errorDeEmision(resultado: {
  status: number
  error: string
  code?: string
  reintentable?: boolean
  documentoId?: string
}): EmitirNotaCDOutput {
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

// ─── Flujo empresa (items-based) ────────────────────────────────────────────

async function flujoEmpresa(input: EmitirNotaEmpresaInput): Promise<EmitirNotaCDOutput> {
  const { data, operadorId } = input

  const errorFecha = validarFechaArca(data.fechaEmision)
  if (errorFecha) return errorFecha

  const idempotencyKey = data.idempotencyKey ?? randomUUID()
  const resultado = await emitirNotaEmpresaDirecta(data, operadorId, idempotencyKey)

  if (!resultado.ok) return errorDeEmision(resultado)

  return { ok: true, status: 201, body: resultado }
}

// ─── Flujo ND recibida por faltante ─────────────────────────────────────────

async function flujoNDRecibidaFaltante(input: EmitirNDRecibidaFaltanteInput): Promise<EmitirNotaCDOutput> {
  const { data, operadorId } = input

  const resultado = await ejecutarCrearNotaCD({
    tipo: "ND_RECIBIDA",
    subtipo: "FALTANTE",
    facturaId: data.facturaId,
    montoNeto: data.montoNeto,
    ivaPct: data.ivaPct,
    descripcion: data.descripcion,
    viajesIds: data.viajesIds,
    nroComprobanteExterno: data.nroComprobanteExterno,
    fechaComprobanteExterno: data.fechaComprobanteExterno,
  }, operadorId)

  if (!resultado.ok) {
    return { ok: false, status: resultado.status, body: { error: resultado.error } }
  }

  return { ok: true, status: 201, body: resultado.nota }
}

// ─── Flujo legacy (subtipo-based) ───────────────────────────────────────────

async function flujoLegacy(input: EmitirNotaCDLegacyInput): Promise<EmitirNotaCDOutput> {
  const { data, operadorId } = input
  const esEmitida = data.tipo === "NC_EMITIDA" || data.tipo === "ND_EMITIDA"

  if (esEmitida) {
    const errorFecha = validarFechaArca(data.fechaEmision)
    if (errorFecha) return errorFecha

    const idempotencyKey = data.idempotencyKey ?? randomUUID()
    const resultado = await emitirNotaCDDirecta(data, operadorId, idempotencyKey)

    if (!resultado.ok) return errorDeEmision(resultado)

    return { ok: true, status: 201, body: resultado }
  }

  // NC/ND recibidas: flujo clásico (sin ARCA)
  const resultado = await ejecutarCrearNotaCD(data, operadorId)

  if (!resultado.ok) {
    return { ok: false, status: resultado.status, body: { error: resultado.error } }
  }

  return { ok: true, status: 201, body: resultado.nota }
}
