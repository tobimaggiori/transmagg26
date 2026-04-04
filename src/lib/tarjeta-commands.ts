/**
 * tarjeta-commands.ts
 *
 * Lógica de negocio transaccional para operaciones con tarjetas:
 * - Cierre de resumen de tarjeta (pago de facturas)
 * - Resumen de tarjeta de aseguradora (pago de cuotas de seguro)
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"

// ─── Tipos comunes ──────────────────────────────────────────────────────────

type ResultadoOk<T> = { ok: true; result: T }
type ResultadoError = { ok: false; status: number; error: string }

// ─── Cierre Resumen Tarjeta ─────────────────────────────────────────────────

export type PagoCierreInput = {
  facturaId: string
  tipo: "PROVEEDOR" | "SEGURO"
  montoPagado: number
}

export type DatosCierreResumenTarjeta = {
  tarjetaId: string
  mesAnio: string
  cuentaPagoId: string
  fechaPago: string
  pdfS3Key?: string | null
  diferencia: number
  descripcionDiferencia?: string | null
  pagos: PagoCierreInput[]
}

type ResultadoCierreResumen = ResultadoOk<unknown> | ResultadoError

/**
 * ejecutarCierreResumenTarjeta: DatosCierreResumenTarjeta string -> Promise<ResultadoCierreResumen>
 *
 * Dado [los datos validados del cierre de resumen y el operadorId],
 * devuelve [el cierre creado o un error con status HTTP].
 *
 * Ejecuta en transacción:
 * - Crea CierreResumenTarjeta
 * - Crea PagoFacturaTarjeta por cada factura
 * - Actualiza estadoPago de cada factura (PAGADA o PAGADA_PARCIAL)
 * - Crea MovimientoSinFactura EGRESO en la cuenta de pago
 *
 * Ejemplos:
 * ejecutarCierreResumenTarjeta({ tarjetaId: "t1", mesAnio: "2026-03", ... }, "op1")
 *   // => { ok: true, result: { id, tarjetaId, ... } }
 */
export async function ejecutarCierreResumenTarjeta(
  data: DatosCierreResumenTarjeta,
  operadorId: string
): Promise<ResultadoCierreResumen> {
  const sumaFacturas = sumarImportes(data.pagos.map((p) => p.montoPagado))
  const diferencia = data.diferencia ?? 0
  const totalPagado = sumarImportes([sumaFacturas, diferencia])

  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear CierreResumenTarjeta
    const cierre = await tx.cierreResumenTarjeta.create({
      data: {
        tarjetaId: data.tarjetaId,
        mesAnio: data.mesAnio,
        totalPagado,
        diferencia,
        descripcionDiferencia: data.descripcionDiferencia ?? null,
        cuentaPagoId: data.cuentaPagoId,
        fechaPago: new Date(data.fechaPago),
        pdfS3Key: data.pdfS3Key ?? null,
        operadorId,
      },
    })

    // 2. Crear PagoFacturaTarjeta por cada factura incluida
    for (const pago of data.pagos) {
      await tx.pagoFacturaTarjeta.create({
        data: {
          cierreResumenId: cierre.id,
          facturaProveedorId: pago.tipo === "PROVEEDOR" ? pago.facturaId : null,
          facturaSeguroId: pago.tipo === "SEGURO" ? pago.facturaId : null,
          montoPagado: pago.montoPagado,
        },
      })

      // 3. Actualizar estadoPago de cada factura
      if (pago.tipo === "PROVEEDOR") {
        const factura = await tx.facturaProveedor.findUniqueOrThrow({ where: { id: pago.facturaId } })
        const totalPagadoFactura = (
          await tx.pagoFacturaTarjeta.aggregate({
            where: { facturaProveedorId: pago.facturaId },
            _sum: { montoPagado: true },
          })
        )._sum.montoPagado ?? 0
        const nuevoEstado = totalPagadoFactura >= factura.total ? "PAGADA" : "PAGADA_PARCIAL"
        await tx.facturaProveedor.update({
          where: { id: pago.facturaId },
          data: { estadoPago: nuevoEstado },
        })
      } else {
        const factura = await tx.facturaSeguro.findUniqueOrThrow({ where: { id: pago.facturaId } })
        const totalPagadoFactura = (
          await tx.pagoFacturaTarjeta.aggregate({
            where: { facturaSeguroId: pago.facturaId },
            _sum: { montoPagado: true },
          })
        )._sum.montoPagado ?? 0
        const nuevoEstado = totalPagadoFactura >= factura.total ? "PAGADA" : "PAGADA_PARCIAL"
        await tx.facturaSeguro.update({
          where: { id: pago.facturaId },
          data: { estadoPago: nuevoEstado },
        })
      }
    }

    // 4. Crear MovimientoSinFactura EGRESO en la cuenta de pago
    const tarjeta = await tx.tarjeta.findUniqueOrThrow({ where: { id: data.tarjetaId } })
    await tx.movimientoSinFactura.create({
      data: {
        cuentaId: data.cuentaPagoId,
        tipo: "EGRESO",
        categoria: "PAGO_TARJETA",
        monto: totalPagado,
        fecha: new Date(data.fechaPago),
        descripcion: `Cierre resumen ${tarjeta.nombre} — ${data.mesAnio}`,
        tarjetaId: data.tarjetaId,
        operadorId,
      },
    })

    return cierre
  })

  return { ok: true, result }
}

// ─── Resumen Tarjeta Aseguradora ────────────────────────────────────────────

export type DatosResumenTarjetaAseguradora = {
  tarjetaId: string
  mesAnio: string
  cuentaPagoId: string
  fechaPago: string
}

type ResultadoResumenAseguradora = ResultadoOk<unknown> | ResultadoError

/**
 * ejecutarResumenTarjetaAseguradora: DatosResumenTarjetaAseguradora string -> Promise<ResultadoResumenAseguradora>
 *
 * Dado [los datos del resumen de tarjeta de aseguradora y el operadorId],
 * devuelve [el resumen creado/actualizado o un error con status HTTP].
 *
 * Valida:
 * - Tarjeta existe
 * - Existen cuotas pendientes para el período y tarjeta
 *
 * Ejecuta en transacción:
 * - Busca cuotas pendientes
 * - Crea o actualiza ResumenTarjeta
 * - Marca cuotas como PAGADA
 * - Crea MovimientoSinFactura EGRESO
 *
 * Ejemplos:
 * ejecutarResumenTarjetaAseguradora({ tarjetaId: "t1", mesAnio: "2026-03", ... }, "op1")
 *   // => { ok: true, result: { id, tarjetaId, ... } }
 * ejecutarResumenTarjetaAseguradora({ tarjetaId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 400, error: "Tarjeta no encontrada" }
 */
export async function ejecutarResumenTarjetaAseguradora(
  data: DatosResumenTarjetaAseguradora,
  operadorId: string
): Promise<ResultadoResumenAseguradora> {
  const tarjeta = await prisma.tarjeta.findUnique({ where: { id: data.tarjetaId } })
  if (!tarjeta) return { ok: false, status: 400, error: "Tarjeta no encontrada" }

  try {
    const resumen = await prisma.$transaction(async (tx) => {
      // 1. Buscar cuotas pendientes para la tarjeta y mes
      const cuotas = await tx.cuotaFacturaSeguro.findMany({
        where: {
          tarjetaId: data.tarjetaId,
          mesAnio: data.mesAnio,
          estado: "PENDIENTE",
        },
      })

      if (cuotas.length === 0) {
        throw new Error("No hay cuotas pendientes para este período y tarjeta")
      }

      // 2. Sumar montos
      const totalCuotas = sumarImportes(cuotas.map((c) => c.monto))

      // 3. Crear o actualizar ResumenTarjeta
      const resumenExistente = await tx.resumenTarjeta.findFirst({
        where: { tarjetaId: data.tarjetaId, periodo: data.mesAnio },
      })

      const nuevoResumen = resumenExistente
        ? await tx.resumenTarjeta.update({
            where: { id: resumenExistente.id },
            data: {
              totalARS: totalCuotas,
              pagado: true,
              fechaVtoPago: new Date(data.fechaPago),
            },
          })
        : await tx.resumenTarjeta.create({
            data: {
              tarjetaId: data.tarjetaId,
              periodo: data.mesAnio,
              totalARS: totalCuotas,
              pagado: true,
              fechaVtoPago: new Date(data.fechaPago),
            },
          })

      // 4. Marcar cuotas como PAGADA y vincular al resumen
      await tx.cuotaFacturaSeguro.updateMany({
        where: {
          tarjetaId: data.tarjetaId,
          mesAnio: data.mesAnio,
          estado: "PENDIENTE",
        },
        data: {
          estado: "PAGADA",
          resumenTarjetaId: nuevoResumen.id,
        },
      })

      // 5. Crear MovimientoSinFactura EGRESO
      await tx.movimientoSinFactura.create({
        data: {
          cuentaId: data.cuentaPagoId,
          tipo: "EGRESO",
          categoria: "PAGO_TARJETA",
          monto: totalCuotas,
          fecha: new Date(data.fechaPago),
          descripcion: `Pago resumen tarjeta ${tarjeta.nombre} ${data.mesAnio}`,
          operadorId,
        },
      })

      return nuevoResumen
    })

    return { ok: true, result: resumen }
  } catch (error) {
    if (error instanceof Error && error.message.includes("No hay cuotas")) {
      return { ok: false, status: 400, error: error.message }
    }
    throw error
  }
}
