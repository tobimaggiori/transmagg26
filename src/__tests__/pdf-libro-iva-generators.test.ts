/**
 * pdf-libro-iva-generators.test.ts — sanity check de los generadores de
 * pdf-libro-iva.ts.
 *
 * Cada función debe devolver un Buffer cuyas primeras 5 letras sean "%PDF-"
 * (magic bytes del formato). Si una función rompe a futuro o devuelve HTML,
 * este test lo detecta.
 */

import {
  generarPDFLibroIva,
  generarPDFIvaVentas,
  generarPDFIvaCompras,
  generarPDFVentasPorAlicuota,
  generarPDFComprasPorAlicuota,
  type AsientoPdf,
} from "@/lib/pdf-libro-iva"

const asientoBase = {
  id: "a1",
  tipoReferencia: "FACTURA_EMITIDA",
  periodo: "2026-04",
  facturaEmitida: {
    nroComprobante: "00012345",
    tipoCbte: 1,
    ptoVenta: 1,
    emitidaEn: new Date("2026-04-15"),
    empresa: { razonSocial: "ACME SA", cuit: "30709381683" },
  },
  facturaProveedor: null,
  liquidacion: null,
  notaCreditoDebito: null,
  facturaSeguro: null,
}

const asientoVenta: AsientoPdf = {
  ...asientoBase,
  id: "v1",
  tipo: "VENTA",
  baseImponible: 1000,
  alicuota: 21,
  montoIva: 210,
}

const asientoCompra: AsientoPdf = {
  ...asientoBase,
  id: "c1",
  tipo: "COMPRA",
  tipoReferencia: "FACTURA_PROVEEDOR",
  facturaEmitida: null,
  facturaProveedor: {
    nroComprobante: "0001-00001234",
    ptoVenta: "0001",
    tipoCbte: "A",
    fechaCbte: new Date("2026-04-10"),
    proveedor: { razonSocial: "Proveedor SRL", cuit: "20123456789" },
  },
  baseImponible: 500,
  alicuota: 21,
  montoIva: 105,
}

function esPdfBuffer(buf: Buffer): boolean {
  return buf.length > 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-"
}

describe("generadores de PDF Libro IVA", () => {
  test("generarPDFLibroIva con asientos vacíos devuelve PDF válido", async () => {
    const buf = await generarPDFLibroIva([], "2026-04")
    expect(esPdfBuffer(buf)).toBe(true)
  })

  test("generarPDFLibroIva con asientos devuelve PDF válido", async () => {
    const buf = await generarPDFLibroIva([asientoVenta, asientoCompra], "2026-04")
    expect(esPdfBuffer(buf)).toBe(true)
  })

  test("generarPDFIvaVentas devuelve PDF válido", async () => {
    const buf = await generarPDFIvaVentas([asientoVenta], "04/2026")
    expect(esPdfBuffer(buf)).toBe(true)
  })

  test("generarPDFIvaCompras devuelve PDF válido", async () => {
    const buf = await generarPDFIvaCompras([asientoCompra], "04/2026")
    expect(esPdfBuffer(buf)).toBe(true)
  })

  test("generarPDFVentasPorAlicuota devuelve PDF válido", async () => {
    const buf = await generarPDFVentasPorAlicuota([asientoVenta], "04/2026")
    expect(esPdfBuffer(buf)).toBe(true)
  })

  test("generarPDFComprasPorAlicuota devuelve PDF válido", async () => {
    const buf = await generarPDFComprasPorAlicuota([asientoCompra], "04/2026")
    expect(esPdfBuffer(buf)).toBe(true)
  })
})
