/**
 * Propósito: Tests unitarios para las reglas de workflow del viaje de Transmagg.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de viaje-workflow.ts.
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
  tieneDocumentosActivos,
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

describe("tieneDocumentosActivos", () => {
  it('tieneDocumentosActivos(["BORRADOR"], "ANULADA") === true', () => {
    expect(tieneDocumentosActivos(["BORRADOR"], "ANULADA")).toBe(true)
  })

  it('tieneDocumentosActivos(["ANULADA", "PAGADA"], "ANULADA") === true', () => {
    expect(tieneDocumentosActivos(["ANULADA", "PAGADA"], "ANULADA")).toBe(true)
  })

  it('tieneDocumentosActivos(["ANULADA"], "ANULADA") === false', () => {
    expect(tieneDocumentosActivos(["ANULADA"], "ANULADA")).toBe(false)
  })
})

describe("resolverEstadoLiquidacionViaje", () => {
  it('resolverEstadoLiquidacionViaje(["BORRADOR"]) === "LIQUIDADO"', () => {
    expect(resolverEstadoLiquidacionViaje([EstadoLiquidacionDocumento.BORRADOR])).toBe(
      EstadoLiquidacionViaje.LIQUIDADO
    )
  })

  it('resolverEstadoLiquidacionViaje(["ANULADA"]) === "PENDIENTE_LIQUIDAR"', () => {
    expect(resolverEstadoLiquidacionViaje([EstadoLiquidacionDocumento.ANULADA])).toBe(
      EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR
    )
  })

  it('resolverEstadoLiquidacionViaje([]) === "PENDIENTE_LIQUIDAR"', () => {
    expect(resolverEstadoLiquidacionViaje([])).toBe(EstadoLiquidacionViaje.PENDIENTE_LIQUIDAR)
  })
})

describe("resolverEstadoFacturaViaje", () => {
  it('resolverEstadoFacturaViaje(["BORRADOR"]) === "FACTURADO"', () => {
    expect(resolverEstadoFacturaViaje([EstadoFacturaDocumento.BORRADOR])).toBe(
      EstadoFacturaViaje.FACTURADO
    )
  })

  it('resolverEstadoFacturaViaje(["ANULADA"]) === "PENDIENTE_FACTURAR"', () => {
    expect(resolverEstadoFacturaViaje([EstadoFacturaDocumento.ANULADA])).toBe(
      EstadoFacturaViaje.PENDIENTE_FACTURAR
    )
  })

  it('resolverEstadoFacturaViaje([]) === "PENDIENTE_FACTURAR"', () => {
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
