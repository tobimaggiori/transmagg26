/**
 * impuesto-commands.ts
 *
 * Lógica de negocio transaccional para registro de pagos de impuestos.
 * Valida precondiciones por medio de pago, crea el pago y los movimientos
 * bancarios correspondientes en una transacción.
 */

import { prisma } from "@/lib/prisma"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"

// ─── Tipos ───────────────────────────────────────────────────────────────────

export type DatosRegistrarPagoImpuesto = {
  tipoImpuesto: string
  descripcion?: string
  periodo: string
  monto: number
  fechaPago: string
  medioPago: string
  cuentaId?: string
  tarjetaId?: string
  comprobantePdfS3Key?: string
  observaciones?: string
}

type ResultadoPagoImpuesto =
  | { ok: true; result: unknown }
  | { ok: false; status: number; error: string }

const COMPROBANTE_PREFIX = "comprobantes-impuestos"

function tipoDisplay(tipoImpuesto: string, descripcion?: string | null): string {
  const map: Record<string, string> = {
    IIBB:      "IIBB",
    IVA:       "IVA",
    GANANCIAS: "Ganancias",
    OTRO:      descripcion ?? "Impuesto",
  }
  return map[tipoImpuesto] ?? tipoImpuesto
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarRegistrarPagoImpuesto: DatosRegistrarPagoImpuesto string -> Promise<ResultadoPagoImpuesto>
 *
 * Dado [los datos validados del pago de impuesto y el operadorId],
 * devuelve [el pago creado o un error con status HTTP].
 *
 * Valida:
 * - Campos requeridos presentes
 * - Si medioPago es CUENTA_BANCARIA: cuentaId y comprobantePdfS3Key obligatorios
 * - S3 key pertenece al prefijo correcto
 *
 * Ejecuta en transacción:
 * - Crea PagoImpuesto
 * - Si CUENTA_BANCARIA: crea MovimientoSinFactura EGRESO
 * - Si TARJETA con cuenta asociada: crea MovimientoSinFactura EGRESO
 *
 * Ejemplos:
 * ejecutarRegistrarPagoImpuesto({ tipoImpuesto: "IIBB", periodo: "2026-03", monto: 5000, ... }, "op1")
 *   // => { ok: true, result: { id, tipoImpuesto: "IIBB", ... } }
 * ejecutarRegistrarPagoImpuesto({ tipoImpuesto: "", ... }, "op1")
 *   // => { ok: false, status: 400, error: "Faltan campos requeridos" }
 */
export async function ejecutarRegistrarPagoImpuesto(
  data: DatosRegistrarPagoImpuesto,
  operadorId: string
): Promise<ResultadoPagoImpuesto> {
  const { tipoImpuesto, descripcion, periodo, monto, fechaPago, medioPago,
          cuentaId, tarjetaId, comprobantePdfS3Key, observaciones } = data

  if (!tipoImpuesto || !periodo || !monto || !fechaPago || !medioPago) {
    return { ok: false, status: 400, error: "Faltan campos requeridos" }
  }

  // Validaciones por medio de pago
  if (medioPago === "CUENTA_BANCARIA") {
    if (!cuentaId) {
      return { ok: false, status: 400, error: "Cuenta bancaria requerida" }
    }
    if (!comprobantePdfS3Key) {
      return { ok: false, status: 400, error: "Comprobante PDF obligatorio para pagos desde cuenta bancaria" }
    }
    if (!comprobantePdfS3Key.startsWith(`${COMPROBANTE_PREFIX}/`)) {
      return { ok: false, status: 400, error: "S3 key de comprobante inválida" }
    }
  }

  const pago = await prisma.$transaction(async (tx) => {
    const nuevoPago = await tx.pagoImpuesto.create({
      data: {
        tipoImpuesto,
        descripcion:         descripcion         ?? null,
        periodo,
        monto,
        fechaPago:           new Date(fechaPago),
        medioPago,
        cuentaId:            cuentaId            ?? null,
        tarjetaId:           tarjetaId           ?? null,
        comprobantePdfS3Key: comprobantePdfS3Key ?? null,
        observaciones:       observaciones       ?? null,
        operadorId,
      },
    })

    const desc = `Pago ${tipoDisplay(tipoImpuesto, descripcion)} — período ${periodo}`

    if (medioPago === "CUENTA_BANCARIA" && cuentaId) {
      await registrarMovimiento(tx, {
        cuentaId,
        tipo: "EGRESO",
        categoria: "PAGO_IMPUESTO",
        monto,
        fecha: new Date(fechaPago),
        descripcion: desc,
        pagoImpuestoId: nuevoPago.id,
        operadorCreacionId: operadorId,
      })
    }

    if (medioPago === "TARJETA" && tarjetaId) {
      // El pago con tarjeta no impacta cuenta hasta que se paga el resumen
      // de tarjeta. No se registra MovimientoCuenta acá; la conciliación
      // de tarjeta vive en su propio flujo.
    }

    return nuevoPago
  })

  return { ok: true, result: pago }
}
