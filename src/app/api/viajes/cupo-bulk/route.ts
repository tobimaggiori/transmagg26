/**
 * PATCH /api/viajes/cupo-bulk
 *
 * Modifica en bloque los campos lockeados de TODOS los viajes pendientes
 * de facturar de una empresa que comparten un cupo. Pensado para cuando el
 * operador necesita corregir un dato común (mercadería, tarifa, etc.) que
 * el endpoint individual rechaza por consistencia.
 *
 * Body:
 *   {
 *     empresaId: string,
 *     cupo: string,
 *     justificacion: string,
 *     campos: { mercaderia?, tarifa?, ... }   // solo lockeados, al menos uno
 *   }
 *
 * Aplica a viajes con `estadoFactura = PENDIENTE_FACTURAR` para esa
 * (empresa, cupo). Los viajes ya facturados no se tocan.
 *
 * Roles: solo internos.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { resolverOperadorId } from "@/lib/session-utils"
import { PROVINCIAS_ARGENTINA } from "@/lib/provincias"
import type { Rol } from "@/types"

function normalizarProvincia(valor: string): string {
  const upper = valor.toUpperCase()
  return PROVINCIAS_ARGENTINA.find((p) => p.toUpperCase() === upper) ?? valor
}

const camposBulkSchema = z
  .object({
    mercaderia: z.string().min(1).optional(),
    procedencia: z.string().nullable().optional(),
    provinciaOrigen: z.string().transform(normalizarProvincia).optional(),
    destino: z.string().nullable().optional(),
    provinciaDestino: z.string().transform(normalizarProvincia).optional(),
    tarifa: z.number().positive().optional(),
    comisionPct: z.number().min(0).max(100).nullable().optional(),
    fleteroId: z.string().uuid().nullable().optional(),
    camionId: z.string().uuid().optional(),
    choferId: z.string().uuid().optional(),
    esCamionPropio: z.boolean().optional(),
    tieneCtg: z.boolean().optional(),
  })
  .refine((c) => Object.keys(c).length > 0, { message: "Indicá al menos un campo a modificar" })

const bulkSchema = z.object({
  empresaId: z.string().uuid(),
  cupo: z.string().min(1),
  justificacion: z.string().min(5, "Justificación obligatoria (mínimo 5 caracteres)"),
  campos: camposBulkSchema,
})

export async function PATCH(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida" }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: "Body inválido" }, { status: 400 })
  }

  const parsed = bulkSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
  }

  const { empresaId, cupo, justificacion, campos } = parsed.data

  // Si se cambia tarifa, también igualamos tarifaEmpresa (mismo modelo del POST).
  const tarifaUpdate = campos.tarifa !== undefined ? { tarifa: campos.tarifa, tarifaEmpresa: campos.tarifa } : {}

  const viajes = await prisma.viaje.findMany({
    where: { empresaId, cupo, tieneCupo: true, estadoFactura: "PENDIENTE_FACTURAR" },
    select: { id: true, historialCambios: true, ...Object.fromEntries(Object.keys(campos).map((k) => [k, true])) as Record<string, true> },
  })

  if (viajes.length === 0) {
    return NextResponse.json({ error: "No hay viajes pendientes de facturar con ese cupo" }, { status: 404 })
  }

  const ahora = new Date().toISOString()

  await prisma.$transaction(async (tx) => {
    for (const v of viajes) {
      const historial: Array<Record<string, unknown>> = JSON.parse(
        (v as unknown as { historialCambios: string | null }).historialCambios ?? "[]",
      )
      historial.push({
        fecha: ahora,
        campo: "cupo-bulk",
        valoresAnteriores: Object.fromEntries(
          Object.keys(campos).map((k) => [k, (v as Record<string, unknown>)[k] ?? null]),
        ),
        valoresNuevos: campos,
        cupo,
        justificacion,
        operadorId,
      })

      await tx.viaje.update({
        where: { id: v.id },
        data: {
          ...campos,
          ...tarifaUpdate,
          historialCambios: JSON.stringify(historial),
        },
      })
    }
  })

  return NextResponse.json({ ok: true, viajesAfectados: viajes.length })
}
