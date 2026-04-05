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
  notaCreditoDebito: { create: jest.fn(), findFirst: jest.fn() },
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
  tipoCbteArcaParaNotaCD: jest.fn().mockReturnValue(3),
}))

import { ejecutarCrearNotaCD } from "@/lib/nota-cd-commands"

beforeEach(() => {
  jest.clearAllMocks()
  mockTx.notaCreditoDebito.create.mockResolvedValue({ id: "nota-1" })
  mockTx.notaCreditoDebito.findFirst.mockResolvedValue(null) // no hay notas previas → nro = 1
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
  notasCreditoDebito: [],
}

const LIQ_MOCK = {
  id: "liq-1",
  estado: "EMITIDA",
  viajes: [{ viajeId: "v1" }, { viajeId: "v2" }],
  notasCreditoDebito: [],
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

// ─── NC/ND sobre LP bloqueadas (arca-matriz-comprobantes.md) ────────────────

describe("NC/ND sobre LP rechazadas en esta etapa", () => {
  it("NC_EMITIDA sobre liquidación → rechazada", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA",
      subtipo: "ANULACION_TOTAL",
      liquidacionId: "liq-1",
      montoNeto: 1200,
      ivaPct: 21,
      descripcion: "Anulación LP",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("no está habilitada")
  })

  it("ND_EMITIDA sobre liquidación → rechazada", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA",
      subtipo: "AJUSTE_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 500,
      ivaPct: 21,
      descripcion: "Ajuste LP",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("no está habilitada")
  })

  it("NC_RECIBIDA sobre liquidación → rechazada", async () => {
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

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("no está habilitada")
  })

  it("ND_RECIBIDA sobre liquidación → rechazada", async () => {
    const r = await ejecutarCrearNotaCD({
      tipo: "ND_RECIBIDA",
      subtipo: "AJUSTE_LIQUIDACION",
      liquidacionId: "liq-1",
      montoNeto: 300,
      ivaPct: 21,
      descripcion: "Ajuste LP",
    }, "op1")

    expect(r.ok).toBe(false)
    if (!r.ok) expect(r.error).toContain("no está habilitada")
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

  it("NC_EMITIDA ANULACION_TOTAL sobre factura que ya tiene NC total → error", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK,
      notasCreditoDebito: [{ id: "nc-existente" }],
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

// (NC/ND sobre LP bloqueadas en esta etapa — tests de rechazo arriba)

// ═══════════════════════════════════════════════════════════════════════════════
// CONGELADO: semántica NC parcial — reversión por viaje vs corrección de importe
// ═══════════════════════════════════════════════════════════════════════════════

describe("CONGELADO: NC parcial empresa — reversión por viaje", () => {
  it("viaje seleccionado queda PENDIENTE_FACTURAR (totalmente revertido)", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    expect(mockTx.viaje.update).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: "v1" }, data: { estadoFactura: "PENDIENTE_FACTURAR" } })
    )
  })

  it("viaje NO seleccionado permanece sin cambios", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    // Solo v1 fue tocado, v2 NO
    const calls = mockTx.viaje.update.mock.calls.map((c: unknown[]) => (c[0] as { where: { id: string } }).where.id)
    expect(calls).toContain("v1")
    expect(calls).not.toContain("v2")
  })

  it("se crean snapshots ViajeEnNotaCD solo para viajes seleccionados", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_PARCIAL", facturaId: "fact-1",
      montoNeto: 1500, ivaPct: 21, descripcion: "Reverso v1", viajesIds: ["v1"],
    }, "op1")

    expect(mockTx.viajeEnNotaCD.create).toHaveBeenCalledTimes(1)
  })
})

describe("CONGELADO: NC parcial empresa — corrección de importe", () => {
  it("CORRECCION_IMPORTE no cambia estadoFactura de ningún viaje", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "CORRECCION_IMPORTE", facturaId: "fact-1",
      montoNeto: 200, ivaPct: 21, descripcion: "Corrección económica",
    }, "op1")

    expect(mockTx.viaje.update).not.toHaveBeenCalled()
    expect(mockTx.viaje.updateMany).not.toHaveBeenCalled()
  })

  it("CORRECCION_IMPORTE no crea snapshots ViajeEnNotaCD", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "CORRECCION_IMPORTE", facturaId: "fact-1",
      montoNeto: 200, ivaPct: 21, descripcion: "Corrección económica",
    }, "op1")

    expect(mockTx.viajeEnNotaCD.create).not.toHaveBeenCalled()
  })
})

// (NC/ND parcial LP: tests de operación eliminados — bloqueado en esta etapa)

describe("CONGELADO: ND no libera viajes", () => {
  it("ND_EMITIDA sobre factura no cambia estados de viaje", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue({
      ...FACTURA_MOCK, empresa: { condicionIva: "RESPONSABLE_INSCRIPTO" },
    })
    await ejecutarCrearNotaCD({
      tipo: "ND_EMITIDA", subtipo: "DIFERENCIA_TARIFA", facturaId: "fact-1",
      montoNeto: 500, ivaPct: 21, descripcion: "Diferencia",
    }, "op1")

    expect(mockTx.viaje.update).not.toHaveBeenCalled()
  })
})

describe("CONGELADO: preservación de historial documental", () => {
  it("NC total emitida NO pone factura en ANULADA", async () => {
    mockPrisma.facturaEmitida.findUnique.mockResolvedValue(FACTURA_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_EMITIDA", subtipo: "ANULACION_TOTAL", facturaId: "fact-1",
      montoNeto: 2500, ivaPct: 21, descripcion: "Anulación total",
    }, "op1")

    expect(mockPrisma.facturaEmitida.update).not.toHaveBeenCalled()
  })

  it("NC recibida total NO pone liquidación en ANULADA", async () => {
    mockPrisma.liquidacion.findUnique.mockResolvedValue(LIQ_MOCK)
    await ejecutarCrearNotaCD({
      tipo: "NC_RECIBIDA", subtipo: "ANULACION_LIQUIDACION", liquidacionId: "liq-1",
      montoNeto: 1200, ivaPct: 21, descripcion: "Anulación LP",
      nroComprobanteExterno: "001", fechaComprobanteExterno: "2026-01-15",
    }, "op1")

    expect(mockPrisma.liquidacion.update).not.toHaveBeenCalled()
  })
})
