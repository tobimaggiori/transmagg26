/**
 * display-asientos.ts — Helpers compartidos para mostrar asientos del Libro
 * IVA en pantalla y en los PDFs.
 *
 * Pantalla y PDFs deben mostrar EXACTAMENTE los mismos campos. Si divergen,
 * los contadores ven distinto en la UI vs el papel y se confunden.
 *
 * Los tipos son estructurales (no Prisma) para evitar acoplar este módulo
 * al esquema. Los callers (page.tsx Server Component y los handlers de
 * /api/contabilidad/iva-*) hacen su propio findMany con el shape de
 * `AsientoDisplayInput` y pasan el resultado a estas funciones.
 */

import { etiquetaComprobanteArca } from "./codigos-arca"

/**
 * Shape mínimo de un AsientoIva con sus relaciones para poder renderizar
 * empresa/CUIT/tipo cbte/número en pantalla y PDF.
 */
export type AsientoDisplayInput = {
  tipoReferencia: string
  periodo: string
  facturaEmitida: {
    nroComprobante: string | null
    tipoCbte: number
    ptoVenta: number | null
    emitidaEn: Date
    empresa: { razonSocial: string; cuit: string }
  } | null
  facturaProveedor: {
    nroComprobante: string
    ptoVenta: string | null
    tipoCbte: string
    fechaCbte: Date
    proveedor: { razonSocial: string; cuit: string }
  } | null
  liquidacion: {
    nroComprobante: number | null
    ptoVenta: number | null
    grabadaEn: Date
    fletero: { razonSocial: string; cuit: string }
  } | null
  notaCreditoDebito: {
    tipo: string
    tipoCbte: number | null
    ptoVenta: number | null
    nroComprobante: number | null
    nroComprobanteExterno: string | null
    fechaComprobanteExterno: Date | null
    emisorExterno: string | null
    creadoEn: Date
    factura: { empresa: { razonSocial: string; cuit: string } } | null
    facturaProveedor: { proveedor: { razonSocial: string; cuit: string } } | null
    liquidacion: { fletero: { razonSocial: string; cuit: string } } | null
  } | null
  facturaSeguro: {
    nroComprobante: string
    tipoComprobante: string
    fecha: Date
    aseguradora: { razonSocial: string; cuit: string }
  } | null
}

export type DatosDisplayAsiento = {
  fecha: Date | null
  empresa: string
  tipoCbte: string
  nroCbte: string
  cuit: string | null
}

/**
 * formatNumeroFiscal: number?, (number | string)? -> string
 *
 * Compone el número fiscal completo PPPP-NNNNNNNN. Si el ptoVenta es null
 * usa "----"; si el número es null usa "s/n".
 *
 * Ejemplos:
 * formatNumeroFiscal(1, 12345)          === "0001-00012345"
 * formatNumeroFiscal(15, "11666")       === "0015-00011666"
 * formatNumeroFiscal(null, 99)          === "----00000099"
 * formatNumeroFiscal(1, null)           === "0001-s/n"
 */
export function formatNumeroFiscal(
  pto: number | null | undefined,
  nro: number | string | null | undefined,
): string {
  const ptoStr = pto != null ? String(pto).padStart(4, "0") : "----"
  const nroStr = nro != null && nro !== "" ? String(nro).padStart(8, "0") : "s/n"
  return `${ptoStr}-${nroStr}`
}

/**
 * datosAsientoVenta: AsientoDisplayInput -> DatosDisplayAsiento
 *
 * Para asientos del LIBRO VENTAS. Cubre FACTURA_EMITIDA, LIQUIDACION
 * (raro pero posible si quedó algún CVLP en ventas) y NC/ND emitidas.
 */
export function datosAsientoVenta(a: AsientoDisplayInput): DatosDisplayAsiento {
  if (a.tipoReferencia === "LIQUIDACION" && a.liquidacion) {
    return {
      fecha: a.liquidacion.grabadaEn,
      empresa: a.liquidacion.fletero.razonSocial,
      tipoCbte: "Cta. Vta. y Líq. Producto",
      nroCbte: formatNumeroFiscal(a.liquidacion.ptoVenta, a.liquidacion.nroComprobante),
      cuit: a.liquidacion.fletero.cuit,
    }
  }
  if (a.tipoReferencia === "FACTURA_EMITIDA" && a.facturaEmitida) {
    const nroRaw = a.facturaEmitida.nroComprobante
    const nroCbte = nroRaw
      ? (nroRaw.includes("-") ? nroRaw : formatNumeroFiscal(a.facturaEmitida.ptoVenta, nroRaw))
      : "s/n"
    return {
      fecha: a.facturaEmitida.emitidaEn,
      empresa: a.facturaEmitida.empresa.razonSocial,
      tipoCbte: etiquetaComprobanteArca(a.facturaEmitida.tipoCbte),
      nroCbte,
      cuit: a.facturaEmitida.empresa.cuit,
    }
  }
  if ((a.tipoReferencia === "NC_EMITIDA" || a.tipoReferencia === "ND_EMITIDA") && a.notaCreditoDebito) {
    const n = a.notaCreditoDebito
    // En ventas, la NC/ND apunta a una factura emitida (a empresa).
    const empresa = n.factura?.empresa.razonSocial ?? n.emisorExterno ?? "—"
    const cuit = n.factura?.empresa.cuit ?? null
    const tipoLabel = n.tipoCbte != null
      ? etiquetaComprobanteArca(n.tipoCbte)
      : (a.tipoReferencia === "NC_EMITIDA" ? "Nota de Crédito" : "Nota de Débito")
    const numero = n.nroComprobante != null ? formatNumeroFiscal(n.ptoVenta, n.nroComprobante) : "s/n"
    return { fecha: n.creadoEn, empresa, tipoCbte: tipoLabel, nroCbte: numero, cuit }
  }
  return { fecha: null, empresa: "—", tipoCbte: "—", nroCbte: "—", cuit: null }
}

/**
 * datosAsientoCompra: AsientoDisplayInput -> DatosDisplayAsiento
 *
 * Para asientos del LIBRO COMPRAS. Cubre:
 *  - FACTURA_PROVEEDOR / FACTURA_PROVEEDOR_EXENTO / PERCEPCION_IVA /
 *    PERCEPCION_IIBB (todos usan a.facturaProveedor)
 *  - FACTURA_SEGURO
 *  - LIQUIDACION (CVLP — siempre Compras en Transmagg)
 *  - NC_EMITIDA / ND_EMITIDA sobre LP (notaCreditoDebito.liquidacion)
 *  - NC_RECIBIDA / ND_RECIBIDA (notaCreditoDebito.facturaProveedor)
 */
export function datosAsientoCompra(a: AsientoDisplayInput): DatosDisplayAsiento {
  if (a.facturaProveedor) {
    const fp = a.facturaProveedor
    const nroRaw = fp.nroComprobante
    const ptoNum = fp.ptoVenta ? parseInt(fp.ptoVenta, 10) : null
    const nroCbte = nroRaw.includes("-")
      ? nroRaw
      : formatNumeroFiscal(ptoNum, nroRaw)
    return {
      fecha: fp.fechaCbte,
      empresa: fp.proveedor.razonSocial,
      tipoCbte: `Factura ${fp.tipoCbte}`,
      nroCbte,
      cuit: fp.proveedor.cuit,
    }
  }
  if (a.tipoReferencia === "LIQUIDACION" && a.liquidacion) {
    return {
      fecha: a.liquidacion.grabadaEn,
      empresa: a.liquidacion.fletero.razonSocial,
      tipoCbte: "Cta. Vta. y Líq. Producto",
      nroCbte: formatNumeroFiscal(a.liquidacion.ptoVenta, a.liquidacion.nroComprobante),
      cuit: a.liquidacion.fletero.cuit,
    }
  }
  if (a.tipoReferencia === "FACTURA_SEGURO" && a.facturaSeguro) {
    const fs = a.facturaSeguro
    const nroCbte = fs.nroComprobante.includes("-")
      ? fs.nroComprobante
      : formatNumeroFiscal(null, fs.nroComprobante)
    return {
      fecha: fs.fecha,
      empresa: fs.aseguradora.razonSocial,
      tipoCbte: `Factura ${fs.tipoComprobante}`,
      nroCbte,
      cuit: fs.aseguradora.cuit,
    }
  }
  if (a.notaCreditoDebito) {
    const n = a.notaCreditoDebito
    // NC/ND sobre LP (NC_EMITIDA con liquidacion) o NC/ND recibidas
    let empresa = "—"
    let cuit: string | null = null
    if (n.liquidacion) {
      empresa = n.liquidacion.fletero.razonSocial
      cuit = n.liquidacion.fletero.cuit
    } else if (n.facturaProveedor) {
      empresa = n.facturaProveedor.proveedor.razonSocial
      cuit = n.facturaProveedor.proveedor.cuit
    } else if (n.emisorExterno) {
      empresa = n.emisorExterno
    }
    const esNC = a.tipoReferencia === "NC_EMITIDA" || a.tipoReferencia === "NC_RECIBIDA"
    const tipoLabel = n.tipoCbte != null
      ? etiquetaComprobanteArca(n.tipoCbte)
      : (esNC ? "Nota de Crédito" : "Nota de Débito")
    const numero = n.nroComprobanteExterno
      ?? (n.nroComprobante != null ? formatNumeroFiscal(n.ptoVenta, n.nroComprobante) : "s/n")
    const fecha = n.fechaComprobanteExterno ?? n.creadoEn
    return { fecha, empresa, tipoCbte: tipoLabel, nroCbte: numero, cuit }
  }
  return { fecha: null, empresa: "—", tipoCbte: "—", nroCbte: "—", cuit: null }
}
