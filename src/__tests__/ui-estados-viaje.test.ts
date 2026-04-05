/**
 * Propósito: Tests de UI para verificar que estados de viaje, badges y filtros
 * son coherentes con el modelo de negocio actual.
 *
 * Congela que:
 * - BORRADOR no aparece en labels/badges de comprobantes
 * - Estados ajustados parciales se muestran correctamente
 * - Helpers de filtrado reconocen estados ajustados como "liquidado"/"facturado"
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
// BORRADOR no existe en labels de UI
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: BORRADOR no aparece en labels de comprobantes", () => {
  it("labelEstadoLiquidacion no reconoce BORRADOR como estado válido", () => {
    // Si alguien pasa BORRADOR, devuelve el string crudo (fallback), no un label bonito
    expect(labelEstadoLiquidacion("BORRADOR")).toBe("BORRADOR")
    // Estados válidos SÍ tienen label distinto al raw string
    expect(labelEstadoLiquidacion("PENDIENTE_LIQUIDAR")).toBe("Pendiente")
    expect(labelEstadoLiquidacion("LIQUIDADO")).toBe("Liquidado")
  })

  it("labelEstadoFactura no reconoce BORRADOR como estado válido", () => {
    expect(labelEstadoFactura("BORRADOR")).toBe("BORRADOR") // fallback crudo
    expect(labelEstadoFactura("PENDIENTE_FACTURAR")).toBe("Pendiente")
    expect(labelEstadoFactura("FACTURADO")).toBe("Facturado")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Estados ajustados parciales correctamente reconocidos
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: helpers reconocen estados ajustados como vigentes", () => {
  it("LIQUIDADO_AJUSTADO_PARCIAL es reconocido como liquidado", () => {
    expect(esLiquidado("LIQUIDADO_AJUSTADO_PARCIAL")).toBe(true)
  })

  it("FACTURADO_AJUSTADO_PARCIAL es reconocido como facturado", () => {
    expect(esFacturado("FACTURADO_AJUSTADO_PARCIAL")).toBe(true)
  })

  it("PENDIENTE_LIQUIDAR NO es reconocido como liquidado", () => {
    expect(esLiquidado("PENDIENTE_LIQUIDAR")).toBe(false)
  })

  it("PENDIENTE_FACTURAR NO es reconocido como facturado", () => {
    expect(esFacturado("PENDIENTE_FACTURAR")).toBe(false)
  })
})

describe("CONGELADO: labels para estados ajustados parciales", () => {
  it("LIQUIDADO_AJUSTADO_PARCIAL → 'Liquidado (ajustado)'", () => {
    expect(labelEstadoLiquidacion("LIQUIDADO_AJUSTADO_PARCIAL")).toBe("Liquidado (ajustado)")
  })

  it("FACTURADO_AJUSTADO_PARCIAL → 'Facturado (ajustado)'", () => {
    expect(labelEstadoFactura("FACTURADO_AJUSTADO_PARCIAL")).toBe("Facturado (ajustado)")
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Filtros y resumen reconocen estados ajustados
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: resumirWorkflowViajes trata ajustados como cerrados", () => {
  it("viaje con ambos circuitos ajustados cuenta como cerrado", () => {
    const r = resumirWorkflowViajes([{
      estadoLiquidacion: "LIQUIDADO_AJUSTADO_PARCIAL",
      estadoFactura: "FACTURADO_AJUSTADO_PARCIAL",
    }])
    expect(r.cerradosAmbos).toBe(1)
    expect(r.pendientesLiquidar).toBe(0)
    expect(r.pendientesFacturar).toBe(0)
  })

  it("viaje con liquidación ajustada + factura pendiente NO cuenta como cerrado", () => {
    const r = resumirWorkflowViajes([{
      estadoLiquidacion: "LIQUIDADO_AJUSTADO_PARCIAL",
      estadoFactura: "PENDIENTE_FACTURAR",
    }])
    expect(r.cerradosAmbos).toBe(0)
    expect(r.pendientesFacturar).toBe(1)
  })
})

describe("CONGELADO: describirCircuitoViaje con estados ajustados", () => {
  it("LIQUIDADO_AJUSTADO_PARCIAL + PENDIENTE_FACTURAR incluye ajuste", () => {
    const d = describirCircuitoViaje("LIQUIDADO_AJUSTADO_PARCIAL", "PENDIENTE_FACTURAR")
    expect(d).toContain("ajustado parcial")
    expect(d).toContain("pendiente de facturar")
  })

  it("LIQUIDADO + FACTURADO_AJUSTADO_PARCIAL incluye ajuste empresa", () => {
    const d = describirCircuitoViaje("LIQUIDADO", "FACTURADO_AJUSTADO_PARCIAL")
    expect(d).toContain("ajustado")
  })

  it("PENDIENTE + PENDIENTE sigue funcionando", () => {
    expect(describirCircuitoViaje("PENDIENTE_LIQUIDAR", "PENDIENTE_FACTURAR"))
      .toBe("Pendiente de liquidar y de facturar")
  })

  it("LIQUIDADO + FACTURADO sigue funcionando", () => {
    expect(describirCircuitoViaje("LIQUIDADO", "FACTURADO"))
      .toBe("Liquidado y facturado")
  })
})
