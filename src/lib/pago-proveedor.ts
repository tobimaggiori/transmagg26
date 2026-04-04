/**
 * Utilidad compartida para registrar un pago a proveedor dentro de una transacción Prisma.
 * Usada tanto por POST /api/proveedores/[id]/pago como por POST /api/facturas-proveedor
 * (pago inline al ingresar factura).
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, importesIguales } from "@/lib/money"

// Tipo del cliente de transacción de Prisma (extraído de la firma de $transaction)
type TxClient = Parameters<Parameters<typeof prisma.$transaction>[0]>[0]

export type ChequePropioDatos = {
  nroCheque?: string | null
  tipoDocBeneficiario: string
  nroDocBeneficiario: string
  mailBeneficiario?: string | null
  fechaEmision: string
  fechaPago: string
  clausula?: string | null
  descripcion1?: string | null
  descripcion2?: string | null
}

export type PagoProveedorInput = {
  fecha: Date
  monto: number
  tipo: string
  observaciones?: string | null
  comprobantePdfS3Key?: string | null
  cuentaId?: string | null
  chequeRecibidoId?: string | null
  tarjetaId?: string | null
  chequePropio?: ChequePropioDatos | null
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

  const resumenTarjetaId: string | null = null

  // ── 1. TARJETA: el gasto queda pendiente de asignación (no se vincula a tarjeta) ──

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
  const totalPagadoNuevo = sumarImportes([totalPagadoAnterior, input.monto])
  const nuevoEstado =
    importesIguales(totalPagadoNuevo, facturaTotal) || totalPagadoNuevo > facturaTotal ? "PAGADA" : "PARCIALMENTE_PAGADA"
  await tx.facturaProveedor.update({
    where: { id: facturaId },
    data: { estadoPago: nuevoEstado },
  })

  // ── 3b. Si la factura es por cuenta de fletero y queda PAGADA, actualizar GastoFletero ──
  if (nuevoEstado === "PAGADA") {
    const gasto = await tx.gastoFletero.findUnique({
      where: { facturaProveedorId: facturaId },
      select: { id: true, estado: true },
    })
    if (gasto && gasto.estado === "PENDIENTE_PAGO") {
      await tx.gastoFletero.update({
        where: { id: gasto.id },
        data: { estado: "PAGADO" },
      })
    }
  }

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
  if (input.tipo === "CHEQUE_PROPIO" && input.cuentaId && input.chequePropio && operadorId) {
    const ch = input.chequePropio
    if (ch.nroCheque) {
      const existing = await tx.chequeEmitido.findFirst({
        where: { nroCheque: ch.nroCheque, cuentaId: input.cuentaId },
        select: { id: true },
      })
      if (existing) throw new Error(`DUPLICATE_CHEQUE:${ch.nroCheque}`)
    }
    const chequeEmitido = await tx.chequeEmitido.create({
      data: {
        proveedorId,
        cuentaId: input.cuentaId,
        nroCheque: ch.nroCheque ?? null,
        tipoDocBeneficiario: ch.tipoDocBeneficiario,
        nroDocBeneficiario: ch.nroDocBeneficiario,
        mailBeneficiario: ch.mailBeneficiario ?? null,
        monto: input.monto,
        fechaEmision: new Date(ch.fechaEmision),
        fechaPago: new Date(ch.fechaPago),
        motivoPago: "FACTURA",
        clausula: ch.clausula ?? "NO_A_LA_ORDEN",
        descripcion1: ch.descripcion1 ?? null,
        descripcion2: ch.descripcion2 ?? null,
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

// ─── Comando: pago directo a proveedor ──────────────────────────────────────

export type DatosPagoProveedorDirecto = {
  proveedorId: string
  facturaProveedorId: string
  fecha: string
  monto: number
  tipo: string
  observaciones?: string | null
  comprobantePdfS3Key?: string | null
  cuentaId?: string | null
  chequeRecibidoId?: string | null
  tarjetaId?: string | null
  chequePropio?: ChequePropioDatos | null
}

type ResultadoPagoProveedorDirecto =
  | { ok: true; result: unknown }
  | { ok: false; status: number; error: string }

/**
 * ejecutarPagoProveedorDirecto: DatosPagoProveedorDirecto string|null -> Promise<ResultadoPagoProveedorDirecto>
 *
 * Dado [los datos validados del pago y el operadorId],
 * devuelve [el resultado del pago o un error con status HTTP].
 *
 * Valida:
 * - Proveedor existe
 * - Factura existe y pertenece al proveedor
 *
 * Ejecuta en transaccion:
 * - Delega a procesarPagoProveedor() para crear PagoProveedor y efectos secundarios
 *
 * Ejemplos:
 * ejecutarPagoProveedorDirecto({ proveedorId: "p1", facturaProveedorId: "f1", ... }, "op1")
 *   // => { ok: true, result: { pagoId, nuevoEstado, resumenTarjetaId } }
 * ejecutarPagoProveedorDirecto({ proveedorId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Proveedor no encontrado" }
 */
export async function ejecutarPagoProveedorDirecto(
  data: DatosPagoProveedorDirecto,
  operadorId: string | null
): Promise<ResultadoPagoProveedorDirecto> {
  const { proveedorId, facturaProveedorId } = data
  const fechaPago = new Date(data.fecha)

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: { id: true, razonSocial: true },
  })
  if (!proveedor) return { ok: false, status: 404, error: "Proveedor no encontrado" }

  const factura = await prisma.facturaProveedor.findUnique({
    where: { id: facturaProveedorId },
    include: { pagos: { where: { anulado: false }, select: { monto: true } } },
  })
  if (!factura || factura.proveedorId !== proveedorId) {
    return { ok: false, status: 404, error: "Factura no encontrada" }
  }

  const totalPagadoAnterior = sumarImportes(factura.pagos.map((p) => p.monto))

  const result = await prisma.$transaction(async (tx) => {
    return procesarPagoProveedor(
      tx,
      {
        facturaId: factura.id,
        facturaTotal: factura.total,
        totalPagadoAnterior,
        facturaNroComprobante: factura.nroComprobante,
        proveedorId,
        proveedorRazonSocial: proveedor.razonSocial,
        operadorId,
      },
      {
        fecha: fechaPago,
        monto: data.monto,
        tipo: data.tipo,
        observaciones: data.observaciones,
        comprobantePdfS3Key: data.comprobantePdfS3Key,
        cuentaId: data.cuentaId,
        chequeRecibidoId: data.chequeRecibidoId,
        tarjetaId: data.tarjetaId,
        chequePropio: data.chequePropio ?? null,
      }
    )
  })

  return { ok: true, result }
}
