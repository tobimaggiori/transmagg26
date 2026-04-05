/**
 * Propósito: Tests de dominio para nota-cd-commands.ts.
 * Verifica que NC/ND preservan historial documental, que NC total
 * libera viajes pero no anula factura, que NC parcial deja viajes
 * a PENDIENTE, y que NC recibida no anula liquidación.
 */

const mockTx = {
  facturaEmitida: { findUnique: jest.fn(), update: jest.fn() },
  liquidacion: { findUnique: jest.fn(), update: jest.fn() },
  chequeRecibido: { findUnique: jest.fn(), update: jest.fn() },
  notaCreditoDebito: { create: jest.fn() },
  viajeEnNotaCD: { create: jest.fn() },
  viaje: { update: jest.fn(), updateMany: jest.fn() },
}
const mockPrisma = {
  ...mockTx,
  $transaction: jest.fn((cb: (tx: typeof mockTx) => Promise<unknown>) => cb(mockTx)),
}

jest.mock("@/lib/prisma", () => ({ prisma: mockPrisma }))
jest.mock("@/lib/nota-cd-utils", () => ({
  calcularTotalesNotaCD: (neto: number, iva: number) => ({
    montoNeto: neto,
    montoIva: neto * iva / 100,
    montoTotal: neto * (1 + iva / 100),
  }),
  calcularProximoNroComprobanteNotaCD: jest.fn().mockResolvedValue(1),
  tipoCbteArcaParaNotaCD: jest.fn().mockReturnValue(3),
}))

import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
  mockTx.viajeEnNotaCD.create.mockResolvedValue({})
  mockTx.viaje.update.mockResolvedValue({})
  mockTx.viaje.updateMany.mockResolvedValue({ count: 1 })
})

const FACTURA_MOCK = {
  id: "fact-1",
  estado: "EMITIDA",
  empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
  viajes: [
    { viajeId: "v1", tarifaEmpresa: 50, kilos: 30000, subtotal: 1500, viaje: { id: "v1" } },
    { viajeId: "v2", tarifaEmpresa: 40, kilos: 25000, subtotal: 1000, viaje: { id: "v2" } },
  ],
}

const LIQ_MOCK = {
  id: "liq-1",
  estado: "EMITIDA",
  viajes: [{ viajeId: "v1" }, { viajeId: "v2" }],
}

// ─── NC_EMITIDA / ANULACION_TOTAL ───────────────────────────────────────────

describe("NC_EMITIDA / ANULACION_TOTAL", () => {
  it("libera todos los viajes a PENDIENTE_FACTURAR", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    expect(r.ok).toBe(true)

    // Viajes deben pasar a PENDIENTE_FACTURAR
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v2" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )
  })

  it("NO pone la factura en ANULADA (preserva historial)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    // facturaEmitida.update NO debe haberse llamado con estado ANULADA
    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })

  it("crea snapshots ViajeEnNotaCD para todos los viajes", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 2500,
      ivaPct: 21,
      descripcion: "Anulación total",
    }, "op1")

    expect(mockPrisma.viajeEnNotaCD.create).toHaveBeenCalledTimes(2)
  })
})

// ─── NC_EMITIDA / ANULACION_PARCIAL ─────────────────────────────────────────

describe("NC_EMITIDA / ANULACION_PARCIAL", () => {
  it("pone viajes seleccionados en PENDIENTE_FACTURAR (revertidos totalmente)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 1500,
      ivaPct: 21,
      descripcion: "Anulación parcial v1",
      viajesIds: ["v1"],
    }, "op1")

    expect(r.ok).toBe(true)

    // v1 queda totalmente revertido → PENDIENTE_FACTURAR
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoFactura: "PENDIENTE_FACTURAR" },
      })
    )

    // v2 NO debe haber sido tocado
    expect(mockTx.viaje.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v2" } })
    )
  })

  it("solo crea snapshots para viajes seleccionados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 1500,
      ivaPct: 21,
      descripcion: "Ajuste parcial v1",
      viajesIds: ["v1"],
    }, "op1")

    expect(mockPrisma.viajeEnNotaCD.create).toHaveBeenCalledTimes(1)
  })
})

// ─── NC_EMITIDA / CORRECCION_IMPORTE ────────────────────────────────────────

describe("NC_EMITIDA / CORRECCION_IMPORTE", () => {
  it("no modifica estado de viajes", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "CORRECCION_IMPORTE",
      facturaId: "fact-1",
      montoNeto: 200,
      ivaPct: 21,
      descripcion: "Corrección menor",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })
})

// ─── ND_EMITIDA ─────────────────────────────────────────────────────────────

describe("ND_EMITIDA", () => {
  it("no modifica estado de viajes ni factura", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
    })

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA",
      subtipo: "DIFERENCIA_TARIFA",
      facturaId: "fact-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Diferencia de tarifa",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })
})

// ─── NC_RECIBIDA / ANULACION_LIQUIDACION ────────────────────────────────────

describe("NC_RECIBIDA / ANULACION_LIQUIDACION", () => {
  it("libera viajes a PENDIENTE_LIQUIDAR", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación LP",
      nroComprobanteExterno: "001",
      fechaComprobanteExterno: "2026-01-15",
    }, "op1")

    expect(r.ok).toBe(true)

    expect(mockTx.viaje.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: { in: ["v1", "v2"] } },
        data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
      })
    )
  })

  it("NO pone la liquidación en ANULADA (preserva historial)", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación LP",
      nroComprobanteExterno: "001",
      fechaComprobanteExterno: "2026-01-15",
    }, "op1")

    // liquidacion.update NO debe haberse llamado con estado ANULADA
    expect(mockPrisma.liquidacion.update).not.toHaveBeenCalled()
  })
})

// ─── Validaciones ───────────────────────────────────────────────────────────

describe("validaciones NC/ND", () => {
  it("NC_EMITIDA sin facturaId → error", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("NC_EMITIDA sobre factura ya anulada → error", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      estado: "ANULADA",
    })
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      facturaId: "fact-1",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("ANULACION_PARCIAL sin viajesIds → error", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_PARCIAL",
      facturaId: "fact-1",
      montoNeto: 100,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")
    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })
})

// ─── NC_RECIBIDA / ANULACION_PARCIAL_LIQUIDACION ────────────────────────────

const LIQ_MOCK_CON_VIAJES = {
  id: "liq-1",
  estado: "EMITIDA",
  viajes: [
    { viajeId: "v1", tarifaFletero: 40, kilos: 30000, subtotal: 1200 },
    { viajeId: "v2", tarifaFletero: 35, kilos: 25000, subtotal: 875 },
  ],
}

describe("NC_RECIBIDA / ANULACION_PARCIAL_LIQUIDACION", () => {
  it("pone viajes seleccionados en PENDIENTE_LIQUIDAR (revertidos totalmente)", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK_CON_VIAJES)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_PARCIAL_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación parcial viaje v1",
      viajesIds: ["v1"],
    }, "op1")

    expect(r.ok).toBe(true)

    // v1 queda totalmente revertido → PENDIENTE_LIQUIDAR
    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: "v1" },
        data: { estadoLiquidacion: "PENDIENTE_LIQUIDAR" },
      })
    )

    // v2 NO debe haber sido tocado
    expect(mockTx.viaje.update).not.toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v2" } })
    )
  })

  it("crea snapshots ViajeEnNotaCD para viajes seleccionados", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK_CON_VIAJES)

    await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_PARCIAL_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Ajuste parcial",
      viajesIds: ["v1"],
    }, "op1")

    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(1)
    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          viajeId: "v1",
          tarifaOriginal: 40,
        }),
      })
    )
  })

  it("sin viajesIds → error", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK_CON_VIAJES)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_PARCIAL_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "test",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })

  it("viaje que no pertenece a la liquidación → error", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK_CON_VIAJES)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "ANULACION_PARCIAL_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "test",
      viajesIds: ["v99-no-existe"],
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.status).toBe(400)
  })
})

// ─── NC_RECIBIDA / CORRECCION_IMPORTE_LIQUIDACION ───────────────────────────

describe("NC_RECIBIDA / CORRECCION_IMPORTE_LIQUIDACION", () => {
  it("no modifica estado de viajes", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA",
      subtipo: "CORRECCION_IMPORTE_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 200,
      ivaPct: 21,
      descripcion: "Corrección menor",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })
})

// ─── ND_RECIBIDA / AJUSTE_LIQUIDACION ───────────────────────────────────────

describe("ND_RECIBIDA / AJUSTE_LIQUIDACION", () => {
  it("no modifica estado de viajes ni liquidación", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)

    const r = await ejecutarCrearNotaCD({
      tipo: "ND_RECIBIDA",
      subtipo: "AJUSTE_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 300,
      ivaPct: 21,
      descripcion: "Ajuste incremento",
    }, "op1")

    expect(r.ok).toBe(true)
    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockPrisma.liquidacion.update).not.toHaveBeenCalled()
  })
})
