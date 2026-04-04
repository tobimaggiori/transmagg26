/**
 * cobro-commands.ts
 *
 * Logica de negocio transaccional para registro de cobros de facturas emitidas.
 * Valida precondiciones, crea pagos con multiples medios y actualiza el estado
 * de la factura.
 */

import { prisma } from "@/lib/prisma"
import { calcularSaldoCCEmpresa } from "@/lib/cuenta-corriente"
import { sumarImportes, restarImportes, maxMonetario } from "@/lib/money"

// ── Tipos ────────────────────────────────────────────────────────────────────

type PagoItem =
  | {
      tipoPago: "CHEQUE"
      monto: number
      esElectronico: boolean
      nroCheque: string
      bancoEmisor: string
      fechaEmision: string
      fechaCobro: string
      cuitLibrador?: string
    }
  | {
      tipoPago: "TRANSFERENCIA"
      monto: number
      cuentaBancariaId: string
      referencia?: string
    }
  | {
      tipoPago: "EFECTIVO"
      monto: number
      descripcion?: string
    }
  | {
      tipoPago: "SALDO_A_FAVOR"
      monto: number
    }

export type DatosRegistrarCobro = {
  facturaId: string
  pagos: PagoItem[]
  fecha: string
}

type ResultadoCobro =
  | {
      ok: true
      result: {
        nuevoEstado: string
        saldoRestante: number
        saldoAFavorGenerado: number
      }
    }
  | { ok: false; status: number; error: string }

// ── Comando principal ────────────────────────────────────────────────────────

/**
 * ejecutarRegistrarCobro: DatosRegistrarCobro string -> Promise<ResultadoCobro>
 *
 * Dado [los datos validados del cobro y el operadorId],
 * devuelve [el resultado del cobro o un error con status HTTP].
 *
 * Valida:
 * - Factura existe y esta en estado cobrable
 * - Saldo a favor suficiente si se usa SALDO_A_FAVOR
 *
 * Ejecuta en transaccion:
 * - Crea pagos por cada medio de cobro
 * - Crea cheques recibidos, movimientos bancarios
 * - Actualiza estado de la factura
 * - Genera excedente como saldo a favor si corresponde
 */
export async function ejecutarRegistrarCobro(
  data: DatosRegistrarCobro,
  operadorId: string
): Promise<ResultadoCobro> {
  const { facturaId, pagos, fecha } = data

  const factura = await prisma.facturaEmitida.findUnique({
    where: { id: facturaId },
    select: {
      id: true,
      empresaId: true,
      total: true,
      estado: true,
      tipoCbte: true,
      nroComprobante: true,
      empresa: { select: { razonSocial: true } },
      pagos: { select: { monto: true } },
    },
  })

  if (!factura) return { ok: false, status: 404, error: "Factura no encontrada" }

  if (!["EMITIDA", "PARCIALMENTE_COBRADA"].includes(factura.estado)) {
    return { ok: false, status: 400, error: "La factura no esta en estado cobrable" }
  }

  const totalYaPagado = sumarImportes(factura.pagos.map((p) => p.monto))
  const saldoPendiente = restarImportes(factura.total, totalYaPagado)
  const totalPagoActual = sumarImportes(pagos.map((p) => p.monto))

  // Validate SALDO_A_FAVOR
  const pagoSaldoAFavor = pagos.find((p) => p.tipoPago === "SALDO_A_FAVOR")
  if (pagoSaldoAFavor) {
    const { saldoAFavor } = await calcularSaldoCCEmpresa(factura.empresaId)
    if (pagoSaldoAFavor.monto > saldoAFavor) {
      return { ok: false, status: 400, error: "Saldo a favor insuficiente" }
    }
  }

  const fechaPago = new Date(fecha)

  const nuevoEstado =
    totalPagoActual >= saldoPendiente ? "COBRADA" : "PARCIALMENTE_COBRADA"

  await prisma.$transaction(async (tx) => {
    for (const pago of pagos) {
      if (pago.tipoPago === "CHEQUE") {
        const nuevoCheque = await tx.chequeRecibido.create({
          data: {
            empresaId: factura.empresaId,
            facturaId,
            esElectronico: pago.esElectronico,
            nroCheque: pago.nroCheque,
            bancoEmisor: pago.bancoEmisor,
            monto: pago.monto,
            fechaEmision: new Date(pago.fechaEmision),
            fechaCobro: new Date(pago.fechaCobro),
            cuitLibrador: pago.cuitLibrador,
            estado: "EN_CARTERA",
            operadorId,
          },
        })
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId: factura.empresaId,
            facturaId,
            tipoPago: "CHEQUE",
            monto: pago.monto,
            fechaPago,
            chequeRecibidoId: nuevoCheque.id,
            operadorId,
          },
        })
      } else if (pago.tipoPago === "TRANSFERENCIA") {
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId: factura.empresaId,
            facturaId,
            tipoPago: "TRANSFERENCIA",
            monto: pago.monto,
            referencia: pago.referencia,
            fechaPago,
            cuentaId: pago.cuentaBancariaId,
            operadorId,
          },
        })
        // Registrar movimiento bancario: TRANSFERENCIA_RECIBIDA
        await tx.cuenta.findUnique({
          where: { id: pago.cuentaBancariaId },
          select: { tieneImpuestoDebcred: true, alicuotaImpuesto: true },
        })
        const nroCbte = factura.nroComprobante ?? "s/n"
        const descripcionMov = `Cobro Factura ${factura.tipoCbte} ${nroCbte} — ${factura.empresa.razonSocial}`
        await tx.movimientoSinFactura.create({
          data: {
            cuentaId: pago.cuentaBancariaId,
            tipo: "INGRESO",
            categoria: "TRANSFERENCIA_RECIBIDA",
            monto: pago.monto,
            fecha: fechaPago,
            descripcion: descripcionMov,
            referencia: pago.referencia,
            operadorId,
          },
        })
      } else if (pago.tipoPago === "EFECTIVO") {
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId: factura.empresaId,
            facturaId,
            tipoPago: "EFECTIVO",
            monto: pago.monto,
            referencia: pago.descripcion,
            fechaPago,
            operadorId,
          },
        })
      } else if (pago.tipoPago === "SALDO_A_FAVOR") {
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId: factura.empresaId,
            facturaId,
            tipoPago: "SALDO_A_FAVOR",
            monto: pago.monto,
            fechaPago,
            operadorId,
          },
        })
      }
    }

    await tx.facturaEmitida.update({
      where: { id: facturaId },
      data: { estado: nuevoEstado },
    })

    const excedente = restarImportes(totalPagoActual, saldoPendiente)
    if (excedente > 0) {
      // Negative-amount payment representing saldo a favor generated
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId: factura.empresaId,
          facturaId: null,
          tipoPago: "SALDO_A_FAVOR",
          monto: -excedente,
          fechaPago,
          operadorId,
        },
      })
    }
  })

  return {
    ok: true,
    result: {
      nuevoEstado,
      saldoRestante: maxMonetario(0, restarImportes(saldoPendiente, totalPagoActual)),
      saldoAFavorGenerado: maxMonetario(0, restarImportes(totalPagoActual, saldoPendiente)),
    },
  }
}
