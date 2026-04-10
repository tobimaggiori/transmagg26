/**
 * Tests para el cálculo de IVA en NC/ND — cubre todos los escenarios documentados
 * en docs/reglas-iva-nc-nd.md.
 *
 * ESTOS TESTS SON INVARIANTES DE NEGOCIO. No modificar sin aprobación explícita.
 * Protegen la lógica fiscal de NC/ND que replica el comportamiento del sistema viejo.
 */

import {
  tipoCbteArcaParaNotaCD,
  calcularTotalesNotaCD,
  calcularTotalesNotaLP,
} from "@/lib/nota-cd-utils"

// ─── Códigos ARCA para NC/ND sobre LP ──────────────────────────────────────

describe("tipoCbteArcaParaNotaCD — LP como origen", () => {
  it("NC sobre LP A (60) → código 3 (NC A)", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 60)).toBe(3)
  })

  it("ND sobre LP A (60) → código 2 (ND A)", () => {
    expect(tipoCbteArcaParaNotaCD("ND_EMITIDA", 60)).toBe(2)
  })

  it("NC sobre LP B (61) → código 8 (NC B)", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 61)).toBe(8)
  })

  it("ND sobre LP B (61) → código 7 (ND B)", () => {
    expect(tipoCbteArcaParaNotaCD("ND_EMITIDA", 61)).toBe(7)
  })
})

// ─── NC sobre factura a empresa (IVA simple) ────────────────────────────────

describe("calcularTotalesNotaCD — NC/ND sobre factura empresa", () => {
  it("NC $100.000 con 21% IVA → neto 100000, iva 21000, total 121000", () => {
    const result = calcularTotalesNotaCD(100000, 21)
    expect(result.montoNeto).toBe(100000)
    expect(result.montoIva).toBe(21000)
    expect(result.montoTotal).toBe(121000)
  })

  it("NC $50.000 con 0% IVA → neto 50000, iva 0, total 50000", () => {
    const result = calcularTotalesNotaCD(50000, 0)
    expect(result.montoNeto).toBe(50000)
    expect(result.montoIva).toBe(0)
    expect(result.montoTotal).toBe(50000)
  })
})

// ─── NC sobre LP — Manera 1: con comisión (anulación de viaje) ──────────────

describe("calcularTotalesNotaLP — con comisión (Manera 1)", () => {
  it("Anular viaje $1.080.000 con 10% comisión y 21% IVA", () => {
    const result = calcularTotalesNotaLP(1080000, 10, 21, true)

    // Comprobante fiscal: neto = bruto - comisión, IVA sobre neto
    expect(result.comisionMonto).toBe(108000)
    expect(result.neto).toBe(972000)
    expect(result.iva).toBe(204120)
    expect(result.total).toBe(1176120)

    // Asiento IVA Ventas: comisión (débito fiscal)
    expect(result.asientoVentas).not.toBeNull()
    expect(result.asientoVentas!.base).toBe(108000)
    expect(result.asientoVentas!.iva).toBe(22680)

    // Asiento IVA Compras: neto viajes (crédito fiscal)
    expect(result.asientoCompras.base).toBe(972000)
    expect(result.asientoCompras.iva).toBe(204120)
  })

  it("Anular viaje $500.000 con 15% comisión y 21% IVA", () => {
    const result = calcularTotalesNotaLP(500000, 15, 21, true)

    expect(result.comisionMonto).toBe(75000)
    expect(result.neto).toBe(425000)
    expect(result.iva).toBe(89250)
    expect(result.total).toBe(514250)

    expect(result.asientoVentas!.base).toBe(75000)
    expect(result.asientoVentas!.iva).toBe(15750)

    expect(result.asientoCompras.base).toBe(425000)
    expect(result.asientoCompras.iva).toBe(89250)
  })

  it("Con 0% comisión y comisión incluida → todo a IVA Compras, sin IVA Ventas", () => {
    const result = calcularTotalesNotaLP(100000, 0, 21, true)

    expect(result.comisionMonto).toBe(0)
    expect(result.neto).toBe(100000)
    expect(result.iva).toBe(21000)
    expect(result.total).toBe(121000)

    // Sin comisión → no hay asiento ventas
    expect(result.asientoVentas).toBeNull()

    expect(result.asientoCompras.base).toBe(100000)
    expect(result.asientoCompras.iva).toBe(21000)
  })

  it("Verificar que comisión + neto = bruto original", () => {
    const result = calcularTotalesNotaLP(1000000, 12, 21, true)

    // Invariante: comisión + neto = bruto
    expect(result.comisionMonto + result.neto).toBe(1000000)

    // Invariante: asientoVentas.base + asientoCompras.base = bruto
    expect(result.asientoVentas!.base + result.asientoCompras.base).toBe(1000000)
  })
})

// ─── NC sobre LP — Manera 2: sin comisión (faltante) ────────────────────────

describe("calcularTotalesNotaLP — sin comisión (Manera 2)", () => {
  it("Faltante $50.000 sin comisión y 21% IVA → todo a IVA Compras", () => {
    const result = calcularTotalesNotaLP(50000, 10, 21, false)

    // Comprobante: neto = bruto (sin resta de comisión)
    expect(result.comisionMonto).toBe(0)
    expect(result.neto).toBe(50000)
    expect(result.iva).toBe(10500)
    expect(result.total).toBe(60500)

    // Solo IVA Compras, sin IVA Ventas
    expect(result.asientoVentas).toBeNull()
    expect(result.asientoCompras.base).toBe(50000)
    expect(result.asientoCompras.iva).toBe(10500)
  })

  it("Faltante $200.000 sin comisión y 21% IVA", () => {
    const result = calcularTotalesNotaLP(200000, 8, 21, false)

    expect(result.comisionMonto).toBe(0)
    expect(result.neto).toBe(200000)
    expect(result.iva).toBe(42000)
    expect(result.total).toBe(242000)

    expect(result.asientoVentas).toBeNull()
    expect(result.asientoCompras.base).toBe(200000)
    expect(result.asientoCompras.iva).toBe(42000)
  })

  it("Sin comisión: IVA Ventas NUNCA cambia, independientemente del comisionPct del LP", () => {
    // Aunque el LP tenga 20% de comisión, si el checkbox está destildado no se toca IVA Ventas
    const result = calcularTotalesNotaLP(100000, 20, 21, false)
    expect(result.asientoVentas).toBeNull()
    expect(result.asientoCompras.base).toBe(100000)
  })
})

// ─── Comparación Manera 1 vs Manera 2 ──────────────────────────────────────

describe("Manera 1 vs Manera 2 — mismo bruto, diferente impacto", () => {
  const bruto = 1000000
  const comisionPct = 10
  const ivaPct = 21

  it("Con comisión: neto del comprobante es menor (se resta comisión)", () => {
    const conComision = calcularTotalesNotaLP(bruto, comisionPct, ivaPct, true)
    const sinComision = calcularTotalesNotaLP(bruto, comisionPct, ivaPct, false)

    // Con comisión: neto = 900000 (se restó 100000)
    expect(conComision.neto).toBe(900000)
    // Sin comisión: neto = 1000000 (bruto directo)
    expect(sinComision.neto).toBe(1000000)

    // Totales distintos por la diferencia de base IVA
    expect(conComision.total).toBeLessThan(sinComision.total)
  })

  it("Con comisión: impacta ambos libros IVA", () => {
    const result = calcularTotalesNotaLP(bruto, comisionPct, ivaPct, true)
    expect(result.asientoVentas).not.toBeNull()
    expect(result.asientoCompras.base).toBe(900000)
  })

  it("Sin comisión: impacta solo IVA Compras", () => {
    const result = calcularTotalesNotaLP(bruto, comisionPct, ivaPct, false)
    expect(result.asientoVentas).toBeNull()
    expect(result.asientoCompras.base).toBe(1000000)
  })
})

// ─── Casos borde ────────────────────────────────────────────────────────────

describe("Casos borde NC/ND LP", () => {
  it("Bruto = 0 → todo cero", () => {
    const result = calcularTotalesNotaLP(0, 10, 21, true)
    expect(result.neto).toBe(0)
    expect(result.iva).toBe(0)
    expect(result.total).toBe(0)
    expect(result.comisionMonto).toBe(0)
  })

  it("IVA = 0% → sin IVA en asientos", () => {
    const result = calcularTotalesNotaLP(100000, 10, 0, true)
    expect(result.neto).toBe(90000)
    expect(result.iva).toBe(0)
    expect(result.total).toBe(90000)
    expect(result.asientoVentas!.iva).toBe(0)
    expect(result.asientoCompras.iva).toBe(0)
  })

  it("Comisión 100% → todo a IVA Ventas, neto viajes = 0", () => {
    const result = calcularTotalesNotaLP(100000, 100, 21, true)
    expect(result.comisionMonto).toBe(100000)
    expect(result.neto).toBe(0)
    expect(result.asientoVentas!.base).toBe(100000)
    expect(result.asientoCompras.base).toBe(0)
  })
})
