/**
 * Propósito: Tests unitarios para los helpers de presentación del workflow de viajes.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de viaje-ui.ts.
 */

import {
  describirCircuitoViaje,
  resumirWorkflowViajes,
  esLiquidado,
  esFacturado,
  labelEstadoLiquidacion,
  labelEstadoFactura,
} from "@/lib/viaje-ui"

describe("describirCircuitoViaje", () => {
  it('describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR") === "Pendiente de liquidar y de facturar"', () => {
    expect(
      describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR")
    ).toBe("Pendiente de liquidar y de facturar")
  })

  it('describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR") === "Liquidado al fletero, pendiente de facturar"', () => {
    expect(describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR")).toBe(
      "Liquidado al fletero, pendiente de facturar"
    )
  })

  it('describirCircuitoViaje("LIQUIDADO", "FACTURADO") === "Liquidado y facturado"', () => {
    expect(describirCircuitoViaje("LIQUIDADO", "FACTURADO")).toBe("Liquidado y facturado")
  })
})

describe("resumirWorkflowViajes", () => {
  it('resumirWorkflowViajes([{ estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR" }]).pendientesAmbos === 1', () => {
    expect(
      resumirWorkflowViajes([
        { estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR" },
      ]).pendientesAmbos
    ).toBe(1)
  })

  it('resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR" }]).pendientesFacturar === 1', () => {
    expect(
      resumirWorkflowViajes([
        { estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR" },
      ]).pendientesFacturar
    ).toBe(1)
  })

  it('resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO" }]).cerradosAmbos === 1', () => {
    expect(
      resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO" }])
        .cerradosAmbos
    ).toBe(1)
  })

  it("AJUSTADO_PARCIAL cuenta como cerrado", () => {
    expect(
      resumirWorkflowViajes([
        { estadoLiquidacion: "LIQUIDADO_AJUSTADO_PARCIAL", estadoFactura: "FACTURADO_AJUSTADO_PARCIAL" },
      ]).cerradosAmbos
    ).toBe(1)
  })
})

// ─── Helpers de estado ──────────────────────────────────────────────────────

describe("esLiquidado", () => {
  it("LIQUIDADO → true", () => expect(esLiquidado("LIQUIDADO")).toBe(true))
  it("LIQUIDADO_AJUSTADO_PARCIAL → true", () => expect(esLiquidado("LIQUIDADO_AJUSTADO_PARCIAL")).toBe(true))
  it("PENDIENTE_LIQUIDAR → false", () => expect(esLiquidado("PENDIENTE_LIQUIDAR")).toBe(false))
})

describe("esFacturado", () => {
  it("FACTURADO → true", () => expect(esFacturado("FACTURADO")).toBe(true))
  it("FACTURADO_AJUSTADO_PARCIAL → true", () => expect(esFacturado("FACTURADO_AJUSTADO_PARCIAL")).toBe(true))
  it("PENDIENTE_FACTURAR → false", () => expect(esFacturado("PENDIENTE_FACTURAR")).toBe(false))
})

describe("labelEstadoLiquidacion", () => {
  it("PENDIENTE_LIQUIDAR → Pendiente", () => expect(labelEstadoLiquidacion("PENDIENTE_LIQUIDAR")).toBe("Pendiente"))
  it("LIQUIDADO → Liquidado", () => expect(labelEstadoLiquidacion("LIQUIDADO")).toBe("Liquidado"))
  it("LIQUIDADO_AJUSTADO_PARCIAL → Liquidado (ajustado)", () => expect(labelEstadoLiquidacion("LIQUIDADO_AJUSTADO_PARCIAL")).toBe("Liquidado (ajustado)"))
})

describe("labelEstadoFactura", () => {
  it("PENDIENTE_FACTURAR → Pendiente", () => expect(labelEstadoFactura("PENDIENTE_FACTURAR")).toBe("Pendiente"))
  it("FACTURADO → Facturado", () => expect(labelEstadoFactura("FACTURADO")).toBe("Facturado"))
  it("FACTURADO_AJUSTADO_PARCIAL → Facturado (ajustado)", () => expect(labelEstadoFactura("FACTURADO_AJUSTADO_PARCIAL")).toBe("Facturado (ajustado)"))
})

describe("describirCircuitoViaje — estados ajustados", () => {
  it("LIQUIDADO_AJUSTADO_PARCIAL + PENDIENTE_FACTURAR incluye ajuste", () => {
    const d = describirCircuitoViaje("LIQUIDADO_AJUSTADO_PARCIAL", "PENDIENTE_FACTURAR")
    expect(d).toContain("ajustado parcial")
    expect(d).toContain("pendiente de facturar")
  })

  it("LIQUIDADO + FACTURADO_AJUSTADO_PARCIAL incluye ajuste", () => {
    const d = describirCircuitoViaje("LIQUIDADO", "FACTURADO_AJUSTADO_PARCIAL")
    expect(d).toContain("ajustado")
  })
})
