/**
 * API Route: GET /api/pagos-fletero/[id]/impacto-modificacion
 *
 * Preview de impacto al anular o modificar un PagoAFletero.
 * Solo lectura — nunca modifica datos.
 *
 * Query params opcionales (si no se provee ninguno → simula anulación completa):
 *   ?nuevoMonto=150000
 *   ?nuevaLiquidacionId=xxx
 */

import { NextRequest, NextResponse } from "next/server"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"

type ImpactoItem = {
  tipo: "LP" | "CC_FLETERO" | "CHEQUE_EMITIDO" | "CHEQUE_RECIBIDO"
  descripcion: string
  detalle: string
  estadoActual: string
  nuevoEstado: string
}

/**
 * GET: preview del impacto de anular o modificar un PagoAFletero.
 *
 * Ejemplos:
 * GET /api/pagos-fletero/abc/impacto-modificacion
 * // => { pago: {...}, impactos: [{ tipo: "LP", descripcion: "LP 0001-00000001", ... }] }
 * GET /api/pagos-fletero/abc/impacto-modificacion?nuevoMonto=50000
 * // => { pago: {...}, impactos: [{ tipo: "LP", nuevoEstado: "PARCIALMENTE_PAGADA" }] }
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const acceso = await requireFinancialAccess()
  if (!acceso.ok) return acceso.response

  const { id } = await params
  const { searchParams } = new URL(request.url)
  const nuevoMontoRaw = searchParams.get("nuevoMonto")
  const nuevaLiquidacionId = searchParams.get("nuevaLiquidacionId")
  const nuevoMonto = nuevoMontoRaw ? parseFloat(nuevoMontoRaw) : null

  try {
    const pago = await prisma.pagoAFletero.findUnique({
      where: { id },
      select: {
        id: true,
        monto: true,
        tipoPago: true,
        fechaPago: true,
        anulado: true,
        fleteroId: true,
        liquidacionId: true,
        cuentaId: true,
        chequeEmitidoId: true,
        chequeRecibidoId: true,
        liquidacion: {
          select: {
            id: true,
            estado: true,
            total: true,
            nroComprobante: true,
            ptoVenta: true,
            fletero: { select: { razonSocial: true } },
            pagos: { where: { anulado: false }, select: { id: true, monto: true } },
          },
        },
        chequeEmitido: {
          select: { id: true, nroCheque: true, estado: true, monto: true, fechaPago: true },
        },
        chequeRecibido: {
          select: { id: true, nroCheque: true, estado: true },
        },
      },
    })

    if (!pago) return notFoundResponse("Pago")
    if (pago.anulado) {
      return NextResponse.json({ error: "El pago ya está anulado" }, { status: 409 })
    }

    const impactos: ImpactoItem[] = []

    // ── Impacto en LP ──────────────────────────────────────────────────────
    if (pago.liquidacion) {
      const liq = pago.liquidacion
      const nroRef = liq.nroComprobante
        ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
        : "Borrador"

      const totalPagadoActual = liq.pagos.reduce((s, p) => s + p.monto, 0)
      const montoEfectivo = nuevoMonto ?? 0 // 0 = anulación completa
      const diferencia = montoEfectivo - pago.monto // negativo si baja o anula
      const totalTrasModif = totalPagadoActual + diferencia

      let nuevoEstadoLiq: string
      if (nuevoMonto !== null && nuevaLiquidacionId) {
        // Reasignación: esta LP pierde el pago completo
        const totalSinPago = totalPagadoActual - pago.monto
        nuevoEstadoLiq = totalSinPago <= 0.01 ? "EMITIDA" : "PARCIALMENTE_PAGADA"
      } else if (nuevoMonto !== null) {
        // Cambio de monto
        nuevoEstadoLiq =
          totalTrasModif >= liq.total - 0.01
            ? "PAGADA"
            : totalTrasModif <= 0.01
            ? "EMITIDA"
            : "PARCIALMENTE_PAGADA"
      } else {
        // Anulación: descontar pago completo
        const totalSinPago = totalPagadoActual - pago.monto
        nuevoEstadoLiq = totalSinPago <= 0.01 ? "EMITIDA" : "PARCIALMENTE_PAGADA"
      }

      impactos.push({
        tipo: "LP",
        descripcion: `LP ${nroRef} — ${liq.fletero.razonSocial}`,
        detalle: `Total: $${liq.total.toLocaleString("es-AR")} · Pagado actual: $${totalPagadoActual.toLocaleString("es-AR")}`,
        estadoActual: liq.estado,
        nuevoEstado: nuevoEstadoLiq,
      })
    }

    // ── Impacto en reasignación LP destino ────────────────────────────────
    if (nuevaLiquidacionId && nuevaLiquidacionId !== pago.liquidacionId) {
      const liqNueva = await prisma.liquidacion.findUnique({
        where: { id: nuevaLiquidacionId },
        select: {
          id: true,
          estado: true,
          total: true,
          nroComprobante: true,
          ptoVenta: true,
          fletero: { select: { razonSocial: true } },
          pagos: { where: { anulado: false }, select: { monto: true } },
        },
      })
      if (liqNueva) {
        const totalPagadoNueva = liqNueva.pagos.reduce((s, p) => s + p.monto, 0)
        const montoReasignado = nuevoMonto ?? pago.monto
        const totalConNuevoPago = totalPagadoNueva + montoReasignado
        const nroRef = liqNueva.nroComprobante
          ? `${String(liqNueva.ptoVenta ?? 1).padStart(4, "0")}-${String(liqNueva.nroComprobante).padStart(8, "0")}`
          : "Borrador"

        const nuevoEstadoLiqNueva =
          totalConNuevoPago >= liqNueva.total - 0.01
            ? "PAGADA"
            : "PARCIALMENTE_PAGADA"

        impactos.push({
          tipo: "LP",
          descripcion: `LP ${nroRef} (destino nuevo) — ${liqNueva.fletero.razonSocial}`,
          detalle: `Total: $${liqNueva.total.toLocaleString("es-AR")} · Pagado actual: $${totalPagadoNueva.toLocaleString("es-AR")}`,
          estadoActual: liqNueva.estado,
          nuevoEstado: nuevoEstadoLiqNueva,
        })
      }
    }

    // ── Impacto CC Fletero ────────────────────────────────────────────────
    impactos.push({
      tipo: "CC_FLETERO",
      descripcion: `CC Fletero`,
      detalle: nuevoMonto !== null
        ? `Diferencia: ${nuevoMonto >= pago.monto ? "+" : ""}$${(nuevoMonto - pago.monto).toLocaleString("es-AR")}`
        : `Se revierte el pago de $${pago.monto.toLocaleString("es-AR")}`,
      estadoActual: "Pago acreditado",
      nuevoEstado: nuevoMonto !== null
        ? "Pago ajustado"
        : "Pago revertido (saldo reabierto)",
    })

    // ── Impacto en ChequeEmitido ──────────────────────────────────────────
    if (pago.chequeEmitido && !nuevoMonto) {
      // Solo aplica en anulación completa
      impactos.push({
        tipo: "CHEQUE_EMITIDO",
        descripcion: `ECheq${pago.chequeEmitido.nroCheque ? ` #${pago.chequeEmitido.nroCheque}` : ""} — $${pago.chequeEmitido.monto.toLocaleString("es-AR")}`,
        detalle: `Fecha pago: ${new Date(pago.chequeEmitido.fechaPago).toLocaleDateString("es-AR")}`,
        estadoActual: pago.chequeEmitido.estado,
        nuevoEstado: "ANULADO",
      })
    }

    // ── Impacto en ChequeRecibido ─────────────────────────────────────────
    if (pago.chequeRecibido && !nuevoMonto) {
      impactos.push({
        tipo: "CHEQUE_RECIBIDO",
        descripcion: `Cheque recibido #${pago.chequeRecibido.nroCheque}`,
        detalle: "Endosado al fletero como parte de este pago",
        estadoActual: pago.chequeRecibido.estado,
        nuevoEstado: "EN_CARTERA",
      })
    }

    return NextResponse.json({
      pago: {
        id: pago.id,
        monto: pago.monto,
        tipo: pago.tipoPago,
        fecha: pago.fechaPago,
        nroCheque: pago.chequeEmitido?.nroCheque ?? pago.chequeRecibido?.nroCheque,
      },
      impactos,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/pagos-fletero/[id]/impacto-modificacion", error)
  }
}
