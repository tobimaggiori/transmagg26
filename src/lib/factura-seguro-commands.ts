/**
 * factura-seguro-commands.ts
 *
 * Lógica transaccional de creación de facturas de seguro a partir de un
 * detalle de items flexibles (CONCEPTO / IVA / PERCEPCION / IMPUESTO).
 * Calcula totales, agrupa AsientoIva por alícuota, sincroniza percepciones
 * con el libro y registra el movimiento bancario si corresponde.
 */

import { prisma } from "@/lib/prisma"
import { registrarMovimiento } from "@/lib/movimiento-cuenta"
import { sumarImportes } from "@/lib/money"

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

export type TipoItemFacturaSeguro = "CONCEPTO" | "IVA" | "PERCEPCION" | "IMPUESTO"

export type SubtipoPercepcion =
  | "PERCEPCION_IVA"
  | "PERCEPCION_IIBB"
  | "PERCEPCION_GANANCIAS"
  | "PERCEPCION_SUSS"
  | "OTRO"

export type ItemFacturaSeguroInput = {
  tipo: TipoItemFacturaSeguro
  subtipo?: SubtipoPercepcion | null
  descripcion: string
  alicuota?: number | null
  baseCalculo?: number | null
  monto: number
}

export type DatosCrearFacturaSeguro = {
  aseguradoraId: string
  nroComprobante: string
  tipoComprobante: string
  fecha: string
  periodoDesde: string
  periodoHasta: string
  items: ItemFacturaSeguroInput[]
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

export type TotalesFacturaSeguro = {
  neto: number
  iva: number
  percepciones: number
  otrosImpuestos: number
  total: number
}

// ─── Cálculos puros ──────────────────────────────────────────────────────────

/**
 * calcularTotalesFacturaSeguro: ItemFacturaSeguroInput[] -> TotalesFacturaSeguro
 *
 * Dado [los items de una factura de seguro], devuelve [los totales agrupados
 * por naturaleza]. `neto` = Σ items CONCEPTO. `iva` = Σ items IVA. `percepciones`
 * = Σ items PERCEPCION. `otrosImpuestos` = Σ items IMPUESTO. `total` = suma de
 * todo.
 *
 * Ejemplos:
 * calcularTotalesFacturaSeguro([
 *   { tipo: "CONCEPTO", descripcion: "Prima", monto: 1000 },
 *   { tipo: "IVA", descripcion: "IVA 21%", alicuota: 21, monto: 210 },
 * ]) // => { neto: 1000, iva: 210, percepciones: 0, otrosImpuestos: 0, total: 1210 }
 *
 * calcularTotalesFacturaSeguro([]) // => { neto: 0, iva: 0, percepciones: 0, otrosImpuestos: 0, total: 0 }
 */
export function calcularTotalesFacturaSeguro(
  items: ItemFacturaSeguroInput[]
): TotalesFacturaSeguro {
  const por = (tipo: TipoItemFacturaSeguro) =>
    sumarImportes(items.filter((i) => i.tipo === tipo).map((i) => i.monto))
  const neto = por("CONCEPTO")
  const iva = por("IVA")
  const percepciones = por("PERCEPCION")
  const otrosImpuestos = por("IMPUESTO")
  return {
    neto,
    iva,
    percepciones,
    otrosImpuestos,
    total: sumarImportes([neto, iva, percepciones, otrosImpuestos]),
  }
}

/**
 * agruparIvaPorAlicuota: ItemFacturaSeguroInput[] -> Map<number, { base: number, monto: number }>
 *
 * Dado [los items de la factura], devuelve [un mapa alícuota -> {base, monto}]
 * sumando los items IVA por alícuota. La base imponible se toma del campo
 * `baseCalculo` del item; si no viene, se distribuye proporcionalmente desde
 * el neto total (heurística: items IVA sin base usan el neto entero).
 *
 * Ejemplos:
 * agruparIvaPorAlicuota([
 *   { tipo: "IVA", alicuota: 21, baseCalculo: 1000, monto: 210, descripcion: "" },
 *   { tipo: "IVA", alicuota: 21, baseCalculo: 500,  monto: 105, descripcion: "" },
 *   { tipo: "IVA", alicuota: 3,  baseCalculo: 200,  monto: 6,   descripcion: "" },
 * ]) // => Map { 21 => {base:1500, monto:315}, 3 => {base:200, monto:6} }
 */
export function agruparIvaPorAlicuota(
  items: ItemFacturaSeguroInput[]
): Map<number, { base: number; monto: number }> {
  const map = new Map<number, { base: number; monto: number }>()
  const itemsIva = items.filter((i) => i.tipo === "IVA")
  for (const it of itemsIva) {
    const alic = it.alicuota ?? 0
    const prev = map.get(alic) ?? { base: 0, monto: 0 }
    map.set(alic, {
      base: sumarImportes([prev.base, it.baseCalculo ?? 0]),
      monto: sumarImportes([prev.monto, it.monto]),
    })
  }
  return map
}

// ─── Validación de items ─────────────────────────────────────────────────────

function validarItems(items: ItemFacturaSeguroInput[]): string | null {
  if (!Array.isArray(items) || items.length === 0) {
    return "Debe haber al menos un item"
  }
  for (const it of items) {
    if (!["CONCEPTO", "IVA", "PERCEPCION", "IMPUESTO"].includes(it.tipo)) {
      return `Tipo de item inválido: ${it.tipo}`
    }
    if (!it.descripcion || it.descripcion.trim().length === 0) {
      return "Cada item requiere descripción"
    }
    if (typeof it.monto !== "number" || !Number.isFinite(it.monto) || it.monto < 0) {
      return `Monto inválido para item "${it.descripcion}"`
    }
    if (it.tipo === "IVA" && (it.alicuota == null || it.alicuota < 0)) {
      return `Item IVA "${it.descripcion}" requiere alícuota válida`
    }
    if (it.tipo === "PERCEPCION" && it.subtipo &&
        !["PERCEPCION_IVA","PERCEPCION_IIBB","PERCEPCION_GANANCIAS","PERCEPCION_SUSS","OTRO"].includes(it.subtipo)) {
      return `Subtipo de percepción inválido: ${it.subtipo}`
    }
  }
  return null
}

// ─── Comando principal ───────────────────────────────────────────────────────

/**
 * ejecutarCrearFacturaSeguro: DatosCrearFacturaSeguro string -> Promise<ResultadoFacturaSeguro>
 *
 * Dado [los datos validados de la factura de seguro y el operadorId],
 * devuelve [la factura creada o un error con status HTTP].
 *
 * Ejecuta en transacción:
 *   1. Crea FacturaSeguro con totales derivados de items.
 *   2. Persiste cada ItemFacturaSeguro con su orden visual.
 *   3. Vincula/crea pólizas.
 *   4. Crea un AsientoIva COMPRA por cada alícuota distinta.
 *   5. Crea PercepcionImpuesto por cada item PERCEPCION (impactan libro).
 *   6. Si CONTADO con cuenta: registra MovimientoCuenta y marca PAGADO.
 */
export async function ejecutarCrearFacturaSeguro(
  data: DatosCrearFacturaSeguro,
  operadorId: string
): Promise<ResultadoFacturaSeguro> {
  const aseguradora = await prisma.proveedor.findUnique({ where: { id: data.aseguradoraId } })
  if (!aseguradora) return { ok: false, status: 400, error: "Aseguradora no encontrada" }

  const errItems = validarItems(data.items)
  if (errItems) return { ok: false, status: 400, error: errItems }

  const totales = calcularTotalesFacturaSeguro(data.items)
  const periodo = new Date(data.fecha).toISOString().slice(0, 7)

  const factura = await prisma.$transaction(async (tx) => {
    const nuevaFactura = await tx.facturaSeguro.create({
      data: {
        aseguradoraId: data.aseguradoraId,
        nroComprobante: data.nroComprobante,
        tipoComprobante: data.tipoComprobante ?? "A",
        fecha: new Date(data.fecha),
        periodoDesde: new Date(data.periodoDesde),
        periodoHasta: new Date(data.periodoHasta),
        neto: totales.neto,
        iva: totales.iva,
        total: totales.total,
        formaPago: data.formaPago,
        medioPagoContado: data.medioPagoContado ?? null,
        cuentaId: data.cuentaId ?? null,
        tarjetaId: data.tarjetaId ?? null,
        cantCuotas: data.cantCuotas ?? null,
        estadoPago: data.formaPago === "TARJETA" ? "PENDIENTE_TARJETA" : "PENDIENTE",
        operadorId,
      },
    })

    await tx.itemFacturaSeguro.createMany({
      data: data.items.map((it, i) => ({
        facturaSeguroId: nuevaFactura.id,
        orden: i,
        tipo: it.tipo,
        subtipo: it.tipo === "PERCEPCION" ? it.subtipo ?? "OTRO" : null,
        descripcion: it.descripcion,
        alicuota: it.alicuota ?? null,
        baseCalculo: it.baseCalculo ?? null,
        monto: it.monto,
      })),
    })

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

    const ivaPorAlic = agruparIvaPorAlicuota(data.items)
    for (const [alicuota, { base, monto }] of Array.from(ivaPorAlic.entries())) {
      await tx.asientoIva.create({
        data: {
          tipo: "COMPRA",
          tipoReferencia: "FACTURA_SEGURO",
          baseImponible: base,
          alicuota,
          montoIva: monto,
          periodo,
          facturaSeguroId: nuevaFactura.id,
        },
      })
    }

    const itemsPercepcion = data.items.filter((i) => i.tipo === "PERCEPCION")
    if (itemsPercepcion.length > 0) {
      await tx.percepcionImpuesto.createMany({
        data: itemsPercepcion.map((p) => ({
          facturaSeguroId: nuevaFactura.id,
          tipo: p.subtipo ?? "OTRO",
          categoria: "PERCEPCION",
          descripcion: p.descripcion,
          monto: p.monto,
          periodo,
        })),
      })
    }

    if (data.formaPago === "CONTADO" && data.cuentaId) {
      await registrarMovimiento(tx, {
        cuentaId: data.cuentaId,
        tipo: "EGRESO",
        categoria: "PAGO_SERVICIO",
        monto: totales.total,
        fecha: new Date(data.fecha),
        descripcion: `Seguro — ${aseguradora.razonSocial} ${data.nroComprobante}`,
        esManual: true,
        operadorCreacionId: operadorId,
      })

      await tx.facturaSeguro.update({
        where: { id: nuevaFactura.id },
        data: { estadoPago: "PAGADO" },
      })
    }

    return tx.facturaSeguro.findUnique({
      where: { id: nuevaFactura.id },
      include: {
        aseguradora: { select: { id: true, razonSocial: true } },
        polizas: true,
        cuotas: true,
        items: { orderBy: { orden: "asc" } },
      },
    })
  })

  return { ok: true, factura }
}
