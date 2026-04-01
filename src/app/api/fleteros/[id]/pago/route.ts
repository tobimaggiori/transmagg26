/**
 * POST /api/fleteros/[id]/pago
 *
 * Registra un pago a un fletero contra múltiples liquidaciones en una transacción atómica.
 * El monto total se distribuye proporcionalmente al saldo pendiente de cada liquidación.
 * Solo accesible para ADMIN_TRANSMAGG y OPERADOR_TRANSMAGG.
 */

import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { prisma } from "@/lib/prisma"
import {
  requireFinancialAccess,
  badRequestResponse,
  notFoundResponse,
  invalidDataResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { resolverOperadorId } from "@/lib/session-utils"

// ─── Schemas Zod ─────────────────────────────────────────────────────────────

const itemSchema = z.discriminatedUnion("tipo", [
  z.object({
    tipo: z.literal("TRANSFERENCIA"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    cuentaId: z.string().uuid("Cuenta inválida"),
  }),
  z.object({
    tipo: z.literal("CHEQUE_PROPIO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    cuentaId: z.string().uuid("Cuenta/chequera inválida"),
    nroChequePropioEmitir: z.string().optional(),
    fechaPagoChequePropioEmitir: z.string().min(1, "Fecha de pago del cheque obligatoria"),
  }),
  z.object({
    tipo: z.literal("CHEQUE_TERCERO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
    chequeRecibidoId: z.string().uuid("Cheque recibido inválido"),
  }),
  z.object({
    tipo: z.literal("EFECTIVO"),
    monto: z.number().positive("El monto debe ser mayor a 0"),
  }),
])

const bodySchema = z.object({
  fechaPago: z.string().min(1, "Fecha de pago obligatoria"),
  observaciones: z.string().optional(),
  liquidacionIds: z.array(z.string().uuid()).min(1, "Seleccioná al menos una liquidación"),
  items: z.array(itemSchema).min(1, "Agregá al menos un ítem de pago"),
})

// ─── Handler ─────────────────────────────────────────────────────────────────

/**
 * POST: NextRequest -> Promise<NextResponse>
 *
 * Dado el id del fletero en la ruta y el body con liquidacionIds + items, registra
 * el pago distribuyendo proporcionalmente el monto entre las liquidaciones seleccionadas.
 *
 * Ejemplos:
 * POST /api/fleteros/abc/pago { liquidacionIds: ["l1","l2"], items: [{tipo:"TRANSFERENCIA",...}] }
 * === { ok: true, pagosCreados: 2 }
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  const access = await requireFinancialAccess()
  if (!access.ok) return access.response

  const { id: fleteroId } = await params

  let operadorId: string
  try {
    operadorId = await resolverOperadorId(access.session.user)
  } catch {
    return NextResponse.json({ error: "Sesión inválida. Cerrá sesión y volvé a ingresar." }, { status: 401 })
  }

  let body: unknown
  try {
    body = await request.json()
  } catch {
    return badRequestResponse("Cuerpo JSON inválido")
  }

  const parsed = bodySchema.safeParse(body)
  if (!parsed.success) return invalidDataResponse(parsed.error.flatten())

  const { fechaPago, observaciones, liquidacionIds, items } = parsed.data

  try {
    const fletero = await prisma.fletero.findUnique({
      where: { id: fleteroId },
      select: { id: true, razonSocial: true, cuit: true },
    })
    if (!fletero) return notFoundResponse("Fletero")

    // Cargar liquidaciones con sus pagos acumulados
    const liquidaciones = await prisma.liquidacion.findMany({
      where: {
        id: { in: liquidacionIds },
        fleteroId,
        estado: { in: ["EMITIDA", "PARCIALMENTE_PAGADA"] },
      },
      select: {
        id: true,
        total: true,
        estado: true,
        nroComprobante: true,
        ptoVenta: true,
        pagos: { where: { anulado: false }, select: { monto: true } },
      },
    })

    if (liquidaciones.length !== liquidacionIds.length) {
      return badRequestResponse("Una o más liquidaciones no encontradas o no están en estado pagable")
    }

    // Calcular saldo pendiente por liquidación
    type LiqConSaldo = {
      id: string
      total: number
      estado: string
      nroComprobante: number | null
      ptoVenta: number | null
      totalPagado: number
      saldoPendiente: number
    }

    const liqs: LiqConSaldo[] = liquidaciones.map((liq) => {
      const totalPagado = liq.pagos.reduce((sum, p) => sum + p.monto, 0)
      return {
        id: liq.id,
        total: liq.total,
        estado: liq.estado,
        nroComprobante: liq.nroComprobante,
        ptoVenta: liq.ptoVenta,
        totalPagado,
        saldoPendiente: Math.max(0, liq.total - totalPagado),
      }
    })

    const totalSaldo = liqs.reduce((sum, l) => sum + l.saldoPendiente, 0)
    if (totalSaldo <= 0) return badRequestResponse("Las liquidaciones seleccionadas no tienen saldo pendiente")

    const totalPago = items.reduce((sum, i) => sum + i.monto, 0)
    if (totalPago <= 0) return badRequestResponse("El total del pago debe ser mayor a 0")

    const fechaPagoDate = new Date(fechaPago)

    // Validar cheques de tercero: deben estar EN_CARTERA
    const chequesTerceroIds = items
      .filter((i) => i.tipo === "CHEQUE_TERCERO")
      .map((i) => (i as { tipo: "CHEQUE_TERCERO"; monto: number; chequeRecibidoId: string }).chequeRecibidoId)

    if (chequesTerceroIds.length > 0) {
      const chequesDB = await prisma.chequeRecibido.findMany({
        where: { id: { in: chequesTerceroIds } },
        select: { id: true, estado: true, monto: true },
      })
      for (const ch of chequesDB) {
        if (ch.estado !== "EN_CARTERA") {
          return badRequestResponse(`El cheque recibido ${ch.id} no está en cartera`)
        }
      }
    }

    // Validar cuentas con chequera para CHEQUE_PROPIO
    const cuentasChequera = items
      .filter((i) => i.tipo === "CHEQUE_PROPIO")
      .map((i) => (i as { tipo: "CHEQUE_PROPIO"; monto: number; cuentaId: string; nroChequePropioEmitir?: string; fechaPagoChequePropioEmitir: string }).cuentaId)

    if (cuentasChequera.length > 0) {
      const cuentasDB = await prisma.cuenta.findMany({
        where: { id: { in: cuentasChequera } },
        select: { id: true, tieneChequera: true, tieneImpuestoDebcred: true, alicuotaImpuesto: true },
      })
      for (const c of cuentasDB) {
        if (!c.tieneChequera) {
          return badRequestResponse(`La cuenta ${c.id} no tiene chequera`)
        }
      }
    }

    let pagosCreados = 0

    await prisma.$transaction(async (tx) => {
      // ── Efectos secundarios por ítem (una sola vez) ──────────────────────────

      // Mapa itemIdx → chequeEmitidoId (para CHEQUE_PROPIO)
      const chequeEmitidoIdPorItem: Map<number, string> = new Map()

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx]

        if (item.tipo === "TRANSFERENCIA") {
          await tx.cuenta.findUnique({
            where: { id: item.cuentaId },
            select: { tieneImpuestoDebcred: true, alicuotaImpuesto: true },
          })
          await tx.movimientoSinFactura.create({
            data: {
              cuentaId: item.cuentaId,
              tipo: "EGRESO",
              categoria: "TRANSFERENCIA_ENVIADA",
              monto: item.monto,
              fecha: fechaPagoDate,
              descripcion: `Pago LP a ${fletero.razonSocial}${observaciones ? ` — ${observaciones}` : ""}`,
              operadorId,
            },
          })
        } else if (item.tipo === "CHEQUE_PROPIO") {
          // Emitir el ECheq vinculado a la primera liquidación del lote
          const primeraLiqId = liqs[0].id
          const nuevoCheque = await tx.chequeEmitido.create({
            data: {
              fleteroId,
              cuentaId: item.cuentaId,
              nroCheque: item.nroChequePropioEmitir ?? null,
              tipoDocBeneficiario: "CUIT",
              nroDocBeneficiario: fletero.cuit,
              monto: item.monto,
              fechaEmision: fechaPagoDate,
              fechaPago: new Date(item.fechaPagoChequePropioEmitir),
              motivoPago: "ORDEN_DE_PAGO",
              clausula: "NO_A_LA_ORDEN",
              estado: "EMITIDO",
              esElectronico: true,
              liquidacionId: primeraLiqId,
              operadorId,
            },
          })
          chequeEmitidoIdPorItem.set(idx, nuevoCheque.id)
        } else if (item.tipo === "CHEQUE_TERCERO") {
          // Endosar el cheque al fletero
          await tx.chequeRecibido.update({
            where: { id: item.chequeRecibidoId },
            data: {
              estado: "ENDOSADO_FLETERO",
              endosadoATipo: "FLETERO",
              endosadoAFleteroId: fleteroId,
            },
          })
        }
        // EFECTIVO: sin efecto secundario adicional
      }

      // ── Crear PagoAFletero por cada ítem × cada liquidación (prorrateado) ──

      for (const liq of liqs) {
        // Proporción de esta liquidación sobre el total del saldo
        const proporcion = totalSaldo > 0 ? liq.saldoPendiente / totalSaldo : 1 / liqs.length

        for (let idx = 0; idx < items.length; idx++) {
          const item = items[idx]
          const montoParaEstaLiq = item.monto * proporcion

          const pagoData: Parameters<typeof tx.pagoAFletero.create>[0]["data"] = {
            fleteroId,
            liquidacionId: liq.id,
            tipoPago: item.tipo,
            monto: montoParaEstaLiq,
            fechaPago: fechaPagoDate,
            operadorId,
          }

          if (item.tipo === "TRANSFERENCIA") {
            pagoData.cuentaId = item.cuentaId
          } else if (item.tipo === "CHEQUE_PROPIO") {
            const chequeEmitidoId = chequeEmitidoIdPorItem.get(idx)
            if (chequeEmitidoId) pagoData.chequeEmitidoId = chequeEmitidoId
          } else if (item.tipo === "CHEQUE_TERCERO") {
            pagoData.chequeRecibidoId = item.chequeRecibidoId
          }

          await tx.pagoAFletero.create({ data: pagoData })
          pagosCreados++
        }

        // Determinar nuevo estado de la liquidación
        const montoTotalParaEstaLiq = totalPago * (liq.saldoPendiente / totalSaldo)
        const nuevoPagado = liq.totalPagado + montoTotalParaEstaLiq
        const nuevoEstado = nuevoPagado >= liq.total ? "PAGADA" : "PARCIALMENTE_PAGADA"

        await tx.liquidacion.update({
          where: { id: liq.id },
          data: { estado: nuevoEstado },
        })
      }
    })

    return NextResponse.json({ ok: true, pagosCreados })
  } catch (error) {
    return serverErrorResponse("POST /api/fleteros/[id]/pago", error)
  }
}
