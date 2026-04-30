/**
 * recibo-cobranza-commands.ts (JM)
 *
 * Adaptado de src/lib/recibo-cobranza-commands.ts. Diferencias:
 * - prismaJm en vez de prisma.
 * - operadorEmail en vez de operadorId.
 * - faltantes sin fleteroId (JM no tiene fletero).
 * - Sin registrarMovimiento bancario (TODO cuando se sume libro de banco JM).
 * - Sin generación de PDF (TODO).
 */

import { prismaJm } from "@/jm/prisma"
import { sumarImportes, restarImportes, m } from "@/lib/money"
import { calcularSaldoCCEmpresaJm } from "@/jm/lib/cuenta-corriente"

type MedioPago = {
  tipo: "TRANSFERENCIA" | "ECHEQ" | "CHEQUE_FISICO" | "EFECTIVO" | "SALDO_CTA_CTE"
  monto: number
  cuentaId?: string
  fechaTransferencia?: string
  referencia?: string
  nroCheque?: string
  bancoEmisor?: string
  fechaEmision?: string
  fechaPago?: string
}

type FacturaAplicada = { facturaId: string; montoAplicado: number }
type NotaAplicada = { notaId: string; monto: number }
type FaltanteInput = { viajeId: string; monto: number; descripcion?: string }

export type DatosCrearReciboCobranzaJm = {
  empresaId: string
  facturasAplicadas: FacturaAplicada[]
  notasAplicadas: NotaAplicada[]
  mediosPago: MedioPago[]
  retencionGanancias: number
  retencionIIBB: number
  retencionSUSS: number
  faltantes: FaltanteInput[]
  fecha: string
}

type Resultado =
  | { ok: true; result: { id: string; nro: number } }
  | { ok: false; status: number; error: string }

export async function ejecutarCrearReciboCobranzaJm(
  data: DatosCrearReciboCobranzaJm,
  operadorEmail: string,
): Promise<Resultado> {
  const {
    empresaId, facturasAplicadas, notasAplicadas, mediosPago,
    retencionGanancias, retencionIIBB, retencionSUSS, faltantes, fecha,
  } = data

  // Validar facturas
  const facturaIds = facturasAplicadas.map((fa) => fa.facturaId)
  const facturas = await prismaJm.facturaEmitida.findMany({
    where: {
      id: { in: facturaIds },
      empresaId,
      estado: "EMITIDA",
      estadoCobro: { in: ["PENDIENTE", "PARCIALMENTE_COBRADA"] },
    },
    include: {
      pagos: { select: { monto: true } },
      notasCreditoDebito: {
        select: { id: true, tipo: true, montoTotal: true, montoDescontado: true },
      },
    },
  })

  if (facturas.length !== facturaIds.length) {
    return { ok: false, status: 400, error: "Alguna factura no existe, no pertenece a la empresa o ya fue cobrada" }
  }

  const notasById = new Map<string, { tipo: string; montoTotal: number; montoDescontado: number; facturaId: string }>()
  for (const f of facturas) {
    for (const n of f.notasCreditoDebito) {
      notasById.set(n.id, {
        tipo: n.tipo,
        montoTotal: Number(n.montoTotal),
        montoDescontado: Number(n.montoDescontado),
        facturaId: f.id,
      })
    }
  }

  for (const na of notasAplicadas) {
    const nota = notasById.get(na.notaId)
    if (!nota) return { ok: false, status: 400, error: "Una nota seleccionada no pertenece a ninguna factura del recibo" }
    const disponible = Math.max(0, restarImportes(nota.montoTotal, nota.montoDescontado))
    if (na.monto > disponible + 0.01) {
      return { ok: false, status: 400, error: `El monto aplicado de la nota ($${na.monto.toFixed(2)}) supera el disponible ($${disponible.toFixed(2)})` }
    }
  }

  const esNC = (t: string) => t === "NC_EMITIDA" || t === "NC_RECIBIDA"
  const esND = (t: string) => t === "ND_EMITIDA" || t === "ND_RECIBIDA"
  function notasDeFactura(facturaId: string) {
    return notasAplicadas.filter((na) => notasById.get(na.notaId)?.facturaId === facturaId)
  }
  function ncAplicadasNuevoEnFactura(facturaId: string) {
    return sumarImportes(notasDeFactura(facturaId).filter((na) => esNC(notasById.get(na.notaId)!.tipo)).map((na) => na.monto))
  }
  function ndAplicadasNuevoEnFactura(facturaId: string) {
    return sumarImportes(notasDeFactura(facturaId).filter((na) => esND(notasById.get(na.notaId)!.tipo)).map((na) => na.monto))
  }

  for (const fa of facturasAplicadas) {
    const factura = facturas.find((f) => f.id === fa.facturaId)!
    const totalPagado = sumarImportes(factura.pagos.map((p) => p.monto))
    const ncDescontadasPrev = sumarImportes(factura.notasCreditoDebito.filter((n) => esNC(n.tipo)).map((n) => n.montoDescontado))
    const ndDescontadasPrev = sumarImportes(factura.notasCreditoDebito.filter((n) => esND(n.tipo)).map((n) => n.montoDescontado))
    const ncNuevo = ncAplicadasNuevoEnFactura(fa.facturaId)
    const ndNuevo = ndAplicadasNuevoEnFactura(fa.facturaId)
    const deudaVigente = Math.max(
      0,
      sumarImportes([Number(factura.total), ndDescontadasPrev, ndNuevo]) - ncDescontadasPrev - ncNuevo - totalPagado,
    )
    if (fa.montoAplicado > deudaVigente + 0.01) {
      return { ok: false, status: 400, error: `El monto aplicado ($${fa.montoAplicado.toFixed(2)}) supera el saldo pendiente ($${deudaVigente.toFixed(2)}) de la factura` }
    }
  }

  const totalAplicado = sumarImportes(facturasAplicadas.map((fa) => fa.montoAplicado))
  const totalFaltantes = sumarImportes(faltantes.map((f) => f.monto))
  const totalMedios = sumarImportes(mediosPago.map((mp) => mp.monto))
  const totalRetenciones = sumarImportes([retencionGanancias, retencionIIBB, retencionSUSS])
  const montoCubrir = restarImportes(totalAplicado, totalFaltantes)
  const montoProvisto = sumarImportes([totalMedios, totalRetenciones])
  const saldoACuenta = Math.max(0, m(montoProvisto - montoCubrir))

  if (montoProvisto + 0.01 < montoCubrir) {
    return { ok: false, status: 400, error: `Los medios de pago ($${montoProvisto.toFixed(2)}) + retenciones no cubren el monto a cobrar ($${montoCubrir.toFixed(2)})` }
  }

  const totalSaldoCtaCte = sumarImportes(mediosPago.filter((mp) => mp.tipo === "SALDO_CTA_CTE").map((mp) => mp.monto))
  if (totalSaldoCtaCte > 0) {
    const cc = await calcularSaldoCCEmpresaJm(empresaId)
    if (totalSaldoCtaCte > cc.saldoAFavor + 0.01) {
      return { ok: false, status: 400, error: `El saldo a favor disponible ($${cc.saldoAFavor.toFixed(2)}) es menor al monto de Saldo Cta. Cte. ($${totalSaldoCtaCte.toFixed(2)})` }
    }
  }

  const reciboCreado = await prismaJm.$transaction(async (tx) => {
    const maxNro = await tx.reciboCobranza.aggregate({ _max: { nro: true } })
    const nro = (maxNro._max.nro ?? 0) + 1

    const recibo = await tx.reciboCobranza.create({
      data: {
        nro,
        ptoVenta: 1,
        fecha: new Date(fecha),
        empresaId,
        totalCobrado: totalMedios,
        totalRetenciones,
        totalComprobantes: totalAplicado,
        retencionGanancias,
        retencionIIBB,
        retencionSUSS,
        totalFaltantes,
        saldoACuenta,
        operadorEmail,
      },
    })

    const reciboLabel = `Recibo ${String(recibo.ptoVenta).padStart(4, "0")}-${String(nro).padStart(8, "0")}`

    for (const mp of mediosPago) {
      await tx.medioPagoRecibo.create({
        data: {
          reciboId: recibo.id,
          tipo: mp.tipo,
          monto: mp.monto,
          cuentaId: mp.cuentaId ?? null,
          fechaTransferencia: mp.fechaTransferencia ? new Date(mp.fechaTransferencia) : null,
          referencia: mp.referencia ?? null,
          nroCheque: mp.nroCheque ?? null,
          bancoEmisor: mp.bancoEmisor ?? null,
          fechaEmision: mp.fechaEmision ? new Date(mp.fechaEmision) : null,
          fechaPago: mp.fechaPago ? new Date(mp.fechaPago) : null,
        },
      })

      if (mp.tipo === "ECHEQ" || mp.tipo === "CHEQUE_FISICO") {
        await tx.chequeRecibido.create({
          data: {
            empresaId,
            nroCheque: mp.nroCheque ?? "S/N",
            bancoEmisor: mp.bancoEmisor ?? "Desconocido",
            monto: mp.monto,
            fechaEmision: mp.fechaEmision ? new Date(mp.fechaEmision) : new Date(fecha),
            fechaCobro: mp.fechaPago ? new Date(mp.fechaPago) : new Date(fecha),
            estado: "EN_CARTERA",
            esElectronico: mp.tipo === "ECHEQ",
            operadorEmail,
            reciboCobranzaId: recibo.id,
          },
        })
      }
    }

    for (const na of notasAplicadas) {
      await tx.notaAplicadaEnRecibo.create({
        data: {
          notaId: na.notaId,
          reciboId: recibo.id,
          monto: na.monto,
          fecha: new Date(fecha),
        },
      })
      await tx.notaCreditoDebito.update({
        where: { id: na.notaId },
        data: { montoDescontado: { increment: na.monto } },
      })
    }

    for (const fa of facturasAplicadas) {
      await tx.facturaEnRecibo.create({
        data: {
          reciboId: recibo.id,
          facturaId: fa.facturaId,
          montoAplicado: fa.montoAplicado,
        },
      })

      if (fa.montoAplicado > 0) {
        await tx.pagoDeEmpresa.create({
          data: {
            empresaId,
            facturaId: fa.facturaId,
            tipoPago: "RECIBO_COBRANZA",
            monto: fa.montoAplicado,
            referencia: reciboLabel,
            fechaPago: new Date(fecha),
            operadorEmail,
          },
        })
      }

      const factura = facturas.find((f) => f.id === fa.facturaId)!
      const totalPagadoPrevio = sumarImportes(factura.pagos.map((p) => p.monto))
      const totalPagadoNuevo = sumarImportes([totalPagadoPrevio, fa.montoAplicado])
      const ncDescontadasPrev = sumarImportes(factura.notasCreditoDebito.filter((n) => esNC(n.tipo)).map((n) => n.montoDescontado))
      const ndDescontadasPrev = sumarImportes(factura.notasCreditoDebito.filter((n) => esND(n.tipo)).map((n) => n.montoDescontado))
      const ncNuevo = ncAplicadasNuevoEnFactura(fa.facturaId)
      const ndNuevo = ndAplicadasNuevoEnFactura(fa.facturaId)
      const saldoFinal = sumarImportes([Number(factura.total), ndDescontadasPrev, ndNuevo]) - ncDescontadasPrev - ncNuevo - totalPagadoNuevo
      const nuevoEstado = saldoFinal <= 0.01 ? "COBRADA" : "PARCIALMENTE_COBRADA"
      await tx.facturaEmitida.update({ where: { id: fa.facturaId }, data: { estadoCobro: nuevoEstado } })
    }

    for (const f of faltantes) {
      await tx.faltanteViaje.create({
        data: {
          reciboCobranzaId: recibo.id,
          viajeId: f.viajeId,
          monto: f.monto,
          descripcion: f.descripcion ?? null,
        },
      })
    }

    if (saldoACuenta > 0) {
      await tx.pagoDeEmpresa.create({
        data: {
          empresaId,
          facturaId: null,
          tipoPago: "SALDO_A_CUENTA",
          monto: saldoACuenta,
          referencia: `Saldo a cuenta — ${reciboLabel}`,
          fechaPago: new Date(fecha),
          operadorEmail,
        },
      })
    }

    return recibo
  })

  return { ok: true, result: { id: reciboCreado.id, nro: reciboCreado.nro } }
}
