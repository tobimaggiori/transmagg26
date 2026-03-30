/**
 * Propósito: Tests unitarios para el sistema de permisos RBAC de Transmagg.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de permissions.ts.
 */

import {
  puedeAcceder,
  esRolInterno,
  puedeVerTarifaFletero,
  puedeVerTarifaEmpresa,
  esAdmin,
  esRolEmpresa,
  esRolFletero,
} from "@/lib/permissions"

describe("puedeAcceder", () => {
  it('puedeAcceder("FLETERO", "liquidaciones") === true', () => {
    expect(puedeAcceder("FLETERO", "liquidaciones")).toBe(true)
  })

  it('puedeAcceder("FLETERO", "proveedores") === false', () => {
    expect(puedeAcceder("FLETERO", "proveedores")).toBe(false)
  })

  it('puedeAcceder("ADMIN_TRANSMAGG", "admin") === true', () => {
    expect(puedeAcceder("ADMIN_TRANSMAGG", "admin")).toBe(true)
  })
})

describe("esRolInterno", () => {
  it('esRolInterno("ADMIN_TRANSMAGG") === true', () => {
    expect(esRolInterno("ADMIN_TRANSMAGG")).toBe(true)
  })

  it('esRolInterno("OPERADOR_TRANSMAGG") === true', () => {
    expect(esRolInterno("OPERADOR_TRANSMAGG")).toBe(true)
  })

  it('esRolInterno("FLETERO") === false', () => {
    expect(esRolInterno("FLETERO")).toBe(false)
  })
})

describe("puedeVerTarifaFletero", () => {
  it('puedeVerTarifaFletero("FLETERO") === true', () => {
    expect(puedeVerTarifaFletero("FLETERO")).toBe(true)
  })

  it('puedeVerTarifaFletero("ADMIN_EMPRESA") === false', () => {
    expect(puedeVerTarifaFletero("ADMIN_EMPRESA")).toBe(false)
  })

  it('puedeVerTarifaFletero("CHOFER") === false', () => {
    expect(puedeVerTarifaFletero("CHOFER")).toBe(false)
  })
})

describe("puedeVerTarifaEmpresa", () => {
  it('puedeVerTarifaEmpresa("ADMIN_EMPRESA") === true', () => {
    expect(puedeVerTarifaEmpresa("ADMIN_EMPRESA")).toBe(true)
  })

  it('puedeVerTarifaEmpresa("FLETERO") === false', () => {
    expect(puedeVerTarifaEmpresa("FLETERO")).toBe(false)
  })

  it('puedeVerTarifaEmpresa("CHOFER") === false', () => {
    expect(puedeVerTarifaEmpresa("CHOFER")).toBe(false)
  })
})

describe("esAdmin", () => {
  it('esAdmin("ADMIN_TRANSMAGG") === true', () => {
    expect(esAdmin("ADMIN_TRANSMAGG")).toBe(true)
  })

  it('esAdmin("OPERADOR_TRANSMAGG") === false', () => {
    expect(esAdmin("OPERADOR_TRANSMAGG")).toBe(false)
  })

  it('esAdmin("FLETERO") === false', () => {
    expect(esAdmin("FLETERO")).toBe(false)
  })
})

describe("esRolEmpresa", () => {
  it('esRolEmpresa("ADMIN_EMPRESA") === true', () => {
    expect(esRolEmpresa("ADMIN_EMPRESA")).toBe(true)
  })

  it('esRolEmpresa("OPERADOR_EMPRESA") === true', () => {
    expect(esRolEmpresa("OPERADOR_EMPRESA")).toBe(true)
  })

  it('esRolEmpresa("FLETERO") === false', () => {
    expect(esRolEmpresa("FLETERO")).toBe(false)
  })
})

describe("esRolFletero", () => {
  it('esRolFletero("FLETERO") === true', () => {
    expect(esRolFletero("FLETERO")).toBe(true)
  })

  it('esRolFletero("CHOFER") === true', () => {
    expect(esRolFletero("CHOFER")).toBe(true)
  })

  it('esRolFletero("ADMIN_TRANSMAGG") === false', () => {
    expect(esRolFletero("ADMIN_TRANSMAGG")).toBe(false)
  })
})
