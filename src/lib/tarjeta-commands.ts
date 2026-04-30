/**
 * tarjeta-commands.ts
 *
 * Lógica de negocio transaccional para operaciones con tarjetas:
 * - Resumen de tarjeta de aseguradora (pago de cuotas de seguro)
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

// ─── Tipos comunes ──────────────────────────────────────────────────────────

type ResultadoOk<T> = { ok: true; result: T }
type ResultadoError = { ok: false; status: number; error: string }

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

      // 5. Registrar MovimientoCuenta EGRESO (esManual: el pago de resumen de
      //    tarjeta no tiene entidad pagoX dedicada; el link al ResumenTarjeta
      //    queda implícito via la cuenta y descripción)
      await registrarMovimiento(tx, {
        cuentaId: data.cuentaPagoId,
        tipo: "EGRESO",
        categoria: "PAGO_TARJETA",
        monto: totalCuotas,
        fecha: new Date(data.fechaPago),
        descripcion: `Pago resumen tarjeta ${tarjeta.nombre} ${data.mesAnio}`,
        esManual: true,
        operadorCreacionId: operadorId,
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
