/**
 * Propósito: Congelar la decisión de negocio de que BORRADOR no existe
 * como estado funcional de comprobantes ARCA.
 *
 * Estos tests fallan si alguien reintroduce BORRADOR en el sistema.
 */

import {
  EstadoFacturaDocumento,
  EstadoLiquidacionDocumento,
} from "@/lib/viaje-workflow"

// ─── BORRADOR no existe en constantes de documento ──────────────────────────

describe("BORRADOR eliminado de estados de documento", () => {
  it("EstadoFacturaDocumento no contiene BORRADOR", () => {
    const valores = Object.values(EstadoFacturaDocumento)
    expect(valores).not.toContain("BORRADOR")
  })

  it("EstadoLiquidacionDocumento no contiene BORRADOR", () => {
    const valores = Object.values(EstadoLiquidacionDocumento)
    expect(valores).not.toContain("BORRADOR")
  })

  it("EstadoFacturaDocumento solo contiene EMITIDA, COBRADA, ANULADA", () => {
    expect(Object.values(EstadoFacturaDocumento).sort()).toEqual(
      ["ANULADA", "COBRADA", "EMITIDA"]
    )
  })

  it("EstadoLiquidacionDocumento solo contiene EMITIDA, PAGADA, ANULADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento).sort()).toEqual(
      ["ANULADA", "EMITIDA", "PAGADA"]
    )
  })
})

// ─── Creación directa como EMITIDA ─────────────────────────────────────────

const mockTx = {
  empresa: { findFirst: jest.fn() },
  viaje: { findMany: jest.fn(), updateMany: jest.fn() },
  facturaEmitida: { create: jest.fn() },
  asientoIva: { create: jest.fn() },
  viajeEnFactura: { create: jest.fn() },
  asientoIibb: { create: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import { ejecutarCrearFactura } from "@/lib/factura-commands"

describe("facturas se crean como EMITIDA, no BORRADOR", () => {
  beforeEach(() => jest.clearAllMocks())

  it("ejecutarCrearFactura persiste estado=EMITIDA", async () => {
    mockPrisma.empresa.findFirst.mockResolvedValue({
      id: "e1", activa: true, condicionIva: "RESPONSABLE_INSCRIPTO",
    })
    mockPrisma.viaje.findMany.mockResolvedValue([{
      id: "v1", empresaId: "e1", kilos: 30000, tarifaEmpresa: 50,
      fechaViaje: new Date("2026-01-10"), estadoFactura: "PENDIENTE_FACTURAR",
      remito: null, cupo: null, mercaderia: null, procedencia: null,
      provinciaOrigen: "Santa Fe", destino: null, provinciaDestino: null,
      fleteroId: "f1", camionId: "c1", choferId: "ch1",
    }])
    mockPrisma.facturaEmitida.create.mockResolvedValue({ id: "fact-1", estado: "EMITIDA" })
    mockPrisma.asientoIva.create.mockResolvedValue({})
    mockPrisma.viajeEnFactura.create.mockResolvedValue({ id: "vef-1" })
    mockPrisma.asientoIibb.create.mockResolvedValue({})
    mockPrisma.viaje.updateMany.mockResolvedValue({ count: 1 })

    const r = await ejecutarCrearFactura({
      empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21,
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockPrisma.facturaEmitida.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({ estado: "EMITIDA" }),
      })
    )
    // Verificar que NO se pasó BORRADOR
    const createCall = mockPrisma.facturaEmitida.create.mock.calls[0][0]
    expect(createCall.data.estado).not.toBe("BORRADOR")
  })
})
