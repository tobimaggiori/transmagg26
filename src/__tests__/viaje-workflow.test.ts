/**
 * Propósito: Tests unitarios para las reglas de workflow del viaje de Transmagg.
 *
 * Modelo cerrado de estados:
 * - Viaje: PENDIENTE_LIQUIDAR | LIQUIDADO + PENDIENTE_FACTURAR | FACTURADO
 * - Documento factura: EMITIDA | COBRADA (inmutable, sin ANULADA)
 * - Documento liquidación: EMITIDA | PAGADA (inmutable, sin ANULADA)
 * - Corrección económica por NC/ND, no por destruir documentos
 * - NC parcial/total libera viajes a PENDIENTE. Corrección de importe no toca viaje.
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

// ─── Modelo cerrado: solo estos estados existen ─────────────────────────────

describe("CONGELADO: estados de viaje — modelo cerrado", () => {
  it("EstadoLiquidacionViaje solo contiene PENDIENTE_LIQUIDAR y LIQUIDADO", () => {
    expect(Object.values(EstadoLiquidacionViaje).sort()).toEqual(
      ["LIQUIDADO", "PENDIENTE_LIQUIDAR"]
    )
  })

  it("EstadoFacturaViaje solo contiene PENDIENTE_FACTURAR y FACTURADO", () => {
    expect(Object.values(EstadoFacturaViaje).sort()).toEqual(
      ["FACTURADO", "PENDIENTE_FACTURAR"]
    )
  })

  it("EstadoFacturaDocumento solo contiene EMITIDA y COBRADA", () => {
    expect(Object.values(EstadoFacturaDocumento).sort()).toEqual(["COBRADA", "EMITIDA"])
  })

  it("EstadoLiquidacionDocumento solo contiene EMITIDA y PAGADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento).sort()).toEqual(["EMITIDA", "PAGADA"])
  })

  it("no existe ANULADA en documentos", () => {
    expect(Object.values(EstadoFacturaDocumento)).not.toContain("ANULADA")
    expect(Object.values(EstadoLiquidacionDocumento)).not.toContain("ANULADA")
  })

  it("no existe AJUSTADO_PARCIAL en viajes", () => {
    expect(Object.values(EstadoLiquidacionViaje)).not.toContain("LIQUIDADO_AJUSTADO_PARCIAL")
    expect(Object.values(EstadoFacturaViaje)).not.toContain("FACTURADO_AJUSTADO_PARCIAL")
  })
})

// ─── Resolver basado en presencia de documentos ─────────────────────────────

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
