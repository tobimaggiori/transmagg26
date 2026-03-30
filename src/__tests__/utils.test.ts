/**
 * Propósito: Tests unitarios para las funciones utilitarias de Transmagg.
 * Cada caso usa exactamente los mismos ejemplos del JSDoc de utils.ts.
 */

import {
  cn,
  formatearMoneda,
  formatearFecha,
  formatearCuit,
  truncar,
} from "@/lib/utils"

describe("cn", () => {
  it('cn("px-4", "py-2") === "px-4 py-2"', () => {
    expect(cn("px-4", "py-2")).toBe("px-4 py-2")
  })

  it('cn("px-4", "px-2") === "px-2"', () => {
    expect(cn("px-4", "px-2")).toBe("px-2")
  })

  it('cn("base", false) === "base"', () => {
    expect(cn("base", false as unknown as string)).toBe("base")
  })
})

describe("formatearMoneda", () => {
  it('formatearMoneda(0) === "$\\u00a00,00"', () => {
    expect(formatearMoneda(0)).toBe("$\u00a00,00")
  })

  it('formatearMoneda(1500) === "$\\u00a01.500,00"', () => {
    expect(formatearMoneda(1500)).toBe("$\u00a01.500,00")
  })

  it('formatearMoneda(1234.56) === "$\\u00a01.234,56"', () => {
    expect(formatearMoneda(1234.56)).toBe("$\u00a01.234,56")
  })
})

describe("formatearFecha", () => {
  it('formatearFecha(new Date("2025-03-15T12:00:00Z")) === "15/03/2025"', () => {
    expect(formatearFecha(new Date("2025-03-15T12:00:00Z"))).toBe("15/03/2025")
  })

  it('formatearFecha("2024-12-01T12:00:00Z") === "01/12/2024"', () => {
    expect(formatearFecha("2024-12-01T12:00:00Z")).toBe("01/12/2024")
  })

  it('formatearFecha(new Date("2026-01-31T12:00:00Z")) === "31/01/2026"', () => {
    expect(formatearFecha(new Date("2026-01-31T12:00:00Z"))).toBe("31/01/2026")
  })
})

describe("formatearCuit", () => {
  it('formatearCuit("20123456789") === "20-12345678-9"', () => {
    expect(formatearCuit("20123456789")).toBe("20-12345678-9")
  })

  it('formatearCuit("30714295698") === "30-71429569-8"', () => {
    expect(formatearCuit("30714295698")).toBe("30-71429569-8")
  })

  it('formatearCuit("12345") === "12345"', () => {
    expect(formatearCuit("12345")).toBe("12345")
  })
})

describe("truncar", () => {
  it('truncar("Hola mundo", 50) === "Hola mundo"', () => {
    expect(truncar("Hola mundo", 50)).toBe("Hola mundo")
  })

  it('truncar("Texto muy largo que excede", 10) === "Texto m..."', () => {
    expect(truncar("Texto muy largo que excede", 10)).toBe("Texto m...")
  })

  it('truncar("exacto", 6) === "exacto"', () => {
    expect(truncar("exacto", 6)).toBe("exacto")
  })
})
