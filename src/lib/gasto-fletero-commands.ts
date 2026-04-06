/**
 * gasto-fletero-commands.ts
 *
 * Logica de negocio transaccional para creacion de gastos de fletero.
 * Un gasto de fletero es una factura de proveedor que Transmagg paga
 * por cuenta del fletero. La deuda queda registrada en GastoFletero.
 */

import { prisma } from "@/lib/prisma"
import { sumarImportes } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type ItemInput = {
  descripcion: string
  monto: number
}

export type DatosCrearGastoFletero = {
  fleteroId: string
  proveedorId: string
  tipoCbte: "A" | "B" | "C" | "M" | "X" | "LIQ_PROD"
  ptoVenta: string
  nroComprobante: string
  fechaComprobante: string
  tipo: "COMBUSTIBLE" | "OTRO"
  items: ItemInput[]
}

type ResultadoGastoFletero =
  | {
      ok: true
      result: {
        gastoId: string
        facturaProveedorId: string
        total: number
        nroComprobante: string
      }
    }
  | { ok: false; status: number; error: string }

// ─── Gasto sin factura ──────────────────────────────────────────────────────

export type DatosCrearGastoSinFactura = {
  fleteroId: string
  tipo: "COMBUSTIBLE" | "OTRO"
  descripcion: string
  monto: number
}

type ResultadoGastoSinFactura =
  | { ok: true; result: { gastoId: string; monto: number; descripcion: string } }
  | { ok: false; status: number; error: string }

/**
 * ejecutarCrearGastoSinFactura: DatosCrearGastoSinFactura -> Promise<ResultadoGastoSinFactura>
 *
 * Dado [los datos de un gasto sin factura],
 * devuelve [el gasto creado o un error con status HTTP].
 *
 * Crea un GastoFletero con sinFactura=true, sin FacturaProveedor, sin impacto en CC.
 * El gasto queda en estado PENDIENTE_DESCUENTO (listo para descontar en la OP).
 */
export async function ejecutarCrearGastoSinFactura(
  data: DatosCrearGastoSinFactura
): Promise<ResultadoGastoSinFactura> {
  const fletero = await prisma.fletero.findUnique({
    where: { id: data.fleteroId, activo: true },
  })
  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }

  const gasto = await prisma.gastoFletero.create({
    data: {
      fleteroId: data.fleteroId,
      facturaProveedorId: null,
      sinFactura: true,
      tipo: data.tipo,
      descripcion: data.descripcion,
      montoPagado: data.monto,
      montoDescontado: 0,
      estado: "PENDIENTE_DESCUENTO",
    },
  })

  return {
    ok: true,
    result: { gastoId: gasto.id, monto: data.monto, descripcion: data.descripcion },
  }
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearGastoFletero: DatosCrearGastoFletero -> Promise<ResultadoGastoFletero>
 *
 * Dado [los datos validados del gasto de fletero],
 * devuelve [el gasto y factura creados o un error con status HTTP].
 *
 * Valida:
 * - Fletero existe y esta activo
 * - Proveedor existe y esta activo
 *
 * Ejecuta en transaccion:
 * - Crea FacturaProveedor (sin PDF, marcada como por cuenta de fletero)
 * - Crea ItemFacturaProveedor por cada item
 * - Crea GastoFletero en estado PENDIENTE_PAGO
 *
 * Ejemplos:
 * ejecutarCrearGastoFletero({ fleteroId: "f1", proveedorId: "p1", items: [...], ... })
 *   // => { ok: true, result: { gastoId, facturaProveedorId, total, nroComprobante } }
 * ejecutarCrearGastoFletero({ fleteroId: "noexiste", ... })
 *   // => { ok: false, status: 404, error: "Fletero no encontrado" }
 */
export async function ejecutarCrearGastoFletero(
  data: DatosCrearGastoFletero
): Promise<ResultadoGastoFletero> {
  const [fletero, proveedor] = await Promise.all([
    prisma.fletero.findUnique({ where: { id: data.fleteroId, activo: true } }),
    prisma.proveedor.findUnique({ where: { id: data.proveedorId, activo: true } }),
  ])

  if (!fletero) return { ok: false, status: 404, error: "Fletero no encontrado" }
  if (!proveedor) return { ok: false, status: 404, error: "Proveedor no encontrado" }

  const itemsCalculados = data.items.map((item) => ({
    descripcion: item.descripcion,
    cantidad: 1,
    precioUnitario: item.monto,
    alicuotaIva: 0,
    esExento: false,
    subtotalNeto: item.monto,
    montoIva: 0,
    subtotalTotal: item.monto,
  }))

  const total = sumarImportes(itemsCalculados.map((i) => i.subtotalTotal))

  const nroComprobanteFormateado =
    data.ptoVenta.padStart(4, "0") + "-" + data.nroComprobante.padStart(8, "0")

  const result = await prisma.$transaction(async (tx) => {
    const factura = await tx.facturaProveedor.create({
      data: {
        proveedorId: data.proveedorId,
        nroComprobante: nroComprobanteFormateado,
        ptoVenta: data.ptoVenta.padStart(4, "0"),
        tipoCbte: data.tipoCbte,
        neto: total,
        ivaMonto: 0,
        total,
        fechaCbte: new Date(data.fechaComprobante),
        esPorCuentaDeFletero: true,
        fleteroId: data.fleteroId,
        tipoGastoFletero: data.tipo,
      },
    })

    await tx.itemFacturaProveedor.createMany({
      data: itemsCalculados.map((item) => ({
        facturaProveedorId: factura.id,
        ...item,
      })),
    })

    const gasto = await tx.gastoFletero.create({
      data: {
        fleteroId: data.fleteroId,
        facturaProveedorId: factura.id,
        tipo: data.tipo,
        montoPagado: total,
        montoDescontado: 0,
        estado: "PENDIENTE_PAGO",
      },
    })

    return { gasto, factura }
  })

  return {
    ok: true,
    result: {
      gastoId: result.gasto.id,
      facturaProveedorId: result.factura.id,
      total: result.factura.total,
      nroComprobante: result.factura.nroComprobante,
    },
  }
}
