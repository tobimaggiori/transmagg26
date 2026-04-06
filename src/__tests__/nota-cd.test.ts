/**
 * Tests para las funciones utilitarias de Notas de Crédito y Débito.
 * Cubre: labelTipoNotaCD, labelSubtipoNotaCD, esEmitida,
 *        tipoCbteArcaParaNotaCD, calcularTotalesNotaCD
 */
import {
  labelTipoNotaCD,
  labelSubtipoNotaCD,
  esEmitida,
  tipoCbteArcaParaNotaCD,
  calcularTotalesNotaCD,
} from "@/lib/nota-cd-utils"

describe("labelTipoNotaCD", () => {
  it('labelTipoNotaCD("NC_EMITIDA") === "Nota de Crédito Emitida"', () => {
    expect(labelTipoNotaCD("NC_EMITIDA")).toBe("Nota de Crédito Emitida")
  })

  it('labelTipoNotaCD("ND_EMITIDA") === "Nota de Débito Emitida"', () => {
    expect(labelTipoNotaCD("ND_EMITIDA")).toBe("Nota de Débito Emitida")
  })

  it('labelTipoNotaCD("NC_RECIBIDA") === "Nota de Crédito Recibida"', () => {
    expect(labelTipoNotaCD("NC_RECIBIDA")).toBe("Nota de Crédito Recibida")
  })

  it('labelTipoNotaCD("ND_RECIBIDA") === "Nota de Débito Recibida"', () => {
    expect(labelTipoNotaCD("ND_RECIBIDA")).toBe("Nota de Débito Recibida")
  })

  it('labelTipoNotaCD("OTRO") === "OTRO"', () => {
    expect(labelTipoNotaCD("OTRO")).toBe("OTRO")
  })
})

describe("labelSubtipoNotaCD", () => {
  it('labelSubtipoNotaCD("ANULACION_TOTAL") === "Anulación total de factura"', () => {
    expect(labelSubtipoNotaCD("ANULACION_TOTAL")).toBe("Anulación total de factura")
  })

  it('labelSubtipoNotaCD("ANULACION_PARCIAL") === "Anulación parcial de factura"', () => {
    expect(labelSubtipoNotaCD("ANULACION_PARCIAL")).toBe("Anulación parcial de factura")
  })

  it('labelSubtipoNotaCD("CORRECCION_IMPORTE") === "Corrección de importe"', () => {
    expect(labelSubtipoNotaCD("CORRECCION_IMPORTE")).toBe("Corrección de importe")
  })

  it('labelSubtipoNotaCD("DIFERENCIA_TARIFA") === "Diferencia de tarifa"', () => {
    expect(labelSubtipoNotaCD("DIFERENCIA_TARIFA")).toBe("Diferencia de tarifa")
  })

  it('labelSubtipoNotaCD("COSTO_ADICIONAL") === "Costo adicional del viaje"', () => {
    expect(labelSubtipoNotaCD("COSTO_ADICIONAL")).toBe("Costo adicional del viaje")
  })

  it('labelSubtipoNotaCD("AJUSTE") === "Ajuste por inflación o contrato"', () => {
    expect(labelSubtipoNotaCD("AJUSTE")).toBe("Ajuste por inflación o contrato")
  })

  it('labelSubtipoNotaCD("PENALIDAD") === "Penalidad al cliente"', () => {
    expect(labelSubtipoNotaCD("PENALIDAD")).toBe("Penalidad al cliente")
  })

  it('labelSubtipoNotaCD("CORRECCION_ADMINISTRATIVA") === "Corrección administrativa"', () => {
    expect(labelSubtipoNotaCD("CORRECCION_ADMINISTRATIVA")).toBe("Corrección administrativa")
  })

  it('labelSubtipoNotaCD("CHEQUE_RECHAZADO") === "Cheque rechazado"', () => {
    expect(labelSubtipoNotaCD("CHEQUE_RECHAZADO")).toBe("Cheque rechazado")
  })

  it('labelSubtipoNotaCD("DESCONOCIDO") === "DESCONOCIDO" (fallback)', () => {
    expect(labelSubtipoNotaCD("DESCONOCIDO")).toBe("DESCONOCIDO")
  })
})

describe("esEmitida", () => {
  it('esEmitida("NC_EMITIDA") === true', () => {
    expect(esEmitida("NC_EMITIDA")).toBe(true)
  })

  it('esEmitida("ND_EMITIDA") === true', () => {
    expect(esEmitida("ND_EMITIDA")).toBe(true)
  })

  it('esEmitida("NC_RECIBIDA") === false', () => {
    expect(esEmitida("NC_RECIBIDA")).toBe(false)
  })

  it('esEmitida("ND_RECIBIDA") === false', () => {
    expect(esEmitida("ND_RECIBIDA")).toBe(false)
  })
})

describe("tipoCbteArcaParaNotaCD (por origen)", () => {
  it("NC sobre Factura A (1) → 3", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 1)).toBe(3)
  })

  it("NC sobre Factura B (6) → 8", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 6)).toBe(8)
  })

  it("ND sobre Factura A (1) → 2", () => {
    expect(tipoCbteArcaParaNotaCD("ND_EMITIDA", 1)).toBe(2)
  })

  it("ND sobre Factura B (6) → 7", () => {
    expect(tipoCbteArcaParaNotaCD("ND_EMITIDA", 6)).toBe(7)
  })

  it("NC sobre FCE A (201) → 203", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 201)).toBe(203)
  })

  it("ND sobre FCE A (201) → 202", () => {
    expect(tipoCbteArcaParaNotaCD("ND_EMITIDA", 201)).toBe(202)
  })

  it("NC sobre origen no soportado → 0", () => {
    expect(tipoCbteArcaParaNotaCD("NC_EMITIDA", 60)).toBe(0)
  })

  it("NC_RECIBIDA → 0 (no aplica)", () => {
    expect(tipoCbteArcaParaNotaCD("NC_RECIBIDA", 1)).toBe(0)
  })
})

describe("calcularTotalesNotaCD", () => {
  it('calcularTotalesNotaCD(1000, 21) === { montoNeto: 1000, montoIva: 210, montoTotal: 1210 }', () => {
    expect(calcularTotalesNotaCD(1000, 21)).toEqual({
      montoNeto: 1000,
      montoIva: 210,
      montoTotal: 1210,
    })
  })

  it('calcularTotalesNotaCD(500, 0) === { montoNeto: 500, montoIva: 0, montoTotal: 500 }', () => {
    expect(calcularTotalesNotaCD(500, 0)).toEqual({
      montoNeto: 500,
      montoIva: 0,
      montoTotal: 500,
    })
  })

  it('calcularTotalesNotaCD(100, 10.5) === { montoNeto: 100, montoIva: 10.5, montoTotal: 110.5 }', () => {
    expect(calcularTotalesNotaCD(100, 10.5)).toEqual({
      montoNeto: 100,
      montoIva: 10.5,
      montoTotal: 110.5,
    })
  })

  it('calcularTotalesNotaCD(0, 21) === { montoNeto: 0, montoIva: 0, montoTotal: 0 }', () => {
    expect(calcularTotalesNotaCD(0, 21)).toEqual({
      montoNeto: 0,
      montoIva: 0,
      montoTotal: 0,
    })
  })
})
