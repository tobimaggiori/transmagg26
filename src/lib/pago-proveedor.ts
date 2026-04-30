/**
 * Utilidad compartida para registrar un pago a proveedor dentro de una transacción Prisma.
 * Usada tanto por POST /api/proveedores/[id]/pago como por POST /api/facturas-proveedor
 * (pago inline al ingresar factura).
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, importesIguales, m } from "@/lib/money"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

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

  // TRANSFERENCIA → MovimientoCuenta EGRESO (referenciado al PagoProveedor)
  if (input.tipo === "TRANSFERENCIA" && input.cuentaId && operadorId) {
    await registrarMovimiento(tx, {
      cuentaId: input.cuentaId,
      tipo: "EGRESO",
      categoria: "TRANSFERENCIA_ENVIADA",
      monto: input.monto,
      fecha: fechaPago,
      descripcion: `Pago factura ${facturaNroComprobante} - ${proveedorRazonSocial}`,
      pagoProveedorId: pago.id,
      operadorCreacionId: operadorId,
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

// ─── Comando batch: pagar varias facturas a un proveedor en un solo registro ──

export type MedioPagoProveedor =
  | { tipo: "TRANSFERENCIA"; monto: number; cuentaId: string; comprobantePdfS3Key?: string | null }
  | { tipo: "CHEQUE_PROPIO"; monto: number; comprobantePdfS3Key?: string | null; chequePropio: ChequePropioDatos & { cuentaId: string } }
  | { tipo: "CHEQUE_FISICO_TERCERO"; monto: number; chequeRecibidoId: string; comprobantePdfS3Key?: string | null }
  | { tipo: "CHEQUE_ELECTRONICO_TERCERO"; monto: number; chequeRecibidoId: string; comprobantePdfS3Key?: string | null }
  | { tipo: "TARJETA"; monto: number; comprobantePdfS3Key?: string | null }
  | { tipo: "EFECTIVO"; monto: number; comprobantePdfS3Key?: string | null }

export type DatosRegistrarPagosProveedor = {
  proveedorId: string
  facturaIds: string[]
  fecha: string
  observaciones?: string | null
  medios: MedioPagoProveedor[]
}

export type ResultadoRegistrarPagosProveedor =
  | { ok: true; result: { pagoIds: string[]; facturasPagadas: string[] } }
  | { ok: false; status: number; error: string }

/**
 * distribuirEnFacturas: number Map<string,number> {id:string}[] -> Array<{facturaId, monto}>
 *
 * Distribuye `monto` entre las facturas en el orden recibido (oldest-first),
 * consumiendo `saldosRestantes` (que se modifica in-place). Si tras distribuir
 * queda residuo positivo (por redondeo), se carga en el primer slice.
 */
function distribuirEnFacturas(
  monto: number,
  saldosRestantes: Map<string, number>,
  facturasOrdenadas: { id: string }[],
): Array<{ facturaId: string; monto: number }> {
  const segments: Array<{ facturaId: string; monto: number }> = []
  let restante = monto
  for (const f of facturasOrdenadas) {
    if (restante <= 0.009) break
    const saldo = saldosRestantes.get(f.id) ?? 0
    if (saldo <= 0.009) continue
    const usar = m(Math.min(restante, saldo))
    if (usar <= 0) continue
    segments.push({ facturaId: f.id, monto: usar })
    saldosRestantes.set(f.id, restarImportes(saldo, usar))
    restante = restarImportes(restante, usar)
  }
  if (restante > 0.009 && segments.length > 0) {
    segments[0].monto = m(sumarImportes([segments[0].monto, restante]))
  }
  return segments
}

/**
 * ejecutarRegistrarPagosProveedor: DatosRegistrarPagosProveedor string|null -> Promise<ResultadoRegistrarPagosProveedor>
 *
 * Registra uno o más medios de pago contra un set de facturas pendientes del proveedor.
 * Distribuye cada medio entre las facturas oldest-first y crea un PagoProveedor por slice.
 * Cada medio crea su instrumento financiero (ChequeEmitido, MovimientoCuenta) una sola vez.
 *
 * Validaciones:
 * - Proveedor existe
 * - Todas las facturas pertenecen al proveedor y tienen saldo > 0
 * - sum(medios.monto) === sum(saldos pendientes)
 *
 * Efectos:
 * - Crea N PagoProveedor (uno por slice de cada medio en cada factura)
 * - Crea ChequeEmitido por cada CHEQUE_PROPIO
 * - Endosa ChequeRecibido por cada CHEQUE_*_TERCERO
 * - Registra MovimientoCuenta EGRESO por cada TRANSFERENCIA, anclado al primer slice
 * - Actualiza estadoPago de cada factura (PAGADA o PARCIALMENTE_PAGADA)
 * - Si una factura queda PAGADA y es esPorCuentaDeFletero, marca GastoFletero PAGADO
 */
export async function ejecutarRegistrarPagosProveedor(
  data: DatosRegistrarPagosProveedor,
  operadorId: string
): Promise<ResultadoRegistrarPagosProveedor> {
  const { proveedorId, facturaIds, fecha, observaciones, medios } = data

  if (medios.length === 0) {
    return { ok: false, status: 400, error: "Debe haber al menos un medio de pago" }
  }
  if (facturaIds.length === 0) {
    return { ok: false, status: 400, error: "Debe seleccionar al menos una factura" }
  }

  const proveedor = await prisma.proveedor.findUnique({
    where: { id: proveedorId },
    select: { id: true, razonSocial: true },
  })
  if (!proveedor) return { ok: false, status: 404, error: "Proveedor no encontrado" }

  const facturas = await prisma.facturaProveedor.findMany({
    where: { id: { in: facturaIds }, proveedorId },
    include: { pagos: { where: { anulado: false }, select: { monto: true } } },
    orderBy: { fechaCbte: "asc" },
  })
  if (facturas.length !== facturaIds.length) {
    return { ok: false, status: 404, error: "Una o más facturas no pertenecen al proveedor" }
  }

  const facturasConSaldo = facturas.map((f) => {
    const totalPagado = sumarImportes(f.pagos.map((p) => p.monto))
    const saldoPendiente = restarImportes(f.total, totalPagado)
    return { id: f.id, total: f.total, totalPagado, saldoPendiente, nroComprobante: f.nroComprobante }
  })

  const sinSaldo = facturasConSaldo.find((f) => f.saldoPendiente <= 0.009)
  if (sinSaldo) {
    return { ok: false, status: 400, error: `La factura ${sinSaldo.nroComprobante} ya está pagada` }
  }

  const totalSaldos = sumarImportes(facturasConSaldo.map((f) => f.saldoPendiente))
  const totalMedios = sumarImportes(medios.map((p) => p.monto))
  if (!importesIguales(totalMedios, totalSaldos)) {
    return {
      ok: false,
      status: 400,
      error: `El total de los medios de pago (${totalMedios.toFixed(2)}) debe igualar al saldo pendiente total (${totalSaldos.toFixed(2)})`,
    }
  }

  const fechaPago = new Date(fecha)
  const facturasOrdenadas = facturasConSaldo.map((f) => ({ id: f.id }))

  try {
    const resultado = await prisma.$transaction(async (tx) => {
      const pagoIds: string[] = []
      const saldosRestantes = new Map<string, number>(
        facturasConSaldo.map((f) => [f.id, f.saldoPendiente])
      )

      for (const medio of medios) {
        // Instrumento financiero one-shot por medio
        let chequeEmitidoId: string | undefined

        if (medio.tipo === "CHEQUE_PROPIO") {
          const ch = medio.chequePropio
          if (ch.nroCheque) {
            const existing = await tx.chequeEmitido.findFirst({
              where: { nroCheque: ch.nroCheque, cuentaId: ch.cuentaId },
              select: { id: true },
            })
            if (existing) throw new Error(`DUPLICATE_CHEQUE:${ch.nroCheque}`)
          }
          const nuevoCheque = await tx.chequeEmitido.create({
            data: {
              proveedorId,
              cuentaId: ch.cuentaId,
              nroCheque: ch.nroCheque ?? null,
              tipoDocBeneficiario: ch.tipoDocBeneficiario,
              nroDocBeneficiario: ch.nroDocBeneficiario,
              mailBeneficiario: ch.mailBeneficiario ?? null,
              monto: medio.monto,
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
          chequeEmitidoId = nuevoCheque.id
        }

        if (medio.tipo === "CHEQUE_FISICO_TERCERO" || medio.tipo === "CHEQUE_ELECTRONICO_TERCERO") {
          await tx.chequeRecibido.update({
            where: { id: medio.chequeRecibidoId },
            data: {
              estado: "ENDOSADO_PROVEEDOR",
              endosadoATipo: "PROVEEDOR",
              endosadoAProveedorId: proveedorId,
            },
          })
        }

        const slices = distribuirEnFacturas(medio.monto, saldosRestantes, facturasOrdenadas)
        let primerPagoIdParaMov: string | null = null

        for (const slice of slices) {
          const pago = await tx.pagoProveedor.create({
            data: {
              facturaProveedorId: slice.facturaId,
              fecha: fechaPago,
              monto: slice.monto,
              tipo: medio.tipo,
              observaciones: observaciones ?? null,
              comprobantePdfS3Key: medio.comprobantePdfS3Key ?? null,
              cuentaId:
                medio.tipo === "TRANSFERENCIA"
                  ? medio.cuentaId
                  : medio.tipo === "CHEQUE_PROPIO"
                    ? medio.chequePropio.cuentaId
                    : null,
              chequeRecibidoId:
                medio.tipo === "CHEQUE_FISICO_TERCERO" || medio.tipo === "CHEQUE_ELECTRONICO_TERCERO"
                  ? medio.chequeRecibidoId
                  : null,
              chequeEmitidoId: medio.tipo === "CHEQUE_PROPIO" ? (chequeEmitidoId ?? null) : null,
              tarjetaId: null,
              resumenTarjetaId: null,
              operadorId,
            },
          })
          pagoIds.push(pago.id)
          if (primerPagoIdParaMov === null) primerPagoIdParaMov = pago.id
        }

        if (medio.tipo === "TRANSFERENCIA" && primerPagoIdParaMov && operadorId) {
          const facturasNros = facturasConSaldo.map((f) => f.nroComprobante).join(", ")
          await registrarMovimiento(tx, {
            cuentaId: medio.cuentaId,
            tipo: "EGRESO",
            categoria: "TRANSFERENCIA_ENVIADA",
            monto: medio.monto,
            fecha: fechaPago,
            descripcion:
              facturasConSaldo.length === 1
                ? `Pago factura ${facturasNros} - ${proveedor.razonSocial}`
                : `Pago facturas ${facturasNros} - ${proveedor.razonSocial}`,
            pagoProveedorId: primerPagoIdParaMov,
            operadorCreacionId: operadorId,
          })
        }
      }

      // Actualizar estadoPago de cada factura y propagar a GastoFletero si corresponde
      const facturasPagadas: string[] = []
      for (const f of facturasConSaldo) {
        const restante = saldosRestantes.get(f.id) ?? 0
        const pagada = restante <= 0.009
        const nuevoEstado = pagada ? "PAGADA" : "PARCIALMENTE_PAGADA"

        await tx.facturaProveedor.update({
          where: { id: f.id },
          data: { estadoPago: nuevoEstado },
        })

        if (pagada) {
          facturasPagadas.push(f.id)
          const gasto = await tx.gastoFletero.findUnique({
            where: { facturaProveedorId: f.id },
            select: { id: true, estado: true },
          })
          if (gasto && gasto.estado === "PENDIENTE_PAGO") {
            await tx.gastoFletero.update({ where: { id: gasto.id }, data: { estado: "PAGADO" } })
          }
        }
      }

      return { pagoIds, facturasPagadas }
    })

    return { ok: true, result: resultado }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("DUPLICATE_CHEQUE:")) {
      const nro = error.message.split(":")[1]
      return { ok: false, status: 409, error: `El cheque N° ${nro} ya existe para esa cuenta` }
    }
    throw error
  }
}
