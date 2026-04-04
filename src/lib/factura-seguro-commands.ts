/**
 * factura-seguro-commands.ts
 *
 * Logica de negocio transaccional para creacion de facturas de seguro.
 * Valida precondiciones, crea la factura, vincula polizas, asientos IVA,
 * percepciones y movimientos bancarios en una transaccion atomica.
 */

import { prisma } from "@/lib/prisma"

// ─── Tipos ───────────────────────────────────────────────────────────────────

type PolizaInput = {
  tipoBien: string
  camionId?: string
  descripcionBien?: string
  nroPoliza: string
  cobertura?: string
  vigenciaDesde: string
  vigenciaHasta: string
}

type PercepcionInput = {
  tipo: string
  categoria: string
  descripcion?: string | null
  monto: number
}

export type DatosCrearFacturaSeguro = {
  aseguradoraId: string
  nroComprobante: string
  tipoComprobante: string
  fecha: string
  periodoDesde: string
  periodoHasta: string
  neto: number
  iva: number
  total: number
  percepciones?: PercepcionInput[]
  formaPago: string
  medioPagoContado?: string
  cuentaId?: string
  tarjetaId?: string
  cantCuotas?: number
  primerMesAnio?: string
  polizas: PolizaInput[]
}

type ResultadoFacturaSeguro =
  | { ok: true; factura: unknown }
  | { ok: false; status: number; error: string }

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearFacturaSeguro: DatosCrearFacturaSeguro string -> Promise<ResultadoFacturaSeguro>
 *
 * Dado [los datos validados de la factura de seguro y el operadorId],
 * devuelve [la factura creada o un error con status HTTP].
 *
 * Valida:
 * - Aseguradora (proveedor) existe
 *
 * Ejecuta en transaccion:
 * - Crea FacturaSeguro
 * - Vincula/crea polizas
 * - Crea AsientoIva COMPRA
 * - Crea percepciones si corresponde
 * - Si CONTADO con cuenta: crea MovimientoSinFactura y marca PAGADO
 *
 * Ejemplos:
 * ejecutarCrearFacturaSeguro({ aseguradoraId: "a1", ... }, "op1")
 *   // => { ok: true, factura: { id, estadoPago: "PENDIENTE", ... } }
 * ejecutarCrearFacturaSeguro({ aseguradoraId: "noexiste", ... }, "op1")
 *   // => { ok: false, status: 400, error: "Aseguradora no encontrada" }
 */
export async function ejecutarCrearFacturaSeguro(
  data: DatosCrearFacturaSeguro,
  operadorId: string
): Promise<ResultadoFacturaSeguro> {
  // Validar aseguradora
  const aseguradora = await prisma.proveedor.findUnique({ where: { id: data.aseguradoraId } })
  if (!aseguradora) return { ok: false, status: 400, error: "Aseguradora no encontrada" }

  // Transaccion
  const factura = await prisma.$transaction(async (tx) => {
    // 1. Crear FacturaSeguro
    const nuevaFactura = await tx.facturaSeguro.create({
      data: {
        aseguradoraId: data.aseguradoraId,
        nroComprobante: data.nroComprobante,
        tipoComprobante: data.tipoComprobante ?? "A",
        fecha: new Date(data.fecha),
        periodoDesde: new Date(data.periodoDesde),
        periodoHasta: new Date(data.periodoHasta),
        neto: data.neto,
        iva: data.iva,
        total: data.total,
        formaPago: data.formaPago,
        medioPagoContado: data.medioPagoContado ?? null,
        cuentaId: data.cuentaId ?? null,
        tarjetaId: data.tarjetaId ?? null,
        cantCuotas: data.cantCuotas ?? null,
        estadoPago: data.formaPago === "TARJETA" ? "PENDIENTE_TARJETA" : "PENDIENTE",
        operadorId,
      },
    })

    // 2. Vincular/crear polizas
    for (const polizaData of data.polizas) {
      const existente = await tx.polizaSeguro.findFirst({
        where: { nroPoliza: polizaData.nroPoliza },
      })

      if (existente) {
        await tx.polizaSeguro.update({
          where: { id: existente.id },
          data: {
            facturaSeguroId: nuevaFactura.id,
            proveedorId: data.aseguradoraId,
            aseguradora: aseguradora.razonSocial,
            tipoBien: polizaData.tipoBien,
            camionId: polizaData.camionId ?? null,
            descripcionBien: polizaData.descripcionBien ?? null,
            cobertura: polizaData.cobertura ?? null,
            vigenciaDesde: new Date(polizaData.vigenciaDesde),
            vigenciaHasta: new Date(polizaData.vigenciaHasta),
          },
        })
      } else {
        await tx.polizaSeguro.create({
          data: {
            nroPoliza: polizaData.nroPoliza,
            aseguradora: aseguradora.razonSocial,
            proveedorId: data.aseguradoraId,
            facturaSeguroId: nuevaFactura.id,
            tipoBien: polizaData.tipoBien,
            camionId: polizaData.camionId ?? null,
            descripcionBien: polizaData.descripcionBien ?? null,
            cobertura: polizaData.cobertura ?? null,
            vigenciaDesde: new Date(polizaData.vigenciaDesde),
            vigenciaHasta: new Date(polizaData.vigenciaHasta),
            activa: true,
          },
        })
      }
    }

    // 3. Crear AsientoIva
    await tx.asientoIva.create({
      data: {
        tipo: "COMPRA",
        tipoReferencia: "FACTURA_SEGURO",
        baseImponible: data.neto,
        alicuota: 21,
        montoIva: data.iva,
        periodo: new Date(data.fecha).toISOString().slice(0, 7),
        facturaSeguroId: nuevaFactura.id,
      },
    })

    // 3b. Percepciones e Impuestos adicionales
    if (data.percepciones && data.percepciones.length > 0) {
      const periodo = new Date(data.fecha).toISOString().slice(0, 7)
      await tx.percepcionImpuesto.createMany({
        data: data.percepciones.map((p) => ({
          facturaSeguroId: nuevaFactura.id,
          tipo: p.tipo,
          categoria: p.categoria,
          descripcion: p.descripcion ?? null,
          monto: p.monto,
          periodo,
        })),
      })
    }

    // 4. Si CONTADO y tiene cuenta: crear MovimientoSinFactura
    if (data.formaPago === "CONTADO" && data.cuentaId) {
      await tx.movimientoSinFactura.create({
        data: {
          cuentaId: data.cuentaId,
          tipo: "EGRESO",
          categoria: "PAGO_SERVICIO",
          monto: data.total,
          fecha: new Date(data.fecha),
          descripcion: `Seguro — ${aseguradora.razonSocial} ${data.nroComprobante}`,
          operadorId,
        },
      })

      await tx.facturaSeguro.update({
        where: { id: nuevaFactura.id },
        data: { estadoPago: "PAGADO" },
      })
    }

    // 5. TARJETA: queda como PENDIENTE_TARJETA, se gestiona desde Contabilidad → Tarjetas

    return tx.facturaSeguro.findUnique({
      where: { id: nuevaFactura.id },
      include: {
        aseguradora: { select: { id: true, razonSocial: true } },
        polizas: true,
        cuotas: true,
      },
    })
  })

  return { ok: true, factura }
}
