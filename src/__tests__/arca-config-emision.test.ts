/**
 * Tests de integración: configuración ARCA × emisión.
 *
 * Verifica que los helpers de disponibilidad filtran correctamente
 * por condición fiscal Y comprobantesHabilitados.
 *
 * Rige: arca-configuracion-y-validaciones.md
 */

import {
  facturasEmpresaDisponibles,
  liquidacionesDisponibles,
  notasDisponibles,
} from "@/lib/arca/catalogo"

// ─── facturasEmpresaDisponibles ────────────────────────────────────────────

describe("facturasEmpresaDisponibles", () => {
  const TODOS = [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]

  it("RI + todos habilitados → [1, 201]", () => {
    expect(facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", TODOS)).toEqual([1, 201])
  })

  it("RI + solo 6 habilitado → [] (6 incompatible con RI)", () => {
    expect(facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", [6])).toEqual([])
  })

  it("RI + solo 1 habilitado → [1]", () => {
    expect(facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", [1])).toEqual([1])
  })

  it("RI + solo 201 habilitado → [201]", () => {
    expect(facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", [201])).toEqual([201])
  })

  it("Monotributista + [1, 6] → [6]", () => {
    expect(facturasEmpresaDisponibles("MONOTRIBUTISTA", [1, 6])).toEqual([6])
  })

  it("Consumidor Final + [1, 6, 201] → [6]", () => {
    expect(facturasEmpresaDisponibles("CONSUMIDOR_FINAL", [1, 6, 201])).toEqual([6])
  })

  it("Consumidor Final + [1] → []", () => {
    expect(facturasEmpresaDisponibles("CONSUMIDOR_FINAL", [1])).toEqual([])
  })

  it("cualquier condición + [] habilitados → []", () => {
    expect(facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", [])).toEqual([])
    expect(facturasEmpresaDisponibles("MONOTRIBUTISTA", [])).toEqual([])
    expect(facturasEmpresaDisponibles("CONSUMIDOR_FINAL", [])).toEqual([])
  })

  it("no incluye códigos LP (60, 61) ni notas (2, 3, 7, 8)", () => {
    const res = facturasEmpresaDisponibles("RESPONSABLE_INSCRIPTO", TODOS)
    expect(res).not.toContain(60)
    expect(res).not.toContain(61)
    expect(res).not.toContain(2)
    expect(res).not.toContain(3)
  })
})

// ─── liquidacionesDisponibles ──────────────────────────────────────────────

describe("liquidacionesDisponibles", () => {
  it("RI + [60, 61] → [60]", () => {
    expect(liquidacionesDisponibles("RESPONSABLE_INSCRIPTO", [60, 61])).toEqual([60])
  })

  it("Monotributista + [60, 61] → [60]", () => {
    expect(liquidacionesDisponibles("MONOTRIBUTISTA", [60, 61])).toEqual([60])
  })

  it("Consumidor Final + [60, 61] → [61]", () => {
    expect(liquidacionesDisponibles("CONSUMIDOR_FINAL", [60, 61])).toEqual([61])
  })

  it("Exento + [60, 61] → [61]", () => {
    expect(liquidacionesDisponibles("EXENTO", [60, 61])).toEqual([61])
  })

  it("RI + solo 61 habilitado → [] (61 no para RI)", () => {
    expect(liquidacionesDisponibles("RESPONSABLE_INSCRIPTO", [61])).toEqual([])
  })

  it("CF + solo 60 habilitado → [] (60 no para CF)", () => {
    expect(liquidacionesDisponibles("CONSUMIDOR_FINAL", [60])).toEqual([])
  })

  it("cualquier condición + [] → []", () => {
    expect(liquidacionesDisponibles("RESPONSABLE_INSCRIPTO", [])).toEqual([])
  })

  it("nunca incluye código 65 aunque esté habilitado", () => {
    expect(liquidacionesDisponibles("RESPONSABLE_INSCRIPTO", [60, 61, 65])).toEqual([60])
    expect(liquidacionesDisponibles("CONSUMIDOR_FINAL", [60, 61, 65])).toEqual([61])
  })

  it("no incluye códigos empresa", () => {
    const res = liquidacionesDisponibles("RESPONSABLE_INSCRIPTO", [1, 6, 60, 61, 201])
    expect(res).toEqual([60])
  })
})

// ─── notasDisponibles ──────────────────────────────────────────────────────

describe("notasDisponibles", () => {
  it("origen 1 + [2, 3] habilitados → NC A y ND A", () => {
    const res = notasDisponibles(1, [2, 3])
    expect(res.map((n) => n.codigo)).toEqual([2, 3])
  })

  it("origen 1 + [7, 8] habilitados → [] (incompatibles)", () => {
    expect(notasDisponibles(1, [7, 8])).toEqual([])
  })

  it("origen 1 + solo 3 habilitado → solo NC A", () => {
    const res = notasDisponibles(1, [3])
    expect(res).toHaveLength(1)
    expect(res[0].codigo).toBe(3)
    expect(res[0].rol).toBe("nota_credito")
  })

  it("origen 6 + [7, 8] → ND B y NC B", () => {
    const res = notasDisponibles(6, [7, 8])
    expect(res.map((n) => n.codigo)).toEqual([7, 8])
  })

  it("origen 6 + [2, 3] → [] (notas de A, no de B)", () => {
    expect(notasDisponibles(6, [2, 3])).toEqual([])
  })

  it("origen 201 + [202, 203] → ND FCE y NC FCE", () => {
    const res = notasDisponibles(201, [202, 203])
    expect(res.map((n) => n.codigo)).toEqual([202, 203])
  })

  it("origen 201 + [2, 3] → [] (notas de Factura A, no de FCE)", () => {
    expect(notasDisponibles(201, [2, 3])).toEqual([])
  })

  it("origen 1 + [] → []", () => {
    expect(notasDisponibles(1, [])).toEqual([])
  })

  it("código 65 nunca aparece aunque esté habilitado (no operativo)", () => {
    const res = notasDisponibles(60, [65])
    expect(res).toEqual([])
  })

  it("resultado tiene metadata correcta (rol, circuito)", () => {
    const res = notasDisponibles(1, [2, 3])
    expect(res[0].rol).toBe("nota_debito")
    expect(res[0].circuito).toBe("empresa")
    expect(res[1].rol).toBe("nota_credito")
    expect(res[1].circuito).toBe("empresa")
  })
})
