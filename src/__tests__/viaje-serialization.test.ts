/**
 * Propósito: Tests unitarios para la serialización semántica del viaje operativo.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de viaje-serialization.ts.
 */

import {
  enriquecerViajeOperativo,
  obtenerTarifaOperativaInicial,
  ocultarTarifaOperativa,
} from "@/lib/viaje-serialization"

describe("obtenerTarifaOperativaInicial", () => {
  it("obtenerTarifaOperativaInicial(150000) === 150000", () => {
    expect(obtenerTarifaOperativaInicial(150000)).toBe(150000)
  })

  it("obtenerTarifaOperativaInicial(null) === null", () => {
    expect(obtenerTarifaOperativaInicial(null)).toBeNull()
  })

  it("obtenerTarifaOperativaInicial(undefined) === null", () => {
    expect(obtenerTarifaOperativaInicial(undefined)).toBeNull()
  })
})

describe("enriquecerViajeOperativo", () => {
  it("enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).tarifaOperativaInicial === 50", () => {
    expect(enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).tarifaOperativaInicial).toBe(50)
  })

  it("enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).toneladas === 25", () => {
    expect(enriquecerViajeOperativo({ kilos: 25000, tarifaOperativaInicial: 50 }).toneladas).toBe(25)
  })

  it("enriquecerViajeOperativo({ kilos: null, tarifaOperativaInicial: 50 }).total === null", () => {
    expect(enriquecerViajeOperativo({ kilos: null, tarifaOperativaInicial: 50 }).total).toBeNull()
  })
})

describe("ocultarTarifaOperativa", () => {
  it('"tarifaOperativaInicial" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === false', () => {
    expect(
      "tarifaOperativaInicial" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" })
    ).toBe(false)
  })

  it('"total" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === false', () => {
    expect(
      "total" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" })
    ).toBe(false)
  })

  it('"id" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" }) === true', () => {
    expect(
      "id" in ocultarTarifaOperativa({ tarifaOperativaInicial: 10, total: 20, id: "v1" })
    ).toBe(true)
  })
})
