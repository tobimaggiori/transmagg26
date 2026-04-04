/**
 * API Route: GET /api/pagos-proveedor/[id]/impacto-modificacion
 *
 * Preview de impacto al anular o modificar un PagoProveedor.
 * Solo lectura — nunca modifica datos.
 *
 * Query params opcionales (si no se provee ninguno → simula anulación completa):
 *   ?nuevoMonto=150000
 *   ?nuevaFacturaId=xxx
 */

import { NextRequest, NextResponse } from "next/server"
import {
  requireFinancialAccess,
  notFoundResponse,
  serverErrorResponse,
} from "@/lib/financial-api"
import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, parsearImporte, importesIguales } from "@/lib/money"

type ImpactoItem = {
  tipo: "FACTURA_PROVEEDOR" | "CC_PROVEEDOR" | "CHEQUE_EMITIDO" | "CHEQUE_RECIBIDO"
  descripcion: string
  detalle: string
  estadoActual: string
  nuevoEstado: string
}

/**
 * GET: preview del impacto de anular o modificar un PagoProveedor.
 *
 * Ejemplos:
 * GET /api/pagos-proveedor/abc/impacto-modificacion
 * // => { pago: {...}, impactos: [{ tipo: "FACTURA_PROVEEDOR", ... }] }
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
  const nuevaFacturaId = searchParams.get("nuevaFacturaId")
  const nuevoMonto = nuevoMontoRaw ? parsearImporte(nuevoMontoRaw) : null

  try {
    const pago = await prisma.pagoProveedor.findUnique({
      where: { id },
      select: {
        id: true,
        monto: true,
        tipo: true,
        fecha: true,
        anulado: true,
        facturaProveedorId: true,
        cuentaId: true,
        chequeEmitidoId: true,
        chequeRecibidoId: true,
        facturaProveedor: {
          select: {
            id: true,
            nroComprobante: true,
            tipoCbte: true,
            total: true,
            estadoPago: true,
            proveedorId: true,
            proveedor: { select: { razonSocial: true } },
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
    const fact = pago.facturaProveedor

    // ── Impacto en Factura Proveedor ──────────────────────────────────────
    {
      const totalPagadoActual = sumarImportes(fact.pagos.map(p => p.monto))
      const montoEfectivo = nuevoMonto ?? 0
      const diferencia = restarImportes(montoEfectivo, pago.monto)
      const totalTrasModif = sumarImportes([totalPagadoActual, diferencia])

      let nuevoEstadoPago: string
      if (nuevoMonto !== null && nuevaFacturaId) {
        const totalSinPago = restarImportes(totalPagadoActual, pago.monto)
        nuevoEstadoPago = importesIguales(totalSinPago, 0) || totalSinPago < 0 ? "PENDIENTE" : "PARCIALMENTE_PAGADA"
      } else if (nuevoMonto !== null) {
        nuevoEstadoPago =
          importesIguales(totalTrasModif, fact.total) || totalTrasModif > fact.total
            ? "PAGADA"
            : importesIguales(totalTrasModif, 0) || totalTrasModif < 0
            ? "PENDIENTE"
            : "PARCIALMENTE_PAGADA"
      } else {
        const totalSinPago = restarImportes(totalPagadoActual, pago.monto)
        nuevoEstadoPago = importesIguales(totalSinPago, 0) || totalSinPago < 0 ? "PENDIENTE" : "PARCIALMENTE_PAGADA"
      }

      impactos.push({
        tipo: "FACTURA_PROVEEDOR",
        descripcion: `${fact.tipoCbte} ${fact.nroComprobante} — ${fact.proveedor.razonSocial}`,
        detalle: `Total: $${fact.total.toLocaleString("es-AR")} · Pagado actual: $${totalPagadoActual.toLocaleString("es-AR")}`,
        estadoActual: fact.estadoPago,
        nuevoEstado: nuevoEstadoPago,
      })
    }

    // ── Impacto en reasignación a nueva factura ───────────────────────────
    if (nuevaFacturaId && nuevaFacturaId !== pago.facturaProveedorId) {
      const factNueva = await prisma.facturaProveedor.findUnique({
        where: { id: nuevaFacturaId },
        select: {
          id: true,
          nroComprobante: true,
          tipoCbte: true,
          total: true,
          estadoPago: true,
          proveedor: { select: { razonSocial: true } },
          pagos: { where: { anulado: false }, select: { monto: true } },
        },
      })
      if (factNueva) {
        const totalPagadoNueva = sumarImportes(factNueva.pagos.map(p => p.monto))
        const montoReasignado = nuevoMonto ?? pago.monto
        const totalConNuevoPago = sumarImportes([totalPagadoNueva, montoReasignado])
        const nuevoEstadoNueva =
          importesIguales(totalConNuevoPago, factNueva.total) || totalConNuevoPago > factNueva.total
            ? "PAGADA"
            : "PARCIALMENTE_PAGADA"

        impactos.push({
          tipo: "FACTURA_PROVEEDOR",
          descripcion: `${factNueva.tipoCbte} ${factNueva.nroComprobante} (destino nuevo) — ${factNueva.proveedor.razonSocial}`,
          detalle: `Total: $${factNueva.total.toLocaleString("es-AR")} · Pagado actual: $${totalPagadoNueva.toLocaleString("es-AR")}`,
          estadoActual: factNueva.estadoPago,
          nuevoEstado: nuevoEstadoNueva,
        })
      }
    }

    // ── Impacto CC Proveedor ──────────────────────────────────────────────
    impactos.push({
      tipo: "CC_PROVEEDOR",
      descripcion: `CC Proveedor — ${fact.proveedor.razonSocial}`,
      detalle: nuevoMonto !== null
        ? `Diferencia: ${nuevoMonto >= pago.monto ? "+" : ""}$${restarImportes(nuevoMonto, pago.monto).toLocaleString("es-AR")}`
        : `Se revierte el pago de $${pago.monto.toLocaleString("es-AR")}`,
      estadoActual: "Pago acreditado",
      nuevoEstado: nuevoMonto !== null ? "Pago ajustado" : "Pago revertido (deuda reabierta)",
    })

    // ── Impacto en ChequeEmitido ──────────────────────────────────────────
    if (pago.chequeEmitido && !nuevoMonto) {
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
        detalle: "Endosado al proveedor como parte de este pago",
        estadoActual: pago.chequeRecibido.estado,
        nuevoEstado: "EN_CARTERA",
      })
    }

    return NextResponse.json({
      pago: {
        id: pago.id,
        monto: pago.monto,
        tipo: pago.tipo,
        fecha: pago.fecha,
        nroCheque: pago.chequeEmitido?.nroCheque ?? pago.chequeRecibido?.nroCheque,
      },
      impactos,
    })
  } catch (error) {
    return serverErrorResponse("GET /api/pagos-proveedor/[id]/impacto-modificacion", error)
  }
}
