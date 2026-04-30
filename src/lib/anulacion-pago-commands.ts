/**
 * anulacion-pago-commands.ts
 *
 * Logica de negocio transaccional para anulacion de pagos a fleteros y proveedores.
 * Cada funcion ejecuta la anulacion atomica del pago, recalcula estados del
 * documento padre, revierte cheques/transferencias y registra historial.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, importesIguales, esMayorQueCero } from "@/lib/money"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosAnularPagoFletero = {
  pagoId: string
  justificacion: string
}

export type DatosAnularPagoProveedor = {
  pagoId: string
  justificacion: string
}

type ResultadoAnularPagoFletero =
  | { ok: true; nuevoEstadoLP: string | null }
  | { ok: false; status: number; error: string }

type ResultadoAnularPagoProveedor =
  | { ok: true; nuevoEstadoPago: string | null }
  | { ok: false; status: number; error: string }

// ─── Anular Pago Fletero ─────────────────────────────────────────────────────

/**
 * ejecutarAnularPagoFletero: DatosAnularPagoFletero string -> Promise<ResultadoAnularPagoFletero>
 *
 * Dado [el id del pago, justificacion y el operadorId],
 * devuelve [{ ok, nuevoEstadoLP } o un error con status HTTP].
 *
 * Ejecuta en transaccion:
 * - Marca pago como anulado
 * - Recalcula estado de la liquidacion
 * - Si cheque propio: marca ANULADO
 * - Si cheque tercero: revierte a EN_CARTERA
 * - Si transferencia: crea movimiento de reversion
 * - Registra historial
 *
 * Ejemplos:
 * ejecutarAnularPagoFletero({ pagoId: "p1", justificacion: "Pago duplicado" }, "op1")
 *   // => { ok: true, nuevoEstadoLP: "EMITIDA" }
 * ejecutarAnularPagoFletero({ pagoId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Pago no encontrado" }
 */
export async function ejecutarAnularPagoFletero(
  data: DatosAnularPagoFletero,
  operadorId: string
): Promise<ResultadoAnularPagoFletero> {
  const { pagoId: id, justificacion } = data

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
      ordenPagoId: true,
      liquidacion: {
        select: {
          id: true,
          total: true,
          estado: true,
          nroComprobante: true,
          ptoVenta: true,
          fletero: { select: { razonSocial: true } },
          pagos: { where: { anulado: false }, select: { id: true, monto: true } },
        },
      },
      chequeEmitido: { select: { id: true, nroCheque: true } },
      chequeRecibido: { select: { id: true } },
    },
  })

  if (!pago) return { ok: false, status: 404, error: "Pago no encontrado" }
  if (pago.anulado) return { ok: false, status: 400, error: "El pago ya está anulado" }

  let nuevoEstadoLP: string | null = null

  await prisma.$transaction(async (tx) => {
    // 1. Marcar pago como anulado
    await tx.pagoAFletero.update({
      where: { id },
      data: { anulado: true, motivoAnulacion: justificacion },
    })

    // 2. Recalcular estado LP
    if (pago.liquidacion) {
      const liq = pago.liquidacion
      const totalSinEste = sumarImportes(
        liq.pagos.filter((p) => p.id !== id).map((p) => p.monto)
      )

      if (importesIguales(totalSinEste, liq.total) || totalSinEste >= liq.total) {
        nuevoEstadoLP = "PAGADA"
      } else if (esMayorQueCero(totalSinEste)) {
        nuevoEstadoLP = "PARCIALMENTE_PAGADA"
      } else {
        nuevoEstadoLP = "EMITIDA"
      }

      await tx.liquidacion.update({
        where: { id: liq.id },
        data: { estado: nuevoEstadoLP },
      })
    }

    // 3. Cheque propio: marcar como ANULADO
    if (pago.chequeEmitidoId) {
      await tx.chequeEmitido.update({
        where: { id: pago.chequeEmitidoId },
        data: { estado: "ANULADO" },
      })
    }

    // 4. Cheque recibido: revertir a EN_CARTERA
    if (pago.chequeRecibidoId) {
      await tx.chequeRecibido.update({
        where: { id: pago.chequeRecibidoId },
        data: {
          estado: "EN_CARTERA",
          endosadoATipo: null,
          endosadoAFleteroId: null,
        },
      })
    }

    // 5. Transferencia: crear movimiento de reversion (mismo pagoAFleteroId)
    if (pago.tipoPago === "TRANSFERENCIA" && pago.cuentaId && pago.liquidacion) {
      const liq = pago.liquidacion
      const nroLiq =
        liq.nroComprobante != null
          ? `${String(liq.ptoVenta ?? 1).padStart(4, "0")}-${String(liq.nroComprobante).padStart(8, "0")}`
          : "s/n"
      await registrarMovimiento(tx, {
        cuentaId: pago.cuentaId,
        tipo: "INGRESO",
        categoria: "OTRO",
        monto: pago.monto,
        fecha: new Date(),
        descripcion: `REVERSIÓN Pago LP ${nroLiq} — ${liq.fletero.razonSocial} (anulado: ${justificacion})`,
        pagoAFleteroId: pago.id,
        operadorCreacionId: operadorId,
      })
    }

    // 6. Registrar historial
    await tx.historialPago.create({
      data: {
        pagoFleteroId: id,
        tipoEvento: "ANULACION",
        justificacion,
        estadoAnterior: JSON.stringify({
          monto: pago.monto,
          tipoPago: pago.tipoPago,
          anulado: false,
        }),
        operadorId,
      },
    })

    // 7. Invalidar cache del PDF de la OP a la que pertenece este pago
    if (pago.ordenPagoId) {
      await tx.ordenPago.update({
        where: { id: pago.ordenPagoId },
        data: { pdfS3Key: null },
      })
    }
  })

  return { ok: true, nuevoEstadoLP }
}

// ─── Anular Pago Proveedor ───────────────────────────────────────────────────

/**
 * ejecutarAnularPagoProveedor: DatosAnularPagoProveedor string -> Promise<ResultadoAnularPagoProveedor>
 *
 * Dado [el id del pago, justificacion y el operadorId],
 * devuelve [{ ok, nuevoEstadoPago } o un error con status HTTP].
 *
 * Ejecuta en transaccion:
 * - Marca pago como anulado
 * - Recalcula estadoPago de la FacturaProveedor
 * - Si cheque propio: marca ANULADO
 * - Si cheque tercero: revierte a EN_CARTERA
 * - Si transferencia: crea movimiento de reversion
 * - Registra historial
 *
 * Ejemplos:
 * ejecutarAnularPagoProveedor({ pagoId: "p1", justificacion: "Pago duplicado" }, "op1")
 *   // => { ok: true, nuevoEstadoPago: "PENDIENTE" }
 * ejecutarAnularPagoProveedor({ pagoId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Pago no encontrado" }
 */
export async function ejecutarAnularPagoProveedor(
  data: DatosAnularPagoProveedor,
  operadorId: string
): Promise<ResultadoAnularPagoProveedor> {
  const { pagoId: id, justificacion } = data

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
          proveedor: { select: { razonSocial: true } },
          pagos: { where: { anulado: false }, select: { id: true, monto: true } },
        },
      },
      chequeEmitido: { select: { id: true } },
      chequeRecibido: { select: { id: true } },
    },
  })

  if (!pago) return { ok: false, status: 404, error: "Pago no encontrado" }
  if (pago.anulado) return { ok: false, status: 400, error: "El pago ya está anulado" }

  let nuevoEstadoPago: string | null = null

  await prisma.$transaction(async (tx) => {
    // 1. Marcar pago como anulado
    await tx.pagoProveedor.update({
      where: { id },
      data: { anulado: true, motivoAnulacion: justificacion },
    })

    // 2. Recalcular estadoPago de la factura
    const fact = pago.facturaProveedor
    const totalSinEste = sumarImportes(
      fact.pagos.filter((p) => p.id !== id).map((p) => p.monto)
    )

    if (importesIguales(totalSinEste, fact.total) || totalSinEste >= fact.total) {
      nuevoEstadoPago = "PAGADA"
    } else if (esMayorQueCero(totalSinEste)) {
      nuevoEstadoPago = "PARCIALMENTE_PAGADA"
    } else {
      nuevoEstadoPago = "PENDIENTE"
    }

    await tx.facturaProveedor.update({
      where: { id: fact.id },
      data: { estadoPago: nuevoEstadoPago },
    })

    // 3. Cheque propio: marcar como ANULADO
    if (pago.chequeEmitidoId) {
      await tx.chequeEmitido.update({
        where: { id: pago.chequeEmitidoId },
        data: { estado: "ANULADO" },
      })
    }

    // 4. Cheque recibido endosado: revertir a EN_CARTERA
    if (pago.chequeRecibidoId) {
      await tx.chequeRecibido.update({
        where: { id: pago.chequeRecibidoId },
        data: {
          estado: "EN_CARTERA",
          endosadoATipo: null,
          endosadoAProveedorId: null,
        },
      })
    }

    // 5. Transferencia: crear movimiento de reversion (mismo pagoProveedorId)
    if (pago.tipo === "TRANSFERENCIA" && pago.cuentaId) {
      const fact = pago.facturaProveedor
      await registrarMovimiento(tx, {
        cuentaId: pago.cuentaId,
        tipo: "INGRESO",
        categoria: "OTRO",
        monto: pago.monto,
        fecha: new Date(),
        descripcion: `REVERSIÓN Pago Factura ${fact.tipoCbte} ${fact.nroComprobante} — ${fact.proveedor.razonSocial} (anulado: ${justificacion})`,
        pagoProveedorId: pago.id,
        operadorCreacionId: operadorId,
      })
    }

    // 6. Registrar historial
    await tx.historialPago.create({
      data: {
        pagoProveedorId: id,
        tipoEvento: "ANULACION",
        justificacion,
        estadoAnterior: JSON.stringify({
          monto: pago.monto,
          tipo: pago.tipo,
          anulado: false,
        }),
        operadorId,
      },
    })
  })

  return { ok: true, nuevoEstadoPago }
}
