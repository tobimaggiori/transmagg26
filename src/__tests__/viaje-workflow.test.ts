/**
 * Propósito: Tests unitarios para las reglas de workflow del viaje de Transmagg.
 *
 * Regla documental:
 * - Los documentos (facturas/liquidaciones) son inmutables — no existe ANULADA
 * - La corrección económica se hace por NC/ND
 * - El estado del viaje depende de si tiene documentos vigentes, no de ANULADA
 */

import {
  EstadoFacturaDocumento,
  EstadoFacturaViaje,
  EstadoLiquidacionDocumento,
  EstadoLiquidacionViaje,
  construirAvisosEdicionViaje,
  resolverEstadoFacturaViaje,
  resolverEstadoLiquidacionViaje,
  tarifaEsEditable,
} from "@/lib/viaje-workflow"

describe("tarifaEsEditable", () => {
  it("tarifaEsEditable(150000) === true", () => {
    expect(tarifaEsEditable(150000)).toBe(true)
  })

  it("tarifaEsEditable(0) === false", () => {
    expect(tarifaEsEditable(0)).toBe(false)
  })

  it("tarifaEsEditable(undefined) === false", () => {
    expect(tarifaEsEditable(undefined)).toBe(false)
  })
})

// ─── Documentos inmutables: ANULADA no existe ───────────────────────────────

describe("CONGELADO: ANULADA no existe en estados de documento", () => {
  it("EstadoFacturaDocumento solo contiene EMITIDA y COBRADA", () => {
    expect(Object.values(EstadoFacturaDocumento).sort()).toEqual(["COBRADA", "EMITIDA"])
  })

  it("EstadoLiquidacionDocumento solo contiene EMITIDA y PAGADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento).sort()).toEqual(["EMITIDA", "PAGADA"])
  })

  it("EstadoFacturaDocumento no contiene ANULADA", () => {
    expect(Object.values(EstadoFacturaDocumento)).not.toContain("ANULADA")
  })

  it("EstadoLiquidacionDocumento no contiene ANULADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento)).not.toContain("ANULADA")
  })
})

// ─── Resolver basado en presencia de documentos, no en ANULADA ──────────────

describe("resolverEstadoLiquidacionViaje", () => {
  it('["EMITIDA"] → LIQUIDADO', () => {
    expect(resolverEstadoLiquidacionViaje([EstadoLiquidacionDocumento.EMITIDA])).toBe(
      EstadoLiquidacionViaje.LIQUIDADO
    )
  })

  it('["PAGADA"] → LIQUIDADO', () => {
    expect(resolverEstadoLiquidacionViaje([EstadoLiquidacionDocumento.PAGADA])).toBe(
      EstadoLiquidacionViaje.LIQUIDADO
    )
  })

  it("[] → PENDIENTE_LIQUIDAR", () => {
    expect(resolverEstadoLiquidacionViaje([])).toBe(EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR)
  })
})

describe("resolverEstadoFacturaViaje", () => {
  it('["EMITIDA"] → FACTURADO', () => {
    expect(resolverEstadoFacturaViaje([EstadoFacturaDocumento.EMITIDA])).toBe(
      EstadoFacturaViaje.FACTURADO
    )
  })

  it('["COBRADA"] → FACTURADO', () => {
    expect(resolverEstadoFacturaViaje([EstadoFacturaDocumento.COBRADA])).toBe(
      EstadoFacturaViaje.FACTURADO
    )
  })

  it("[] → PENDIENTE_FACTURAR", () => {
    expect(resolverEstadoFacturaViaje([])).toBe(EstadoFacturaViaje.PENDIENTE_FACTURAR)
  })
})

// ─── Estados de ajuste parcial ──────────────────────────────────────────────

describe("estados de ajuste parcial", () => {
  it("FACTURADO_AJUSTADO_PARCIAL existe en EstadoFacturaViaje", () => {
    expect(EstadoFacturaViaje.FACTURADO_AJUSTADO_PARCIAL).toBe("FACTURADO_AJUSTADO_PARCIAL")
  })

  it("LIQUIDADO_AJUSTADO_PARCIAL existe en EstadoLiquidacionViaje", () => {
    expect(EstadoLiquidacionViaje.LIQUIDADO_AJUSTADO_PARCIAL).toBe("LIQUIDADO_AJUSTADO_PARCIAL")
  })
})

describe("construirAvisosEdicionViaje", () => {
  it('construirAvisosEdicionViaje("LIQUIDADO", "PENDIENTE_FACTURAR").length === 1', () => {
    expect(
      construirAvisosEdicionViaje(
        EstadoLiquidacionViaje.LIQUIDADO,
        EstadoFacturaViaje.PENDIENTE_FACTURAR
      )
    ).toHaveLength(1)
  })

  it('construirAvisosEdicionViaje("LIQUIDADO", "FACTURADO").length === 2', () => {
    expect(
      construirAvisosEdicionViaje(
        EstadoLiquidacionViaje.LIQUIDADO,
        EstadoFacturaViaje.FACTURADO
      )
    ).toHaveLength(2)
  })

  it('construirAvisosEdicionViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR").length === 0', () => {
    expect(
      construirAvisosEdicionViaje(
        EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR,
        EstadoFacturaViaje.PENDIENTE_FACTURAR
      )
    ).toHaveLength(0)
  })
})
