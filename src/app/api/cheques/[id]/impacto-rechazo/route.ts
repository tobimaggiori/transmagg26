/**
 * API Route: GET /api/cheques/[id]/impacto-rechazo
 * Preview de impacto al rechazar un cheque (emitido o recibido).
 * Solo lectura — nunca modifica datos.
 */

import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { esRolInterno } from "@/lib/permissions"
import type { Rol } from "@/types"

type ImpactoItem = {
  tipo: "LIQUIDACION" | "FACTURA_PROVEEDOR"
  id: string
  referencia: string
  montoAnulado: number
  estadoActual: string
  estadoResultante: string
}

/**
 * GET: (id) -> Promise<NextResponse>
 *
 * Dado el id de un cheque (emitido o recibido), calcula el impacto si se marcara
 * como RECHAZADO: pagos que se anularían y nuevos estados de LP/FacturaProveedor.
 * Solo accesible para roles internos.
 *
 * Retorna:
 * {
 *   cheque: { id, tipo: "EMITIDO"|"RECIBIDO", estado, monto, nroCheque },
 *   impactos: ImpactoItem[],
 *   costoBancario: { aplica: boolean }
 * }
 *
 * Ejemplos:
 * GET /api/cheques/abc/impacto-rechazo (cheque EMITIDO con 1 PagoAFletero)
 * // => 200 { cheque: {...}, impactos: [{ tipo: "LIQUIDACION", estadoResultante: "EMITIDA" }], costoBancario: { aplica: true } }
 * GET /api/cheques/abc/impacto-rechazo (cheque ya RECHAZADO)
 * // => 409 { error: "El cheque ya está rechazado" }
 */
export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth()
  if (!session?.user) return NextResponse.json({ error: "No autorizado" }, { status: 401 })
  const rol = session.user.rol as Rol
  if (!esRolInterno(rol)) return NextResponse.json({ error: "Acceso denegado" }, { status: 403 })

  const { id } = await params

  // Buscar en emitidos primero, luego en recibidos
  const chequeEmitido = await prisma.chequeEmitido.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      monto: true,
      nroCheque: true,
      pagosFletero: {
        where: { anulado: false },
        select: {
          id: true,
          monto: true,
          liquidacion: {
            select: {
              id: true,
              nroComprobante: true,
              ptoVenta: true,
              total: true,
              estado: true,
              pagos: { where: { anulado: false }, select: { monto: true } },
            },
          },
        },
      },
      pagosProveedor: {
        where: { anulado: false },
        select: {
          id: true,
          monto: true,
          facturaProveedor: {
            select: {
              id: true,
              nroComprobante: true,
              tipoCbte: true,
              total: true,
              estadoPago: true,
              pagos: { where: { anulado: false }, select: { monto: true } },
            },
          },
        },
      },
    },
  })

  if (chequeEmitido) {
    if (chequeEmitido.estado === "RECHAZADO") {
      return NextResponse.json({ error: "El cheque ya está rechazado" }, { status: 409 })
    }

    const impactos: ImpactoItem[] = []

    for (const pago of chequeEmitido.pagosFletero) {
      const liq = pago.liquidacion
      if (!liq) continue
      const totalPagado = liq.pagos.reduce((s, p) => s + p.monto, 0)
      const totalSinEstePago = totalPagado - pago.monto
      const estadoResultante = totalSinEstePago <= 0.01 ? "EMITIDA" : "PARCIALMENTE_PAGADA"
      impactos.push({
        tipo: "LIQUIDACION",
        id: liq.id,
        referencia: `LP ${String(liq.ptoVenta ?? "").padStart(4, "0")}-${String(liq.nroComprobante ?? "").padStart(8, "0")}`,
        montoAnulado: pago.monto,
        estadoActual: liq.estado,
        estadoResultante,
      })
    }

    for (const pago of chequeEmitido.pagosProveedor) {
      const fact = pago.facturaProveedor
      const totalPagado = fact.pagos.reduce((s, p) => s + p.monto, 0)
      const totalSinEstePago = totalPagado - pago.monto
      const estadoResultante = totalSinEstePago <= 0.01 ? "PENDIENTE" : "PARCIALMENTE_PAGADA"
      impactos.push({
        tipo: "FACTURA_PROVEEDOR",
        id: fact.id,
        referencia: `${fact.tipoCbte} ${fact.nroComprobante}`,
        montoAnulado: pago.monto,
        estadoActual: fact.estadoPago,
        estadoResultante,
      })
    }

    return NextResponse.json({
      cheque: {
        id: chequeEmitido.id,
        tipo: "EMITIDO",
        estado: chequeEmitido.estado,
        monto: chequeEmitido.monto,
        nroCheque: chequeEmitido.nroCheque,
      },
      impactos,
      costoBancario: { aplica: chequeEmitido.estado === "EMITIDO" },
    })
  }

  // Buscar en recibidos
  const chequeRecibido = await prisma.chequeRecibido.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      monto: true,
      nroCheque: true,
      pagosFletero: {
        where: { anulado: false },
        select: {
          id: true,
          monto: true,
          liquidacion: {
            select: {
              id: true,
              nroComprobante: true,
              ptoVenta: true,
              total: true,
              estado: true,
              pagos: { where: { anulado: false }, select: { monto: true } },
            },
          },
        },
      },
      pagosProveedor: {
        where: { anulado: false },
        select: {
          id: true,
          monto: true,
          facturaProveedor: {
            select: {
              id: true,
              nroComprobante: true,
              tipoCbte: true,
              total: true,
              estadoPago: true,
              pagos: { where: { anulado: false }, select: { monto: true } },
            },
          },
        },
      },
    },
  })

  if (chequeRecibido) {
    if (chequeRecibido.estado === "RECHAZADO") {
      return NextResponse.json({ error: "El cheque ya está rechazado" }, { status: 409 })
    }

    const impactos: ImpactoItem[] = []

    for (const pago of chequeRecibido.pagosFletero) {
      const liq = pago.liquidacion
      if (!liq) continue
      const totalPagado = liq.pagos.reduce((s, p) => s + p.monto, 0)
      const totalSinEstePago = totalPagado - pago.monto
      const estadoResultante = totalSinEstePago <= 0.01 ? "EMITIDA" : "PARCIALMENTE_PAGADA"
      impactos.push({
        tipo: "LIQUIDACION",
        id: liq.id,
        referencia: `LP ${String(liq.ptoVenta ?? "").padStart(4, "0")}-${String(liq.nroComprobante ?? "").padStart(8, "0")}`,
        montoAnulado: pago.monto,
        estadoActual: liq.estado,
        estadoResultante,
      })
    }

    for (const pago of chequeRecibido.pagosProveedor) {
      const fact = pago.facturaProveedor
      const totalPagado = fact.pagos.reduce((s, p) => s + p.monto, 0)
      const totalSinEstePago = totalPagado - pago.monto
      const estadoResultante = totalSinEstePago <= 0.01 ? "PENDIENTE" : "PARCIALMENTE_PAGADA"
      impactos.push({
        tipo: "FACTURA_PROVEEDOR",
        id: fact.id,
        referencia: `${fact.tipoCbte} ${fact.nroComprobante}`,
        montoAnulado: pago.monto,
        estadoActual: fact.estadoPago,
        estadoResultante,
      })
    }

    return NextResponse.json({
      cheque: {
        id: chequeRecibido.id,
        tipo: "RECIBIDO",
        estado: chequeRecibido.estado,
        monto: chequeRecibido.monto,
        nroCheque: chequeRecibido.nroCheque,
      },
      impactos,
      costoBancario: { aplica: false },
    })
  }

  return NextResponse.json({ error: "Cheque no encontrado" }, { status: 404 })
}
