/**
 * Propósito: Tests unitarios para los helpers de presentación del workflow de viajes.
 *
 * Modelo cerrado: PENDIENTE | LIQUIDADO/FACTURADO. Sin AJUSTADO_PARCIAL.
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
  it("PENDIENTE + PENDIENTE", () => {
    expect(describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR"))
      .toBe("Pendiente de liquidar y de facturar")
  })

  it("LIQUIDADO + PENDIENTE", () => {
    expect(describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR"))
      .toBe("Liquidado al fletero, pendiente de facturar")
  })

  it("LIQUIDADO + FACTURADO", () => {
    expect(describirCircuitoViaje("LIQUIDADO", "FACTURADO"))
      .toBe("Liquidado y facturado")
  })

  it("PENDIENTE + FACTURADO", () => {
    expect(describirCircuitoViaje("PENDIENTE_LIQUIDAR", "FACTURADO"))
      .toBe("Facturado a la empresa, pendiente de liquidar")
  })
})

describe("resumirWorkflowViajes", () => {
  it("PENDIENTE ambos → pendientesAmbos = 1", () => {
    expect(
      resumirWorkflowViajes([
        { estadoLiquidacion: "PENDIENTE_LIQUIDAR", estadoFactura: "PENDIENTE_FACTURAR" },
      ]).pendientesAmbos
    ).toBe(1)
  })

  it("LIQUIDADO + PENDIENTE → pendientesFacturar = 1", () => {
    expect(
      resumirWorkflowViajes([
        { estadoLiquidacion: "LIQUIDADO", estadoFactura: "PENDIENTE_FACTURAR" },
      ]).pendientesFacturar
    ).toBe(1)
  })

  it("LIQUIDADO + FACTURADO → cerradosAmbos = 1", () => {
    expect(
      resumirWorkflowViajes([{ estadoLiquidacion: "LIQUIDADO", estadoFactura: "FACTURADO" }])
        .cerradosAmbos
    ).toBe(1)
  })
})

describe("esLiquidado", () => {
  it("LIQUIDADO → true", () => expect(esLiquidado("LIQUIDADO")).toBe(true))
  it("PENDIENTE_LIQUIDAR → false", () => expect(esLiquidado("PENDIENTE_LIQUIDAR")).toBe(false))
})

describe("esFacturado", () => {
  it("FACTURADO → true", () => expect(esFacturado("FACTURADO")).toBe(true))
  it("PENDIENTE_FACTURAR → false", () => expect(esFacturado("PENDIENTE_FACTURAR")).toBe(false))
})

describe("labelEstadoLiquidacion", () => {
  it("PENDIENTE_LIQUIDAR → Pendiente", () => expect(labelEstadoLiquidacion("PENDIENTE_LIQUIDAR")).toBe("Pendiente"))
  it("LIQUIDADO → Liquidado", () => expect(labelEstadoLiquidacion("LIQUIDADO")).toBe("Liquidado"))
})

describe("labelEstadoFactura", () => {
  it("PENDIENTE_FACTURAR → Pendiente", () => expect(labelEstadoFactura("PENDIENTE_FACTURAR")).toBe("Pendiente"))
  it("FACTURADO → Facturado", () => expect(labelEstadoFactura("FACTURADO")).toBe("Facturado"))
})
