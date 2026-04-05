/**
 * Propósito: Tests unitarios para los helpers de elegibilidad de facturación.
 * Cubre viajeEsFacturable() y razonNoFacturable() con todos los casos de borde.
 */

import { viajeEsFacturable, razonNoFacturable } from "@/lib/facturacion"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkViaje(overrides: Partial<{
  estadoFactura: string
  enLiquidaciones: Array<{ liquidacion: { estado: string } }>
}> = {}) {
  return {
    estadoFactura: "PENDIENTE_FACTURAR",
    enLiquidaciones: [],
    ...overrides,
  }
}

function mkLiquidacion(overrides: Partial<{ estado: string }> = {}) {
  return {
    liquidacion: {
      estado: "EMITIDA",
      ...overrides,
    },
  }
}

// ─── viajeEsFacturable ────────────────────────────────────────────────────────

describe("viajeEsFacturable", () => {
  it("returns true when estadoFactura=PENDIENTE_FACTURAR, LP EMITIDA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion()] })
    expect(viajeEsFacturable(v)).toBe(true)
  })

  it("returns true when LP is PAGADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "PAGADA" })] })
    expect(viajeEsFacturable(v)).toBe(true)
  })

  it("returns true when LP is PARCIALMENTE_PAGADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "PARCIALMENTE_PAGADA" })] })
    expect(viajeEsFacturable(v)).toBe(true)
  })

  it("returns false when estadoFactura is not PENDIENTE_FACTURAR", () => {
    const v = mkViaje({ estadoFactura: "FACTURADO", enLiquidaciones: [mkLiquidacion()] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns false when no liquidaciones", () => {
    const v = mkViaje({ enLiquidaciones: [] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns false when LP is ANULADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "ANULADA" })] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns true when one of multiple LPs is in active state", () => {
    const v = mkViaje({
      enLiquidaciones: [
        mkLiquidacion({ estado: "ANULADA" }),
        mkLiquidacion({ estado: "EMITIDA" }),
      ],
    })
    expect(viajeEsFacturable(v)).toBe(true)
  })

  it("returns false when all LPs are inactive", () => {
    const v = mkViaje({
      enLiquidaciones: [
        mkLiquidacion({ estado: "ANULADA" }),
      ],
    })
    expect(viajeEsFacturable(v)).toBe(false)
  })
})

// ─── razonNoFacturable ────────────────────────────────────────────────────────

describe("razonNoFacturable", () => {
  it("returns reason about estadoFactura when not PENDIENTE_FACTURAR", () => {
    const v = mkViaje({ estadoFactura: "FACTURADO" })
    expect(razonNoFacturable(v)).toMatch(/pendiente de facturar/i)
  })

  it("returns 'No tiene liquidación asignada' when enLiquidaciones is empty", () => {
    const v = mkViaje({ enLiquidaciones: [] })
    expect(razonNoFacturable(v)).toMatch(/liquidaci[oó]n asignada/i)
  })

  it("returns LP not active message when all LPs are ANULADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "ANULADA" })] })
    expect(razonNoFacturable(v)).toMatch(/activo|emitida/i)
  })
})
