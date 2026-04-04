/**
 * factura-proveedor-commands.ts
 *
 * Logica de negocio transaccional para creacion de facturas de proveedor.
 * Valida precondiciones, calcula totales por item con IVA individual,
 * genera asientos IVA compras agrupados por alicuota, percepciones
 * y opcionalmente registra un pago inline, todo en una transaccion atomica.
 */

import { prisma } from "@/lib/prisma"
import { procesarPagoProveedor } from "@/lib/pago-proveedor"
import { sumarImportes, multiplicarImporte, calcularIva } from "@/lib/money"

// ─── Tipos ───────────────────────────────────────────────────────────────────

/** Tipos de comprobante que discriminan IVA */
const TIPOS_CON_IVA = new Set(["A", "M", "LIQ_PROD"])

type ItemInput = {
  descripcion: string
  cantidad: number
  precioUnitario: number
  alicuotaIva: number
  esExento: boolean
}

type PercepcionInput = {
  tipo: string
  categoria: "PERCEPCION" | "IMPUESTO_INTERNO"
  descripcion?: string | null
  monto: number
}

type PagoInlineInput = {
  fecha: string
  monto: number
  tipo: "TRANSFERENCIA" | "CHEQUE_PROPIO" | "CHEQUE_FISICO_TERCERO" | "CHEQUE_ELECTRONICO_TERCERO" | "TARJETA" | "EFECTIVO"
  observaciones?: string | null
  comprobantePdfS3Key?: string | null
  cuentaId?: string | null
  chequeRecibidoId?: string | null
  tarjetaId?: string | null
  chequePropio?: {
    nroCheque?: string | null
    tipoDocBeneficiario: string
    nroDocBeneficiario: string
    mailBeneficiario?: string | null
    fechaEmision: string
    fechaPago: string
    clausula?: string | null
    descripcion1?: string | null
    descripcion2?: string | null
  } | null
}

export type DatosCrearFacturaProveedor = {
  proveedorId: string
  tipoCbte: "A" | "B" | "C" | "M" | "X" | "LIQ_PROD"
  ptoVenta: string
  nroComprobante: string
  fechaComprobante: string
  concepto?: string
  percepcionIIBB?: number
  percepcionIVA?: number
  percepcionGanancias?: number
  pdfS3Key: string
  items: ItemInput[]
  percepciones?: PercepcionInput[]
  pago?: PagoInlineInput | null
}

type ResultadoFacturaProveedor =
  | {
      ok: true
      result: {
        id: string
        nroComprobante: string
        total: number
        itemsCount: number
        asientosCount: number
        estadoPago: string
        pagoRegistrado: number | null
      }
    }
  | { ok: false; status: number; error: string }

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearFacturaProveedor: DatosCrearFacturaProveedor string|undefined -> Promise<ResultadoFacturaProveedor>
 *
 * Dado [los datos validados de la factura de proveedor y el operadorId],
 * devuelve [la factura creada con sus totales o un error con status HTTP].
 *
 * Valida:
 * - Items B/C/X no deben tener IVA
 * - Proveedor existe y esta activo
 *
 * Ejecuta en transaccion:
 * - Crea FacturaProveedor con totales calculados
 * - Crea ItemFacturaProveedor por cada item
 * - Crea AsientoIva agrupado por alicuota (solo A/M/LIQ_PROD)
 * - Crea PercepcionImpuesto adicionales
 * - Procesa pago inline (opcional)
 *
 * Ejemplos:
 * ejecutarCrearFacturaProveedor({ proveedorId: "p1", tipoCbte: "A", items: [...], ... }, "op1")
 *   // => { ok: true, result: { id, nroComprobante, total, ... } }
 * ejecutarCrearFacturaProveedor({ proveedorId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 404, error: "Proveedor no encontrado" }
 */
export async function ejecutarCrearFacturaProveedor(
  data: DatosCrearFacturaProveedor,
  operadorId: string | undefined
): Promise<ResultadoFacturaProveedor> {
  const discriminaIVA = TIPOS_CON_IVA.has(data.tipoCbte)

  // Validar regla B/C/X: items deben tener alicuotaIva=0 y no esExento=true
  if (!discriminaIVA) {
    const itemsConIVA = data.items.filter((i) => i.alicuotaIva !== 0 || i.esExento)
    if (itemsConIVA.length > 0) {
      return {
        ok: false,
        status: 400,
        error: `Facturas tipo ${data.tipoCbte} no discriminan IVA. Todos los items deben tener alicuota 0.`,
      }
    }
  }

  // Verificar que el proveedor exista
  const proveedor = await prisma.proveedor.findUnique({
    where: { id: data.proveedorId, activo: true },
  })
  if (!proveedor) {
    return { ok: false, status: 404, error: "Proveedor no encontrado" }
  }

  // Calcular totales desde los items
  const itemsCalculados = data.items.map((item) => {
    const subtotalNeto = multiplicarImporte(item.cantidad, item.precioUnitario)
    const esExento = discriminaIVA && item.esExento
    const alicuota = discriminaIVA && !esExento ? item.alicuotaIva : 0
    const montoIva = alicuota > 0 ? calcularIva(subtotalNeto, alicuota) : 0
    return {
      descripcion: item.descripcion,
      cantidad: item.cantidad,
      precioUnitario: item.precioUnitario,
      alicuotaIva: alicuota,
      esExento,
      subtotalNeto,
      montoIva,
      subtotalTotal: sumarImportes([subtotalNeto, montoIva]),
    }
  })

  const totalNeto = sumarImportes(itemsCalculados.map((i) => i.subtotalNeto))
  const totalIvaMonto = sumarImportes(itemsCalculados.map((i) => i.montoIva))
  const percIIBB = data.percepcionIIBB ?? 0
  const percIVA = data.percepcionIVA ?? 0
  const percGanancias = data.percepcionGanancias ?? 0
  const totalPercepcionesExtra = sumarImportes((data.percepciones ?? []).map((p) => p.monto))
  const totalPercepciones = sumarImportes([percIIBB, percIVA, percGanancias, totalPercepcionesExtra])
  const total = sumarImportes([totalNeto, totalIvaMonto, totalPercepciones])

  const nroComprobanteFormateado =
    data.ptoVenta.padStart(4, "0") + "-" + data.nroComprobante.padStart(8, "0")
  const periodo = data.fechaComprobante.slice(0, 7)

  const result = await prisma.$transaction(async (tx) => {
    // 1. Crear FacturaProveedor
    const factura = await tx.facturaProveedor.create({
      data: {
        proveedorId: data.proveedorId,
        nroComprobante: nroComprobanteFormateado,
        ptoVenta: data.ptoVenta.padStart(4, "0"),
        tipoCbte: data.tipoCbte,
        neto: totalNeto,
        ivaMonto: totalIvaMonto,
        total,
        fechaCbte: new Date(data.fechaComprobante),
        concepto: data.concepto ?? null,
        pdfS3Key: data.pdfS3Key,
        percepcionIIBB: percIIBB > 0 ? percIIBB : null,
        percepcionIVA: percIVA > 0 ? percIVA : null,
        percepcionGanancias: percGanancias > 0 ? percGanancias : null,
      },
    })

    // 2. Crear items
    await tx.itemFacturaProveedor.createMany({
      data: itemsCalculados.map((item) => ({
        facturaProveedorId: factura.id,
        ...item,
      })),
    })

    // 3. Asientos IVA — solo para A, M, LIQ_PROD
    const asientosCreados: unknown[] = []
    if (discriminaIVA) {
      // Agrupar items no exentos por alicuota
      const porAlicuota = new Map<number, number>()
      let baseExenta = 0

      for (const item of itemsCalculados) {
        if (item.esExento) {
          baseExenta = sumarImportes([baseExenta, item.subtotalNeto])
        } else if (item.alicuotaIva > 0) {
          porAlicuota.set(item.alicuotaIva, sumarImportes([porAlicuota.get(item.alicuotaIva) ?? 0, item.subtotalNeto]))
        } else {
          // alicuota 0%, no exento — base gravada a 0%
          porAlicuota.set(0, sumarImportes([porAlicuota.get(0) ?? 0, item.subtotalNeto]))
        }
      }

      // Crear un AsientoIva por cada alicuota
      for (const [alicuota, base] of Array.from(porAlicuota)) {
        const montoIvaAsiento = calcularIva(base, alicuota)
        const asiento = await tx.asientoIva.create({
          data: {
            facturaProvId: factura.id,
            tipoReferencia: "FACTURA_PROVEEDOR",
            tipo: "COMPRA",
            baseImponible: base,
            alicuota,
            montoIva: montoIvaAsiento,
            periodo,
          },
        })
        asientosCreados.push(asiento)
      }

      // Crear AsientoIva para base exenta si hay
      if (baseExenta > 0) {
        const asientoExento = await tx.asientoIva.create({
          data: {
            facturaProvId: factura.id,
            tipoReferencia: "FACTURA_PROVEEDOR_EXENTO",
            tipo: "COMPRA",
            baseImponible: baseExenta,
            alicuota: 0,
            montoIva: 0,
            periodo,
          },
        })
        asientosCreados.push(asientoExento)
      }

      // Asientos para percepciones
      if (percIVA > 0) {
        const asientoPercIva = await tx.asientoIva.create({
          data: {
            facturaProvId: factura.id,
            tipoReferencia: "PERCEPCION_IVA",
            tipo: "COMPRA",
            baseImponible: percIVA,
            alicuota: 0,
            montoIva: percIVA,
            periodo,
          },
        })
        asientosCreados.push(asientoPercIva)
      }
      if (percIIBB > 0) {
        const asientoPercIibb = await tx.asientoIva.create({
          data: {
            facturaProvId: factura.id,
            tipoReferencia: "PERCEPCION_IIBB",
            tipo: "COMPRA",
            baseImponible: percIIBB,
            alicuota: 0,
            montoIva: percIIBB,
            periodo,
          },
        })
        asientosCreados.push(asientoPercIibb)
      }
    }

    // 4. Percepciones e Impuestos adicionales (PercepcionImpuesto)
    if (data.percepciones && data.percepciones.length > 0) {
      await tx.percepcionImpuesto.createMany({
        data: data.percepciones.map((p) => ({
          facturaProveedorId: factura.id,
          tipo: p.tipo,
          categoria: p.categoria,
          descripcion: p.descripcion ?? null,
          monto: p.monto,
          periodo,
        })),
      })
    }

    // 5. Pago opcional — dentro de la misma transaccion atomica
    let pagoResult: { nuevoEstado: string } | null = null
    const esPagoTarjeta = data.pago && data.pago.tipo === "TARJETA"
    if (data.pago && esPagoTarjeta) {
      // Tarjeta: no crear pago ni movimiento, solo marcar como pendiente tarjeta
      await tx.facturaProveedor.update({
        where: { id: factura.id },
        data: { estadoPago: "PENDIENTE_TARJETA" },
      })
      pagoResult = { nuevoEstado: "PENDIENTE_TARJETA" }
    } else if (data.pago) {
      pagoResult = await procesarPagoProveedor(
        tx,
        {
          facturaId: factura.id,
          facturaTotal: total,
          totalPagadoAnterior: 0,
          facturaNroComprobante: nroComprobanteFormateado,
          proveedorId: data.proveedorId,
          proveedorRazonSocial: proveedor.razonSocial,
          operadorId: operadorId ?? null,
        },
        {
          fecha: new Date(data.pago.fecha),
          monto: data.pago.monto,
          tipo: data.pago.tipo,
          observaciones: data.pago.observaciones,
          comprobantePdfS3Key: data.pago.comprobantePdfS3Key,
          cuentaId: data.pago.cuentaId,
          chequeRecibidoId: data.pago.chequeRecibidoId,
          tarjetaId: data.pago.tarjetaId,
          chequePropio: data.pago.chequePropio ?? null,
        }
      )
    }

    return { factura, itemsCount: itemsCalculados.length, asientosCount: asientosCreados.length, pagoResult }
  })

  return {
    ok: true,
    result: {
      id: result.factura.id,
      nroComprobante: result.factura.nroComprobante,
      total: result.factura.total,
      itemsCount: result.itemsCount,
      asientosCount: result.asientosCount,
      estadoPago: result.pagoResult?.nuevoEstado ?? "PENDIENTE",
      pagoRegistrado: result.pagoResult ? data.pago?.monto ?? null : null,
    },
  }
}
