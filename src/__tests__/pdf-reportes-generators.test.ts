/**
 * pdf-reportes-generators.test.ts — sanity check de los generadores de
 * reportes agrupados (gastos, IIBB, LP vs facturas).
 *
 * Cada función debe devolver un Buffer cuyos primeros 5 bytes sean "%PDF-".
 */

import { generarPDFGastos, type GastoItem } from "@/lib/pdf-gastos"
import { generarPDFIibb, type ViajeIibbItem } from "@/lib/pdf-iibb"
import { generarPDFLpVsFacturas, type ConciliacionItem } from "@/lib/pdf-lp-vs-facturas"

function esPdfBuffer(buf: Buffer): boolean {
  return buf.length > 5 && buf.subarray(0, 5).toString("ascii") === "%PDF-"
}

describe("generadores de PDF de reportes agrupados", () => {
  describe("pdf-gastos", () => {
    test("vacío devuelve PDF válido", async () => {
      const buf = await generarPDFGastos([], "04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })

    test("con items agrupados por rubro devuelve PDF válido", async () => {
      const items: GastoItem[] = [
        { rubro: "COMBUSTIBLE", fecha: new Date("2026-04-10"), descripcion: "YPF — A 0001-12345", monto: 100000 },
        { rubro: "COMBUSTIBLE", fecha: new Date("2026-04-15"), descripcion: "YPF — A 0001-12346", monto: 80000 },
        { rubro: "PEAJES", fecha: new Date("2026-04-20"), descripcion: "Caminos del Río — A 0001-555", monto: 5000 },
        { rubro: "VIAJES CONTRATADOS", fecha: new Date("2026-04-25"), descripcion: "Liquidación 00000123 — Fletero SRL", monto: 250000 },
      ]
      const buf = await generarPDFGastos(items, "04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })
  })

  describe("pdf-iibb", () => {
    test("vacío devuelve PDF válido", async () => {
      const buf = await generarPDFIibb([], "04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })

    test("con viajes por provincia devuelve PDF válido", async () => {
      const items: ViajeIibbItem[] = [
        { provincia: "BUENOS AIRES", fecha: new Date("2026-04-10"), empresa: "ACME SA", mercaderia: "Cereal", procedencia: "Pergamino", subtotal: 500000 },
        { provincia: "BUENOS AIRES", fecha: new Date("2026-04-12"), empresa: "ACME SA", mercaderia: "Soja", procedencia: "Salto", subtotal: 600000 },
        { provincia: "SANTA FE", fecha: new Date("2026-04-15"), empresa: "Otra Empresa SRL", mercaderia: "Maíz", procedencia: "Rosario", subtotal: 750000 },
      ]
      const buf = await generarPDFIibb(items, "04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })
  })

  describe("pdf-lp-vs-facturas", () => {
    test("vacío devuelve PDF válido", async () => {
      const buf = await generarPDFLpVsFacturas([], "01/04/2026 al 30/04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })

    test("con conciliaciones devuelve PDF válido", async () => {
      const items: ConciliacionItem[] = [
        { provincia: "BUENOS AIRES", remito: "R-001", nroLP: "12345", netoLP: 100000, nroFact: "0001-1234", netoFact: 100000, diferencia: 0, empresa: "ACME" },
        { provincia: "BUENOS AIRES", remito: "R-002", nroLP: "12346", netoLP: 80000, nroFact: "0001-1235", netoFact: 85000, diferencia: 5000, empresa: "ACME" },
        { provincia: "SANTA FE", remito: "R-003", nroLP: "12347", netoLP: 200000, nroFact: "0001-1236", netoFact: 200000, diferencia: 0, empresa: "Otra SRL" },
      ]
      const buf = await generarPDFLpVsFacturas(items, "01/04/2026 al 30/04/2026")
      expect(esPdfBuffer(buf)).toBe(true)
    })
  })
})
