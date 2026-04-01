/**
 * Propósito: Tests unitarios para los helpers de elegibilidad de facturación.
 * Cubre viajeEsFacturable() y razonNoFacturable() con todos los casos de borde.
 */

import { viajeEsFacturable, razonNoFacturable } from "@/lib/facturacion"

// ─── Helpers ─────────────────────────────────────────────────────────────────

function mkViaje(overrides: Partial<{
  estadoFactura: string
  enLiquidaciones: Array<{ liquidacion: { estado: string; cae: string | null; arcaEstado: string | null } }>
}> = {}) {
  return {
    estadoFactura: "PENDIENTE_FACTURAR",
    enLiquidaciones: [],
    ...overrides,
  }
}

function mkLiquidacion(overrides: Partial<{ estado: string; cae: string | null; arcaEstado: string | null }> = {}) {
  return {
    liquidacion: {
      estado: "EMITIDA",
      cae: "12345678901234",
      arcaEstado: "ACEPTADA",
      ...overrides,
    },
  }
}

// ─── viajeEsFacturable ────────────────────────────────────────────────────────

describe("viajeEsFacturable", () => {
  it("returns true when estadoFactura=PENDIENTE_FACTURAR, LP EMITIDA con CAE y ACEPTADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion()] })
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

  it("returns false when LP is BORRADOR", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "BORRADOR" })] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns false when LP has no CAE", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ cae: null })] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns false when LP arcaEstado is PENDIENTE", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ arcaEstado: "PENDIENTE" })] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns false when LP arcaEstado is RECHAZADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ arcaEstado: "RECHAZADA" })] })
    expect(viajeEsFacturable(v)).toBe(false)
  })

  it("returns true when one of multiple LPs is EMITIDA+CAE+ACEPTADA", () => {
    const v = mkViaje({
      enLiquidaciones: [
        mkLiquidacion({ estado: "BORRADOR", cae: null }),
        mkLiquidacion(),
      ],
    })
    expect(viajeEsFacturable(v)).toBe(true)
  })

  it("returns false when all LPs fail the condition", () => {
    const v = mkViaje({
      enLiquidaciones: [
        mkLiquidacion({ cae: null }),
        mkLiquidacion({ arcaEstado: "PENDIENTE" }),
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

  it("returns 'La LP no está emitida' when all LPs are BORRADOR", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ estado: "BORRADOR" })] })
    expect(razonNoFacturable(v)).toMatch(/emitida/i)
  })

  it("returns 'La LP no tiene CAE de ARCA' when LP is EMITIDA but cae is null", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ cae: null })] })
    expect(razonNoFacturable(v)).toMatch(/CAE/i)
  })

  it("returns 'La LP no fue aceptada por ARCA' when arcaEstado is not ACEPTADA", () => {
    const v = mkViaje({ enLiquidaciones: [mkLiquidacion({ arcaEstado: "PENDIENTE" })] })
    expect(razonNoFacturable(v)).toMatch(/aceptada por ARCA/i)
  })
})
