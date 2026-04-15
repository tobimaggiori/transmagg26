/**
 * Tests de invariantes de dominio para factura-commands y liquidacion-commands.
 *
 * Verifica que los commands rechacen estados inválidos:
 * - Factura sin viajes
 * - Liquidación sin viajes
 * - Factura con viajes ya facturados
 * - Liquidación con viajes ya liquidados
 */

const mockPrisma = {
  empresa: { findFirst: jest.fn() },
  fletero: { findFirst: jest.fn() },
  viaje: { findMany: jest.fn(), updateMany: jest.fn() },
  facturaEmitida: { create: jest.fn() },
  liquidacion: { findFirst: jest.fn(), create: jest.fn() },
  viajeEnFactura: { create: jest.fn() },
  viajeEnLiquidacion: { create: jest.fn() },
  asientoIva: { create: jest.fn() },
  asientoIibb: { create: jest.fn(), findFirst: jest.fn(), update: jest.fn() },
  camion: { findFirst: jest.fn() },
  usuario: { findFirst: jest.fn() },
  $transaction: jest.fn((cb: (tx: unknown) => Promise<unknown>) => cb(mockPrisma)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/arca/catalogo", () => ({
  resolverPuntoVentaFacturaEmpresa: jest.fn().mockReturnValue(1),
}))
jest.mock("@/lib/arca/config", () => ({
  cargarConfigArca: jest.fn().mockResolvedValue({ puntosVenta: {} }),
}))

import { ejecutarCrearFactura } from "@/lib/factura-commands"
import { ejecutarCrearLiquidacion } from "@/lib/liquidacion-commands"

beforeEach(() => {
  jest.clearAllMocks()
})

// ═══════════════════════════════════════════════════════════════════════════════
// Factura: invariantes
// ═══════════════════════════════════════════════════════════════════════════════

describe("ejecutarCrearFactura — invariantes", () => {
  it("rechaza factura sin viajes (viajeIds vacío)", async () => {
    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: [], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("al menos un viaje")
    }
    // No debe haber intentado buscar empresa ni viajes
    expect(mockPrisma.empresa.findFirst).not.toHaveBeenCalled()
  })

  it("rechaza viajes que ya están facturados", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      id: "e1", activa: true, condicionIva: "RESPONSABLE_INSCRIPTO",
    })
    mockPrisma.viaje.findMany.mockResolvedValue([
      { id: "v1", empresaId: "e1", estadoFactura: "FACTURADO", kilos: 25000, tarifaEmpresa: 50, fechaViaje: new Date() },
    ])

    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("no están pendientes de facturar")
    }
  })

  it("rechaza viajes que no pertenecen a la empresa", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      id: "e1", activa: true, condicionIva: "RESPONSABLE_INSCRIPTO",
    })
    mockPrisma.viaje.findMany.mockResolvedValue([
      { id: "v1", empresaId: "otra-empresa", estadoFactura: "PENDIENTE_FACTURAR", kilos: 25000, tarifaEmpresa: 50, fechaViaje: new Date() },
    ])

    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("no pertenecen a la empresa")
    }
  })

  it("rechaza empresa inexistente o inactiva", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue(null)

    const r = await ejecutarCrearFactura({
      empresaId: "noexiste", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(404)
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Liquidación: invariantes
// ═══════════════════════════════════════════════════════════════════════════════

describe("ejecutarCrearLiquidacion — invariantes", () => {
  it("rechaza liquidación sin viajes (array vacío)", async () => {
    const r = await ejecutarCrearLiquidacion({
      fleteroId: "f1", comisionPct: 10, ivaPct: 21, viajes: [],
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("al menos un viaje")
    }
    expect(mockPrisma.fletero.findFirst).not.toHaveBeenCalled()
  })

  it("rechaza viajes ya liquidados", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue({ id: "f1", activo: true })
    // La query busca viajes con estadoLiquidacion=PENDIENTE_LIQUIDAR
    // Si el viaje ya está liquidado, no lo encuentra → count mismatch
    mockPrisma.viaje.findMany.mockResolvedValue([]) // 0 encontrados vs 1 enviado

    const r = await ejecutarCrearLiquidacion({
      fleteroId: "f1", comisionPct: 10, ivaPct: 21,
      viajes: [{ viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 50 }],
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) {
      expect(r.status).toBe(400)
      expect(r.error).toContain("ya están liquidados")
    }
  })

  it("rechaza fletero inexistente o inactivo", async () => {
    mockPrisma.fletero.findFirst.mockResolvedValue(null)

    const r = await ejecutarCrearLiquidacion({
      fleteroId: "noexiste", comisionPct: 10, ivaPct: 21,
      viajes: [{ viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 50 }],
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(404)
  })
})
