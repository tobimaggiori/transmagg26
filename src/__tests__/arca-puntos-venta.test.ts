/**
 * Tests para normalización de puntosVenta end-to-end:
 * - Lectura desde DB (cargarConfigArca): string legacy → number
 * - Escritura a DB (normalizarPuntosVentaInput): filtra NaN, 0, negativos
 */

// Mock prisma antes de importar config
const mockPrisma = {
  configuracionArca: {
    findUnique: jest.fn(),
  },
}
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { cargarConfigArca } from "@/lib/arca/config"

const BASE_CONFIG = {
  id: "unico",
  cuit: "30709381683",
  razonSocial: "TEST",
  certificadoB64: "cert",
  certificadoPass: "pass",
  modo: "homologacion",
  cbuMiPymes: null,
  activa: true,
  actualizadoEn: new Date(),
  actualizadoPor: null,
}

describe("puntosVenta normalización", () => {
  it("convierte strings legacy a numbers", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: JSON.stringify({ FACTURA_A: "1", NOTA_CREDITO_A: "3" }),
    })

    const config = await cargarConfigArca()
    expect(config.puntosVenta.FACTURA_A).toBe(1)
    expect(config.puntosVenta.NOTA_CREDITO_A).toBe(3)
    expect(typeof config.puntosVenta.FACTURA_A).toBe("number")
  })

  it("mantiene numbers que ya son numbers", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: JSON.stringify({ FACTURA_A: 1, FACTURA_B: 2 }),
    })

    const config = await cargarConfigArca()
    expect(config.puntosVenta.FACTURA_A).toBe(1)
    expect(config.puntosVenta.FACTURA_B).toBe(2)
  })

  it("ignora valores no numéricos", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: JSON.stringify({ FACTURA_A: "abc", FACTURA_B: "2" }),
    })

    const config = await cargarConfigArca()
    expect(config.puntosVenta.FACTURA_A).toBeUndefined()
    expect(config.puntosVenta.FACTURA_B).toBe(2)
  })

  it("ignora valores cero o negativos", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: JSON.stringify({ FACTURA_A: "0", FACTURA_B: "-1", FACTURA_C: "5" }),
    })

    const config = await cargarConfigArca()
    expect(config.puntosVenta.FACTURA_A).toBeUndefined()
    expect(config.puntosVenta.FACTURA_B).toBeUndefined()
    expect(config.puntosVenta.FACTURA_C).toBe(5)
  })

  it("maneja JSON vacío sin error", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: "{}",
    })

    const config = await cargarConfigArca()
    expect(Object.keys(config.puntosVenta)).toHaveLength(0)
  })

  it("maneja mix de strings y numbers (legacy + nuevo)", async () => {
    mockPrisma.configuracionArca.findUnique.mockResolvedValue({
      ...BASE_CONFIG,
      puntosVenta: JSON.stringify({
        FACTURA_A: "1",    // string legacy
        FACTURA_B: 2,      // number actual
        NOTA_CREDITO_A: "3", // string legacy
      }),
    })

    const config = await cargarConfigArca()
    expect(config.puntosVenta).toEqual({
      FACTURA_A: 1,
      FACTURA_B: 2,
      NOTA_CREDITO_A: 3,
    })
  })
})

// ─── Normalización de input (escritura a DB) ─────────────────────────────────
// Replica la lógica de normalizarPuntosVentaInput de la route para testear
// el contrato: solo números válidos > 0 se persisten.

function normalizarPuntosVentaInput(input: Record<string, string | number>): Record<string, number> {
  const result: Record<string, number> = {}
  for (const [k, v] of Object.entries(input)) {
    const n = typeof v === "number" ? v : parseInt(String(v), 10)
    if (!isNaN(n) && n > 0) result[k] = n
  }
  return result
}

describe("puntosVenta normalización de input (escritura)", () => {
  it('"abc" no se persiste', () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: "abc" })
    expect(result.FACTURA_A).toBeUndefined()
    expect(Object.keys(result)).toHaveLength(0)
  })

  it("0 no se persiste", () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: 0 })
    expect(result.FACTURA_A).toBeUndefined()
  })

  it("-1 no se persiste", () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: -1 })
    expect(result.FACTURA_A).toBeUndefined()
  })

  it('"0" (string) no se persiste', () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: "0" })
    expect(result.FACTURA_A).toBeUndefined()
  })

  it('"-1" (string) no se persiste', () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: "-1" })
    expect(result.FACTURA_A).toBeUndefined()
  })

  it('"3" se persiste como 3', () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: "3" })
    expect(result.FACTURA_A).toBe(3)
    expect(typeof result.FACTURA_A).toBe("number")
  })

  it("5 (number) se persiste como 5", () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: 5 })
    expect(result.FACTURA_A).toBe(5)
  })

  it("NaN no produce entrada en el resultado", () => {
    const result = normalizarPuntosVentaInput({ FACTURA_A: "abc", FACTURA_B: "3" })
    expect(JSON.stringify(result)).toBe('{"FACTURA_B":3}')
    // No hay null ni NaN en el JSON
    expect(JSON.stringify(result)).not.toContain("null")
    expect(JSON.stringify(result)).not.toContain("NaN")
  })

  it("mix completo: solo valores válidos sobreviven", () => {
    const result = normalizarPuntosVentaInput({
      FACTURA_A: "1",
      FACTURA_B: "abc",
      NOTA_CREDITO_A: 0,
      NOTA_CREDITO_B: -5,
      NOTA_DEBITO_A: "7",
      NOTA_DEBITO_B: 10,
    })
    expect(result).toEqual({
      FACTURA_A: 1,
      NOTA_DEBITO_A: 7,
      NOTA_DEBITO_B: 10,
    })
  })
})
