/**
 * cheque-rechazo-commands.ts
 *
 * Logica de negocio transaccional para confirmar el rechazo de un cheque.
 * Marca el cheque como RECHAZADO, anula todos los pagos vinculados,
 * recalcula estados de liquidaciones y facturas proveedor, y opcionalmente
 * registra un costo bancario.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, importesIguales } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosConfirmarRechazoCheque = {
  chequeId: string
  costoBancarioMonto: number | null
}

type ResultadoRechazoCheque =
  | { ok: true; impactosAplicados: number }
  | { ok: false; status: number; error: string }

// ─── Helpers internos ────────────────────────────────────────────────────────

type Tx = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

/**
 * recalcularEstadoLiquidacion: (liquidacionId, tx) -> Promise<void>
 *
 * Recalcula y actualiza el estado de una liquidacion basado en sus pagos vigentes.
 * Estados posibles: EMITIDA (0 pagado) | PARCIALMENTE_PAGADA (algo pagado) | PAGADA (total cubierto).
 */
async function recalcularEstadoLiquidacion(liquidacionId: string, tx: Tx) {
  const liq = await tx.liquidacion.findUnique({
    where: { id: liquidacionId },
    select: { total: true, estado: true, pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!liq) return

  const totalPagado = sumarImportes(liq.pagos.map((p) => p.monto))
  let nuevoEstado: string
  if (importesIguales(totalPagado, 0)) {
    nuevoEstado = "EMITIDA"
  } else if (importesIguales(totalPagado, liq.total)) {
    nuevoEstado = "PAGADA"
  } else {
    nuevoEstado = "PARCIALMENTE_PAGADA"
  }

  if (nuevoEstado !== liq.estado) {
    await tx.liquidacion.update({ where: { id: liquidacionId }, data: { estado: nuevoEstado } })
  }
}

/**
 * recalcularEstadoFacturaProveedor: (facturaId, tx) -> Promise<void>
 *
 * Recalcula y actualiza estadoPago de una FacturaProveedor basado en sus pagos vigentes.
 * Estados: PENDIENTE (0) | PARCIALMENTE_PAGADA | PAGADA.
 */
async function recalcularEstadoFacturaProveedor(facturaId: string, tx: Tx) {
  const fact = await tx.facturaProveedor.findUnique({
    where: { id: facturaId },
    select: { total: true, estadoPago: true, pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!fact) return

  const totalPagado = sumarImportes(fact.pagos.map((p) => p.monto))
  let nuevoEstado: string
  if (importesIguales(totalPagado, 0)) {
    nuevoEstado = "PENDIENTE"
  } else if (importesIguales(totalPagado, fact.total)) {
    nuevoEstado = "PAGADA"
  } else {
    nuevoEstado = "PARCIALMENTE_PAGADA"
  }

  if (nuevoEstado !== fact.estadoPago) {
    await tx.facturaProveedor.update({ where: { id: facturaId }, data: { estadoPago: nuevoEstado } })

    // Si volvio a PENDIENTE o PARCIALMENTE_PAGADA y habia un GastoFletero PAGADO, revertirlo
    if (nuevoEstado !== "PAGADA") {
      const gasto = await tx.gastoFletero.findUnique({
        where: { facturaProveedorId: facturaId },
        select: { id: true, estado: true },
      })
      if (gasto && gasto.estado === "PAGADO") {
        await tx.gastoFletero.update({
          where: { id: gasto.id },
          data: { estado: "PENDIENTE_PAGO" },
        })
      }
    }
  }
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarConfirmarRechazoCheque: DatosConfirmarRechazoCheque string -> Promise<ResultadoRechazoCheque>
 *
 * Dado [el id del cheque, costo bancario opcional y el operadorId],
 * devuelve [{ ok, impactosAplicados } o un error con status HTTP].
 *
 * Busca primero en ChequeEmitido, luego en ChequeRecibido.
 * Anula atomicamente todos los pagos vinculados y recalcula estados.
 *
 * Ejemplos:
 * ejecutarConfirmarRechazoCheque({ chequeId: "c1", costoBancarioMonto: null }, "op1")
 *   // => { ok: true, impactosAplicados: 2 }
 * ejecutarConfirmarRechazoCheque({ chequeId: "yaRechazado", ... }, "op1")
 *   // => { ok: false, status: 409, error: "El cheque ya está rechazado" }
 */
export async function ejecutarConfirmarRechazoCheque(
  data: DatosConfirmarRechazoCheque,
  operadorId: string
): Promise<ResultadoRechazoCheque> {
  const { chequeId: id, costoBancarioMonto } = data
  const motivoAnulacion = "Cheque rechazado por el banco"

  // Verificar emitido
  const chequeEmitido = await prisma.chequeEmitido.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      monto: true,
      cuentaId: true,
      pagosFletero: {
        where: { anulado: false },
        select: { id: true, liquidacionId: true },
      },
      pagosProveedor: {
        where: { anulado: false },
        select: { id: true, facturaProveedorId: true },
      },
    },
  })

  if (chequeEmitido) {
    if (chequeEmitido.estado === "RECHAZADO") {
      return { ok: false, status: 409, error: "El cheque ya está rechazado" }
    }

    let impactosAplicados = 0

    await prisma.$transaction(async (tx) => {
      // 1. Marcar cheque RECHAZADO
      await tx.chequeEmitido.update({ where: { id }, data: { estado: "RECHAZADO" } })

      // 2. Anular PagoAFletero vinculados
      const liqIds = new Set<string>()
      for (const pago of chequeEmitido.pagosFletero) {
        await tx.pagoAFletero.update({
          where: { id: pago.id },
          data: { anulado: true, motivoAnulacion },
        })
        if (pago.liquidacionId) liqIds.add(pago.liquidacionId)
        impactosAplicados++
      }

      // 3. Anular PagoProveedor vinculados
      const factIds = new Set<string>()
      for (const pago of chequeEmitido.pagosProveedor) {
        await tx.pagoProveedor.update({
          where: { id: pago.id },
          data: { anulado: true, motivoAnulacion },
        })
        factIds.add(pago.facturaProveedorId)
        impactosAplicados++
      }

      // 4. Recalcular estados
      for (const liqId of Array.from(liqIds)) {
        await recalcularEstadoLiquidacion(liqId, tx)
      }
      for (const factId of Array.from(factIds)) {
        await recalcularEstadoFacturaProveedor(factId, tx)
      }

      // 5. Costo bancario si aplica
      if (costoBancarioMonto && chequeEmitido.estado === "EMITIDO") {
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: chequeEmitido.cuentaId,
            tipo: "EGRESO",
            categoria: "MANTENIMIENTO_CUENTA",
            monto: costoBancarioMonto,
            fecha: new Date(),
            descripcion: "Costo bancario por cheque rechazado",
            operadorId,
          },
        })
      }
    })

    return { ok: true, impactosAplicados }
  }

  // Verificar recibido
  const chequeRecibido = await prisma.chequeRecibido.findUnique({
    where: { id },
    select: {
      id: true,
      estado: true,
      pagosFletero: {
        where: { anulado: false },
        select: { id: true, liquidacionId: true },
      },
      pagosProveedor: {
        where: { anulado: false },
        select: { id: true, facturaProveedorId: true },
      },
    },
  })

  if (chequeRecibido) {
    if (chequeRecibido.estado === "RECHAZADO") {
      return { ok: false, status: 409, error: "El cheque ya está rechazado" }
    }

    let impactosAplicados = 0

    await prisma.$transaction(async (tx) => {
      // 1. Marcar cheque RECHAZADO
      await tx.chequeRecibido.update({ where: { id }, data: { estado: "RECHAZADO" } })

      // 2. Anular PagoAFletero vinculados
      const liqIds = new Set<string>()
      for (const pago of chequeRecibido.pagosFletero) {
        await tx.pagoAFletero.update({
          where: { id: pago.id },
          data: { anulado: true, motivoAnulacion },
        })
        if (pago.liquidacionId) liqIds.add(pago.liquidacionId)
        impactosAplicados++
      }

      // 3. Anular PagoProveedor vinculados
      const factIds = new Set<string>()
      for (const pago of chequeRecibido.pagosProveedor) {
        await tx.pagoProveedor.update({
          where: { id: pago.id },
          data: { anulado: true, motivoAnulacion },
        })
        factIds.add(pago.facturaProveedorId)
        impactosAplicados++
      }

      // 4. Recalcular estados
      for (const liqId of Array.from(liqIds)) {
        await recalcularEstadoLiquidacion(liqId, tx)
      }
      for (const factId of Array.from(factIds)) {
        await recalcularEstadoFacturaProveedor(factId, tx)
      }
    })

    return { ok: true, impactosAplicados }
  }

  return { ok: false, status: 404, error: "Cheque no encontrado" }
}
