/**
 * API Routes para gestión de Notas de Crédito y Débito.
 * GET  /api/notas-credito-debito?tipo=&facturaId=&liquidacionId=&empresaId=
 * POST /api/notas-credito-debito — Crea NC/ND con lógica de negocio completa
 *
 * Solo accesible para roles internos (ADMIN_TRANSMAGG, OPERADOR_TRANSMAGG).
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import { crearNotaCDSchema } from "@/lib/financial-schemas"
import { calcularTotalesNotaCD, tipoCbteArcaParaNotaCD } from "@/lib/nota-cd-utils"
import type { Rol } from "@/types"

/**
 * calcularProximoNroComprobanteNotaCD: typeof prisma string -> Promise<number>
 *
 * Dado el cliente de Prisma y el tipo de nota (NC_EMITIDA o ND_EMITIDA),
 * devuelve el próximo número de comprobante disponible calculado como el
 * máximo nroComprobante registrado en notas_credito_debito para ese tipo más 1,
 * o 1 si no existe ninguna nota aún.
 * Esta función existe para asignar numeración correlativa a las NC/ND emitidas
 * por Transmagg antes de enviarlas a ARCA, siguiendo la regla de numeración
 * global por tipo de comprobante y punto de venta.
 *
 * Ejemplos:
 * calcularProximoNroComprobanteNotaCD(prisma, "NC_EMITIDA") === Promise<1>  // Sin notas previas
 * calcularProximoNroComprobanteNotaCD(prisma, "ND_EMITIDA") === Promise<6>  // Con última nro = 5
 */
async function calcularProximoNroComprobanteNotaCD(
  db: typeof prisma,
  tipo: string
): Promise<number> {
  const ultima = await db.notaCreditoDebito.findFirst({
    where: { tipo },
    orderBy: { nroComprobante: "desc" },
    select: { nroComprobante: true },
  })
  return (ultima?.nroComprobante ?? 0) + 1
}

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
 * NC_RECIBIDA/ANULACION_LIQUIDACION: anula la liquidación y libera sus viajes
 * ND_RECIBIDA/CHEQUE_RECHAZADO: marca el cheque como RECHAZADO
 *
 * Solo roles internos pueden crear NC/ND.
 * Existe para centralizar toda la lógica de emisión y recepción de NC/ND
 * garantizando consistencia transaccional en la base de datos.
 *
 * Ejemplos:
 * POST { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "f1", montoNeto: 1000, descripcion: "Anulación" }
 * // => 201 { id, tipo: "NC_EMITIDA", estado: "BORRADOR", montoTotal: 1210 }
 * POST { tipo: "NC_RECIBIDA", subtipo: "ANULACION_LIQUIDACION", liquidacionId: "l1", montoNeto: 500, descripcion: "NC proveedor" }
 * // => 201 { id, tipo: "NC_RECIBIDA", ... }
 * POST { tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "anulada", montoNeto: 1, descripcion: "..." }
 * // => 400 { error: "La factura ya está anulada" }
 */
export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  try {
    const body = await request.json()
    const parsed = crearNotaCDSchema.safeParse(body)
    if (!parsed.success) {
      return NextResponse.json({ error: "Datos inválidos", detalles: parsed.error.flatten() }, { status: 400 })
    }

    const data = parsed.data
    const { montoNeto, montoIva, montoTotal } = calcularTotalesNotaCD(data.montoNeto, data.ivaPct)

    // ─── NC_EMITIDA ──────────────────────────────────────────────────────────────

    if (data.tipo === "NC_EMITIDA") {
      if (!data.facturaId) {
        return NextResponse.json({ error: "Se requiere facturaId para NC_EMITIDA" }, { status: 400 })
      }

      const factura = await prisma.facturaEmitida.findUnique({
        where: { id: data.facturaId },
        include: {
          empresa: { select: { condicionIva: true } },
          viajes: {
            include: {
              viaje: { select: { id: true } },
            },
          },
        },
      })
      if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })
      if (factura.estado === "ANULADA") return NextResponse.json({ error: "La factura ya está anulada" }, { status: 400 })

      const tipoCbte = tipoCbteArcaParaNotaCD("NC_EMITIDA", factura.empresa.condicionIva)
      const nroComprobante = await calcularProximoNroComprobanteNotaCD(prisma, "NC_EMITIDA")

      if (data.subtipo === "ANULACION_TOTAL") {
        const nota = await prisma.$transaction(async (tx) => {
          const nuevaNota = await tx.notaCreditoDebito.create({
            data: {
              tipo: data.tipo,
              subtipo: data.subtipo,
              facturaId: data.facturaId,
              montoNeto,
              montoIva,
              montoTotal,
              descripcion: data.descripcion,
              motivoDetalle: data.motivoDetalle ?? null,
              estado: "BORRADOR",
              nroComprobante,
              tipoCbte,
              arcaEstado: "PENDIENTE",
              operadorId: session.user.id,
            },
          })

          // Snapshot de todos los viajes
          for (const vef of factura.viajes) {
            await tx.viajeEnNotaCD.create({
              data: {
                notaId: nuevaNota.id,
                viajeId: vef.viajeId,
                tarifaOriginal: vef.tarifaEmpresa,
                kilosOriginal: vef.kilos ?? null,
                subtotalOriginal: vef.subtotal,
              },
            })
            // Liberar viaje
            await tx.viaje.update({
              where: { id: vef.viajeId },
              data: { estadoFactura: "PENDIENTE_FACTURAR" },
            })
          }

          // Anular factura
          await tx.facturaEmitida.update({
            where: { id: data.facturaId },
            data: { estado: "ANULADA" },
          })

          return nuevaNota
        })

        return NextResponse.json(nota, { status: 201 })
      }

      if (data.subtipo === "ANULACION_PARCIAL") {
        if (!data.viajesIds || data.viajesIds.length === 0) {
          return NextResponse.json({ error: "Se requieren viajesIds para ANULACION_PARCIAL" }, { status: 400 })
        }

        const viajeIdsEnFactura = factura.viajes.map((v) => v.viajeId)
        const todosPertenecen = data.viajesIds.every((id) => viajeIdsEnFactura.includes(id))
        if (!todosPertenecen) {
          return NextResponse.json({ error: "Uno o más viajes no pertenecen a la factura" }, { status: 400 })
        }

        const nota = await prisma.$transaction(async (tx) => {
          const nuevaNota = await tx.notaCreditoDebito.create({
            data: {
              tipo: data.tipo,
              subtipo: data.subtipo,
              facturaId: data.facturaId,
              montoNeto,
              montoIva,
              montoTotal,
              descripcion: data.descripcion,
              motivoDetalle: data.motivoDetalle ?? null,
              estado: "BORRADOR",
              nroComprobante,
              tipoCbte,
              arcaEstado: "PENDIENTE",
              operadorId: session.user.id,
            },
          })

          // Snapshot y liberación solo de los viajes seleccionados
          for (const viajeId of data.viajesIds!) {
            const vef = factura.viajes.find((v) => v.viajeId === viajeId)!
            await tx.viajeEnNotaCD.create({
              data: {
                notaId: nuevaNota.id,
                viajeId,
                tarifaOriginal: vef.tarifaEmpresa,
                kilosOriginal: vef.kilos ?? null,
                subtotalOriginal: vef.subtotal,
              },
            })
            await tx.viaje.update({
              where: { id: viajeId },
              data: { estadoFactura: "PENDIENTE_FACTURAR" },
            })
          }

          return nuevaNota
        })

        return NextResponse.json(nota, { status: 201 })
      }

      if (data.subtipo === "CORRECCION_IMPORTE") {
        const nota = await prisma.$transaction(async (tx) => {
          return await tx.notaCreditoDebito.create({
            data: {
              tipo: data.tipo,
              subtipo: data.subtipo,
              facturaId: data.facturaId,
              montoNeto,
              montoIva,
              montoTotal,
              descripcion: data.descripcion,
              motivoDetalle: data.motivoDetalle ?? null,
              estado: "BORRADOR",
              nroComprobante,
              tipoCbte,
              arcaEstado: "PENDIENTE",
              operadorId: session.user.id,
            },
          })
        })
        return NextResponse.json(nota, { status: 201 })
      }

      return NextResponse.json({ error: "Subtipo NC_EMITIDA no reconocido" }, { status: 400 })
    }

    // ─── ND_EMITIDA ──────────────────────────────────────────────────────────────

    if (data.tipo === "ND_EMITIDA") {
      if (!data.facturaId) {
        return NextResponse.json({ error: "Se requiere facturaId para ND_EMITIDA" }, { status: 400 })
      }

      const factura = await prisma.facturaEmitida.findUnique({
        where: { id: data.facturaId },
        include: { empresa: { select: { condicionIva: true } } },
      })
      if (!factura) return NextResponse.json({ error: "Factura no encontrada" }, { status: 404 })

      const tipoCbte = tipoCbteArcaParaNotaCD("ND_EMITIDA", factura.empresa.condicionIva)
      const nroComprobante = await calcularProximoNroComprobanteNotaCD(prisma, "ND_EMITIDA")

      const nota = await prisma.$transaction(async (tx) => {
        return await tx.notaCreditoDebito.create({
          data: {
            tipo: data.tipo,
            subtipo: data.subtipo ?? null,
            facturaId: data.facturaId,
            montoNeto,
            montoIva,
            montoTotal,
            descripcion: data.descripcion,
            motivoDetalle: data.motivoDetalle ?? null,
            estado: "BORRADOR",
            nroComprobante,
            tipoCbte,
            arcaEstado: "PENDIENTE",
            operadorId: session.user.id,
          },
        })
      })

      return NextResponse.json(nota, { status: 201 })
    }

    // ─── NC_RECIBIDA ─────────────────────────────────────────────────────────────

    if (data.tipo === "NC_RECIBIDA") {
      if (data.subtipo === "ANULACION_LIQUIDACION") {
        if (!data.nroComprobanteExterno || !data.fechaComprobanteExterno) {
          return NextResponse.json(
            { error: "Se requieren nroComprobanteExterno y fechaComprobanteExterno para NC_RECIBIDA" },
            { status: 400 }
          )
        }
        if (!data.liquidacionId) {
          return NextResponse.json({ error: "Se requiere liquidacionId para NC_RECIBIDA/ANULACION_LIQUIDACION" }, { status: 400 })
        }

        const liquidacion = await prisma.liquidacion.findUnique({
          where: { id: data.liquidacionId },
          include: { viajes: { select: { viajeId: true } } },
        })
        if (!liquidacion) return NextResponse.json({ error: "Liquidación no encontrada" }, { status: 404 })
        if (liquidacion.estado === "ANULADA") return NextResponse.json({ error: "La liquidación ya está anulada" }, { status: 400 })

        const nota = await prisma.$transaction(async (tx) => {
          const nuevaNota = await tx.notaCreditoDebito.create({
            data: {
              tipo: data.tipo,
              subtipo: data.subtipo ?? null,
              liquidacionId: data.liquidacionId,
              nroComprobanteExterno: data.nroComprobanteExterno ?? null,
              fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
              emisorExterno: data.emisorExterno ?? null,
              montoNeto,
              montoIva,
              montoTotal,
              descripcion: data.descripcion,
              motivoDetalle: data.motivoDetalle ?? null,
              estado: "REGISTRADA",
              operadorId: session.user.id,
            },
          })

          // Anular liquidación
          await tx.liquidacion.update({
            where: { id: data.liquidacionId },
            data: { estado: "ANULADA" },
          })

          // Liberar viajes de la liquidación
          const viajeIds = liquidacion.viajes.map((v) => v.viajeId)
          if (viajeIds.length > 0) {
            await tx.viaje.updateMany({
              where: { id: { in: viajeIds } },
              data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
            })
          }

          return nuevaNota
        })

        return NextResponse.json(nota, { status: 201 })
      }

      return NextResponse.json({ error: "Subtipo NC_RECIBIDA no reconocido" }, { status: 400 })
    }

    // ─── ND_RECIBIDA ─────────────────────────────────────────────────────────────

    if (data.tipo === "ND_RECIBIDA") {
      if (data.subtipo === "CHEQUE_RECHAZADO") {
        if (!data.chequeRecibidoId) {
          return NextResponse.json({ error: "Se requiere chequeRecibidoId para ND_RECIBIDA/CHEQUE_RECHAZADO" }, { status: 400 })
        }

        const cheque = await prisma.chequeRecibido.findUnique({
          where: { id: data.chequeRecibidoId },
        })
        if (!cheque) return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })

        const nota = await prisma.$transaction(async (tx) => {
          await tx.chequeRecibido.update({
            where: { id: data.chequeRecibidoId },
            data: { estado: "RECHAZADO" },
          })

          return await tx.notaCreditoDebito.create({
            data: {
              tipo: data.tipo,
              subtipo: data.subtipo ?? null,
              chequeRecibidoId: data.chequeRecibidoId,
              nroComprobanteExterno: data.nroComprobanteExterno ?? null,
              fechaComprobanteExterno: data.fechaComprobanteExterno ? new Date(data.fechaComprobanteExterno) : null,
              emisorExterno: data.emisorExterno ?? null,
              montoNeto,
              montoIva,
              montoTotal,
              descripcion: data.descripcion,
              motivoDetalle: data.motivoDetalle ?? null,
              estado: "REGISTRADA",
              operadorId: session.user.id,
            },
          })
        })

        return NextResponse.json(nota, { status: 201 })
      }

      return NextResponse.json({ error: "Subtipo ND_RECIBIDA no reconocido" }, { status: 400 })
    }

    return NextResponse.json({ error: "Tipo de nota no reconocido" }, { status: 400 })
  } catch (error) {
    console.error("[POST /api/notas-credito-debito]", error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Error desconocido", detail: String(error) },
      { status: 500 }
    )
  }
}
