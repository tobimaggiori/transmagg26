/**
 * pago-fletero-directo-commands.ts
 *
 * Logica de negocio transaccional para registrar un pago directo a fletero
 * contra multiples liquidaciones, distribuyendo proporcionalmente por saldo.
 * Maneja transferencias, cheques propios, cheques de tercero y efectivo.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes, restarImportes, maxMonetario, multiplicarImporte } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ItemTransferencia = {
  tipo: "TRANSFERENCIA"
  monto: number
  cuentaId: string
}

type ItemChequePropio = {
  tipo: "CHEQUE_PROPIO"
  monto: number
  cuentaId: string
  nroChequePropioEmitir?: string
  fechaPagoChequePropioEmitir: string
}

type ItemChequeTercero = {
  tipo: "CHEQUE_TERCERO"
  monto: number
  chequeRecibidoId: string
}

type ItemEfectivo = {
  tipo: "EFECTIVO"
  monto: number
}

type ItemPago = ItemTransferencia | ItemChequePropio | ItemChequeTercero | ItemEfectivo

export type DatosPagoFleteroDirecto = {
  fleteroId: string
  fechaPago: string
  observaciones?: string
  liquidacionIds: string[]
  items: ItemPago[]
}

type ResultadoPagoFletero =
  | { ok: true; result: { ok: true; pagosCreados: number } }
  | { ok: false; status: number; error: string }

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarPagoFleteroDirecto: DatosPagoFleteroDirecto string -> Promise<ResultadoPagoFletero>
 *
 * Dado [los datos validados del pago y el operadorId],
 * devuelve [el resultado del pago o un error con status HTTP].
 *
 * Valida:
 * - Fletero existe
 * - Todas las liquidaciones existen, pertenecen al fletero y estan en estado pagable
 * - Hay saldo pendiente
 * - Cheques de tercero estan EN_CARTERA
 * - Cuentas de CHEQUE_PROPIO tienen chequera
 *
 * Ejecuta en transaccion:
 * - Efectos secundarios por item (movimientos, cheques emitidos, endosos)
 * - Crea PagoAFletero por item x liquidacion (prorrateado)
 * - Actualiza estado de cada liquidacion
 *
 * Ejemplos:
 * ejecutarPagoFleteroDirecto({ fleteroId: "f1", liquidacionIds: ["l1"], items: [...], ... }, "op1")
 *   // => { ok: true, result: { ok: true, pagosCreados: 1 } }
 * ejecutarPagoFleteroDirecto({ fleteroId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Fletero no encontrado" }
 */
export async function ejecutarPagoFleteroDirecto(
  data: DatosPagoFleteroDirecto,
  operadorId: string
): Promise<ResultadoPagoFletero> {
  const { fleteroId, fechaPago, observaciones, liquidacionIds, items } = data

  const fletero = await prisma.fletero.findUnique({
    where: { id: fleteroId },
    select: { id: true, razonSocial: true, cuit: true },
  })
  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }

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
    return { ok: false, status: 400, error: "Una o mas liquidaciones no encontradas o no estan en estado pagable" }
  }

  // Calcular saldo pendiente por liquidacion
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
    const totalPagado = sumarImportes(liq.pagos.map((p) => p.monto))
    return {
      id: liq.id,
      total: liq.total,
      estado: liq.estado,
      nroComprobante: liq.nroComprobante,
      ptoVenta: liq.ptoVenta,
      totalPagado,
      saldoPendiente: maxMonetario(0, restarImportes(liq.total, totalPagado)),
    }
  })

  const totalSaldo = sumarImportes(liqs.map((l) => l.saldoPendiente))
  if (totalSaldo <= 0) return { ok: false, status: 400, error: "Las liquidaciones seleccionadas no tienen saldo pendiente" }

  const totalPago = sumarImportes(items.map((i) => i.monto))
  if (totalPago <= 0) return { ok: false, status: 400, error: "El total del pago debe ser mayor a 0" }

  const fechaPagoDate = new Date(fechaPago)

  // Validar cheques de tercero: deben estar EN_CARTERA
  const chequesTerceroIds = items
    .filter((i): i is ItemChequeTercero => i.tipo === "CHEQUE_TERCERO")
    .map((i) => i.chequeRecibidoId)

  if (chequesTerceroIds.length > 0) {
    const chequesDB = await prisma.chequeRecibido.findMany({
      where: { id: { in: chequesTerceroIds } },
      select: { id: true, estado: true, monto: true },
    })
    for (const ch of chequesDB) {
      if (ch.estado !== "EN_CARTERA") {
        return { ok: false, status: 400, error: `El cheque recibido ${ch.id} no esta en cartera` }
      }
    }
  }

  // Validar cuentas con chequera para CHEQUE_PROPIO
  const cuentasChequera = items
    .filter((i): i is ItemChequePropio => i.tipo === "CHEQUE_PROPIO")
    .map((i) => i.cuentaId)

  if (cuentasChequera.length > 0) {
    const cuentasDB = await prisma.cuenta.findMany({
      where: { id: { in: cuentasChequera } },
      select: { id: true, tieneChequera: true, tieneImpuestoDebcred: true, alicuotaImpuesto: true },
    })
    for (const c of cuentasDB) {
      if (!c.tieneChequera) {
        return { ok: false, status: 400, error: `La cuenta ${c.id} no tiene chequera` }
      }
    }
  }

  let pagosCreados = 0

  await prisma.$transaction(async (tx) => {
    // ── Efectos secundarios por item (una sola vez) ──────────────────────────

    // Mapa itemIdx -> chequeEmitidoId (para CHEQUE_PROPIO)
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
        // Emitir el ECheq vinculado a la primera liquidacion del lote
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

    // ── Crear PagoAFletero por cada item x cada liquidacion (prorrateado) ──

    for (const liq of liqs) {
      // Proporcion de esta liquidacion sobre el total del saldo
      const proporcion = totalSaldo > 0 ? liq.saldoPendiente / totalSaldo : 1 / liqs.length

      for (let idx = 0; idx < items.length; idx++) {
        const item = items[idx]
        const montoParaEstaLiq = multiplicarImporte(item.monto, proporcion)

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

      // Determinar nuevo estado de la liquidacion
      const montoTotalParaEstaLiq = multiplicarImporte(totalPago, proporcion)
      const nuevoPagado = sumarImportes([liq.totalPagado, montoTotalParaEstaLiq])
      const nuevoEstado = nuevoPagado >= liq.total ? "PAGADA" : "PARCIALMENTE_PAGADA"

      await tx.liquidacion.update({
        where: { id: liq.id },
        data: { estado: nuevoEstado },
      })
    }
  })

  return { ok: true, result: { ok: true, pagosCreados } }
}
