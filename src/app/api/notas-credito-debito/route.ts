/**
 * API Routes para gestión de Notas de Crédito y Débito.
 * GET  /api/notas-credito-debito?tipo=&facturaId=&liquidacionId=&empresaId=
 * POST /api/notas-credito-debito — Crea NC/ND con lógica de negocio completa
 *
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 */

import { NextRequest, NextResponse } from "next/server"
import { randomUUID } from "crypto"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { crearNotaCDSchema } from "@/lib/financial-schemas"
import { resolverOperadorId } from "@/lib/session-utils"
import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"
import { emitirNotaCDDirecta } from "@/lib/emision-directa"
import { validarFechaEmisionArca } from "@/lib/fecha-emision"
import type { Rol } from "@/types"

/**
 * GET: NextRequest -> Promise<NextResponse>
 *
 * Dado query params opcionales tipo, facturaId, liquidacionId y empresaId,
 * devuelve las notas de crédito/débito que coinciden con los filtros,
 * incluyendo factura (id, nroComprobante, empresa.razonSocial),
 * liquidación (id, nroComprobante, fletero.razonSocial), operador,
 * y viajesAfectados, ordenadas por fecha de creación descendente.
 * Esta ruta existe para el listado y filtrado de NC/ND en el panel de gestión.
 *
 * Ejemplos:
 * GET /api/notas-credito-debito (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, tipo, subtipo, montoTotal, estado, factura, operador, ... }]
 * GET /api/notas-credito-debito?tipo=NC_EMITIDA (sesión ADMIN_TRANSMAGG)
 * // => 200 [{ id, tipo: "NC_EMITIDA", ... }]
 * GET /api/notas-credito-debito (sesión FLETERO)
 * // => 403 { error: "Acceso denegado" }
 */
export async function GET(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { searchParams } = new URL(request.url)
  const tipo = searchParams.get("tipo")
  const facturaId = searchParams.get("facturaId")
  const liquidacionId = searchParams.get("liquidacionId")

  try {
    const where: Record<string, unknown> = {}
    if (tipo) where.tipo = tipo
    if (facturaId) where.facturaId = facturaId
    if (liquidacionId) where.liquidacionId = liquidacionId

    const notas = await prisma.notaCreditoDebito.findMany({
      where,
      include: {
        factura: {
          select: {
            id: true,
            nroComprobante: true,
            empresa: { select: { razonSocial: true } },
          },
        },
        liquidacion: {
          select: {
            id: true,
            nroComprobante: true,
            fletero: { select: { razonSocial: true } },
          },
        },
        operador: { select: { nombre: true, apellido: true } },
        viajesAfectados: true,
      },
      orderBy: { creadoEn: "desc" },
    })

    return NextResponse.json(notas)
  } catch (error) {
    console.error("[GET /api/notas-credito-debito]", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el body validado por crearNotaCDSchema, ejecuta la lógica de negocio
 * correspondiente al tipo y subtipo de la nota dentro de una transacción:
 *
 * NC_EMITIDA/ANULACION_TOTAL: anula la factura y libera todos sus viajes
 * NC_EMITIDA/ANULACION_PARCIAL: libera solo los viajes seleccionados vía viajesIds
 * NC_EMITIDA/CORRECCION_IMPORTE: crea la nota sin cambios de estado en viajes
 * ND_EMITIDA: crea la nota asociada a la factura sin cambios de estado
 * NC_RECIBIDA: registra la nota recibida (NC/ND sobre LP bloqueadas en esta etapa)
 * ND_RECIBIDA/CHEQUE_RECHAZADO: marca el cheque como RECHAZADO
 *
 * Solo roles internos pueden crear NC/ND.
 *
 * Ejemplos:
 * POST { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "f1", montoNeto: 1000, descripcion: "Anulación" }
 * // => 201 { id, tipo: "NC_EMITIDA", estado: "EMITIDA", montoTotal: 1210 }
 * POST { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "inexistente", montoNeto: 1, descripcion: "..." }
 * // => 400 { error: "Factura no encontrada" }
 */
export async function POST(request: NextRequest) {
  // Auth
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  // Validación
  try {
    const body = await request.json()
    const parsed = crearNotaCDSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const esEmitida = parsed.data.tipo === "NC_EMITIDA" || parsed.data.tipo === "ND_EMITIDA"

    if (parsed.data.fechaEmision && esEmitida) {
      const validacion = validarFechaEmisionArca(parsed.data.fechaEmision)
      if (!validacion.ok) {
        return NextResponse.json({ error: validacion.error }, { status: 422 })
      }
    }

    if (esEmitida) {
      // NC/ND emitidas: emisión directa ARCA obligatoria.
      // Si ARCA devuelve CAE → EMITIDA. Si ARCA falla → no queda nota.
      const idempotencyKey = parsed.data.idempotencyKey ?? randomUUID()
      const resultado = await emitirNotaCDDirecta(parsed.data, operadorId, idempotencyKey)
      if (!resultado.ok) {
        return NextResponse.json({
          error: resultado.error,
          code: resultado.code,
          reintentable: resultado.reintentable,
          documentoId: resultado.documentoId,
        }, { status: resultado.status })
      }
      return NextResponse.json(resultado, { status: 201 })
    }

    // NC/ND recibidas: flujo clásico (sin ARCA, son documentos externos)
    const resultado = await ejecutarCrearNotaCD(parsed.data, operadorId)

    if (!resultado.ok) {
      return NextResponse.json({ error: resultado.error }, { status: resultado.status })
    }

    return NextResponse.json(resultado.nota, { status: 201 })
  } catch (error) {
    console.error("[POST /api/notas-credito-debito]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
