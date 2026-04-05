/**
 * Propósito: Congelar la decisión de negocio del modelo documental.
 *
 * Reglas cerradas:
 * - BORRADOR no existe como estado de comprobantes ARCA
 * - ANULADA no existe — los documentos son inmutables
 * - Si ARCA devuelve CAE => el comprobante queda EMITIDA
 * - Si ARCA no devuelve CAE => el comprobante no se emite
 * - La corrección económica se hace por NC/ND, no por destruir el documento
 *
 * Estos tests fallan si alguien reintroduce BORRADOR o ANULADA en el sistema.
 */

import {
  EstadoFacturaDocumento,
  EstadoLiquidacionDocumento,
} from "@/lib/viaje-workflow"

// ─── BORRADOR y ANULADA no existen en constantes de documento ───────────────

describe("modelo documental inmutable", () => {
  it("EstadoFacturaDocumento no contiene BORRADOR", () => {
    expect(Object.values(EstadoFacturaDocumento)).not.toContain("BORRADOR")
  })

  it("EstadoLiquidacionDocumento no contiene BORRADOR", () => {
    expect(Object.values(EstadoLiquidacionDocumento)).not.toContain("BORRADOR")
  })

  it("EstadoFacturaDocumento no contiene ANULADA", () => {
    expect(Object.values(EstadoFacturaDocumento)).not.toContain("ANULADA")
  })

  it("EstadoLiquidacionDocumento no contiene ANULADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento)).not.toContain("ANULADA")
  })

  it("EstadoFacturaDocumento solo contiene EMITIDA y COBRADA", () => {
    expect(Object.values(EstadoFacturaDocumento).sort()).toEqual(["COBRADA", "EMITIDA"])
  })

  it("EstadoLiquidacionDocumento solo contiene EMITIDA y PAGADA", () => {
    expect(Object.values(EstadoLiquidacionDocumento).sort()).toEqual(["EMITIDA", "PAGADA"])
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

describe("facturas se crean como EMITIDA (inmutable)", () => {
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
    const createCall = mockPrisma.facturaEmitida.create.mock.calls[0][0]
    expect(createCall.data.estado).toBe("EMITIDA")
  })
})
