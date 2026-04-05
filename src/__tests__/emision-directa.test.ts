/**
 * Propósito: Tests para el módulo de emisión directa ARCA.
 *
 * Semántica transaccional:
 * - ARCA OK → documento EMITIDA + PDF + viajes actualizados
 * - ARCA FAIL → sin documento, sin efectos, viajes intactos
 */

const mockEjecutarCrearFactura = jest.fn()
const mockEjecutarCrearLiquidacion = jest.fn()
const mockEjecutarCrearNotaCD = jest.fn()
const mockAutorizarFacturaArca = jest.fn()
const mockAutorizarLiquidacionArca = jest.fn()
const mockAutorizarNotaCDArca = jest.fn()

const mockTx = {
  viajeEnFactura: { findMany: jest.fn() },
  viajeEnLiquidacion: { findMany: jest.fn() },
  asientoIibb: { deleteMany: jest.fn() },
  asientoIva: { deleteMany: jest.fn() },
  facturaEmitida: { delete: jest.fn(), update: jest.fn() },
  liquidacion: { delete: jest.fn(), findUnique: jest.fn() },
  notaCreditoDebito: { delete: jest.fn(), update: jest.fn() },
  viaje: { updateMany: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/factura-commands", () => ({
  ejecutarCrearFactura: mockEjecutarCrearFactura,
}))
jest.mock("@/lib/liquidacion-commands", () => ({
  ejecutarCrearLiquidacion: mockEjecutarCrearLiquidacion,
}))
jest.mock("@/lib/nota-cd-commands", () => ({
  ejecutarCrearNotaCD: mockEjecutarCrearNotaCD,
}))
jest.mock("@/lib/arca/service", () => ({
  autorizarFacturaArca: mockAutorizarFacturaArca,
  autorizarLiquidacionArca: mockAutorizarLiquidacionArca,
  autorizarNotaCDArca: mockAutorizarNotaCDArca,
}))
jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))

import {
  emitirFacturaDirecta,
  emitirLiquidacionDirecta,
  emitirNotaCDDirecta,
} from "@/lib/emision-directa"

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.viajeEnFactura.findMany.mockResolvedValue([])
  mockTx.viajeEnLiquidacion.findMany.mockResolvedValue([])
  mockTx.asientoIibb.deleteMany.mockResolvedValue({ count: 0 })
  mockTx.asientoIva.deleteMany.mockResolvedValue({ count: 0 })
  mockTx.facturaEmitida.delete.mockResolvedValue({})
  mockTx.facturaEmitida.update.mockResolvedValue({ id: "fact-1", estado: "EMITIDA" })
  mockTx.liquidacion.delete.mockResolvedValue({})
  mockTx.liquidacion.findUnique.mockResolvedValue({ id: "liq-1" })
  mockTx.notaCreditoDebito.delete.mockResolvedValue({})
  mockTx.notaCreditoDebito.update.mockResolvedValue({ id: "nota-1", estado: "EMITIDA" })
  mockTx.viaje.updateMany.mockResolvedValue({ count: 1 })
})

const ARCA_RESULT = {
  ok: true,
  cae: "74120000000001",
  caeVto: new Date("2026-02-15"),
  nroComprobante: 42,
  ptoVenta: 1,
  tipoCbte: 1,
  qrData: "https://qr.example.com",
}

// ═══════════════════════════════════════════════════════════════════════════════
// Factura
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirFacturaDirecta", () => {
  const data = { empresaId: "e1", viajeIds: ["v1", "v2"], tipoCbte: 1, ivaPct: 21 }

  it("ARCA OK → documento EMITIDA + arca result", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.arca.cae).toBe("74120000000001")
    // Debe haber seteado estado=EMITIDA
    expect(mockTx.facturaEmitida.update).toHaveBeenCalledWith({
      where: { id: "fact-1" },
      data: { estado: "EMITIDA" },
    })
  })

  it("ARCA FAIL → ok=false, sin documento, con mensaje claro", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new Error("10016: CUIT inválido"))

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(502)
    expect(r.error).toContain("No se pudo emitir el comprobante")
    expect(r.error).toContain("CUIT inválido")
    expect(r.error).toContain("no quedó emitido")
  })

  it("ARCA FAIL → revierte factura y viajes", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "fact-1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new Error("ARCA rechazó"))

    await emitirFacturaDirecta(data, "op1", "key-1")

    // Debe haber ejecutado compensación
    expect(mockPrisma.$transaction).toHaveBeenCalled()
    // Viajes revertidos a PENDIENTE_FACTURAR
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "PENDIENTE_FACTURAR" },
    })
    // Factura eliminada
    expect(mockTx.facturaEmitida.delete).toHaveBeenCalledWith({ where: { id: "fact-1" } })
  })

  it("creación falla → error sin intentar ARCA ni compensar", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: false, status: 404, error: "Empresa no encontrada" })

    const r = await emitirFacturaDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.status).toBe(404)
    expect(mockAutorizarFacturaArca).not.toHaveBeenCalled()
    expect(mockPrisma.$transaction).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Liquidación
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirLiquidacionDirecta", () => {
  const data = {
    fleteroId: "f1",
    comisionPct: 5,
    ivaPct: 21,
    viajes: [
      { viajeId: "v1", fechaViaje: "2026-01-01", kilos: 30000, tarifaFletero: 40 },
      { viajeId: "v2", fechaViaje: "2026-01-02", kilos: 25000, tarifaFletero: 35 },
    ],
  }

  it("ARCA OK → documento con CAE + arca result", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirLiquidacionDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(true)
    if (!r.ok) return
    expect(r.arca.cae).toBe("74120000000001")
  })

  it("ARCA FAIL → sin efectos, viajes revertidos", async () => {
    mockEjecutarCrearLiquidacion.mockResolvedValue({ ok: true, liquidacion: { id: "liq-1" } })
    mockAutorizarLiquidacionArca.mockRejectedValue(new Error("Timeout WSAA"))

    const r = await emitirLiquidacionDirecta(data, "op1", "key-1")

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toContain("Timeout WSAA")
    // Compensación ejecutada
    expect(mockTx.liquidacion.delete).toHaveBeenCalledWith({ where: { id: "liq-1" } })
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
    })
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// NC/ND emitidas
// ═══════════════════════════════════════════════════════════════════════════════

describe("emitirNotaCDDirecta — NC_EMITIDA", () => {
  const ncTotal = {
    tipo: "NC_EMITIDA",
    subtipo: "ANULACION_TOTAL",
    facturaId: "fact-1",
    montoNeto: 1000,
    ivaPct: 21,
    descripcion: "Anulación total",
  }

  it("ARCA OK → nota EMITIDA", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockResolvedValue(ARCA_RESULT)

    const r = await emitirNotaCDDirecta(ncTotal, "op1", "key-1")

    expect(r.ok).toBe(true)
    expect(mockTx.notaCreditoDebito.update).toHaveBeenCalledWith({
      where: { id: "nota-1" },
      data: { estado: "EMITIDA" },
    })
  })

  it("ARCA FAIL → nota eliminada, viajes revertidos a FACTURADO", async () => {
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-1" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new Error("Error ARCA"))
    // La compensación busca viajes de la factura
    mockTx.viajeEnFactura.findMany.mockResolvedValue([{ viajeId: "v1" }, { viajeId: "v2" }])

    const r = await emitirNotaCDDirecta(ncTotal, "op1", "key-1")

    expect(r.ok).toBe(false)
    // Nota eliminada
    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-1" } })
    // Viajes revertidos a FACTURADO (estaban PENDIENTE_FACTURAR tras NC total)
    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1", "v2"] } },
      data: { estadoFactura: "FACTURADO" },
    })
  })
})

describe("emitirNotaCDDirecta — NC parcial ARCA FAIL", () => {
  it("revierte viajes a FACTURADO (no AJUSTADO_PARCIAL)", async () => {
    const ncParcial = {
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Ajuste parcial",
      viajesIds: ["v1"],
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-2" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new Error("Error"))

    await emitirNotaCDDirecta(ncParcial, "op1", "key-1")

    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith({
      where: { id: { in: ["v1"] } },
      data: { estadoFactura: "FACTURADO" },
    })
  })
})

describe("emitirNotaCDDirecta — ND_EMITIDA ARCA FAIL", () => {
  it("nota eliminada, sin revertir viajes (ND no toca viajes)", async () => {
    const nd = {
      tipo: "ND_EMITIDA",
      subtipo: "DIFERENCIA_TARIFA",
      facturaId: "fact-1",
      montoNeto: 200,
      ivaPct: 21,
      descripcion: "Diferencia",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-3" } })
    mockAutorizarNotaCDArca.mockRejectedValue(new Error("Error"))

    await emitirNotaCDDirecta(nd, "op1", "key-1")

    expect(mockTx.notaCreditoDebito.delete).toHaveBeenCalledWith({ where: { id: "nota-3" } })
    // No debe tocar viajes
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })
})

describe("emitirNotaCDDirecta — NC_RECIBIDA no va a ARCA", () => {
  it("crea sin intentar ARCA", async () => {
    const ncRecibida = {
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1000,
      ivaPct: 21,
      descripcion: "Anulación LP",
      nroComprobanteExterno: "001",
      fechaComprobanteExterno: "2026-01-15",
    }
    mockEjecutarCrearNotaCD.mockResolvedValue({ ok: true, nota: { id: "nota-4" } })

    const r = await emitirNotaCDDirecta(ncRecibida, "op1", "key-1")

    expect(r.ok).toBe(true)
    expect(mockAutorizarNotaCDArca).not.toHaveBeenCalled()
  })
})

// ═══════════════════════════════════════════════════════════════════════════════
// Invariantes
// ═══════════════════════════════════════════════════════════════════════════════

describe("invariantes de emisión directa", () => {
  it("idempotencyKey se pasa correctamente a ARCA", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "f1" } })
    mockAutorizarFacturaArca.mockResolvedValue(ARCA_RESULT)

    await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1",
      "uuid-idempotent-123"
    )

    expect(mockAutorizarFacturaArca).toHaveBeenCalledWith("f1", "uuid-idempotent-123")
  })

  it("ARCA FAIL sin mensaje → error genérico claro", async () => {
    mockEjecutarCrearFactura.mockResolvedValue({ ok: true, factura: { id: "f1" } })
    mockAutorizarFacturaArca.mockRejectedValue(new Error(""))

    const r = await emitirFacturaDirecta(
      { empresaId: "e1", viajeIds: ["v1"], tipoCbte: 1, ivaPct: 21 },
      "op1",
      "key-1"
    )

    expect(r.ok).toBe(false)
    if (r.ok) return
    expect(r.error).toContain("No se pudo emitir el comprobante")
  })
})
