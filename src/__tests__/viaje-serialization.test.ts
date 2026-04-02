/**
 * Propósito: Tests unitarios para la serialización semántica del viaje operativo.
 */

import {
  enriquecerViajeOperativo,
  ocultarTarifaOperativa,
} from "@/lib/viaje-serialization"

describe("enriquecerViajeOperativo", () => {
  it("usa tarifaEmpresa para calcular total", () => {
    const r = enriquecerViajeOperativo({ kilos: 25000, tarifaFletero: 40, tarifaEmpresa: 50 })
    expect(r.toneladas).toBe(25)
    expect(r.total).toBe(25000 * 50)
  })

  it("kilos null → total null", () => {
    expect(enriquecerViajeOperativo({ kilos: null, tarifaEmpresa: 50 }).total).toBeNull()
  })

  it("fallback a tarifaFletero si no hay tarifaEmpresa", () => {
    const r = enriquecerViajeOperativo({ kilos: 10000, tarifaFletero: 30 })
    expect(r.total).toBe(10000 * 30)
  })
})

describe("ocultarTarifaOperativa", () => {
  it("oculta tarifaFletero, tarifaEmpresa y total", () => {
    const result = ocultarTarifaOperativa({ tarifaFletero: 10, tarifaEmpresa: 20, total: 30, id: "v1" })
    expect("tarifaFletero" in result).toBe(false)
    expect("tarifaEmpresa" in result).toBe(false)
    expect("total" in result).toBe(false)
    expect("id" in result).toBe(true)
  })
})
