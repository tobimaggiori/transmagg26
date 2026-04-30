/**
 * Tests de helpers puros de factura-seguro-commands:
 *  - calcularTotalesFacturaSeguro
 *  - agruparIvaPorAlicuota
 */

import {
  calcularTotalesFacturaSeguro,
  agruparIvaPorAlicuota,
  type ItemFacturaSeguroInput,
} from "@/lib/factura-seguro-commands"

describe("calcularTotalesFacturaSeguro", () => {
  it("vacío devuelve todos en 0", () => {
    expect(calcularTotalesFacturaSeguro([])).toEqual({
      neto: 0,
      iva: 0,
      percepciones: 0,
      otrosImpuestos: 0,
      total: 0,
    })
  })

  it("agrupa por tipo y suma total", () => {
    const items: ItemFacturaSeguroInput[] = [
      { tipo: "CONCEPTO", descripcion: "Prima", monto: 1000 },
      { tipo: "CONCEPTO", descripcion: "Recargo financiero", monto: 100 },
      { tipo: "IVA", descripcion: "IVA 21%", alicuota: 21, monto: 231 },
      { tipo: "IVA", descripcion: "IVA 3%", alicuota: 3, monto: 30 },
      { tipo: "PERCEPCION", descripcion: "Percepción IVA", alicuota: 1.5, monto: 15 },
      { tipo: "IMPUESTO", descripcion: "Sellado", monto: 50 },
    ]
    const t = calcularTotalesFacturaSeguro(items)
    expect(t.neto).toBe(1100)
    expect(t.iva).toBe(261)
    expect(t.percepciones).toBe(15)
    expect(t.otrosImpuestos).toBe(50)
    expect(t.total).toBe(1426)
  })

  it("ignora items con monto 0", () => {
    const t = calcularTotalesFacturaSeguro([
      { tipo: "CONCEPTO", descripcion: "Prima", monto: 1000 },
      { tipo: "IMPUESTO", descripcion: "Vacío", monto: 0 },
    ])
    expect(t.total).toBe(1000)
  })
})

describe("agruparIvaPorAlicuota", () => {
  it("agrupa múltiples items con misma alícuota", () => {
    const items: ItemFacturaSeguroInput[] = [
      { tipo: "IVA", descripcion: "IVA 21% A", alicuota: 21, baseCalculo: 1000, monto: 210 },
      { tipo: "IVA", descripcion: "IVA 21% B", alicuota: 21, baseCalculo: 500, monto: 105 },
      { tipo: "IVA", descripcion: "IVA 3%", alicuota: 3, baseCalculo: 200, monto: 6 },
    ]
    const m = agruparIvaPorAlicuota(items)
    expect(m.size).toBe(2)
    expect(m.get(21)).toEqual({ base: 1500, monto: 315 })
    expect(m.get(3)).toEqual({ base: 200, monto: 6 })
  })

  it("ignora items que no son IVA", () => {
    const items: ItemFacturaSeguroInput[] = [
      { tipo: "CONCEPTO", descripcion: "Prima", monto: 1000 },
      { tipo: "PERCEPCION", descripcion: "Percep IVA", alicuota: 21, monto: 50 },
      { tipo: "IVA", descripcion: "IVA 21%", alicuota: 21, baseCalculo: 1000, monto: 210 },
    ]
    const m = agruparIvaPorAlicuota(items)
    expect(m.size).toBe(1)
    expect(m.get(21)).toEqual({ base: 1000, monto: 210 })
  })

  it("baseCalculo nulo se trata como 0", () => {
    const items: ItemFacturaSeguroInput[] = [
      { tipo: "IVA", descripcion: "IVA 21%", alicuota: 21, monto: 210 },
    ]
    const m = agruparIvaPorAlicuota(items)
    expect(m.get(21)).toEqual({ base: 0, monto: 210 })
  })

  it("vacío devuelve mapa vacío", () => {
    expect(agruparIvaPorAlicuota([]).size).toBe(0)
  })
})
