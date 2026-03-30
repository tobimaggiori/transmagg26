/**
 * Tests para las funciones puras de cálculo de viajes, liquidaciones y facturas.
 * Cada función tiene al menos 3 casos de prueba usando exactamente los ejemplos del JSDoc.
 */

import {
  calcularToneladas,
  calcularTotalViaje,
  calcularLiquidacion,
  calcularFactura,
} from "@/lib/viajes"

// ─── calcularToneladas ────────────────────────────────────────────────────────

describe("calcularToneladas", () => {
  it("25000 kg => 25 toneladas", () => {
    expect(calcularToneladas(25000)).toBe(25)
  })

  it("1500 kg => 1.5 toneladas", () => {
    expect(calcularToneladas(1500)).toBe(1.5)
  })

  it("0 kg => 0 toneladas", () => {
    expect(calcularToneladas(0)).toBe(0)
  })

  it("18000 kg => 18 toneladas", () => {
    expect(calcularToneladas(18000)).toBe(18)
  })

  it("1234 kg => 1.234 toneladas", () => {
    expect(calcularToneladas(1234)).toBe(1.234)
  })
})

// ─── calcularTotalViaje ───────────────────────────────────────────────────────

describe("calcularTotalViaje", () => {
  it("25000 kg × $50/ton => $1250", () => {
    expect(calcularTotalViaje(25000, 50)).toBe(1250)
  })

  it("1500 kg × $100/ton => $150", () => {
    expect(calcularTotalViaje(1500, 100)).toBe(150)
  })

  it("0 kg × $100/ton => $0", () => {
    expect(calcularTotalViaje(0, 100)).toBe(0)
  })

  it("18000 kg × 160000/ton => $2880000", () => {
    expect(calcularTotalViaje(18000, 160000)).toBe(2880000)
  })

  it("1500 kg × 0.5/ton => $0.75 (redondeo a 2 decimales)", () => {
    expect(calcularTotalViaje(1500, 0.5)).toBe(0.75)
  })
})

// ─── calcularLiquidacion ──────────────────────────────────────────────────────

describe("calcularLiquidacion", () => {
  const viajeSimple = [{ kilos: 25000, tarifaFletero: 50 }]

  it("subtotalBruto === 1250", () => {
    expect(calcularLiquidacion(viajeSimple, 10, 21).subtotalBruto).toBe(1250)
  })

  it("comisionMonto === 125 (10% de 1250)", () => {
    expect(calcularLiquidacion(viajeSimple, 10, 21).comisionMonto).toBe(125)
  })

  it("neto === 1125 (subtotal - comision)", () => {
    expect(calcularLiquidacion(viajeSimple, 10, 21).neto).toBe(1125)
  })

  it("ivaMonto === 236.25 (21% de 1125)", () => {
    expect(calcularLiquidacion(viajeSimple, 10, 21).ivaMonto).toBe(236.25)
  })

  it("totalFinal === 1361.25 (neto + iva)", () => {
    expect(calcularLiquidacion(viajeSimple, 10, 21).totalFinal).toBe(1361.25)
  })

  it("comision 0% => neto = subtotalBruto", () => {
    const r = calcularLiquidacion(viajeSimple, 0, 21)
    expect(r.comisionMonto).toBe(0)
    expect(r.neto).toBe(1250)
  })

  it("multiples viajes se suman correctamente", () => {
    const viajes = [
      { kilos: 25000, tarifaFletero: 50 },  // 1250
      { kilos: 10000, tarifaFletero: 100 }, // 1000
    ]
    const r = calcularLiquidacion(viajes, 10, 21)
    expect(r.subtotalBruto).toBe(2250)
    expect(r.comisionMonto).toBe(225)
  })
})

// ─── calcularFactura ──────────────────────────────────────────────────────────

describe("calcularFactura", () => {
  const viajeSimple = [{ kilos: 25000, tarifaEmpresa: 60 }]

  it("neto === 1500", () => {
    expect(calcularFactura(viajeSimple, 21).neto).toBe(1500)
  })

  it("ivaMonto === 315 (21% de 1500)", () => {
    expect(calcularFactura(viajeSimple, 21).ivaMonto).toBe(315)
  })

  it("total === 1815", () => {
    expect(calcularFactura(viajeSimple, 21).total).toBe(1815)
  })

  it("IVA 0% => total === neto", () => {
    const r = calcularFactura(viajeSimple, 0)
    expect(r.ivaMonto).toBe(0)
    expect(r.total).toBe(r.neto)
  })

  it("multiples viajes se suman correctamente", () => {
    const viajes = [
      { kilos: 25000, tarifaEmpresa: 60 },  // 1500
      { kilos: 10000, tarifaEmpresa: 80 },  // 800
    ]
    const r = calcularFactura(viajes, 21)
    expect(r.neto).toBe(2300)
    expect(r.ivaMonto).toBe(483)
    expect(r.total).toBe(2783)
  })
})
