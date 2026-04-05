/**
 * Tests de la matriz fiscal cerrada ARCA — arca-invariantes-y-tests.md
 *
 * Cubre:
 * - Catálogo cerrado (invariante 1)
 * - Operatividad actual (invariante 2)
 * - Configuración ARCA por código (invariante 3)
 * - Notas derivadas del origen (invariante 6)
 * - LP restringido (invariante 7)
 * - Integración ARCA exacta (invariante 8)
 * - Sin mapeos heredados (invariante 9)
 * - Regresión legado
 */

import {
  CATALOGO_ARCA,
  CODIGOS_CATALOGO,
  CODIGOS_LP_BASE,
  CODIGOS_FACTURA_BASE,
  esCodValido,
  esCodOperativo,
  notasCompatibles,
  facturasParaCondicionFiscal,
  tipoCbteLiquidacion,
  tipoCbteFactura,
  validarNotaContraOrigen,
  buscarComprobante,
  validarComprobanteHabilitado,
} from "@/lib/arca/catalogo"

// ═══════════════════════════════════════════════════════════════════════════════
// 1. Tests del catálogo cerrado (invariante 1)
// ═══════════════════════════════════════════════════════════════════════════════

describe("catálogo cerrado ARCA", () => {
  it("contiene exactamente los 12 códigos del catálogo", () => {
    expect(CODIGOS_CATALOGO.size).toBe(12)
    expect(Array.from(CODIGOS_CATALOGO).sort((a, b) => a - b)).toEqual(
      [1, 2, 3, 6, 7, 8, 60, 61, 65, 201, 202, 203]
    )
  })

  it("acepta códigos válidos del catálogo", () => {
    expect(esCodValido(1)).toBe(true)
    expect(esCodValido(60)).toBe(true)
    expect(esCodValido(201)).toBe(true)
    expect(esCodValido(65)).toBe(true) // contemplado aunque no operativo
  })

  it("rechaza códigos fuera del catálogo", () => {
    expect(esCodValido(4)).toBe(false)
    expect(esCodValido(5)).toBe(false)
    expect(esCodValido(186)).toBe(false) // legacy LP — PROHIBIDO
    expect(esCodValido(187)).toBe(false) // legacy LP — PROHIBIDO
    expect(esCodValido(0)).toBe(false)
    expect(esCodValido(999)).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 2. Tests de operatividad actual (invariante 2)
// ═══════════════════════════════════════════════════════════════════════════════

describe("operatividad actual", () => {
  it("65 pertenece al catálogo pero NO está operativo", () => {
    expect(esCodValido(65)).toBe(true)
    expect(esCodOperativo(65)).toBe(false)
  })

  it("todos los demás códigos están operativos", () => {
    for (const cod of [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]) {
      expect(esCodOperativo(cod)).toBe(true)
    }
  })

  it("buscarComprobante(65) tiene operativo=false y visibleEnUI=false", () => {
    const c65 = buscarComprobante(65)!
    expect(c65.operativo).toBe(false)
    expect(c65.visibleEnUI).toBe(false)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 3. Tests de emisión empresa por condición fiscal (E1-E4)
// ═══════════════════════════════════════════════════════════════════════════════

describe("emisión empresa por condición fiscal", () => {
  it("RI ve 1 y 201", () => {
    const codigos = facturasParaCondicionFiscal("RESPONSABLE_INSCRIPTO")
    expect(codigos).toContain(1)
    expect(codigos).toContain(201)
    expect(codigos).not.toContain(6)
  })

  it("Monotributista ve 6, no ve 1", () => {
    const codigos = facturasParaCondicionFiscal("MONOTRIBUTISTA")
    expect(codigos).toContain(6)
    expect(codigos).not.toContain(1)
  })

  it("Consumidor Final ve 6, no ve 1 ni 201", () => {
    const codigos = facturasParaCondicionFiscal("CONSUMIDOR_FINAL")
    expect(codigos).toContain(6)
    expect(codigos).not.toContain(1)
    expect(codigos).not.toContain(201)
  })

  it("facturas base empresa son solo 1, 6, 201", () => {
    expect(Array.from(CODIGOS_FACTURA_BASE).sort((a, b) => a - b)).toEqual([1, 6, 201])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 4. Tests de matriz de notas empresa (E5-E8)
// ═══════════════════════════════════════════════════════════════════════════════

describe("matriz cerrada de notas empresa", () => {
  it("origen 1 → solo 2 y 3", () => {
    expect(notasCompatibles(1).sort()).toEqual([2, 3])
  })

  it("origen 6 → solo 7 y 8", () => {
    expect(notasCompatibles(6).sort()).toEqual([7, 8])
  })

  it("origen 201 → solo 202 y 203", () => {
    expect(notasCompatibles(201).sort()).toEqual([202, 203])
  })

  it("validarNotaContraOrigen acepta combinaciones válidas", () => {
    expect(validarNotaContraOrigen(2, 1)).toBeNull()
    expect(validarNotaContraOrigen(3, 1)).toBeNull()
    expect(validarNotaContraOrigen(7, 6)).toBeNull()
    expect(validarNotaContraOrigen(8, 6)).toBeNull()
    expect(validarNotaContraOrigen(202, 201)).toBeNull()
    expect(validarNotaContraOrigen(203, 201)).toBeNull()
  })

  it("validarNotaContraOrigen rechaza combinaciones cruzadas", () => {
    expect(validarNotaContraOrigen(7, 1)).not.toBeNull() // ND B sobre Fact A
    expect(validarNotaContraOrigen(8, 1)).not.toBeNull() // NC B sobre Fact A
    expect(validarNotaContraOrigen(2, 6)).not.toBeNull() // ND A sobre Fact B
    expect(validarNotaContraOrigen(3, 6)).not.toBeNull() // NC A sobre Fact B
    expect(validarNotaContraOrigen(202, 1)).not.toBeNull() // ND FCE sobre Fact A
    expect(validarNotaContraOrigen(203, 6)).not.toBeNull() // NC FCE sobre Fact B
    expect(validarNotaContraOrigen(2, 201)).not.toBeNull() // ND A sobre FCE
    expect(validarNotaContraOrigen(7, 201)).not.toBeNull() // ND B sobre FCE
  })

  it("validarNotaContraOrigen rechaza código fuera del catálogo", () => {
    expect(validarNotaContraOrigen(186, 1)).not.toBeNull()
    expect(validarNotaContraOrigen(999, 1)).not.toBeNull()
  })

  it("validarNotaContraOrigen rechaza 65 (no operativo)", () => {
    expect(validarNotaContraOrigen(65, 60)).not.toBeNull()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 5. Tests de LP (F1-F4)
// ═══════════════════════════════════════════════════════════════════════════════

describe("LP restringido", () => {
  it("LP base operativos son solo 60 y 61", () => {
    expect(Array.from(CODIGOS_LP_BASE).sort()).toEqual([60, 61])
  })

  it("tipoCbteLiquidacion RI → 60", () => {
    expect(tipoCbteLiquidacion("RESPONSABLE_INSCRIPTO")).toBe(60)
  })

  it("tipoCbteLiquidacion Monotributista → 60", () => {
    expect(tipoCbteLiquidacion("MONOTRIBUTISTA")).toBe(60)
  })

  it("tipoCbteLiquidacion Consumidor Final → 61", () => {
    expect(tipoCbteLiquidacion("CONSUMIDOR_FINAL")).toBe(61)
  })

  it("tipoCbteLiquidacion Exento → 61", () => {
    expect(tipoCbteLiquidacion("EXENTO")).toBe(61)
  })

  it("65 no está en CODIGOS_LP_BASE", () => {
    expect(CODIGOS_LP_BASE.has(65)).toBe(false)
  })

  it("no hay notas compatibles con LP en esta etapa", () => {
    expect(notasCompatibles(60)).toEqual([])
    expect(notasCompatibles(61)).toEqual([])
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 6. Tests de integración ARCA (A1-A12)
// ═══════════════════════════════════════════════════════════════════════════════

describe("integración ARCA — mapeo exacto", () => {
  it("tipoCbteFactura RI → 1", () => {
    expect(tipoCbteFactura("RESPONSABLE_INSCRIPTO")).toBe(1)
  })

  it("tipoCbteFactura CF → 6", () => {
    expect(tipoCbteFactura("CONSUMIDOR_FINAL")).toBe(6)
  })

  it("tipoCbteFactura RI + MiPyME → 201", () => {
    expect(tipoCbteFactura("RESPONSABLE_INSCRIPTO", "SCA")).toBe(201)
  })

  it("tipoCbteLiquidacion RI → 60 (no 186)", () => {
    expect(tipoCbteLiquidacion("RESPONSABLE_INSCRIPTO")).toBe(60)
    expect(tipoCbteLiquidacion("RESPONSABLE_INSCRIPTO")).not.toBe(186)
  })

  it("tipoCbteLiquidacion CF → 61 (no 187)", () => {
    expect(tipoCbteLiquidacion("CONSUMIDOR_FINAL")).toBe(61)
    expect(tipoCbteLiquidacion("CONSUMIDOR_FINAL")).not.toBe(187)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 7. Tests de regresión legado
// ═══════════════════════════════════════════════════════════════════════════════

describe("regresión — códigos heredados prohibidos", () => {
  it("186 no pertenece al catálogo", () => {
    expect(esCodValido(186)).toBe(false)
  })

  it("187 no pertenece al catálogo", () => {
    expect(esCodValido(187)).toBe(false)
  })

  it("no hay mapeo a 186/187 en tipoCbteLiquidacion", () => {
    const resultados = [
      tipoCbteLiquidacion("RESPONSABLE_INSCRIPTO"),
      tipoCbteLiquidacion("MONOTRIBUTISTA"),
      tipoCbteLiquidacion("CONSUMIDOR_FINAL"),
      tipoCbteLiquidacion("EXENTO"),
    ]
    for (const r of resultados) {
      expect(r).not.toBe(186)
      expect(r).not.toBe(187)
    }
  })

  it("catálogo no contiene ningún comprobante con código 186 o 187", () => {
    expect(buscarComprobante(186)).toBeUndefined()
    expect(buscarComprobante(187)).toBeUndefined()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 8. Invariantes de estructura del catálogo
// ═══════════════════════════════════════════════════════════════════════════════

describe("estructura del catálogo", () => {
  it("cada comprobante tiene circuito definido", () => {
    for (const c of CATALOGO_ARCA) {
      expect(["empresa", "fletero"]).toContain(c.circuito)
    }
  })

  it("cada nota tiene al menos un origen compatible", () => {
    for (const c of CATALOGO_ARCA) {
      if (c.rol !== "base") {
        expect(c.origenCompatible.length).toBeGreaterThan(0)
      }
    }
  })

  it("cada comprobante base no tiene origen compatible", () => {
    for (const c of CATALOGO_ARCA) {
      if (c.rol === "base") {
        expect(c.origenCompatible).toEqual([])
      }
    }
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// 9. Tests de configuración ARCA por código (invariante C1-C3)
// ═══════════════════════════════════════════════════════════════════════════════

describe("validarComprobanteHabilitado", () => {
  const habilitados = [1, 6, 60, 61, 201]

  it("código habilitado → null (válido)", () => {
    expect(validarComprobanteHabilitado(1, habilitados)).toBeNull()
    expect(validarComprobanteHabilitado(60, habilitados)).toBeNull()
    expect(validarComprobanteHabilitado(201, habilitados)).toBeNull()
  })

  it("código deshabilitado → error con mensaje", () => {
    expect(validarComprobanteHabilitado(2, habilitados)).toContain("no está habilitado")
    expect(validarComprobanteHabilitado(3, habilitados)).toContain("no está habilitado")
    expect(validarComprobanteHabilitado(7, habilitados)).toContain("no está habilitado")
  })

  it("65 configurable pero no operativo → rechazado por operatividad", () => {
    const habConc65 = [...habilitados, 65]
    expect(validarComprobanteHabilitado(65, habConc65)).toContain("no está operativo")
  })

  it("código fuera del catálogo → rechazado", () => {
    expect(validarComprobanteHabilitado(186, habilitados)).toContain("no pertenece al catálogo")
    expect(validarComprobanteHabilitado(999, habilitados)).toContain("no pertenece al catálogo")
  })

  it("lista vacía de habilitados → todo deshabilitado", () => {
    expect(validarComprobanteHabilitado(1, [])).toContain("no está habilitado")
    expect(validarComprobanteHabilitado(60, [])).toContain("no está habilitado")
  })

  it("todos los operativos habilitados → todos válidos", () => {
    const todos = [1, 2, 3, 6, 7, 8, 60, 61, 201, 202, 203]
    for (const cod of todos) {
      expect(validarComprobanteHabilitado(cod, todos)).toBeNull()
    }
  })
})
