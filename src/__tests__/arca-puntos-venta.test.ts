/**
 * Tests para normalización de puntosVenta (string legacy → number).
 * Verifica backward compatibility con datos guardados como strings en DB.
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
