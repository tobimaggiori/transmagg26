/**
 * Propósito: Tests de UI para verificar que estados de viaje, badges y filtros
 * son coherentes con el modelo de negocio cerrado.
 *
 * Congela que:
 * - Solo existen PENDIENTE y LIQUIDADO/FACTURADO (sin AJUSTADO_PARCIAL)
 * - BORRADOR y ANULADA no aparecen en labels/badges de comprobantes
 * - Helpers de filtrado reconocen solo los estados válidos
 */

import {
  esLiquidado,
  esFacturado,
  labelEstadoLiquidacion,
  labelEstadoFactura,
  describirCircuitoViaje,
  resumirWorkflowViajes,
} from "@/lib/viaje-ui"

// ═══════════════════════════════════════════════════════════════════════════════
// Estados inválidos no tienen labels
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: estados inválidos no tienen labels", () => {
  it("BORRADOR no tiene label", () => {
    expect(labelEstadoLiquidacion("BORRADOR")).toBe("BORRADOR")
    expect(labelEstadoFactura("BORRADOR")).toBe("BORRADOR")
  })

  it("ANULADA no tiene label", () => {
    expect(labelEstadoLiquidacion("ANULADA")).toBe("ANULADA")
    expect(labelEstadoFactura("ANULADA")).toBe("ANULADA")
  })

  it("AJUSTADO_PARCIAL no tiene label", () => {
    expect(labelEstadoLiquidacion("LIQUIDADO_AJUSTADO_PARCIAL")).toBe("LIQUIDADO_AJUSTADO_PARCIAL")
    expect(labelEstadoFactura("FACTURADO_AJUSTADO_PARCIAL")).toBe("FACTURADO_AJUSTADO_PARCIAL")
  })

  it("estados válidos SÍ tienen label", () => {
    expect(labelEstadoLiquidacion("PENDIENTE_LIQUIDAR")).toBe("Pendiente")
    expect(labelEstadoLiquidacion("LIQUIDADO")).toBe("Liquidado")
    expect(labelEstadoFactura("PENDIENTE_FACTURAR")).toBe("Pendiente")
    expect(labelEstadoFactura("FACTURADO")).toBe("Facturado")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Helpers de filtrado
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: esLiquidado y esFacturado — modelo cerrado", () => {
  it("LIQUIDADO es reconocido como liquidado", () => {
    expect(esLiquidado("LIQUIDADO")).toBe(true)
  })

  it("PENDIENTE_LIQUIDAR NO es liquidado", () => {
    expect(esLiquidado("PENDIENTE_LIQUIDAR")).toBe(false)
  })

  it("AJUSTADO_PARCIAL NO es reconocido (estado eliminado)", () => {
    expect(esLiquidado("LIQUIDADO_AJUSTADO_PARCIAL")).toBe(false)
    expect(esFacturado("FACTURADO_AJUSTADO_PARCIAL")).toBe(false)
  })

  it("FACTURADO es reconocido como facturado", () => {
    expect(esFacturado("FACTURADO")).toBe(true)
  })

  it("PENDIENTE_FACTURAR NO es facturado", () => {
    expect(esFacturado("PENDIENTE_FACTURAR")).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Resumen y descripción de circuito
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: resumirWorkflowViajes", () => {
  it("viaje con ambos circuitos cerrados cuenta como cerrado", () => {
    const r = resumirWorkflowViajes([{
      estadoLiquidacion: "LIQUIDADO",
      estadoFactura: "FACTURADO",
    }])
    expect(r.cerradosAmbos).toBe(1)
    expect(r.pendientesLiquidar).toBe(0)
    expect(r.pendientesFacturar).toBe(0)
  })

  it("viaje con liquidación cerrada + factura pendiente NO cuenta como cerrado", () => {
    const r = resumirWorkflowViajes([{
      estadoLiquidacion: "LIQUIDADO",
      estadoFactura: "PENDIENTE_FACTURAR",
    }])
    expect(r.cerradosAmbos).toBe(0)
    expect(r.pendientesFacturar).toBe(1)
  })
})

describe("CONGELADO: describirCircuitoViaje", () => {
  it("PENDIENTE + PENDIENTE", () => {
    expect(describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR"))
      .toBe("Pendiente de liquidar y de facturar")
  })

  it("LIQUIDADO + FACTURADO", () => {
    expect(describirCircuitoViaje("LIQUIDADO", "FACTURADO"))
      .toBe("Liquidado y facturado")
  })

  it("LIQUIDADO + PENDIENTE", () => {
    expect(describirCircuitoViaje("LIQUIDADO", "PENDIENTE_FACTURAR"))
      .toBe("Liquidado al fletero, pendiente de facturar")
  })

  it("PENDIENTE + FACTURADO", () => {
    expect(describirCircuitoViaje("PENDIENTE_LIQUIDAR", "FACTURADO"))
      .toBe("Facturado a la empresa, pendiente de liquidar")
  })
})
