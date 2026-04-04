/**
 * cheque-commands.ts
 *
 * Lógica de negocio transaccional para operaciones con cheques recibidos.
 * Valida precondiciones, ejecuta la transacción y crea los movimientos
 * bancarios correspondientes.
 */

import { prisma } from "@/lib/prisma"
import { aplicarPorcentaje, restarImportes } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosDescontarChequeBanco = {
  chequeId: string
  cuentaId: string
  tasaDescuento: number
  fecha: string
}

type ResultadoDescontarCheque =
  | { ok: true; result: { cheque: unknown; movIngreso: unknown; movEgreso: unknown; neto: number; comision: number } }
  | { ok: false; status: number; error: string }

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarDescontarChequeBanco: DatosDescontarChequeBanco string -> Promise<ResultadoDescontarCheque>
 *
 * Dado [los datos validados del descuento de cheque y el operadorId],
 * devuelve [el cheque actualizado con sus movimientos o un error con status HTTP].
 *
 * Valida:
 * - Cheque existe
 * - Cheque está EN_CARTERA
 * - Cuenta existe
 *
 * Ejecuta en transacción:
 * - Actualiza cheque a DESCONTADO_BANCO
 * - Crea MovimientoSinFactura INGRESO por el neto
 * - Crea MovimientoSinFactura EGRESO por la comisión bancaria
 *
 * Ejemplos:
 * ejecutarDescontarChequeBanco({ chequeId: "c1", cuentaId: "cu1", tasaDescuento: 5, fecha: "2026-04-01" }, "op1")
 *   // => { ok: true, result: { cheque: {...}, movIngreso: {...}, movEgreso: {...}, neto: 950, comision: 50 } }
 * ejecutarDescontarChequeBanco({ chequeId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Cheque recibido no encontrado" }
 */
export async function ejecutarDescontarChequeBanco(
  data: DatosDescontarChequeBanco,
  operadorId: string
): Promise<ResultadoDescontarCheque> {
  const cheque = await prisma.chequeRecibido.findUnique({
    where: { id: data.chequeId },
    include: { empresa: { select: { razonSocial: true } } },
  })
  if (!cheque) return { ok: false, status: 404, error: "Cheque recibido no encontrado" }
  if (cheque.estado !== "EN_CARTERA") return { ok: false, status: 400, error: "El cheque no está EN_CARTERA" }

  const cuenta = await prisma.cuenta.findUnique({ where: { id: data.cuentaId }, select: { id: true } })
  if (!cuenta) return { ok: false, status: 404, error: "Cuenta no encontrado" }

  const fecha = new Date(data.fecha)
  const comision = aplicarPorcentaje(cheque.monto, data.tasaDescuento)
  const neto = restarImportes(cheque.monto, comision)

  const resultado = await prisma.$transaction(async (tx) => {
    const chequeActualizado = await tx.chequeRecibido.update({
      where: { id: data.chequeId },
      data: {
        estado: "DESCONTADO_BANCO",
        cuentaDepositoId: data.cuentaId,
        tasaDescuento: data.tasaDescuento,
        fechaAcreditacion: fecha,
      },
    })

    const movIngreso = await tx.movimientoSinFactura.create({
      data: {
        cuentaId: data.cuentaId,
        tipo: "INGRESO",
        categoria: "DESCUENTO_CHEQUE_BANCO",
        monto: neto,
        fecha,
        descripcion: `Descuento cheque ${cheque.nroCheque}${cheque.empresa ? ` — ${cheque.empresa.razonSocial}` : ""} (tasa ${data.tasaDescuento}%)`,
        referencia: cheque.nroCheque,
        operadorId,
      },
    })

    const movEgreso = await tx.movimientoSinFactura.create({
      data: {
        cuentaId: data.cuentaId,
        tipo: "EGRESO",
        categoria: "OTRO",
        monto: comision,
        fecha,
        descripcion: `Comisión descuento cheque ${cheque.nroCheque}${cheque.empresa ? ` — ${cheque.empresa.razonSocial}` : ""}`,
        referencia: cheque.nroCheque,
        operadorId,
      },
    })

    return { cheque: chequeActualizado, movIngreso, movEgreso, neto, comision }
  })

  return { ok: true, result: resultado }
}
