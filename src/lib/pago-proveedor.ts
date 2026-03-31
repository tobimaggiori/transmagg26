/**
 * Utilidad compartida para registrar un pago a proveedor dentro de una transacción Prisma.
 * Usada tanto por POST /api/proveedores/[id]/pago como por POST /api/facturas-proveedor
 * (pago inline al ingresar factura).
 */

import { prisma } from "@/lib/prisma"

// Tipo del cliente de transacción de Prisma (extraído de la firma de $transaction)
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type PagoProveedorInput = {
  fecha: Date
  monto: number
  tipo: string
  observaciones?: string | null
  comprobantePdfS3Key?: string | null
  cuentaId?: string | null
  chequeRecibidoId?: string | null
  tarjetaId?: string | null
  chequeNro?: string | null
  chequeFechaPago?: string | null
  chequeTipoDocBeneficiario?: string | null
  chequeNroDocBeneficiario?: string | null
}

export type PagoProveedorCtx = {
  facturaId: string
  facturaTotal: number
  /** Suma de pagos previos registrados (0 para una factura recién creada) */
  totalPagadoAnterior: number
  facturaNroComprobante: string
  proveedorId: string
  proveedorRazonSocial: string
  operadorId: string | null
}

/**
 * procesarPagoProveedor: (TxClient, PagoProveedorCtx, PagoProveedorInput) ->
 *   Promise<{ pagoId: string; nuevoEstado: string; resumenTarjetaId: string | null }>
 *
 * Dado el cliente de transacción activo y el contexto de la factura, crea el PagoProveedor
 * y aplica todos los efectos secundarios:
 *   TRANSFERENCIA        → MovimientoSinFactura EGRESO
 *   CHEQUE_PROPIO        → ChequeEmitido
 *   CHEQUE_*_TERCERO     → endosar ChequeRecibido
 *   TARJETA_*            → buscar/crear ResumenTarjeta + GastoTarjeta
 *   EFECTIVO             → solo PagoProveedor
 * Actualiza estadoPago de la factura a PAGADA o PARCIALMENTE_PAGADA.
 *
 * Ejemplos:
 * await procesarPagoProveedor(tx, ctx, { tipo: "EFECTIVO", monto: 1000, fecha: new Date() })
 *   → { pagoId: "uuid", nuevoEstado: "PAGADA", resumenTarjetaId: null }
 */
export async function procesarPagoProveedor(
  tx: TxClient,
  ctx: PagoProveedorCtx,
  input: PagoProveedorInput
): Promise<{ pagoId: string; nuevoEstado: string; resumenTarjetaId: string | null }> {
  const {
    facturaId,
    facturaTotal,
    totalPagadoAnterior,
    facturaNroComprobante,
    proveedorId,
    proveedorRazonSocial,
    operadorId,
  } = ctx
  const fechaPago = input.fecha

  let resumenTarjetaId: string | null = null

  // ── 1. Para TARJETA_*: buscar o crear ResumenTarjeta del mes ────────────────
  if (
    (input.tipo === "TARJETA_CREDITO" ||
      input.tipo === "TARJETA_DEBITO" ||
      input.tipo === "TARJETA_PREPAGA") &&
    input.tarjetaId
  ) {
    const periodo = `${fechaPago.getFullYear()}-${String(fechaPago.getMonth() + 1).padStart(2, "0")}`
    const resumenExistente = await tx.resumenTarjeta.findFirst({
      where: { tarjetaId: input.tarjetaId, periodo },
    })

    if (resumenExistente) {
      await tx.resumenTarjeta.update({
        where: { id: resumenExistente.id },
        data: { totalARS: resumenExistente.totalARS + input.monto },
      })
      resumenTarjetaId = resumenExistente.id
    } else {
      const ultimoDiaMes = new Date(fechaPago.getFullYear(), fechaPago.getMonth() + 1, 0)
      const nuevoResumen = await tx.resumenTarjeta.create({
        data: {
          tarjetaId: input.tarjetaId,
          periodo,
          fechaVtoPago: ultimoDiaMes,
          totalARS: input.monto,
          pagado: false,
        },
      })
      resumenTarjetaId = nuevoResumen.id
    }

    const efectivoOperadorId =
      operadorId ??
      (await tx.usuario.findFirst({ where: { rol: "ADMIN_TRANSMAGG" } }))!.id
    await tx.gastoTarjeta.create({
      data: {
        tarjetaId: input.tarjetaId,
        tipoGasto: "PAGO_PROVEEDOR",
        monto: input.monto,
        fecha: fechaPago,
        descripcion: `Factura ${facturaNroComprobante} - ${proveedorRazonSocial}`,
        operadorId: efectivoOperadorId,
      },
    })
  }

  // ── 2. Crear PagoProveedor ──────────────────────────────────────────────────
  const pago = await tx.pagoProveedor.create({
    data: {
      facturaProveedorId: facturaId,
      fecha: fechaPago,
      monto: input.monto,
      tipo: input.tipo,
      observaciones: input.observaciones ?? null,
      comprobantePdfS3Key: input.comprobantePdfS3Key ?? null,
      cuentaId: input.cuentaId ?? null,
      chequeRecibidoId: input.chequeRecibidoId ?? null,
      tarjetaId: input.tarjetaId ?? null,
      resumenTarjetaId,
      operadorId: operadorId ?? null,
    },
  })

  // ── 3. Actualizar estadoPago de la factura ──────────────────────────────────
  const totalPagadoNuevo = totalPagadoAnterior + input.monto
  const nuevoEstado =
    totalPagadoNuevo >= facturaTotal - 0.01 ? "PAGADA" : "PARCIALMENTE_PAGADA"
  await tx.facturaProveedor.update({
    where: { id: facturaId },
    data: { estadoPago: nuevoEstado },
  })

  // ── 4. Efectos secundarios por tipo ────────────────────────────────────────

  // TRANSFERENCIA → MovimientoSinFactura EGRESO
  if (input.tipo === "TRANSFERENCIA" && input.cuentaId && operadorId) {
    await tx.movimientoSinFactura.create({
      data: {
        cuentaId: input.cuentaId,
        tipo: "EGRESO",
        categoria: "TRANSFERENCIA_ENVIADA",
        monto: input.monto,
        fecha: fechaPago,
        descripcion: `Pago factura ${facturaNroComprobante} - ${proveedorRazonSocial}`,
        referencia: input.observaciones ?? null,
        operadorId,
      },
    })
  }

  // CHEQUE_PROPIO → ChequeEmitido
  if (input.tipo === "CHEQUE_PROPIO" && input.cuentaId && operadorId) {
    const chequeEmitido = await tx.chequeEmitido.create({
      data: {
        proveedorId,
        cuentaId: input.cuentaId,
        nroCheque: input.chequeNro ?? null,
        tipoDocBeneficiario: input.chequeTipoDocBeneficiario ?? "CUIT",
        nroDocBeneficiario: input.chequeNroDocBeneficiario ?? proveedorRazonSocial,
        monto: input.monto,
        fechaEmision: fechaPago,
        fechaPago: input.chequeFechaPago ? new Date(input.chequeFechaPago) : fechaPago,
        motivoPago: "FACTURA",
        clausula: "NO_A_LA_ORDEN",
        estado: "EMITIDO",
        esElectronico: true,
        operadorId,
      },
    })
    await tx.pagoProveedor.update({
      where: { id: pago.id },
      data: { chequeEmitidoId: chequeEmitido.id },
    })
  }

  // CHEQUE_FISICO_TERCERO / CHEQUE_ELECTRONICO_TERCERO → endosar ChequeRecibido
  if (
    (input.tipo === "CHEQUE_FISICO_TERCERO" || input.tipo === "CHEQUE_ELECTRONICO_TERCERO") &&
    input.chequeRecibidoId
  ) {
    await tx.chequeRecibido.update({
      where: { id: input.chequeRecibidoId },
      data: {
        estado: "ENDOSADO_PROVEEDOR",
        endosadoATipo: "PROVEEDOR",
        endosadoAProveedorId: proveedorId,
      },
    })
  }

  return { pagoId: pago.id, nuevoEstado, resumenTarjetaId }
}
