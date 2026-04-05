/**
 * Propósito: Tests unitarios para la serialización semántica del viaje operativo,
 * incluyendo regresiones de seguridad por rol.
 */

import {
  enriquecerViajeOperativo,
  ocultarTarifaOperativa,
} from "@/lib/viaje-serialization"
import {
  puedeVerTarifaFletero,
  puedeVerTarifaEmpresa,
  esRolInterno,
} from "@/lib/permissions"
import type { Rol } from "@/types"

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

  it("conserva todos los campos no sensibles", () => {
    const result = ocultarTarifaOperativa({
      tarifa: 10, tarifaEmpresa: 20, total: 30,
      id: "v1", kilos: 25000, origen: "Rosario", destino: "BsAs",
    })
    expect(result).toEqual({ id: "v1", kilos: 25000, origen: "Rosario", destino: "BsAs" })
  })
})

// ─── Regresión de seguridad: combinación permisos + serialización por rol ────

describe("regresión seguridad — visibilidad de tarifas por rol", () => {
  const VIAJE = {
    id: "v1",
    kilos: 30000,
    tarifa: 40,
    tarifaEmpresa: 55,
    origen: "Rosario",
    destino: "Buenos Aires",
  }

  const VIAJE_EN_LIQ = {
    id: "vel-1",
    viajeId: "v1",
    tarifaFletero: 40,
    kilos: 30000,
    subtotal: 1200,
    origen: "Rosario",
  }

  const VIAJE_EN_FACTURA = {
    id: "vef-1",
    viajeId: "v1",
    tarifaEmpresa: 55,
    kilos: 30000,
    subtotal: 1650,
    origen: "Rosario",
  }

  const TODOS_LOS_ROLES: Rol[] = [
    "ADMIN_TRANSMAGG", "OPERADOR_TRANSMAGG",
    "FLETERO", "CHOFER",
    "ADMIN_EMPRESA", "OPERADOR_EMPRESA",
  ]

  // Simula la lógica que usan los endpoints GET /api/viajes
  function serializarViajeParaRol(rol: Rol) {
    const enriquecido = enriquecerViajeOperativo(VIAJE)
    return esRolInterno(rol) ? enriquecido : ocultarTarifaOperativa(enriquecido)
  }

  // Simula la lógica que usa GET /api/liquidaciones/[id]
  function serializarViajeEnLiqParaRol(rol: Rol) {
    if (puedeVerTarifaFletero(rol)) return VIAJE_EN_LIQ
    const { tarifaFletero, subtotal, ...resto } = VIAJE_EN_LIQ
    void tarifaFletero; void subtotal
    return resto
  }

  // Simula la lógica que usa GET /api/facturas/[id]
  function serializarViajeEnFacturaParaRol(rol: Rol) {
    if (puedeVerTarifaEmpresa(rol)) return VIAJE_EN_FACTURA
    const { tarifaEmpresa, ...resto } = VIAJE_EN_FACTURA
    void tarifaEmpresa
    return resto
  }

  // ── Viajes operativos ──

  it("FLETERO no recibe tarifa, tarifaEmpresa ni total en viajes", () => {
    const r = serializarViajeParaRol("FLETERO")
    expect(r).not.toHaveProperty("tarifa")
    expect(r).not.toHaveProperty("tarifaEmpresa")
    expect(r).not.toHaveProperty("total")
    expect(r).toHaveProperty("id")
    expect(r).toHaveProperty("origen")
  })

  it("ADMIN_EMPRESA no recibe tarifa, tarifaEmpresa ni total en viajes", () => {
    const r = serializarViajeParaRol("ADMIN_EMPRESA")
    expect(r).not.toHaveProperty("tarifa")
    expect(r).not.toHaveProperty("tarifaEmpresa")
    expect(r).not.toHaveProperty("total")
  })

  it("ADMIN_TRANSMAGG recibe todos los campos en viajes", () => {
    const r = serializarViajeParaRol("ADMIN_TRANSMAGG")
    expect(r).toHaveProperty("tarifa", 40)
    expect(r).toHaveProperty("tarifaEmpresa", 55)
    expect(r).toHaveProperty("total")
  })

  // ── Viajes en liquidación (tarifaFletero) ──

  it("ADMIN_EMPRESA nunca ve tarifaFletero en liquidaciones", () => {
    const r = serializarViajeEnLiqParaRol("ADMIN_EMPRESA")
    expect(r).not.toHaveProperty("tarifaFletero")
    expect(r).not.toHaveProperty("subtotal")
  })

  it("OPERADOR_EMPRESA nunca ve tarifaFletero en liquidaciones", () => {
    const r = serializarViajeEnLiqParaRol("OPERADOR_EMPRESA")
    expect(r).not.toHaveProperty("tarifaFletero")
  })

  it("CHOFER nunca ve tarifaFletero en liquidaciones", () => {
    const r = serializarViajeEnLiqParaRol("CHOFER")
    expect(r).not.toHaveProperty("tarifaFletero")
  })

  it("FLETERO sí ve tarifaFletero en sus liquidaciones", () => {
    const r = serializarViajeEnLiqParaRol("FLETERO")
    expect(r).toHaveProperty("tarifaFletero", 40)
    expect(r).toHaveProperty("subtotal", 1200)
  })

  // ── Viajes en factura (tarifaEmpresa) ──

  it("FLETERO nunca ve tarifaEmpresa en facturas", () => {
    const r = serializarViajeEnFacturaParaRol("FLETERO")
    expect(r).not.toHaveProperty("tarifaEmpresa")
  })

  it("CHOFER nunca ve tarifaEmpresa en facturas", () => {
    const r = serializarViajeEnFacturaParaRol("CHOFER")
    expect(r).not.toHaveProperty("tarifaEmpresa")
  })

  it("ADMIN_EMPRESA sí ve tarifaEmpresa en facturas", () => {
    const r = serializarViajeEnFacturaParaRol("ADMIN_EMPRESA")
    expect(r).toHaveProperty("tarifaEmpresa", 55)
  })

  // ── Invariante: ningún rol externo ve ambas tarifas simultáneamente ──

  it("ningún rol externo ve tarifaFletero Y tarifaEmpresa a la vez", () => {
    for (const rol of TODOS_LOS_ROLES) {
      if (esRolInterno(rol)) continue
      const liq = serializarViajeEnLiqParaRol(rol)
      const fac = serializarViajeEnFacturaParaRol(rol)
      const veTarifaFletero = "tarifaFletero" in liq
      const veTarifaEmpresa = "tarifaEmpresa" in fac
      expect(
        veTarifaFletero && veTarifaEmpresa
      ).toBe(false)
    }
  })
})
