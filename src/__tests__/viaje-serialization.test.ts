/**
 * Propósito: Tests unitarios para la serialización semántica del viaje operativo.
 */

import {
  enriquecerViajeOperativo,
  ocultarTarifaOperativa,
} from "@/lib/viaje-serialization"

describe("enriquecerViajeOperativo", () => {
  it("usa tarifaEmpresa para calcular total", () => {
    const r = enriquecerViajeOperativo({ kilos: 25000, tarifa: 40, tarifaEmpresa: 50 })
    expect(r.toneladas).toBe(25)
    expect(r.total).toBe(1250) // 25 ton × $50/ton
  })

  it("kilos null → total null", () => {
    expect(enriquecerViajeOperativo({ kilos: null, tarifaEmpresa: 50 }).total).toBeNull()
  })

  it("fallback a tarifa si no hay tarifaEmpresa", () => {
    const r = enriquecerViajeOperativo({ kilos: 10000, tarifa: 30 })
    expect(r.total).toBe(300) // 10 ton × $30/ton
  })
})

describe("ocultarTarifaOperativa", () => {
  it("oculta tarifa, tarifaEmpresa y total", () => {
    const result = ocultarTarifaOperativa({ tarifa: 10, tarifaEmpresa: 20, total: 30, id: "v1" })
    expect("tarifa" in result).toBe(false)
    expect("tarifaEmpresa" in result).toBe(false)
    expect("total" in result).toBe(false)
    expect("id" in result).toBe(true)
  })
})
