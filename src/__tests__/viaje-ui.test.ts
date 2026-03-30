/**
 * Propósito: Tests unitarios para los helpers de presentación del workflow de viajes.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de viaje-ui.ts.
 */

import { describirCircuitoViaje, resumirWorkflowViajes } from "@/lib/viaje-ui"

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
})
